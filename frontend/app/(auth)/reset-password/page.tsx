import { GuestPage } from "@/components/layouts/guest-page";
import { pageTitle } from "@/lib/site";
import Link from "next/link";
import { ResetPasswordForm } from "./form";

export const metadata = { title: pageTitle("Choose a password") };

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Where the reset email's link lands. */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  const email = typeof query.email === "string" ? query.email : "";

  return (
    <GuestPage title="Choose a new password" description="Pick something you have not used here before.">
      {token && email ? (
        <ResetPasswordForm token={token} email={email} invite={false} />
      ) : (
        <p className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
          This link is incomplete. Open it again from the email, or{" "}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            ask for a new one
          </Link>
          .
        </p>
      )}
    </GuestPage>
  );
}
