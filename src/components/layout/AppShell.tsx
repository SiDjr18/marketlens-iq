import type { ReactNode } from "react";
import type { DashboardTab, FilterState } from "../../lib/utils/types";
import { Header } from "./Header";
import { NavigationTabs } from "./NavigationTabs";
import { TopFilterBar, type FilterOptions } from "./TopFilterBar";
import { ScrollableDashboard } from "./ScrollableDashboard";

type AppShellProps = {
  status: "No data" | "Uploaded" | "Mapping required" | "Ready";
  activeTab: DashboardTab;
  filters: FilterState;
  filterOptions: FilterOptions;
  filtersDisabled: boolean;
  disabledTabs?: DashboardTab[];
  onUploadClick: () => void;
  onSettingsClick: () => void;
  onTabChange: (tab: DashboardTab) => void;
  onFilterChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onSaveView: () => void;
  onOpenMapping: () => void;
  children: ReactNode;
};

export function AppShell({
  status,
  activeTab,
  filters,
  filterOptions,
  filtersDisabled,
  disabledTabs,
  onUploadClick,
  onSettingsClick,
  onTabChange,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  onSaveView,
  onOpenMapping,
  children
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-slate-900">
      <Header status={status} onUploadClick={onUploadClick} onSettingsClick={onSettingsClick} />
      <NavigationTabs activeTab={activeTab} onChange={onTabChange} disabledTabs={disabledTabs} />
      <TopFilterBar
        filters={filters}
        options={filterOptions}
        disabled={filtersDisabled}
        onChange={onFilterChange}
        onApply={onApplyFilters}
        onClear={onClearFilters}
        onSave={onSaveView}
        onOpenMapping={onOpenMapping}
      />
      <ScrollableDashboard>{children}</ScrollableDashboard>
    </div>
  );
}
