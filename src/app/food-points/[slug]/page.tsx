import ProfileDetail from "@/features/discovery/ProfileDetail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <ProfileDetail idOrSlug={decodeURIComponent(slug)} />;
}
