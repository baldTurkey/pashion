import Link from "next/link";
import Mpform from "@/components/mpform";

export default function NewListingPage() {
  return (
    <>
      <div style={{ maxWidth: 640, margin: "0 auto 12px" }}>
        <Link href="/dashboard/brand/listings" className="bv-btn">
          &larr; Back to my listings
        </Link>
      </div>
      <Mpform />
    </>
  );
}