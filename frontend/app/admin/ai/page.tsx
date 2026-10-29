import { SparklesIcon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { getAiSettings } from "@/lib/admin";
import { pageTitle } from "@/lib/site";
import { AiSettingsForm } from "./settings-form";
import { ProviderTable } from "./provider-table";

export const metadata = { title: pageTitle("AI providers") };

/**
 * Which AI drafts invoices. Keys are set on the server (backend .env), so a
 * provider shows as available only once its key is there.
 */
export default async function AiProvidersPage() {
  const { data } = await getAiSettings();

  return (
    <AppLayout
      breadcrumbs={[{ title: "AI providers", href: "/admin/ai" }]}
      icon={SparklesIcon}
      title="AI providers"
      description="Choose the model that drafts invoices from descriptions, and a fallback for when it is down."
    >
      <div className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <AiSettingsForm settings={data.settings} providers={data.providers} />
        <ProviderTable providers={data.providers} active={data.settings.provider} fallback={data.settings.fallback} />
      </div>
    </AppLayout>
  );
}
