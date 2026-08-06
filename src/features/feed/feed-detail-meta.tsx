import { observer } from "mobx-react-lite";
import type { JSX, ReactNode } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";

import { formatDistance, formatOdometer } from "@/lib/distance-utils";
import type { FeedItem } from "@/models/feed";
import { resolveFeedMileageDisplay } from "@/models/feed";
import { useStore } from "@/store/store";

function formatTimeAgo(dateString: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(dateString).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Format backend `foundInSeconds` for display.
 * Backend already applies platform lag + last-digit fallback when ≤ 0 / exact minutes.
 */
export function formatFoundInSeconds(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  if (totalMinutes < 1) {
    return `${totalSeconds} sec`;
  }
  if (totalHours < 1) {
    const sec = totalSeconds % 60;
    return `${totalMinutes} min ${sec} sec`;
  }
  const remainMin = totalMinutes % 60;
  return remainMin > 0
    ? `${totalHours} ${totalHours === 1 ? "hour" : "hours"} ${remainMin} min`
    : `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
}

interface MetaRow {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

function MetaRowItem({ row }: { row: MetaRow }): JSX.Element {
  return (
    <View className="flex-row items-start gap-5">
      <Typography
        type="body-xs"
        className="w-[108px] text-[13.2px] font-normal leading-[17.6px] text-muted"
      >
        {row.label}
      </Typography>
      {typeof row.value === "string" || typeof row.value === "number" ? (
        <Typography
          type="body-xs"
          className={`min-w-0 flex-1 text-[13.2px] font-normal leading-[17.6px] text-foreground${row.valueClassName ? ` ${row.valueClassName}` : ""}`}
        >
          {row.value}
        </Typography>
      ) : (
        <View className="min-w-0 flex-1">{row.value}</View>
      )}
    </View>
  );
}

interface FeedDetailMetaSectionProps {
  item: FeedItem;
}

export const FeedDetailMetaSection = observer(function FeedDetailMetaSection({
  item,
}: FeedDetailMetaSectionProps): JSX.Element | null {
  const { userStore } = useStore();
  const rows: MetaRow[] = [];
  const distanceUnit = userStore.preferences?.distanceUnit ?? "mi";
  const mileageDisplay = resolveFeedMileageDisplay(item);

  if (mileageDisplay != null) {
    rows.push({
      label: "Odometer",
      value: `${formatOdometer(mileageDisplay.miles, distanceUnit)}${
        mileageDisplay.uncertain ? "?" : ""
      }`,
      valueClassName: mileageDisplay.uncertain ? "text-uncertain" : undefined,
    });
  }

  if (item.creationTime) {
    rows.push({
      label: "Posted",
      value: `${new Date(item.creationTime).toLocaleString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })} · ${formatTimeAgo(item.creationTime)} ago`,
    });
  }

  const locationLine = [
    item.locationText,
    item.distanceMiles != null
      ? formatDistance(item.distanceMiles, distanceUnit, 1)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (locationLine) {
    rows.push({
      label: "Location",
      value: locationLine,
    });
  }

  if (rows.length === 0) return null;

  return (
    <View className="gap-2.5">
      <Typography
        type="body-sm"
        weight="semibold"
        className="text-[15px] text-foreground"
      >
        Details
      </Typography>
      <View className="gap-2.5">
        {rows.map((row) => (
          <MetaRowItem key={row.label} row={row} />
        ))}
      </View>
    </View>
  );
});
