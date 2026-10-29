"use client";

import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveAiSettings } from "@/lib/admin";
import { AiProvider, AiSettings } from "@/types/api";
import { ValidationError } from "@/types/global";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const NONE = "none";

export function AiSettingsForm({ settings, providers }: { settings: AiSettings; providers: AiProvider[] }) {
  const [provider, setProvider] = useState(settings.provider);
  const [model, setModel] = useState(settings.model ?? "");
  const [fallback, setFallback] = useState(settings.fallback ?? NONE);
  const [fallbackModel, setFallbackModel] = useState(settings.fallback_model ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const byId = (id: string) => providers.find((option) => option.id === id);
  const label = (option: AiProvider) => `${option.label}${option.configured ? "" : " (no API key)"}`;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const response = await saveAiSettings({
        provider,
        model: model.trim() || null,
        fallback: fallback === NONE ? null : fallback,
        fallback_model: fallback === NONE ? null : fallbackModel.trim() || null,
      });
      if ((response as ValidationError).errors) {
        setErrors(Object.fromEntries(Object.entries((response as ValidationError).errors).map(([field, messages]) => [field, messages[0]])));
        return;
      }
      toast.success("AI settings saved");
      router.refresh();
    } catch {
      toast.error("Could not save the AI settings.");
    } finally {
      setLoading(false);
    }
  };

  const active = byId(provider);
  const backup = fallback === NONE ? undefined : byId(fallback);

  return (
    <form onSubmit={save}>
      <DetailCard title="Active provider" description="Every workspace's invoice drafts use this.">
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={(value) => value && setProvider(value)}>
              <SelectTrigger id="provider" className="w-full">
                <SelectValue>{active ? active.label : provider}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {providers.map((option) => (
                  <SelectItem key={option.id} value={option.id} disabled={!option.configured}>
                    {label(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError message={errors.provider} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" list="model-options" value={model} onChange={(event) => setModel(event.target.value)} placeholder={active?.default_model ?? "Provider default"} />
            <datalist id="model-options">
              {active?.models.map((option) => <option key={option} value={option} />)}
            </datalist>
            <p className="text-xs text-muted-foreground">Leave empty for the server default ({active?.default_model ?? "none set"}).</p>
            <InputError message={errors.model} />
          </div>

          <div className="grid gap-2 border-t pt-5">
            <Label htmlFor="fallback">Fallback provider</Label>
            <Select value={fallback} onValueChange={(value) => value && setFallback(value)}>
              <SelectTrigger id="fallback" className="w-full">
                <SelectValue>{backup ? backup.label : "No fallback"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No fallback</SelectItem>
                {providers
                  .filter((option) => option.id !== provider)
                  .map((option) => (
                    <SelectItem key={option.id} value={option.id} disabled={!option.configured}>
                      {label(option)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used when the active provider is down, rate limited or rejects its key.</p>
            <InputError message={errors.fallback} />
          </div>
          {backup && (
            <div className="grid gap-2">
              <Label htmlFor="fallback_model">Fallback model</Label>
              <Input
                id="fallback_model"
                list="fallback-model-options"
                value={fallbackModel}
                onChange={(event) => setFallbackModel(event.target.value)}
                placeholder={backup.default_model ?? "Provider default"}
              />
              <datalist id="fallback-model-options">
                {backup.models.map((option) => <option key={option} value={option} />)}
              </datalist>
              <InputError message={errors.fallback_model} />
            </div>
          )}
          <SubmitButton loading={loading} label="Save AI settings" />
          <p className="text-xs text-muted-foreground">
            API keys are set on the server in <code className="rounded bg-muted px-1">backend/.env</code> and never shown here.
          </p>
        </div>
      </DetailCard>
    </form>
  );
}
