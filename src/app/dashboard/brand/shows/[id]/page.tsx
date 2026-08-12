import ShowDetail from "@/components/showdashdetail";
import BrandShell from "../../BrandShell";

export default function ShowDetailPage({ params }: { params: { id: string } }) {
  return (
      <ShowDetail id={params.id} />
  );
}