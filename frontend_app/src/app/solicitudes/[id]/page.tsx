import { notFound } from "next/navigation";
import { EvaluationView } from "@/features/evaluaciones/components/evaluation-view";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return <EvaluationView key={id} id={Number(id)} />;
}
