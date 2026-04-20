import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat | UniversalAI",
  description: "Chat with multiple AI models side-by-side and compare responses.",
};

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    redirect("/login");
  }

  return <ChatInterface />;
}
