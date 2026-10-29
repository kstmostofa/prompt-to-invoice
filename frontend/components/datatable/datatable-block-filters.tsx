import { ReactNode } from "react";

export default function DatatableBlockFilters({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">{children}</div>
    </div>
  );
}
