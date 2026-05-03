import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center text-xs font-semibold space-x-1", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <a
              href={item.href}
              className="text-secondary-light hover:text-secondary-dark transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span
              className={cn(
                item.active ? "text-primary-dark" : "text-secondary-light"
              )}
            >
              {item.label}
            </span>
          )}

          {index < items.length - 1 && (
            <ChevronRight className="w-3 h-3 text-secondary-light/50 mx-1" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
