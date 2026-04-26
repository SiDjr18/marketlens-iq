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
    <nav className="flex h-14 shrink-0 items-center overflow-hidden border-b border-border bg-[#F7F9FC] px-6">
      <Tabs
        tabs={NAV_TABS.map((tab) => ({ ...tab, label: disabledTabs.includes(tab.id) ? `${tab.label}` : tab.label }))}
        active={activeTab}
        onChange={(tab) => {
          if (!disabledTabs.includes(tab)) onChange(tab);
        }}
      />
    </nav>
  );
}
