"use client";

import { SparklesIcon } from "@hugeicons/core-free-icons";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState } from "react";

const EXAMPLES = [
  "10 hours of consulting for Acme Corp at $120/hour, due in 30 days",
  "Logo design for Globex, €850 flat, plus 19% VAT, net 14",
  "3 days of development at $600/day and hosting setup $150 for Initech, 10% discount",
];

interface AiPromptProps {
  onSubmit: (prompt: string) => void;
  loading?: boolean;
  defaultValue?: string;
  className?: string;
}

/**
 * "Describe the work": the AI way into an invoice. Cmd/Ctrl+Enter submits.
 */
export function AiPrompt({ onSubmit, loading = false, defaultValue = "", className }: AiPromptProps) {
  const [prompt, setPrompt] = useState(defaultValue);
  const ready = prompt.trim().length >= 5 && !loading;

  const submit = () => {
    if (ready) onSubmit(prompt.trim());
  };

  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-primary/10 via-background to-background p-4 ring-1 ring-primary/20 sm:p-5", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon icon={SparklesIcon} className="size-4" />
        </span>
        Describe the work, get an invoice
      </div>
      <Textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            submit();
          }
        }}
        maxLength={2000}
        rows={3}
        placeholder={EXAMPLES[0]}
        aria-label="Describe the work"
        className="mt-3 resize-none bg-background"
        disabled={loading}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.slice(1).map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => setPrompt(example)}
              className="max-w-full truncate rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
        <Button type="button" onClick={submit} disabled={!ready}>
          <Icon icon={SparklesIcon} className={loading ? "animate-pulse" : undefined} />
          {loading ? "Drafting..." : "Draft invoice"}
        </Button>
      </div>
    </div>
  );
}
