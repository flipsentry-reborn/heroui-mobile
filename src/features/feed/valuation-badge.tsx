import type { JSX } from "react";
import { Chip } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

const TIER_COLOR: Record<ValuationTier, "success" | "accent" | "warning" | "danger"> = {
 greatDeal: "success",
 goodValue: "accent",
 fairPrice: "warning",
 overpriced: "danger",
};

const TIER_LABEL: Record<ValuationTier, string> = {
 greatDeal: "Great",
 goodValue: "Good",
 fairPrice: "Fair",
 overpriced: "Pass",
};

interface ValuationBadgeProps {
 buySignal: number;
}

/** Valuation pill - Chip keeps readable labels (Pro Badge was collapsing to dots). */
export function ValuationBadge({ buySignal }: ValuationBadgeProps): JSX.Element {
 const tier = getValuationTier(buySignal);
 return (
 <Chip size="sm" variant="primary" color={TIER_COLOR[tier]} className="shadow-sm">
 <Chip.Label className="text-[9px] font-semibold">{TIER_LABEL[tier]}</Chip.Label>
 </Chip>
 );
}
