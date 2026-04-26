import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
