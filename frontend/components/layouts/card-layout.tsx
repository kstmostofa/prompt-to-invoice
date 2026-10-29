import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardLayoutProps {
  children: React.ReactNode;
  /** Optional: a card under a page header has no title of its own to repeat. */
  title?: ReactNode;
  description?: ReactNode;
  cardAction?: ReactNode;
  className?: string;
  /** Overrides for the title row, e.g. a smaller, muted title on a metric tile. */
  titleClassName?: string;
}

export default function CardLayout({
  children,
  title,
  description,
  cardAction,
  className,
  titleClassName,
}: CardLayoutProps) {
  // The header is words only, a title and a description, with any action on
  // the right. A card with nothing to put there drops the strip entirely
  // rather than reserving blank space above its panel.
  const hasHeader = Boolean(title || description || cardAction);

  return (
    // <div className="flex h-full flex-1 flex-col p-4">
    //   <Card className="p-4 bg-sidebar shadow-xs rounded-2xl gap-0 overflow-hidden">
    //     <CardHeader className="flex flex-row items-center justify-between p-0">
    //       <div className="flex flex-col">
    //         <CardTitle className="text-2xl">{title}</CardTitle>
    //         {description && <CardDescription>{description}</CardDescription>}
    //       </div>
    //       {cardAction && <div>{cardAction}</div>}
    //     </CardHeader>
    //     <CardContent className="p-0 mt-4">{children}</CardContent>
    //   </Card>
    // </div>
    // <div className="p-4">
    //   <div className="flex flex-col rounded-3xl border bg-muted ">
    //     <div className="flex items-center justify-between gap-2 p-4">
    //       <div>
    //         <CardTitle>{title}</CardTitle>
    //         {description && <CardDescription>{description}</CardDescription>}
    //       </div>
    //       {cardAction && <div>{cardAction}</div>}
    //     </div>
    //     <div className="relative h-full scale-102 lg:scale-101 ">
    //       {children}
    //     </div>
    //   </div>
    // </div>
    <div
      className={cn(
        "w-full gap-2 bg-sidebar p-1 shadow-sm rounded-2xl ring-1 ring-sidebar-border",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex flex-col">
            {title && (
              <span
                className={cn(
                  "flex items-center gap-2 font-heading text-xl font-medium tracking-wide",
                  titleClassName,
                )}
              >
                {title}
              </span>
            )}
            {description && (
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
            )}
          </div>
          {cardAction && (
            <div className="flex items-center gap-2">{cardAction}</div>
          )}
        </div>
      )}
      {/* flex-1 is inert while this shell is a block; it only takes effect for
          callers that make the shell a flex column to equalise card heights. */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
