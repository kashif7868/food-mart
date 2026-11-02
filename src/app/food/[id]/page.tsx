import FoodDetail from "@/features/discovery/FoodDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <FoodDetail id={id} />;
}
