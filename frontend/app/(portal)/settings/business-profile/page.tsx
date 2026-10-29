import { Building03Icon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { pageTitle } from "@/lib/site";
import { getBusinessProfile } from "@/lib/workspace";
import { BusinessProfileForm } from "./form";
import { LogoCard } from "./logo-card";

export const metadata = { title: pageTitle("Business profile") };

/** Who every invoice is from: name, address, tax details and numbering. */
export default async function BusinessProfilePage() {
  const { data: profile } = await getBusinessProfile();

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Settings", href: "/settings/business-profile" },
        { title: "Business profile", href: "/settings/business-profile" },
      ]}
      icon={Building03Icon}
      title="Business profile"
      description="What your clients see at the top of every invoice."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BusinessProfileForm profile={profile} />
        </div>
        <LogoCard logoUrl={profile.logo_url} />
      </div>
    </AppLayout>
  );
}
