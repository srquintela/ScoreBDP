import { notFound } from "next/navigation";
import { EditApplication } from "@/features/formulario/components/edit-application";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <EditApplication key={id} id={Number(id)} />;
}
