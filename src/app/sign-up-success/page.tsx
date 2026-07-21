import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", textAlign: "center", padding: "32px", borderRadius: "16px", background: "white", boxShadow: "0 20px 50px rgba(0,0,0,0.1)" }}>
        <h1 style={{ marginBottom: "12px" }}>Account created</h1>
        <p style={{ marginBottom: "20px", color: "#6b7280" }}>
          Your brand account has been created. Please check your email to confirm your account.
        </p>
        <Link href="/" style={{ display: "inline-block", padding: "10px 16px", borderRadius: "999px", background: "#498f6a", color: "white", textDecoration: "none" }}>
          Go home
        </Link>
      </div>
    </main>
  );
}
