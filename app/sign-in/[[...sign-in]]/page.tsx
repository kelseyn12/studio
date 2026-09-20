import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/clerk-mode";

export default function SignInPage() {
  if (!hasClerk()) redirect("/login");
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <SignIn />
    </div>
  );
}
