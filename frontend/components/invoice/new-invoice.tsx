"use client";

import { generateInvoiceDraft } from "@/lib/invoices";
import type { ClientOption, InvoiceDefaults, InvoiceDraft } from "@/types/api";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AiPrompt } from "./ai-prompt";
import { InvoiceEditor } from "./invoice-editor";

interface NewInvoiceProps {
  defaults: InvoiceDefaults;
  clients: ClientOption[];
  /** A prompt carried over from the dashboard: drafted on arrival. */
  initialPrompt?: string;
}

/**
 * A new invoice two ways: describe the work and review the AI draft in the
 * editor, or fill the editor in by hand. Each draft remounts the editor so
 * it starts from the draft's values.
 */
export function NewInvoice({ defaults, clients, initialPrompt }: NewInvoiceProps) {
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  const generate = async (prompt: string) => {
    setLoading(true);
    try {
      const result = await generateInvoiceDraft(prompt);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setDraft(result.data);
      setVersion((current) => current + 1);
      toast.success("Draft ready. Review it below.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !started.current) {
      started.current = true;
      // A prompt carried over from the dashboard is drafted straight away.
      generate(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4">
      <AiPrompt onSubmit={generate} loading={loading} defaultValue={initialPrompt} />
      <InvoiceEditor key={version} defaults={defaults} clients={clients} draft={draft} />
    </div>
  );
}
