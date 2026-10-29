"use client";

import NextTopLoader, { useTopLoader } from "nextjs-toploader";
import { useEffect } from "react";

/**
 * The page-load bar, taught about links that do not navigate.
 *
 * nextjs-toploader starts the bar on any click inside a same-site <a> and
 * finishes it on the navigation that follows. A download (an invoice PDF)
 * delivers a file and the page stays, so nothing finished the bar and it
 * crawled forever. This listens once the click has bubbled to the window,
 * after the loader's own document listener, and ends the bar for downloads.
 * The storefront has the same component.
 */
export function TopLoader(props: React.ComponentProps<typeof NextTopLoader>) {
  const loader = useTopLoader();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (anchor?.hasAttribute("download")) loader.done(true);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [loader]);

  return <NextTopLoader {...props} />;
}
