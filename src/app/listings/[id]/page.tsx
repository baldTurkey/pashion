import Mplisting from "@/mplisting";

export default function ListingPage({ params }: { params: { id: string } }) {
  return <Mplisting id={params.id} />;
}