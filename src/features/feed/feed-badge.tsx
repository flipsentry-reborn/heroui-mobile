import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { Chip } from "heroui-native";

import { getValuationTier, type ValuationTier } from "@/models/feed";

type ChipColor = "accent" | "default" | "success" | "warning" | "danger";
type IonName = ComponentProps<typeof Ionicons>["name"];

/** Shared size for every overlay badge on a feed card. */
const CHIP_CLASS = "h-5 min-h-5 px-1.5 py-0";
const LABEL_CLASS = "text-[10px] font-normal leading-none";

/**
 * Deal quality (valuation) only - each tier has its own color.
 * Good uses sky blue so it never reads like Great (success).
 */
const TIER_STYLE: Record<
  ValuationTier,
  { label: string; color: ChipColor; chipClass?: string; labelClass?: string }
> = {
  greatDeal: { label: "Great", color: "success" },
  goodValue: {
    label: "Good",
    color: "accent",
    chipClass: "bg-sky-500",
    labelClass: "text-white",
  },
  fairPrice: { label: "OK", color: "warning" },
  overpriced: { label: "Skip", color: "danger" },
};

/** Status chips: one style + neutral (white) icon before label. */
const STATUS_CHIP_CLASS = `${CHIP_CLASS} flex-row items-center gap-0.5 bg-black/70`;
const STATUS_LABEL_CLASS = `${LABEL_CLASS} text-white`;

const STATUS_ICON: Record<string, IonName> = {
  Dealer: "storefront-outline",
  Spam: "warning-outline",
  Salvage: "construct-outline",
  Rebuilt: "build-outline",
  "Major Damage": "alert-circle-outline",
  Negotiable: "pricetag-outline",
  ASAP: "flash-outline",
  Committed: "checkmark-circle-outline",
};

interface FeedBadgeProps {
  label: string;
  color: ChipColor;
  chipClass?: string;
  labelClass?: string;
}

/** Solid Chip badge - same height/type for valuation + status. */
export function FeedBadge({
  label,
  color,
  chipClass,
  labelClass,
}: FeedBadgeProps): JSX.Element {
  return (
    <Chip
      size="sm"
      variant="primary"
      color={color}
      className={`${CHIP_CLASS}${chipClass ? ` ${chipClass}` : ""}`}
    >
      <Chip.Label
        className={`${LABEL_CLASS}${labelClass ? ` ${labelClass}` : ""}`}
      >
        {label}
      </Chip.Label>
    </Chip>
  );
}

export function ValuationBadge({
  buySignal,
}: {
  buySignal: number;
}): JSX.Element {
  const tier = getValuationTier(buySignal);
  const style = TIER_STYLE[tier];
  return (
    <FeedBadge
      label={style.label}
      color={style.color}
      chipClass={style.chipClass}
      labelClass={style.labelClass}
    />
  );
}

/** Negotiable, ASAP, Damaged, Dealer, etc. - shared style + icon. */
export function StatusBadge({ label }: { label: string }): JSX.Element {
  const icon = STATUS_ICON[label] ?? "ellipse-outline";

  return (
    <Chip
      size="sm"
      variant="primary"
      color="default"
      className={STATUS_CHIP_CLASS}
    >
      <Ionicons name={icon} size={10} color="#FFFFFF" />
      <Chip.Label className={STATUS_LABEL_CLASS}>{label}</Chip.Label>
    </Chip>
  );
}
