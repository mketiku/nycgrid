import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, resolveCameras } from "@/lib/collections/data";
import { MultiView } from "@/features/collections/MultiView";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const collection = getCollection(slug);
    if (!collection) return { title: "nycgrid" };
    return {
      title: `${collection.name} — nycgrid`,
      description: collection.description,
    };
  } catch {
    return { title: "nycgrid" };
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const cameras = resolveCameras(collection.cameraIds);

  return (
    <main className="px-4 md:px-6 py-6 flex flex-col h-[calc(100vh-3rem)]">
      <MultiView cameras={cameras} title={collection.name} description={collection.description} />
    </main>
  );
}
