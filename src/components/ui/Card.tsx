import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`rounded-lg border border-border bg-white p-5 shadow-soft ${className}`} {...props} />;
}
