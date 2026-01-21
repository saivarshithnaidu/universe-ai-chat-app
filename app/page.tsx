import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { cookies } from "next/headers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UniversalAI | Smart AI Chat Assistant",
  description: "Chat with UniversalAI – a fast, secure, AI-powered chat assistant built using modern web technologies.",
};


export default async function Home() {
  const { userId } = await auth();

  if (process.env.NODE_ENV === 'development') {
    console.log("Clerk userId:", userId);
  }

  if (!userId) {
    redirect("/sign-in");
  }



  return <ChatInterface />;
}
