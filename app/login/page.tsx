import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { hasClerk } from "@/lib/clerk-mode";

export default function LoginPage() {
  if (hasClerk()) redirect("/sign-in");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6">
      <LoginForm />
      <p className="text-sm text-white">Posts your videos to YouTube</p>
      <div className="flex gap-4 text-sm">
        <a href="/privacy" className="text-white underline">
          Privacy
        </a>
        <a href="/terms" className="text-white underline">
          Terms
        </a>
      </div>
    </div>
  );
}
