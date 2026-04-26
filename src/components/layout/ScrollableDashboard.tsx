import type { ReactNode } from "react";

type ScrollableDashboardProps = {
  children: ReactNode;
};

export function ScrollableDashboard({ children }: ScrollableDashboardProps) {
  return (
    <main id="dashboard-scroll" className="dashboard-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto max-w-[1280px] p-6">{children}</div>
    </main>
  );
}
