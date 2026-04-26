import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`rounded-xl border border-border bg-white p-5 shadow-sm ${className}`} {...props} />;
}
