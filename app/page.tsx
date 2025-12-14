'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { AVAILABLE_MODELS, getModelById } from '@/lib/models';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInput } from '@/components/ChatInput';
import { ModelResponseCard } from '@/components/ModelResponseCard';
import { User } from 'lucide-react';

// Custom hook for persistent chat
function usePersistentChat(modelId: string) {
  const chat = useChat({
    // @ts-ignore - api option might be implicit or type definition is mismatching
    api: '/api/chat',
    body: { model: getModelById(modelId)?.modelId },
    id: `chat-${modelId}`,
    onError: (err) => {
      console.error(`Chat error for ${modelId}:`, err);
    },
    onFinish: (message) => {
      console.log(`Chat finished for ${modelId}:`, message);
    },
  }) as any;

  // Adapter for mismatching SDK types/versions
  const { messages, sendMessage, status, error } = chat;

  // Map 'sendMessage' to 'append' (assuming similar method signature or adapter needed)
  // Check if sendMessage exists, otherwise fallback? 
  // Runtime showed 'sendMessage' exists.
  const append = sendMessage;

  // Map status to isLoading
  // common statuses: 'ready', 'submitted', 'streaming', 'error'
  const isLoading = status === 'submitted' || status === 'streaming';

  // Log state changes for debugging
  useEffect(() => {
    console.log(`Chat state update for ${modelId}:`, {
      messagesLength: messages?.length,
      status,
      error
    });
  }, [messages, status, error, modelId]);

  return { messages, append, isLoading, data: undefined, error };
}


export default function Home() {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load selection from local storage
  useEffect(() => {
    const saved = localStorage.getItem('selectedModelIds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validIds = parsed.filter(id =>
            AVAILABLE_MODELS.some(m => m.id === id)
          );
          setSelectedModelIds(validIds);
        }
      } catch (error) {
        console.error('Failed to load selected models:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save selection
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('selectedModelIds', JSON.stringify(selectedModelIds));
    }
  }, [selectedModelIds, isLoaded]);

  // -- Chat Hooks --
  // -- Chat Hooks --
  const chatGeminiFlash = usePersistentChat('gemini-2-0-flash-exp');
  const chatLlama33 = usePersistentChat('llama-3-3-70b');
  const chatQwen = usePersistentChat('qwen-2-5-72b');
  const chatPhi3 = usePersistentChat('phi-3-medium');

  const chatMap = {
    'gemini-2-0-flash-exp': chatGeminiFlash,
    'llama-3-3-70b': chatLlama33,
    'qwen-2-5-72b': chatQwen,
    'phi-3-medium': chatPhi3,
  };

  const toggleModel = (id: string) => {
    if (selectedModelIds.includes(id)) {
      setSelectedModelIds(prev => prev.filter(m => m !== id));
    } else {
      if (selectedModelIds.length < 3) {
        setSelectedModelIds(prev => [...prev, id]);
      }
    }
  };

  const [input, setInput] = useState('');

  const isLoading = selectedModelIds.some(id => chatMap[id as keyof typeof chatMap]?.isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || selectedModelIds.length === 0) return;

    const currentInput = input;
    setInput(''); // Clear input immediately

    // Send to all selected models
    console.log('Submitting message to models:', selectedModelIds);

    // We can interact with multiple hooks.
    // NOTE: append returns a Promise in recent SDKs?
    // We should allow them to run in parallel.
    await Promise.all(selectedModelIds.map(async id => {
      const chat = chatMap[id as keyof typeof chatMap];
      if (chat) {
        try {
          console.log(`Appending to ${id}...`);
          await chat.append({ role: 'user', content: currentInput });
          console.log(`Append triggered for ${id}`);
        } catch (e) {
          console.error(`Failed to append to ${id}:`, e);
        }
      }
    }));
  };

  const primaryModelId = selectedModelIds[0];
  const primaryChat = primaryModelId ? chatMap[primaryModelId as keyof typeof chatMap] : null;
  const messages = primaryChat ? primaryChat.messages : [];

  // Debug display
  // console.log('Current render state:', { ... }); // Reduced log noise

  // Derived state for display
  const turns = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'user') {
      turns.push({
        userMessage: messages[i],
        responseIndex: i + 1
      });
    }
  }

  if (!isLoaded) return <div className="p-8">Loading...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-white dark:bg-black text-black dark:text-white">
      <div className="w-full max-w-6xl flex-1 flex flex-col p-4 md:p-8 gap-8">

        {/* Header & Selector */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Multi-Model Chat</h1>
            <p className="text-zinc-500">Select up to 3 models to compare responses side-by-side.</p>

            {(primaryChat?.error || Object.values(chatMap).some(c => c.error)) && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm mb-4">
                <strong>Error detected:</strong> Check the console for details.
                <br />
                {(primaryChat?.error?.message || "Unknown error")}
              </div>
            )}
          </div>

          <ModelSelector
            selectedModelIds={selectedModelIds}
            onToggle={toggleModel}
            disabled={isLoading}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col gap-8 pb-32">
          {turns.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-zinc-400 italic">
              Select models and start chatting...
            </div>
          )}

          {turns.map((turn, idx) => (
            <div key={turn.userMessage.id + idx} className="flex flex-col gap-6 group">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tr-sm px-6 py-4 text-zinc-800 dark:text-zinc-200 max-w-2xl text-base leading-relaxed">
                  {turn.userMessage.content}
                </div>
              </div>

              {/* Model Responses Row */}
              <div className={`grid gap-4 w-full`} style={{
                gridTemplateColumns: `repeat(${selectedModelIds.length}, minmax(0, 1fr))`
              }}>
                {selectedModelIds.map(modelId => {
                  const chat = chatMap[modelId as keyof typeof chatMap];
                  if (!chat) return null;

                  // Get the message at the expected index
                  // Note: chat.messages might update asynchronously, so check existence
                  // Also, if one model fails or is slower, it might not have the message yet?
                  // With `useChat` append, it usually optimistically adds the response placeholder instantly?
                  // Or maybe not. `useChat` adds optimistic response?
                  // Actually `append` adds the user message. The assistant message comes from the stream start.
                  // So we might need to be careful if message doesn't exist yet.
                  const responseMsg = chat.messages[turn.responseIndex];
                  const model = getModelById(modelId);

                  if (!model) return null;

                  return (
                    <div key={modelId} className="min-w-0">
                      <ModelResponseCard
                        model={model}
                        // We construct a synthetic "history" or just pass the content?
                        // ModelResponseCard expects `messages`. Let's just pass `[responseMsg]` if it exists.
                        messages={responseMsg ? [responseMsg] : []}
                        isLoading={chat.isLoading && !chat.data} // simplified loading check
                        error={chat.error}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black pb-8">
          <div className="max-w-3xl mx-auto w-full">
            <ChatInput
              input={input}
              handleInputChange={(e) => setInput(e.target.value)}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              disabled={selectedModelIds.length === 0}
            />
          </div>
        </div>

      </div>
    </main>
  );
}
