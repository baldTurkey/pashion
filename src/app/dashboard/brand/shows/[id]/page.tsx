import ShowDetail from "@/components/showdashdetail";

export default async function ShowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
      <ShowDetail id={id} />
  );
}