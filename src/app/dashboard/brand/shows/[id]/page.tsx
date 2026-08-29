import ShowDetail from "@/components/showdashdetail";

export default function ShowDetailPage({ params }: { params: { id: string } }) {
  return (
      <ShowDetail id={params.id} />
  );
}