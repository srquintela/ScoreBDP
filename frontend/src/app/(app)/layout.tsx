import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/cookies";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-wheat-50">
      <Sidebar rol={session.role} userName={session.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="BDP Score" />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
