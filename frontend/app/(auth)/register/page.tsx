import { GuestPage } from "@/components/layouts/guest-page";
import { pageTitle } from "@/lib/site";
import Link from "next/link";
import { RegisterForm } from "./form";

export const metadata = {
  title: pageTitle("Create account"),
};

export default function RegisterPage() {
  return (
    <GuestPage
      title="Start invoicing"
      description="Free for up to 5 invoices a month. No card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </GuestPage>
  );
}
