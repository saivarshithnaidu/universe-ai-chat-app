from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import io
import uvicorn
import logging
import re
import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import time

# --- SETUP LOGGING ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("rag_service")

app = FastAPI(title="Production RAG Backend")

# 1. CORS SUPPORT
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG & MODELS ---
MODEL_NAME = "all-MiniLM-L6-v2"
# Use 'chroma_db' folder for persistence as requested
DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

# Create data directory if it doesn't exist
if not os.path.exists(DB_PATH):
    os.makedirs(DB_PATH)

logger.info(f"Initializing SentenceTransformer: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)

logger.info(f"Initializing ChromaDB PersistentClient at {DB_PATH}")
chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection = chroma_client.get_or_create_collection(name="universe_docs")

# --- MODELS ---
class StoreRequest(BaseModel):
    text: str
    userId: str # Standardized to userId
    metadata: dict = {}

class QueryRequest(BaseModel):
    question: str
    userId: str # Standardized to userId
    top_k: int = 3

# --- HELPERS ---

def success_response(data: any):
    return {"success": True, "data": data, "error": None}

def error_response(message: str, status_code: int = 400):
    return {"success": False, "data": None, "error": message}

def clean_text(text: str) -> str:
    """Removes extra spaces and normalize empty lines."""
    text = re.sub(r'[ ]{2,}', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()

def character_based_chunking(text: str, chunk_size: int = 500, overlap: int = 100):
    """
    Standard character-based chunking with fixed size and overlap.
    """
    if not text:
        return []
    
    chunks = []
    i = 0
    while i < len(text):
        end = i + chunk_size
        chunk = text[i:end]
        
        if chunk.strip():
            chunks.append(chunk.strip())
        
        i += (chunk_size - overlap)
        if overlap >= chunk_size:
            i += chunk_size
            
    return chunks

# --- ENDPOINTS ---

@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.1.0", "db": "chromadb", "model": MODEL_NAME}

@app.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):
    """
    STAGE 1: High-Performance PDF Extraction
    """
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    try:
        content = await file.read()
        if len(content) > MAX_SIZE:
            return error_response(f"File too large. Max {MAX_SIZE/1024/1024}MB allowed.")

        pdf_stream = io.BytesIO(content)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")
        
        total_text = []
        for page in doc:
            page_text = page.get_text("text")
            if page_text.strip():
                total_text.append(page_text.strip())
        
        doc.close()
        
        raw_text = "\n\n".join(total_text)
        processed_text = clean_text(raw_text)

        if len(processed_text) < 10:
            return error_response("No searchable text extracted. PDF may be an image-only scan.")

        return success_response({
            "text": processed_text,
            "pages": len(total_text),
            "characters": len(processed_text),
            "filename": file.filename
        })

    except Exception as e:
        logger.error(f"Extraction Error: {str(e)}")
        return error_response(f"Extraction failed: {str(e)}")

@app.post("/rag/store")
async def store_text(req: StoreRequest):
    """
    PRODUCTION RAG STAGE: Chunk -> Embed -> Store
    """
    try:
        start_time = time.time()
        # Task 5: Debug log
        print(f"DEBUG: USER ID for STORE: {req.userId}")
        logger.info(f"Storing data for user: {req.userId}")

        text = clean_text(req.text)
        if not text:
            return error_response("Empty text provided")

        chunks = character_based_chunking(text, chunk_size=500, overlap=100)
        logger.info(f"Created {len(chunks)} chunks")

        if not chunks:
            return error_response("Failed to generate chunks")

        embeddings = model.encode(chunks).tolist()
        
        ids = [f"{req.userId}_{int(time.time()*1000)}_{i}" for i in range(len(chunks))]
        
        # Task 2: Store metadata: { userId, fileName }
        # Task 1: Ensure SAME userId is used (using standardized userId)
        metadatas = [ {
            **req.metadata, 
            "userId": req.userId, 
            "fileName": req.metadata.get("fileName", "unknown"),
            "chunk_index": i 
        } for i in range(len(chunks)) ]

        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        duration = time.time() - start_time
        logger.info(f"Ingestion complete in {duration:.2f}s for {len(chunks)} chunks")

        return success_response({
            "userId": req.userId,
            "chunks": len(chunks),
            "duration_s": duration
        })

    except Exception as e:
        logger.error(f"Store Error: {str(e)}")
        return error_response(f"Storage failed: {str(e)}")

@app.post("/rag/query")
async def query_rag(req: QueryRequest):
    """
    PRODUCTION RAG SEARCH: Embed Query -> Search -> Context
    """
    try:
        # Task 5: Debug log
        print(f"DEBUG: USER ID for QUERY: {req.userId}")
        logger.info(f"Querying RAG for user {req.userId}: {req.question[:50]}...")

        # 1. Embed Query
        query_embedding = model.encode([req.question]).tolist()

        # 2. Search
        # Task 3: Fix query filter (where: { userId: userId })
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=req.top_k,
            where={"userId": req.userId}
        )

        # Task 5: Debug log QUERY RESULTS
        print(f"DEBUG: QUERY RESULTS: {results}")
        logger.info(f"Search complete. Found {len(results.get('documents', [[]])[0])} matches.")

        # 3. Form Context
        # Task 6: Ensure context extraction (const context = results.documents?.[0]?.join("\n\n"))
        documents = results.get('documents', [[]])[0]
        
        # Task 7: If empty, return proper message
        if not documents:
            return success_response({
                "context": "I couldn't find any relevant information in your uploaded documents.",
                "chunks_found": 0
            })

        context = "\n\n".join([doc for doc in documents if doc])

        return success_response({
            "context": context,
            "chunks_found": len(documents)
        })

    except Exception as e:
        logger.error(f"Query Error: {str(e)}")
        return error_response(f"Query failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
