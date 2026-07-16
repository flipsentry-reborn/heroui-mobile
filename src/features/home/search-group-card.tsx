import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import {
 Chip,
 PressableFeedback,
 Separator,
 Surface,
 Typography,
 useThemeColor,
} from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import type { SearchGroup, SearchType } from "@/mocks/data/home";
import {
 cityFromLocation,
 formatIntervalLabel,
 formatPriceShort,
 groupStatus,
} from "@/mocks/services/home";

type IonName = ComponentProps<typeof Ionicons>["name"];

const TYPE_META: Record<
 SearchType,
 { label: string; icon: IonName }
> = {
 car: { label: "Vehicles", icon: "car-outline" },
 iphone: { label: "iPhones", icon: "phone-portrait-outline" },
 custom: { label: "Other", icon: "search-outline" },
};

interface SearchGroupCardProps {
 group: SearchGroup;
 onEdit: () => void;
}

export function SearchGroupCard({ group, onEdit }: SearchGroupCardProps): JSX.Element {
 const [expanded, setExpanded] = useState(false);
 const [success, warning, muted] = useThemeColor(["success", "warning", "muted"]);
 const status = groupStatus(group);
 const settings = group.settings;
 const visible = expanded ? settings : settings.slice(0, 3);
 const cq = group.carQuery;
 const meta = TYPE_META[group.searchType];
 const title =
 group.searchType === "custom" && group.customLabel
 ? group.customLabel
 : meta.label;

 const statusColor =
 status.tone === "success"
 ? success
 : status.tone === "warning"
 ? warning
 : muted;

 const badges: string[] = [
 cityFromLocation(group.locationName),
 `${group.radiusMiles} mi`,
 ];
 if (cq?.minPrice != null || cq?.maxPrice != null) {
 badges.push(
 `${cq.minPrice != null ? formatPriceShort(cq.minPrice) : "Any"} - ${
 cq.maxPrice != null ? formatPriceShort(cq.maxPrice) : "Any"
 }`,
 );
 }
 if (cq?.minYear != null || cq?.maxYear != null) {
 badges.push(`${cq.minYear ?? "Any"} - ${cq.maxYear ?? "Any"}`);
 }
 if (cq?.maxMileage != null) {
 badges.push(`≤ ${formatPriceShort(cq.maxMileage)} mi`);
 }
 if (cq?.makes?.length && cq.makes[0] !== "Any") {
 badges.push(cq.makes.slice(0, 2).join(", "));
 }

 return (
 <Surface variant="secondary" className="mx-3 mb-3">
 <View className="gap-3 p-4">
 <View className="flex-row items-center gap-2.5">
 <View
 className={`h-10 w-10 items-center justify-center rounded-xl ${
 status.tone === "success" ? "bg-accent/15" : "bg-white/8"
 }`}
 >
 <Ionicons
 name={meta.icon}
 size={18}
 color={status.tone === "success" ? success : muted}
 />
 </View>
 <View className="min-w-0 flex-1 gap-0.5">
 <Typography type="body-sm" weight="semibold" className="text-foreground">
 {title}
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
 <PressableFeedback
 onPress={onEdit}
 accessibilityLabel="Edit search"
 animation={{ scale: { value: 0.96 } }}
 className="rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5"
 >
 <Typography type="body-xs" weight="semibold" className="text-foreground">
 Edit
 </Typography>
 </PressableFeedback>
 </View>

 <View className="flex-row flex-wrap gap-1.5">
 {badges.map((b) => (
 <Chip key={b} size="sm" variant="soft" color="default" className="bg-white/6">
 <Chip.Label className="text-[10px] text-muted">{b}</Chip.Label>
 </Chip>
 ))}
 </View>

 <View className="overflow-hidden rounded-xl border border-white/8 bg-black/20">
 <View className="flex-row items-center justify-between border-b border-white/8 px-3 py-2">
 <Typography type="body-xs" weight="medium" className="text-muted">
 {settings.length === 1 ? "1 platform" : `${settings.length} platforms`}
 </Typography>
 {settings.length > 3 ? (
 <PressableFeedback
 onPress={() => setExpanded((v) => !v)}
 animation={{ scale: { value: 0.97 } }}
 >
 <Typography type="body-xs" weight="semibold" className="text-accent">
 {expanded ? "Show less" : "Show all"}
 </Typography>
 </PressableFeedback>
 ) : null}
 </View>

 {visible.map((s, i) => (
 <View key={s.id}>
 {i > 0 ? <Separator className="mx-3 opacity-40" /> : null}
 <View
 className="flex-row items-center gap-3 px-3 py-2.5"
 style={{ opacity: s.isActive ? 1 : 0.45 }}
 >
 <PlatformIcon platform={s.platform} size={22} />
 <Typography type="body-sm" className="min-w-0 flex-1 text-foreground">
 {cityFromLocation(s.locationName)}
 </Typography>
 <Chip size="sm" variant="soft" color="default" className="bg-white/6">
 <Chip.Label className="text-[10px]">
 {formatIntervalLabel(s.runIntervalSeconds)}
 </Chip.Label>
 </Chip>
 <View
 className={`h-2 w-2 rounded-full ${s.isActive ? "bg-success" : "bg-muted"}`}
 />
 </View>
 </View>
 ))}
 </View>
 </View>
 </Surface>
 );
}
