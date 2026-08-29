import Link from "next/link";
import CreateShowForm from "@/components/CreateShowForm";

export default function NewShowPage() {
  return (
    <> 
      <div style={{ maxWidth: 640, margin: "0 auto 12px" }}>
        <Link href="/dashboard/brand/shows" className="bv-btn">
          &larr; Back to my shows
        </Link>
      </div>
      <CreateShowForm />
    </>
  );
}