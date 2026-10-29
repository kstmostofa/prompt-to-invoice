import { auth } from "@/auth";
import { BASE_API_URL, GET_INVOICE_PDF } from "@/lib/api-urls";

/**
 * The invoice as a PDF, streamed through from the API with the user's token.
 * A route handler, not a server action: actions return JSON, and a download
 * has to be a real response the browser can save. `?inline=1` opens it in
 * the browser instead of downloading.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return new Response("Not found", { status: 404 });
  }

  const session = await auth();
  if (!session?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const upstream = await fetch(`${BASE_API_URL}${GET_INVOICE_PDF(numericId)}`, {
    headers: {
      Accept: "application/pdf",
      Authorization: `Bearer ${session.accessToken}`,
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response(upstream.status === 404 ? "Not found" : "Could not build the PDF", {
      status: upstream.status,
    });
  }

  const disposition = upstream.headers.get("Content-Disposition") ?? `attachment; filename="Invoice ${id}.pdf"`;
  const inline = new URL(request.url).searchParams.get("inline") === "1";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": inline ? disposition.replace(/^attachment/, "inline") : disposition,
      "Cache-Control": "private, no-store",
    },
  });
}
