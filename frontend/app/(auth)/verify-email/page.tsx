import { CheckmarkCircle02Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { auth } from "@/auth";
import { GuestPage } from "@/components/layouts/guest-page";
import { DetailCard } from "@/components/shared/detail-card";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/account";
import { pageTitle } from "@/lib/site";
import Link from "next/link";

export const metadata = { title: pageTitle("Verify email") };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Where the verification email's link lands. */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const query = await searchParams;
  const param = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const [id, hash, expires, signature] = ["id", "hash", "expires", "signature"].map(param);

  const result =
    id && hash && expires && signature
      ? await verifyEmail({ id, hash, expires, signature })
      : { success: false, message: "This link is incomplete. Open it again from the email." };
  const session = await auth();

  return (
    <GuestPage title={result.success ? "You're verified" : "Verification failed"} description={result.message}>
      <DetailCard title={result.success ? "All set" : "What now?"}>
        <div className="flex items-start gap-3">
          <Icon
            icon={result.success ? CheckmarkCircle02Icon : Alert02Icon}
            className={result.success ? "size-6 shrink-0 text-emerald-500" : "size-6 shrink-0 text-amber-500"}
          />
          <p className="text-sm text-muted-foreground">
            {result.success
              ? "You can now email invoices straight to your clients."
              : "Sign in and use the banner at the top of the page to send a new link."}
          </p>
        </div>
        <Button className="mt-5 w-full" render={<Link href={session ? "/dashboard" : "/login"} />}>
          {session ? "Go to dashboard" : "Sign in"}
        </Button>
      </DetailCard>
    </GuestPage>
  );
}
