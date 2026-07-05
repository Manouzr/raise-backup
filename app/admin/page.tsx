import { getT } from "@/lib/i18n/server";
import { OrgTable } from "@/components/admin/OrgTable";

// Vue d'ensemble des tenants : chaque ligne pilote l'abonnement d'une org
// (plan, statut, essai). Table opérationnelle, chaque valeur sert une décision.

export default async function AdminOrgsPage() {
  const t = await getT();
  return (
    <div className="animate-fade-up">
      <h1 className="headline text-[34px] text-white">{t("admin.title")}</h1>
      <p className="mt-1.5 text-[13.5px] text-night-text">{t("admin.subtitle")}</p>
      <OrgTable />
    </div>
  );
}
