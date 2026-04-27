import type { DashboardTab } from "../../lib/utils/types";

type TabsProps = {
  tabs: Array<{ id: DashboardTab; label: string }>;
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`h-9 rounded-md px-4 text-sm font-semibold transition ${
            active === tab.id ? "bg-navy text-white shadow-control" : "text-slate-600 hover:bg-slate-50 hover:text-navy"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
