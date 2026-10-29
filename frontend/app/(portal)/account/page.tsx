import { UserCircleIcon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem } from "@/components/shared/detail-card";
import { getProfile } from "@/lib/account";
import { formatDate } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";
import { WorkspaceSwitcher } from "./workspace-switcher";

export const metadata = { title: pageTitle("Account") };

/** Your own account: your details, your workspaces and your password. */
export default async function AccountPage() {
  const { data: user } = await getProfile();
  const workspaces = user.workspaces ?? [];

  return (
    <AppLayout
      breadcrumbs={[{ title: "Account", href: "/account" }]}
      icon={UserCircleIcon}
      title="Account"
      description="Your own sign-in, used across every workspace you belong to."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileForm user={user} />
        <ChangePasswordForm />
        {!user.is_admin && workspaces.length > 0 && (
          <WorkspaceSwitcher workspaces={workspaces} currentId={user.current_workspace_id} />
        )}
        <DetailCard title="Sign-in activity">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledItem label="Member since" value={formatDate(user.created_at)} />
            <LabeledItem label="Last sign-in" value={formatDate(user.last_login_at) || "—"} />
          </div>
        </DetailCard>
      </div>
    </AppLayout>
  );
}
