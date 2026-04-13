/**
 * STAGE 2: TEXT PROCESSING (Semantic Chunking)
 * Rule: Splits raw text into meaningful segments for vectorization.
 * Target: 500-800 tokens (approx characters for MiniLM)
 */
export function chunkText(text: string, chunkSize: number = 2000, overlap: number = 400): string[] {
    if (!text || text.trim().length === 0) return [];

    console.log(`[STAGE 2] Starting chunking on ${text.length} characters...`);

    // Standard Clean-up
    const cleanText = text
        .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-printable characters
        .replace(/\n\s*\n/g, '\n\n')       // Max 2 line breaks
        .replace(/[ ]{2,}/g, ' ')          // Remove extra spaces
        .trim();

    // Semantic Split (Paragraphs)
    const paragraphs = cleanText.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        if (!paragraph.trim()) continue;

        // Paragraph is too big, split it manually
        if (paragraph.length > chunkSize) {
            let start = 0;
            while (start < paragraph.length) {
                const subChunk = paragraph.substring(start, start + chunkSize);
                chunks.push(subChunk.trim());
                start += (chunkSize - overlap);
            }
        } else if ((currentChunk.length + paragraph.length) > chunkSize) {
            // Push current chunk and start new one
            chunks.push(currentChunk.trim());
            currentChunk = paragraph + "\n\n";
        } else {
            // Append to current chunk
            currentChunk += paragraph + "\n\n";
        }
    }

    // Capture last chunk
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    console.log(`[STAGE 2] Generated ${chunks.length} semantic chunks.`);
    return chunks;
}
