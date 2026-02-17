import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B]">
            <SignUp
                appearance={{
                    baseTheme: dark,
                }}
                forceRedirectUrl="/app"
                signInUrl="/sign-in"
            />
        </div>
    );
}
