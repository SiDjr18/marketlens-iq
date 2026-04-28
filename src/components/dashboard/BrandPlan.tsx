import { useMemo, useState } from "react";
import type { AnalyticsContext, BrandPlanInput } from "../../lib/utils/types";
import { aggregateByBrand, aggregateByTherapy } from "../../lib/analytics/aggregateData";
import { generateBrandPlan } from "../../lib/strategy/brandPlanGenerator";
import { isStrategyReady } from "../../lib/mapping/validateMapping";
import { cellText } from "../../lib/utils/formatters";
import { isUsableDimensionValue } from "../../lib/mapping/semanticColumns";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";

export function BrandPlan({ context, onOpenMapping }: { context: AnalyticsContext; onOpenMapping: () => void }) {
  const brands = useMemo(
    () => aggregateByBrand(context.rows, context.mapping, context.filters.metric, context.filters).filter((row) => isUsableDimensionValue(row.name)),
    [context]
  );
  const therapies = useMemo(
    () => aggregateByTherapy(context.rows, context.mapping, context.filters.metric, context.filters).filter((row) => isUsableDimensionValue(row.name)),
    [context]
  );
  const [input, setInput] = useState<BrandPlanInput>({
    brand: brands[0]?.name ?? "",
    therapy: therapies[0]?.name ?? "",
    competitors: [],
    horizon: "180 days",
    objective: "Grow share"
  });
  const [generated, setGenerated] = useState(false);

  const effectiveBrand = brands.some((row) => row.name === input.brand) ? input.brand : brands[0]?.name || "";
  const effectiveTherapy = therapies.some((row) => row.name === input.therapy) ? input.therapy : therapies[0]?.name || "";
  const parentMolecule = useMemo(() => inferParentMolecule(context, effectiveBrand), [context, effectiveBrand]);
  const effectiveInput = {
    ...input,
    brand: effectiveBrand,
    therapy: effectiveTherapy
  };
  const plan = generated ? generateBrandPlan(context, effectiveInput) : [];

  if (!isStrategyReady(context.health)) {
    return <EmptyState title="Brand Plan is locked" description="Complete field mapping and pass data health validation to generate a pharma-grade brand plan." action={<Button variant="primary" onClick={onOpenMapping}>Open Field Mapping</Button>} />;
  }

  if (!brands.length) {
    return <EmptyState title="Brand names need review" description="The current Brand mapping contains pivot totals, measures, or numeric values instead of brand names. Open Field Mapping and choose the real brand/product column from the raw file." action={<Button variant="primary" onClick={onOpenMapping}>Open Field Mapping</Button>} />;
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12">
        <div className="grid gap-3 md:grid-cols-5">
          <Select
            label="Brand"
            value={effectiveInput.brand}
            onChange={(event) => setInput((current) => ({ ...current, brand: event.target.value }))}
            options={brands.slice(0, 100).map((row) => ({ label: row.name, value: row.name }))}
          />
          <Select
            label="Therapy"
            value={effectiveInput.therapy}
            onChange={(event) => setInput((current) => ({ ...current, therapy: event.target.value }))}
            options={therapies.slice(0, 100).map((row) => ({ label: row.name, value: row.name }))}
          />
          <Select
            label="Horizon"
            value={input.horizon}
            onChange={(event) => setInput((current) => ({ ...current, horizon: event.target.value as BrandPlanInput["horizon"] }))}
            options={["90 days", "180 days", "1 year"].map((value) => ({ label: value, value }))}
          />
          <Select
            label="Objective"
            value={input.objective}
            onChange={(event) => setInput((current) => ({ ...current, objective: event.target.value as BrandPlanInput["objective"] }))}
            options={["Grow share", "Defend leadership", "Launch", "Revive", "Enter new therapy"].map((value) => ({ label: value, value }))}
          />
          <div className="flex items-end">
            <Button variant="primary" className="w-full" onClick={() => setGenerated(true)}>
              Generate Brand Plan
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <MultiSelect
            label="Competitors"
            options={brands.filter((row) => row.name !== effectiveInput.brand).slice(0, 100).map((row) => row.name)}
            value={input.competitors}
            onChange={(competitors) => setInput((current) => ({ ...current, competitors }))}
          />
        </div>
        {parentMolecule && (
          <div className="mt-4 rounded-lg border border-teal/20 bg-teal-50 p-3 text-sm font-semibold text-teal">
            Parent molecule detected for {effectiveInput.brand}: {parentMolecule}
          </div>
        )}
      </Card>

      {!generated ? (
        <div className="col-span-12">
          <EmptyState title="Ready to generate" description="Select the brand, therapy, competitors, horizon, and objective, then generate a data-backed brand plan." />
        </div>
      ) : (
        plan.map((section) => (
          <Card key={section.title} className="col-span-12 md:col-span-6">
            <h3 className="text-lg font-black text-navy">{section.title}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {section.points.map((point) => (
                <li key={point} className="rounded-lg bg-slate-50 p-3">{point}</li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}

function inferParentMolecule(context: AnalyticsContext, brand: string): string {
  const brandColumn = context.mapping.brand;
  const moleculeColumn = context.mapping.molecule;
  if (!brandColumn || !moleculeColumn || !brand) return "";
  const match = context.rows.find((row) => cellText(row[brandColumn]) === brand && isUsableDimensionValue(row[moleculeColumn]));
  return match ? cellText(match[moleculeColumn]) : "";
}
