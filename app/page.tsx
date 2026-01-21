import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { cookies } from "next/headers";


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
