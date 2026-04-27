import { NAV_TABS } from "../../lib/utils/constants";
import type { DashboardTab } from "../../lib/utils/types";
import { Tabs } from "../ui/Tabs";

type NavigationTabsProps = {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
  disabledTabs?: DashboardTab[];
};

export function NavigationTabs({ activeTab, onChange, disabledTabs = [] }: NavigationTabsProps) {
  return (
    <nav className="flex min-h-14 shrink-0 items-center border-b border-border bg-canvas px-6 py-2">
      <div className="mx-auto flex w-full max-w-[1280px] items-center rounded-lg border border-border bg-white p-1 shadow-control">
        <Tabs
          tabs={NAV_TABS.map((tab) => ({ ...tab, label: disabledTabs.includes(tab.id) ? `${tab.label}` : tab.label }))}
          active={activeTab}
          onChange={(tab) => {
            if (!disabledTabs.includes(tab)) onChange(tab);
          }}
        />
      </div>
    </nav>
  );
}
