import { GuestPage } from "@/components/layouts/guest-page";
import { pageTitle } from "@/lib/site";
import Link from "next/link";
import { ForgotPasswordForm } from "./form";

export const metadata = { title: pageTitle("Forgot password") };

export default function ForgotPasswordPage() {
  return (
    <GuestPage
      title="Forgot your password?"
      description="Enter your email and we will send you a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </GuestPage>
  );
}
