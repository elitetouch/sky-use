import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { StatusTemplate } from "@/lib/types";
import { StatusTemplateManager } from "@/components/admin/StatusTemplateManager";
import { NoAccess } from "@/components/admin/NoAccess";

export const metadata: Metadata = {
  title: "Status Milestones",
};

export default async function AdminStatusTemplatesPage() {
  if (!can(await getCurrentUser(), "milestones.manage")) {
    return <NoAccess area="status milestones" />;
  }
  const token = await getSessionToken();
  const templates = await apiFetch<StatusTemplate[]>("/admin/status-templates", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Status Milestones</h1>
      <p className="mt-1 text-body">
        The tracking milestones staff choose from when updating a shipment. Each one prefills a default note.
      </p>

      <div className="mt-6">
        <StatusTemplateManager initialTemplates={templates} />
      </div>
    </div>
  );
}
