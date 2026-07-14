import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Chip, Separator, Surface, Typography } from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import type { SearchGroup } from "@/mocks/data/home";
import {
  cityFromLocation,
  formatIntervalLabel,
  formatPriceShort,
  groupStatus,
} from "@/mocks/services/home";

interface SearchGroupCardProps {
  group: SearchGroup;
  onEdit: () => void;
}

export function SearchGroupCard({ group, onEdit }: SearchGroupCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const status = groupStatus(group);
  const settings = group.settings;
  const visible = expanded ? settings : settings.slice(0, 3);
  const cq = group.carQuery;

  const statusColor =
    status.tone === "success"
      ? "#1DB954"
      : status.tone === "warning"
        ? "#f59e0b"
        : "#8A8A8A";

  const badges: string[] = [
    cityFromLocation(group.locationName),
    `${group.radiusMiles} mi`,
  ];
  if (cq?.minPrice != null || cq?.maxPrice != null) {
    badges.push(
      `${cq.minPrice != null ? formatPriceShort(cq.minPrice) : "Any"} – ${
        cq.maxPrice != null ? formatPriceShort(cq.maxPrice) : "Any"
      }`,
    );
  }
  if (cq?.minYear != null || cq?.maxYear != null) {
    badges.push(
      `${cq.minYear ?? "Any"} – ${cq.maxYear ?? "Any"}`,
    );
  }
  if (cq?.maxMileage != null) {
    badges.push(`≤ ${formatPriceShort(cq.maxMileage)} mi`);
  }
  if (cq?.makes?.length && cq.makes[0] !== "Any") {
    badges.push(cq.makes.slice(0, 2).join(", "));
  }

  return (
    <Surface
      variant="secondary"
      className="mx-3 mb-3 gap-3 overflow-hidden rounded-2xl border border-white/10 p-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
      }}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5">
          <Ionicons name="car-outline" size={18} color="#B3B3B3" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Typography type="body-sm" weight="semibold" className="text-foreground">
            Car
          </Typography>
          <View className="flex-row items-center gap-1.5">
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <Typography type="body-xs" style={{ color: statusColor }}>
              {status.label}
            </Typography>
          </View>
        </View>
        <Pressable
          onPress={onEdit}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
        >
          <Typography type="body-xs" weight="semibold" className="text-foreground">
            Edit
          </Typography>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap gap-1.5">
        {badges.map((b) => (
          <Chip key={b} size="sm" variant="soft" color="default">
            <Chip.Label className="text-[10px]">{b}</Chip.Label>
          </Chip>
        ))}
      </View>

      <View className="gap-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Typography type="body-xs" className="text-muted">
            {settings.length === 1 ? "1 search" : `${settings.length} searches`}
          </Typography>
          {settings.length > 3 ? (
            <Pressable onPress={() => setExpanded((v) => !v)}>
              <Typography type="body-xs" weight="semibold" style={{ color: "#1DB954" }}>
                {expanded ? "Show less" : "Show all"}
              </Typography>
            </Pressable>
          ) : null}
        </View>

        {visible.map((s, i) => (
          <View key={s.id}>
            {i > 0 ? <Separator className="my-1 opacity-50" /> : null}
            <View
              className="flex-row items-center gap-3 py-1.5"
              style={{ opacity: s.isActive ? 1 : 0.45 }}
            >
              <PlatformIcon platform={s.platform} size={22} />
              <Typography type="body-sm" className="min-w-0 flex-1 text-foreground">
                {cityFromLocation(s.locationName)}
              </Typography>
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label className="text-[10px]">
                  {formatIntervalLabel(s.runIntervalSeconds)}
                </Chip.Label>
              </Chip>
              <View
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.isActive ? "#1DB954" : "#6B6B6B" }}
              />
            </View>
          </View>
        ))}
      </View>
    </Surface>
  );
}
