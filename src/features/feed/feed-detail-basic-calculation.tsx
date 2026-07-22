import { Ionicons } from "@expo/vector-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheet,
  Chip,
  PressableFeedback,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { SheetShell } from "@/features/home/sheet-shell";
import { getValuationTier, type ListingValuation } from "@/models/feed";

const StyledBottomSheetScrollView = withUniwind(BottomSheetScrollView);

const BASIC_ICON_COLOR = "#60A5FA";

function formatPrice(price: number, symbol: string): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function DetailRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}): JSX.Element {
  return (
    <View className="flex-row items-start justify-between gap-3 py-1.5">
      <Typography type="body-xs" className="shrink-0 text-muted">
        {label}
      </Typography>
      <Typography
        type="body-xs"
        weight={emphasize ? "semibold" : "medium"}
        className="min-w-0 flex-1 text-right text-foreground"
      >
        {value}
      </Typography>
    </View>
  );
}

interface FeedDetailBasicCalculationProps {
  valuation: ListingValuation;
  currencySymbol: string;
}

/**
 * Comps valuation row + sheet (Basic Calculation).
 * Same shell pattern as Advanced — SheetShell, no Trigger on mount.
 */
export function FeedDetailBasicCalculation({
  valuation,
  currencySymbol,
}: FeedDetailBasicCalculationProps): JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [muted] = useThemeColor(["muted"]);
  const [visible, setVisible] = useState(false);
  const snapPoints = useMemo(() => ["55%", "88%"], []);

  if (!valuation.calculated) return null;

  const tier = getValuationTier(valuation.buySignal);
  const tierLabel =
    tier === "greatDeal"
      ? "Great deal"
      : tier === "goodValue"
        ? "Good value"
        : tier === "fairPrice"
          ? "Fair"
          : "Overpriced";
  const isPhone =
    valuation.valuationType === "iphone" ||
    valuation.valuationType === "samsung";
  const titleLine = isPhone
    ? [
        valuation.iphoneModel || valuation.samsungModel || valuation.model,
        valuation.storageGb != null ? `${valuation.storageGb}GB` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : [valuation.year, valuation.make, valuation.model].filter(Boolean).join(" ");

  return (
    <View>
      <PressableFeedback
        accessibilityRole="button"
        accessibilityLabel="Open basic calculation"
        className="w-auto overflow-hidden rounded-2xl bg-surface"
        animation={{ scale: { value: 0.98 } }}
        onPress={() => setVisible(true)}
      >
        <View className="gap-1 px-3 py-2">
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="analytics-outline" size={16} color={BASIC_ICON_COLOR} />
            <Typography
              type="body-sm"
              weight="semibold"
              className="min-w-0 flex-1 text-foreground"
              numberOfLines={1}
            >
              Basic Calculation
            </Typography>
            <Ionicons name="chevron-forward" size={16} color={muted} />
          </View>
          <View className="flex-row items-center gap-1.5 pl-[26px]">
            <Typography
              type="body-xs"
              weight="medium"
              className="min-w-0 shrink text-foreground"
              numberOfLines={1}
            >
              {valuation.compCount} comps
            </Typography>
            <Chip size="sm" variant="soft" className="h-5 shrink-0 px-1.5">
              <Chip.Label className="text-[10px]">{tierLabel}</Chip.Label>
            </Chip>
            <Typography
              type="body-xs"
              weight="semibold"
              className="ml-auto shrink-0 text-foreground"
            >
              {formatPrice(valuation.fairPrice, currencySymbol)}
            </Typography>
          </View>
        </View>
      </PressableFeedback>

      <SheetShell visible={visible} onClose={() => setVisible(false)}>
        <BottomSheet.Content
          snapPoints={snapPoints}
          enableOverDrag={false}
          enableDynamicSizing={false}
          handleComponent={null}
          contentContainerClassName="h-full px-0"
        >
          <View className="gap-1 px-5 pb-3 pt-4">
            <View className="flex-row items-center gap-2.5">
              <Ionicons
                name="analytics-outline"
                size={18}
                color={BASIC_ICON_COLOR}
              />
              <BottomSheet.Title
                className="min-w-0 flex-1 text-left text-xl font-bold"
                numberOfLines={1}
              >
                Basic Calculation
              </BottomSheet.Title>
              <BottomSheet.Close />
            </View>
            <BottomSheet.Description className="pl-[28px] text-left">
              {titleLine}
              {" · "}
              {valuation.compCount} comps
            </BottomSheet.Description>
          </View>

          <StyledBottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-3 px-5 pt-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          >
            <View className="flex-row gap-2">
              <View className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2.5">
                <Typography type="body-xs" className="text-muted">
                  Fair price
                </Typography>
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className="text-foreground"
                >
                  {formatPrice(valuation.fairPrice, currencySymbol)}
                </Typography>
              </View>
              <View className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2.5">
                <Typography type="body-xs" className="text-muted">
                  Profit
                </Typography>
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className={
                    valuation.profit > 0
                      ? "text-success"
                      : valuation.profit < 0
                        ? "text-danger"
                        : "text-foreground"
                  }
                >
                  {valuation.profit > 0 ? "+" : ""}
                  {formatPrice(valuation.profit, currencySymbol)}
                </Typography>
              </View>
              <View className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2.5">
                <Typography type="body-xs" className="text-muted">
                  Buy signal
                </Typography>
                <Typography
                  type="body-sm"
                  weight="semibold"
                  className="text-foreground"
                >
                  {valuation.buySignal}
                </Typography>
              </View>
            </View>

            <View className="rounded-xl bg-background px-3 py-1">
              <DetailRow
                label="Asking price"
                value={formatPrice(valuation.price, currencySymbol)}
              />
              <DetailRow
                label="Fair price"
                value={formatPrice(valuation.fairPrice, currencySymbol)}
                emphasize
              />
              <DetailRow label="Comps" value={String(valuation.compCount)} />
              {!isPhone ? (
                <>
                  <DetailRow
                    label="Your CVS"
                    value={
                      valuation.targetCvs != null
                        ? valuation.targetCvs.toFixed(2)
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Market median CVS"
                    value={
                      valuation.medianCvs != null
                        ? valuation.medianCvs.toFixed(2)
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Percentile"
                    value={
                      valuation.percentileRank != null
                        ? `${valuation.percentileRank.toFixed(1)}%`
                        : "—"
                    }
                  />
                </>
              ) : null}
            </View>

            <Separator />

            <View className="rounded-xl bg-background px-3 py-1">
              {isPhone ? (
                <>
                  <DetailRow
                    label="Model"
                    value={
                      valuation.iphoneModel ||
                      valuation.samsungModel ||
                      valuation.model ||
                      "—"
                    }
                  />
                  <DetailRow
                    label="Storage"
                    value={
                      valuation.storageGb != null
                        ? `${valuation.storageGb}GB`
                        : "—"
                    }
                  />
                  <DetailRow
                    label="Battery"
                    value={
                      valuation.batteryHealth != null
                        ? `${valuation.batteryHealth}%`
                        : "assumed 80%"
                    }
                  />
                </>
              ) : (
                <>
                  <DetailRow
                    label="Year / make / model"
                    value={`${valuation.year} ${valuation.make} ${valuation.model}`}
                  />
                  <DetailRow
                    label="Trim"
                    value={valuation.trim || "none detected"}
                  />
                  <DetailRow
                    label="Mileage band"
                    value={
                      valuation.mileageLow != null && valuation.mileageHigh != null
                        ? `${valuation.mileageLow.toLocaleString()} – ${valuation.mileageHigh.toLocaleString()} mi`
                        : valuation.mileage
                          ? `${valuation.mileage.toLocaleString()} mi`
                          : "—"
                    }
                  />
                </>
              )}
              <DetailRow
                label="Calculated"
                value={formatDate(valuation.calculatedAt)}
              />
              <DetailRow label="Source" value="Local comps" />
            </View>

            {valuation.warnings != null && valuation.warnings.length > 0 ? (
              <View className="gap-1 rounded-xl bg-warning/10 px-3 py-2.5">
                {valuation.warnings.map((warning) => (
                  <Typography
                    key={warning}
                    type="body-xs"
                    className="text-warning"
                  >
                    {warning}
                  </Typography>
                ))}
              </View>
            ) : null}
          </StyledBottomSheetScrollView>
        </BottomSheet.Content>
      </SheetShell>
    </View>
  );
}
