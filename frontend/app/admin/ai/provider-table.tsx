"use client";

import { DetailCard } from "@/components/shared/detail-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { testAiProvider } from "@/lib/admin";
import { AiProvider, AiTestResult } from "@/types/api";
import { useState } from "react";

const SAMPLE = "10 hours of consulting for Acme Corp at $120/hour and a $250 workshop, due in 30 days";

const number = (value: number) => new Intl.NumberFormat("en").format(value);

export function ProviderTable({ providers, active, fallback }: { providers: AiProvider[]; active: string; fallback: string | null }) {
  const [testing, setTesting] = useState<AiProvider | null>(null);
  const [prompt, setPrompt] = useState(SAMPLE);
  const [result, setResult] = useState<AiTestResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    if (!testing) return;
    setRunning(true);
    setResult(null);
    setResult(await testAiProvider(testing.id, null, prompt));
    setRunning(false);
  };

  return (
    <DetailCard title="Providers" description="Usage over the last 30 days. Test any provider that has a key.">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Default model</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead className="text-right">Success</TableHead>
              <TableHead className="text-right">Tokens in / out</TableHead>
              <TableHead className="text-right">Avg time</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => {
              const usage = provider.usage_30d;
              return (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {provider.label}
                      {provider.id === active && <Badge>Active</Badge>}
                      {provider.id === fallback && <Badge variant="secondary">Fallback</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{provider.configured ? (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        Ready
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No API key</span>
                    )}</TableCell>
                  <TableCell className="font-mono text-xs">{provider.default_model ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{number(usage.requests)}</TableCell>
                  <TableCell className="text-right tabular-nums">{usage.requests ? `${Math.round((usage.succeeded / usage.requests) * 100)}%` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {number(usage.input_tokens)} / {number(usage.output_tokens)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{usage.requests ? `${(usage.avg_duration_ms / 1000).toFixed(1)}s` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!provider.configured}
                      onClick={() => {
                        setTesting(provider);
                        setResult(null);
                      }}
                    >
                      Test
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={testing !== null} onOpenChange={(open) => !open && setTesting(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test {testing?.label}</DialogTitle>
            <DialogDescription>Runs one description through this provider. Nothing is saved; the call is billed by the provider.</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={2000} />
          <div className="flex justify-end">
            <Button onClick={run} disabled={running || prompt.trim().length < 5}>
              {running ? "Running..." : "Run test"}
            </Button>
          </div>
          {result &&
            (result.success ? (
              <div className="grid gap-2 text-sm">
                <div className="text-muted-foreground">
                  <span className="font-mono">{result.data.model}</span> · {(result.data.duration_ms / 1000).toFixed(1)}s · {number(result.data.input_tokens)} in /{" "}
                  {number(result.data.output_tokens)} out
                </div>
                <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(result.data.output, null, 2)}</pre>
              </div>
            ) : (
              <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
                {result.message}
                {result.reason ? ` (${result.reason.replace(/_/g, " ")})` : ""}
              </p>
            ))}
        </DialogContent>
      </Dialog>
    </DetailCard>
  );
}
