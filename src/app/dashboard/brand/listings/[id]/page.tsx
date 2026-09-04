import Mplisting from "./mplisting";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Mplisting id={id} />;
}