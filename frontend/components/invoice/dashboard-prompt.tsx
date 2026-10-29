"use client";

import { useRouter } from "next/navigation";
import { AiPrompt } from "./ai-prompt";

/** The dashboard's prompt box: hands the description to the new-invoice page. */
export function DashboardPrompt() {
  const router = useRouter();

  return <AiPrompt onSubmit={(prompt) => router.push(`/invoices/new?prompt=${encodeURIComponent(prompt)}`)} />;
}
