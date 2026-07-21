import type { JSX } from "react";
import { useMemo } from "react";
import { View } from "react-native";
import { Accordion, Chip, cn, Typography } from "heroui-native";

import { resolveTrimEstimates } from "@/mocks/data/trim-estimates";
import type { ListingValuation } from "@/models/feed";

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

interface FeedDetailTrimEstimatesProps {
  valuation: ListingValuation;
  currencySymbol: string;
}

/** Car-only: one compact accordion listing sibling trim estimates. */
export function FeedDetailTrimEstimates({
  valuation,
  currencySymbol,
}: FeedDetailTrimEstimatesProps): JSX.Element | null {
  const trims = useMemo(() => resolveTrimEstimates(valuation), [valuation]);
  const current = useMemo(() => trims.find((t) => t.isCurrent), [trims]);

  if (trims.length === 0) return null;

  const summary =
    current != null
      ? `${current.trim} · ${formatPrice(current.fairPrice, currencySymbol)}`
      : `${trims.length} trims`;

  return (
    <Accordion
      variant="surface"
      selectionMode="single"
      hideSeparator
      isCollapsible
      className="w-auto"
    >
      <Accordion.Item value="other-trims">
        <Accordion.Trigger className="gap-2 px-3 py-2">
          <View className="min-w-0 flex-1 gap-0.5">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-foreground"
              numberOfLines={1}
            >
              Other trims
            </Typography>
            <Typography type="body-xs" className="text-muted" numberOfLines={1}>
              {valuation.year} {valuation.make} {valuation.model}
              {" · "}
              {summary}
            </Typography>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>

        <Accordion.Content className="gap-0 px-3 pb-2.5 pt-0">
          {trims.map((trim, index) => (
            <View
              key={trim.id}
              className={cn(
                "flex-row items-center gap-2 py-1.5",
                index < trims.length - 1 && "border-b border-border/40",
              )}
            >
              <Typography
                type="body-xs"
                weight={trim.isCurrent ? "semibold" : "normal"}
                className="min-w-0 shrink text-foreground"
                numberOfLines={1}
              >
                {trim.trim}
              </Typography>
              {trim.isCurrent ? (
                <Chip size="sm" variant="soft" color="accent" className="h-5 px-1.5">
                  <Chip.Label className="text-[10px]">Current</Chip.Label>
                </Chip>
              ) : null}
              <Typography
                type="body-xs"
                weight="semibold"
                className="ml-auto text-foreground"
              >
                {formatPrice(trim.fairPrice, currencySymbol)}
              </Typography>
            </View>
          ))}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
