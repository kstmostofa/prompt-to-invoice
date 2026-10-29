import { BreadcrumbItem as BreadcrumbItemType } from "@/types/global";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Fragment } from "react";
import Link from "next/link";

export default function AppBreadcrumb({
  breadcrumbs,
}: {
  breadcrumbs: BreadcrumbItemType[];
}) {
  return (
    <>
      {breadcrumbs?.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <Fragment key={index}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium text-base">
                        {item.title}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={item.href} />}>
                        {item.title}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  );
}
