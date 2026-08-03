import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Chip, cn, PressableFeedback, Typography, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

import { SheetShell } from "@/features/home/sheet-shell";
import { SheetContent } from "@/features/home/sheet-content";
import { resolveTrimEstimates } from "@/mocks/data/trim-estimates";
import { resolveExternalFairPrice, type ListingValuation } from "@/models/feed";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

/** Yellowish AI sparkles — matches AI Warnings accent. */
const AI_ICON_COLOR = "#E8C547";

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

function formatDelta(delta: number, symbol: string): string {
  if (delta === 0) return "—";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatPrice(Math.abs(delta), symbol)}`;
}

interface FeedDetailTrimEstimatesProps {
  valuation: ListingValuation;
  currencySymbol: string;
}

/**
 * External (book) valuation — Advanced Calculation row + trim bottom sheet.
 * Uses SheetShell (same as home) — no BottomSheet.Trigger — so the feed-card
 * press that navigates here cannot auto-open the portal on mount.
 */
export function FeedDetailTrimEstimates({
  valuation,
  currencySymbol,
}: FeedDetailTrimEstimatesProps): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [muted] = useThemeColor(["muted"]);
  const [visible, setVisible] = useState(false);
  const snapPoints = useMemo(() => ["55%", "88%"], []);

  const options = useMemo(() => resolveTrimEstimates(valuation), [valuation]);
  const selected = useMemo(() => options.find((o) => o.isSelected), [options]);
  const selectedFair =
    resolveExternalFairPrice(valuation.countryCode, selected?.marketplace) ?? valuation.fairPrice;

  if (options.length === 0) return null;

  // Single wrapper so SheetShell never becomes a second `gap-*` sibling on the
  // feed-detail column when the portal mounts (Fragment would flatten to 2 kids).
  return (
    <View>
      <PressableFeedback
        accessibilityRole="button"
        accessibilityLabel="Open advanced calculation"
        className="w-full overflow-hidden rounded-2xl border border-border bg-surface-secondary"
        animation={{ scale: { value: 0.98 } }}
        onPress={() => setVisible(true)}
      >
        <PressableFeedback.Highlight />
        <View className="flex-row items-center gap-2.5 px-3 py-3">
          <Ionicons name="sparkles" size={18} color={AI_ICON_COLOR} />

          <View className="min-w-0 flex-1 gap-1">
            <Typography
              type="body-sm"
              weight="semibold"
              className="text-[14px] text-foreground"
              numberOfLines={1}
            >
              Advanced Calculation
            </Typography>
            <Typography
              type="body-xs"
              className="min-w-0 text-[11px] text-muted"
              numberOfLines={1}
            >
              {selected?.trim ?? `${options.length} trim estimates`}
            </Typography>
          </View>

          <View className="shrink-0 flex-row items-center gap-0.5">
            <Typography type="body-sm" weight="bold" className="text-[15px] text-foreground">
              {formatPrice(selectedFair, currencySymbol)}
            </Typography>
            <Ionicons name="chevron-forward" size={13} color={muted} />
          </View>
        </View>
      </PressableFeedback>

      <SheetShell visible={visible} onClose={() => setVisible(false)}>
        <SheetContent
          snapPoints={snapPoints}
          enableOverDrag={false}
          enableDynamicSizing={false}
          handleComponent={null}
          contentContainerClassName="h-full px-0"
        >
          <View className="gap-1 px-5 pb-3 pt-4">
            <View className="flex-row items-center gap-2.5">
              <Ionicons name="sparkles" size={18} color={AI_ICON_COLOR} />
              <BottomSheet.Title
                className="min-w-0 flex-1 text-left text-xl font-bold"
                numberOfLines={1}
              >
                Advanced Calculation
              </BottomSheet.Title>
              <BottomSheet.Close />
            </View>
            <BottomSheet.Description className="pl-[28px] text-left">
              {valuation.year} {valuation.make} {valuation.model}
              {" · "}
              {options.length} trims
            </BottomSheet.Description>
          </View>

          <StyledBottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-1 px-4 pt-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            {options.map((option, index) => {
              const fair = resolveExternalFairPrice(valuation.countryCode, option.marketplace) ?? 0;
              const delta = fair - selectedFair;
              const isSelected = !!option.isSelected;

              return (
                <View
                  key={`${option.vehicleId ?? option.trim ?? "trim"}-${index}`}
                  className={cn(
                    "flex-row items-center gap-2 rounded-lg px-2 py-2.5",
                    isSelected && "bg-success/15"
                  )}
                >
                  <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                    <Typography
                      type="body-xs"
                      weight={isSelected ? "semibold" : "normal"}
                      className="min-w-0 shrink text-foreground"
                      numberOfLines={2}
                    >
                      {option.trim}
                    </Typography>
                    {isSelected ? (
                      <Chip
                        size="sm"
                        variant="soft"
                        color="success"
                        className="h-5 shrink-0 px-1.5"
                      >
                        <Chip.Label className="text-[10px]">Selected</Chip.Label>
                      </Chip>
                    ) : null}
                  </View>

                  {!isSelected ? (
                    <Typography
                      type="body-xs"
                      className={cn(
                        "shrink-0 text-[11px]",
                        delta > 0 ? "text-success" : "text-danger"
                      )}
                    >
                      {formatDelta(delta, currencySymbol)}
                    </Typography>
                  ) : null}

                  <Typography type="body-xs" weight="semibold" className="shrink-0 text-foreground">
                    {formatPrice(fair, currencySymbol)}
                  </Typography>
                </View>
              );
            })}
          </StyledBottomSheetScrollView>
        </SheetContent>
      </SheetShell>
    </View>
  );
}
