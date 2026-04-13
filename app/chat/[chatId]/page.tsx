import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import ChatInterface from "@/components/ChatInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | Universal AI",
  description: "Review and continue your conversation.",
};

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) redirect("/login");

  // Fetch chat metadata
  const chat = await db.getChat(chatId);
  if (!chat || chat.user_id !== userId) notFound();

  // Fetch messages
  const messages = await db.getChatMessages(chatId, userId);

  // Group flat messages into turns
  const turns: any[] = [];
  let currentTurn: any = null;

  messages.forEach((msg: any) => {
    if (msg.role === 'user') {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = { userMessage: msg.content, responses: [] };
    } else if (currentTurn) {
      currentTurn.responses.push({
        modelId: msg.model || 'ai-agent',
        text: msg.content,
        status: (msg.status || 'success') as 'success' | 'failed' | 'busy',
        type: 'llm',
      });
    }
  });
  if (currentTurn) turns.push(currentTurn);

  // Fetch project files for agent mode
  const projectFiles = await db.getChatProjectFiles(chatId);

  return (
    <ChatInterface
      initialChatId={chatId}
      initialMessages={turns}
      initialProjectFiles={projectFiles}
      initialProjectFramework={chat.project_framework || 'react'}
    />
  );
}
