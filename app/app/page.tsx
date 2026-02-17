import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chat | Universal AI",
    description: "Chat with multiple AI models side-by-side and compare responses.",
};

export default async function AppPage() {
    const { userId } = await auth();

    if (process.env.NODE_ENV === 'development') {
        console.log("Clerk userId:", userId);
    }

    if (!userId) {
        redirect("/sign-in");
    }

    return (
        <div className="h-screen overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
                <ChatInterface />
            </div>
        </div>
    );
}
