import { ComingSoon } from "@/components/ui/coming-soon";

export default function ForgotPasswordPage() {
  return (
    <ComingSoon
      title="Reset your password"
      description="Password reset by email is coming soon. For now, reach out to us directly if you're locked out of your account."
      backHref="/login"
      backLabel="Back to sign in"
    />
  );
}
