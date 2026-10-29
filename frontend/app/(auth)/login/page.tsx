import LoginForm from "@/components/forms/login-form";
import { GuestPage } from "@/components/layouts/guest-page";
import { pageTitle } from "@/lib/site";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: pageTitle("Sign in"),
};

export default function Login() {
  return (
    <GuestPage
      title="Welcome back"
      description="Sign in to create, send and track your invoices."
      footer={
        <>
          New to PromptToInvoice?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </GuestPage>
  );
}
