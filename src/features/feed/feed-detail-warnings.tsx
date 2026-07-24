import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { View } from "react-native";
import {
  Accordion,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import { AiEstimationIcon } from "@/components/icons/ai-estimation-icon";
import { FeedCategoryBadge } from "@/features/feed/feed-category-badge";
import type { FeedValuationWarning } from "@/models/feed";

const StyledIonicons = withUniwind(Ionicons);

/** Same yellowish AI sparkles as Advanced Calculation. */
const AI_ICON_COLOR = "#E8C547";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function warningIcon(severity: FeedValuationWarning["severity"]): IoniconName {
  return severity === "info" ? "sparkles" : "warning";
}

interface FeedDetailWarningsProps {
  warnings: FeedValuationWarning[];
}

/**
 * AI valuation insights accordion (KBB / external analysis notes).
 * Layout animations disabled so it scrolls with the detail page.
 */
export function FeedDetailWarnings({
  warnings,
}: FeedDetailWarningsProps): JSX.Element | null {
  const [warningColor] = useThemeColor(["warning"]);

  if (warnings.length === 0) return null;

  return (
    <Accordion
      variant="surface"
      selectionMode="single"
      hideSeparator
      isCollapsible
      defaultValue="warnings"
      animation="disable-all"
      className="shadow-none"
    >
      <Accordion.Item value="warnings">
        <Accordion.Trigger className="z-0 py-2.5">
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <AiEstimationIcon size={18} />
            <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
              <Typography
                type="body-sm"
                weight="semibold"
                className="min-w-0 shrink text-foreground"
                numberOfLines={1}
              >
                AI Warnings
              </Typography>
              <FeedCategoryBadge label="AI" inline />
            </View>
            <View className="rounded-full bg-warning/15 px-2 py-0.5">
              <Typography type="body-xs" className="text-[11px] text-warning">
                {warnings.length}
              </Typography>
            </View>
          </View>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="pt-0">
          <Typography type="body-xs" className="mb-2 text-[11px] text-muted">
            Our AI flagged these while estimating this listing.
          </Typography>
          <View className="gap-0">
            {warnings.map((warning, index) => {
              const isLast = index === warnings.length - 1;
              const isInfo = warning.severity === "info";
              const iconColor = isInfo
                ? AI_ICON_COLOR
                : warningColor || "#d97706";

              return (
                <View key={`${warning.type ?? "w"}:${warning.message}`}>
                  <View className="flex-row items-start gap-2.5 py-2">
                    <StyledIonicons
                      name={warningIcon(warning.severity)}
                      size={15}
                      className="mt-0.5"
                      color={iconColor}
                    />
                    <Typography
                      type="body-xs"
                      className={`min-w-0 flex-1 text-xs leading-4 ${
                        isInfo ? "text-foreground" : "text-warning"
                      }`}
                    >
                      {warning.message}
                    </Typography>
                  </View>
                  {!isLast ? <Separator className="bg-muted/40" /> : null}
                </View>
              );
            })}
          </View>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
