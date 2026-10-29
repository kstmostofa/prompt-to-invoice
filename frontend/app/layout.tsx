import type { Metadata } from "next";
import { Geist, Geist_Mono, Hind_Siliguri, Khand } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NextAuthProvider } from "@/components/providers/next-auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TopLoader } from "@/components/shared/top-loader";

// Khand is the wordmark's typeface, and the whole app is set in it: body
// text at regular, headings a step heavier. It is a static family, so the
// weights must be listed. globals.css maps both --font-sans and
// --font-heading to this one variable.
// Khand has no Bengali glyphs. Hind Siliguri is its sibling from the same
// foundry and takes over wherever lang="bn" (see globals.css) — for Latin
// letters and digits on that page too, so nothing there falls back to Khand.
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bengali",
});

const khand = Khand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-khand",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PromptToInvoice",
  description: "Describe the work, get a ready-to-send invoice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        khand.variable,
        hindSiliguri.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <TopLoader
                color="var(--primary)"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px var(--primary),0 0 5px var(--primary)"
              />
              {children}
              <Toaster position="bottom-center" swipeDirections={["bottom"]} richColors />
            </TooltipProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
