import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

// Panel super-admin plateforme — route top-level, hors du groupe (app) :
// pas de sidebar radar ni de simulateur. Garde d'accès stricte : seul un
// opérateur BidEdge (super-admin) entre ici. Chrome sobre, barre sombre.

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isSuperAdmin) redirect("/");

  const initial = user.name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="flex min-h-screen flex-col bg-app text-ink">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-dark-border bg-ink px-6">
        <span className="text-[16px] font-bold tracking-[-0.01em] text-white">
          Bid<span className="text-accent-dark">Edge</span>
        </span>
        <span className="inline-flex items-center rounded-full border border-dark-border bg-dark-card px-3 py-1 text-[11px] font-semibold tracking-[.01em] text-accent-dark">
          Admin plateforme
        </span>

        <span className="flex-1" />

        <Link
          href="/"
          className="text-[13px] font-semibold text-dark-text transition-colors hover:text-white"
        >
          ← Retour à l&apos;app
        </Link>

        <span className="flex items-center gap-2.5 pl-1">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-dark-card text-[12.5px] font-bold text-accent-dark">
            {initial}
          </span>
          <span className="hidden text-[13px] font-semibold text-white sm:inline">{user.name}</span>
        </span>

        <AdminLogoutButton />
      </header>

      <main className="mx-auto w-full max-w-[1080px] flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
