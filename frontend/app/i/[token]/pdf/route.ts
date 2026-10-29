import { PUBLIC_INVOICE_PDF_URL } from "@/lib/api-urls";

/** The client's PDF download, by token, without a session. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const upstream = await fetch(PUBLIC_INVOICE_PDF_URL(token), { headers: { Accept: "application/pdf" }, cache: "no-store" });

  if (!upstream.ok) {
    return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": upstream.headers.get("Content-Disposition") ?? 'attachment; filename="Invoice.pdf"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
