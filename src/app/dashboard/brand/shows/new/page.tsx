import Link from "next/link";
import CreateShowForm from "@/components/CreateShowForm";
import BrandShell from "../../BrandShell";

export default function NewShowPage() {
  return (
    <BrandShell>
      <div style={{ maxWidth: 640, margin: "0 auto 12px" }}>
        <Link href="/dashboard/shows" className="bv-btn">
          &larr; Back to my shows
        </Link>
      </div>
      <CreateShowForm />
    </BrandShell>
  );
}