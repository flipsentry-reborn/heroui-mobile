import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
 BottomSheet,
 Button,
 Chip,
 PressableFeedback,
 ScrollShadow,
 Surface,
 Typography,
 useThemeColor,
 useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { BrandButton } from "@/components/ui/brand-button";
import { SearchGroupCard } from "@/features/home/search-group-card";
import type { HomeState, SearchType } from "@/mocks/data/home";
import {
 deleteGroup,
 formatIntervalLabel,
 getHome,
 toggleGroupActive,
} from "@/mocks/services/home";

const CREATE_OPTIONS: {
 key: SearchType;
 icon: keyof typeof Ionicons.glyphMap;
 label: string;
 desc: string;
}[] = [
 { key: "car", icon: "car", label: "Vehicles", desc: "Cars, trucks" },
 { key: "iphone", icon: "phone-portrait", label: "iPhones", desc: "All iPhone models" },
 { key: "custom", icon: "search", label: "Other", desc: "Anything else" },
];

const TYPE_FILTER_LABEL: Record<SearchType, string> = {
 car: "Vehicles",
 iphone: "iPhones",
 custom: "Other",
};

const EDIT_ACTIONS = [
 {
 icon: "location-outline" as const,
 title: "Edit Location & Radius",
 desc: "Change search area",
 },
 {
 icon: "apps-outline" as const,
 title: "Edit Platforms",
 desc: "Add or remove platforms",
 },
 {
 icon: "search-outline" as const,
 title: "Edit Search Query",
 desc: "Change what you're searching for",
 },
 {
 icon: "options-outline" as const,
 title: "Edit Filters",
 desc: "Price, year, mileage",
 },
];

/** Portal only while visible; open after mount so HeroUI snap works; unmount when closed. */
function HomeBottomSheet({
 visible,
 onClose,
 children,
}: {
 visible: boolean;
 onClose: () => void;
 children: ReactNode;
}): JSX.Element | null {
 const [isOpen, setIsOpen] = useState(false);

 useEffect(() => {
 if (!visible) {
 setIsOpen(false);
 return;
 }
 const id = requestAnimationFrame(() => setIsOpen(true));
 return () => cancelAnimationFrame(id);
 }, [visible]);

 if (!visible) return null;

 return (
 <BottomSheet
 isOpen={isOpen}
 onOpenChange={(open) => {
 setIsOpen(open);
 if (!open) onClose();
 }}
 >
 <BottomSheet.Portal>
 <BottomSheet.Overlay />
 <BottomSheet.Content
 backgroundClassName="bg-surface rounded-t-3xl"
 handleClassName="bg-surface"
 handleIndicatorClassName="bg-separator"
 >
 {children}
 </BottomSheet.Content>
 </BottomSheet.Portal>
 </BottomSheet>
 );
}

export function HomeScreen(): JSX.Element {
 const insets = useSafeAreaInsets();
 const router = useRouter();
 const { toast } = useToast();
 const [accent, accentForeground, muted, background] = useThemeColor([
 "accent",
 "accent-foreground",
 "muted",
 "background",
 ]);
 const [state, setState] = useState<HomeState | null>(null);
 const [createOpen, setCreateOpen] = useState(false);
 const [selectedType, setSelectedType] = useState<SearchType | null>(null);
 const [editGroupId, setEditGroupId] = useState<string | null>(null);
 const [typeFilter, setTypeFilter] = useState<SearchType | "all">("all");

 const load = useCallback(async () => {
 setState(await getHome());
 }, []);

 useEffect(() => {
 void load();
 }, [load]);

 useFocusEffect(
 useCallback(() => {
 return () => {
 setCreateOpen(false);
 setSelectedType(null);
 setEditGroupId(null);
 };
 }, []),
 );

 const plan = state?.plan;
 const groups = state?.groups ?? [];
 const editGroup = groups.find((g) => g.id === editGroupId) ?? null;

 const availableTypes = useMemo(() => {
 const set = new Set(groups.map((g) => g.searchType));
 return (["car", "iphone", "custom"] as SearchType[]).filter((t) => set.has(t));
 }, [groups]);

 const filteredGroups = useMemo(() => {
 if (typeFilter === "all") return groups;
 return groups.filter((g) => g.searchType === typeFilter);
 }, [groups, typeFilter]);

 const handleCreateConfirm = () => {
 if (!selectedType) return;
 setCreateOpen(false);
 setSelectedType(null);
 toast.show({
 variant: "accent",
 label: "Create Search",
 description: `${selectedType} flow - mock only in this build.`,
 duration: 2600,
 });
 };

 const handleToggleAll = async (active: boolean) => {
 if (!editGroupId) return;
 const updated = await toggleGroupActive(editGroupId, active);
 if (updated) {
 setState((s) =>
 s
 ? {
 ...s,
 groups: s.groups.map((g) => (g.id === editGroupId ? updated : g)),
 }
 : s,
 );
 toast.show({
 variant: "success",
 label: active ? "Search activated" : "Search paused",
 duration: 2000,
 });
 }
 setEditGroupId(null);
 };

 const handleDelete = () => {
 if (!editGroupId) return;
 Alert.alert(
 "Delete Search Group",
 "Are you sure you want to delete this search group and all its settings? This action cannot be undone.",
 [
 { text: "Cancel", style: "cancel" },
 {
 text: "Delete",
 style: "destructive",
 onPress: () => {
 void deleteGroup(editGroupId).then((ok) => {
 if (ok) {
 setState((s) =>
 s
 ? {
 ...s,
 groups: s.groups.filter((g) => g.id !== editGroupId),
 plan: {
 ...s.plan,
 usedSearches: Math.max(0, s.plan.usedSearches - 1),
 },
 }
 : s,
 );
 toast.show({
 variant: "success",
 label: "Search group deleted",
 duration: 2200,
 });
 }
 setEditGroupId(null);
 });
 },
 },
 ],
 );
 };

 if (!state) {
 return (
 <View className="flex-1 items-center justify-center bg-background">
 <Typography type="body-sm" className="text-muted">
 Loading searches...
 </Typography>
 </View>
 );
 }

 return (
 <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
 <View className="px-5 pb-3 pt-2">
 <Typography type="h3" weight="bold" className="text-foreground">
 Home
 </Typography>
 </View>

 <ScrollShadow
 className="flex-1"
 LinearGradientComponent={LinearGradient}
 color={background}
 >
 <ScrollView
 className="flex-1"
 showsVerticalScrollIndicator={false}
 contentContainerClassName="pb-[110px]"
 >
 {/* Plan / credits - ~15% tighter + glass on badges/credits only */}
 <PressableFeedback
 onPress={() => router.push("/settings/subscription")}
 className="mx-3 mb-3 overflow-hidden rounded-2xl"
 animation={{ scale: { value: 0.985 } }}
 >
 <View className="overflow-hidden rounded-2xl border border-border bg-surface-secondary p-[15px]">
 <View className="absolute left-0 right-0 top-0 h-px bg-white/12" />

 <View className="mb-2 flex-row items-center justify-between">
 <Typography
 type="body-xs"
 weight="semibold"
 className="text-[10px] uppercase tracking-wider text-muted"
 >
 Search Credits
 </Typography>
 <Chip size="sm" variant="secondary" color="default" className="flex-row items-center gap-1 px-2 py-0.5">
 <Ionicons name="diamond" size={11} color={accent} />
 <Chip.Label className="text-[11px] text-foreground">
 {plan?.displayName ?? "Hunter"}
 </Chip.Label>
 </Chip>
 </View>

 <View className="mb-2.5 flex-row items-end justify-between">
 <View>
 <Typography
 type="h4"
 weight="bold"
 className="text-[22px] leading-7 text-foreground"
 >
 {plan?.usedSearches ?? 0} / {plan?.maxSearches ?? 8}
 </Typography>
 <Typography type="body-xs" className="text-[11px] text-muted">
 active searches
 </Typography>
 </View>
 <Chip size="sm" variant="primary" color="accent" className="px-3 py-1.5">
 <Chip.Label className="text-[11px] text-accent-foreground">
 Upgrade
 </Chip.Label>
 </Chip>
 </View>

 <View className="flex-row flex-wrap gap-1.5">
 {(plan?.credits ?? []).map((c) => (
 <Chip
 key={c.intervalSeconds}
 size="sm"
 variant="secondary"
 color="default"
 className="px-2.5 py-1"
 >
 <Chip.Label className="text-[11px] text-foreground">
 {formatIntervalLabel(c.intervalSeconds)}: {c.remaining}/{c.total}
 </Chip.Label>
 </Chip>
 ))}
 </View>
 </View>
 </PressableFeedback>

 {/* Quick action - settings-style glass shell */}
 <View className="mb-2">
 <Typography
 type="body-xs"
 weight="semibold"
 className="mx-5 mb-2 uppercase tracking-wider text-muted"
 >
 Actions
 </Typography>
 <Surface variant="secondary" className="mx-3">
 <View className="p-3">
 <BrandButton
 className="min-h-12"
 onPress={() => {
 setSelectedType(null);
 setCreateOpen(true);
 }}
 >
 <Ionicons name="add" size={18} color={accentForeground} />
 <BrandButton.Label>Create New Search</BrandButton.Label>
 </BrandButton>
 </View>
 </Surface>
 </View>

 {groups.length === 0 ? (
 <View className="mt-2">
 <Typography
 type="body-xs"
 weight="semibold"
 className="mx-5 mb-2 uppercase tracking-wider text-muted"
 >
 Your Searches
 </Typography>
 <Surface variant="secondary" className="mx-3">
 <EmptyState className="px-5 py-10">
 <EmptyState.Header>
 <EmptyState.Media variant="icon">
 <Ionicons name="search-outline" size={20} color={muted} />
 </EmptyState.Media>
 <EmptyState.Title>No active searches</EmptyState.Title>
 <EmptyState.Description>
 Create your first search to start finding deals. We will notify you
 when new listings match.
 </EmptyState.Description>
 </EmptyState.Header>
 </EmptyState>
 </Surface>
 </View>
 ) : (
 <View className="mt-2">
 <View className="mb-2 flex-row items-center justify-between px-5">
 <Typography
 type="body-xs"
 weight="semibold"
 className="uppercase tracking-wider text-muted"
 >
 Your Searches
 </Typography>
 <Typography type="body-xs" className="text-muted">
 {filteredGroups.length} of {plan?.maxSearches ?? 8}
 </Typography>
 </View>

 {availableTypes.length > 1 ? (
 <ScrollView
 horizontal
 showsHorizontalScrollIndicator={false}
 contentContainerClassName="gap-2 px-5 pb-3"
 >
 <Chip
 size="sm"
 variant={typeFilter === "all" ? "primary" : "tertiary"}
 color={typeFilter === "all" ? "accent" : "default"}
 onPress={() => setTypeFilter("all")}
 className={typeFilter === "all" ? undefined : "border border-white/12 bg-white/6"}
 >
 <Chip.Label
 className={
 typeFilter === "all"
 ? "text-[11px] text-accent-foreground"
 : "text-[11px] text-muted"
 }
 >
 All
 </Chip.Label>
 </Chip>
 {availableTypes.map((t) => {
 const active = typeFilter === t;
 return (
 <Chip
 key={t}
 size="sm"
 variant={active ? "primary" : "tertiary"}
 color={active ? "accent" : "default"}
 onPress={() => setTypeFilter(t)}
 className={active ? undefined : "border border-white/12 bg-white/6"}
 >
 <Chip.Label
 className={
 active
 ? "text-[11px] text-accent-foreground"
 : "text-[11px] text-muted"
 }
 >
 {TYPE_FILTER_LABEL[t]}
 </Chip.Label>
 </Chip>
 );
 })}
 </ScrollView>
 ) : null}

 {filteredGroups.map((g) => (
 <SearchGroupCard
 key={g.id}
 group={g}
 onEdit={() => setEditGroupId(g.id)}
 />
 ))}
 </View>
 )}
 </ScrollView>
 </ScrollShadow>

 <HomeBottomSheet
 visible={createOpen}
 onClose={() => {
 setCreateOpen(false);
 setSelectedType(null);
 }}
 >
 <View className="gap-3 px-1 pb-6 pt-2">
 <BottomSheet.Title>Choose Type</BottomSheet.Title>
 {CREATE_OPTIONS.map((opt) => {
 const selected = selectedType === opt.key;
 return (
 <PressableFeedback
 key={opt.key}
 onPress={() => setSelectedType(opt.key)}
 animation={{ scale: { value: 0.98 } }}
 >
 <Surface
 variant="secondary"
 className={`rounded-2xl border ${
 selected ? "border-accent/55" : "border-border"
 }`}
 >
 <View className="flex-row items-center gap-3 p-3.5">
 <View
 className={`h-10 w-10 items-center justify-center rounded-xl ${
 selected ? "bg-accent/15" : "bg-surface-tertiary"
 }`}
 >
 <Ionicons
 name={opt.icon}
 size={20}
 color={selected ? accent : muted}
 />
 </View>
 <View className="min-w-0 flex-1">
 <Typography type="body-sm" weight="semibold" className="text-foreground">
 {opt.label}
 </Typography>
 <Typography type="body-xs" className="text-muted">
 {opt.desc}
 </Typography>
 </View>
 {selected ? (
 <Ionicons name="checkmark-circle" size={20} color={accent} />
 ) : null}
 </View>
 </Surface>
 </PressableFeedback>
 );
 })}
 <BrandButton
 className="mt-1"
 isDisabled={!selectedType}
 onPress={handleCreateConfirm}
 >
 <BrandButton.Label>Create Search</BrandButton.Label>
 </BrandButton>
 </View>
 </HomeBottomSheet>

 <HomeBottomSheet
 visible={editGroupId != null}
 onClose={() => setEditGroupId(null)}
 >
 <View className="gap-2 px-1 pb-6 pt-2">
 <BottomSheet.Title className="mb-1">Edit Search</BottomSheet.Title>
 {EDIT_ACTIONS.map((action) => (
 <PressableFeedback
 key={action.title}
 onPress={() => {
 setEditGroupId(null);
 toast.show({
 variant: "accent",
 label: action.title,
 description: "Mock only - create flow not ported yet.",
 duration: 2400,
 });
 }}
 animation={{ scale: { value: 0.98 } }}
 >
 <Surface variant="secondary" className="rounded-2xl">
 <View className="flex-row items-center gap-3 p-3.5">
 <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-tertiary">
 <Ionicons name={action.icon} size={18} color={muted} />
 </View>
 <View className="min-w-0 flex-1">
 <Typography type="body-sm" weight="semibold" className="text-foreground">
 {action.title}
 </Typography>
 <Typography type="body-xs" className="text-muted">
 {action.desc}
 </Typography>
 </View>
 <Ionicons name="chevron-forward" size={16} color={muted} />
 </View>
 </Surface>
 </PressableFeedback>
 ))}

 <Button
 variant="secondary"
 className="mt-2 rounded-2xl"
 onPress={() => {
 const allActive =
 editGroup?.settings.every((s) => s.isActive) ?? false;
 void handleToggleAll(!allActive);
 }}
 >
 <Button.Label>
 {editGroup?.settings.every((s) => s.isActive)
 ? "Stop All Searches"
 : "Start All Searches"}
 </Button.Label>
 </Button>
 <Button
 variant="danger-soft"
 className="rounded-2xl"
 onPress={handleDelete}
 >
 <Button.Label>Delete Search</Button.Label>
 </Button>
 </View>
 </HomeBottomSheet>
 </View>
 );
}
