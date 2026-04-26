import type { DashboardTab } from "../../lib/utils/types";

type TabsProps = {
  tabs: Array<{ id: DashboardTab; label: string }>;
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
            active === tab.id ? "bg-teal text-white shadow-sm" : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
