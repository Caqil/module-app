import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}
