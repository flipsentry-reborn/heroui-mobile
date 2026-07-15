import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheet,
  Button,
  Chip,
  PressableFeedback,
  Typography,
  useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";

import { BrandButton } from "@/components/ui/brand-button";
import { GlassSurface } from "@/components/ui/glass-surface";
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

/** Tiny frosted chip on the green hero — glass on badges only. */
function HeroGlassChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <View
      className={`overflow-hidden rounded-full border border-white/30 ${className ?? ""}`}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 28 : 18}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.12)" }]}
      />
      {children}
    </View>
  );
}

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
        <BottomSheet.Content>{children}</BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

export function HomeScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
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
      description: `${selectedType} flow — mock only in this build.`,
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
      <View className="px-5 pb-1 pt-2">
        <Typography type="h3" weight="bold" className="text-foreground">
          Home
        </Typography>
        <Typography type="body-xs" className="mt-0.5 text-muted">
          Manage live searches and credits
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 8 }}
      >
        {/* Plan / credits — ~15% tighter + glass on badges/credits only */}
        <PressableFeedback
          onPress={() => router.push("/settings/subscription")}
          className="mx-3 mb-3 overflow-hidden rounded-2xl"
          animation={{ scale: { value: 0.985 } }}
        >
          <LinearGradient
            colors={["#1ED760", "#1DB954", "#169c46"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 15,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: "rgba(255,255,255,0.18)",
              overflow: "hidden",
            }}
          >
            <View className="absolute left-0 right-0 top-0 h-px bg-white/35" />

            <View className="mb-2 flex-row items-center justify-between">
              <Typography
                type="body-xs"
                weight="semibold"
                className="text-[10px] uppercase tracking-wider text-white/75"
              >
                Search Credits
              </Typography>
              <HeroGlassChip className="flex-row items-center gap-1 px-2 py-0.5">
                <Ionicons name="diamond" size={11} color="#fff" />
                <Typography type="body-xs" weight="semibold" className="text-[11px] text-white">
                  {plan?.displayName ?? "Hunter"}
                </Typography>
              </HeroGlassChip>
            </View>

            <View className="mb-2.5 flex-row items-end justify-between">
              <View>
                <Typography
                  type="h4"
                  weight="bold"
                  className="text-[22px] leading-7 text-white"
                >
                  {plan?.usedSearches ?? 0} / {plan?.maxSearches ?? 8}
                </Typography>
                <Typography type="body-xs" className="text-[11px] text-white/80">
                  active searches
                </Typography>
              </View>
              <HeroGlassChip className="px-3 py-1.5">
                <Typography type="body-xs" weight="semibold" className="text-[11px] text-white">
                  Upgrade
                </Typography>
              </HeroGlassChip>
            </View>

            <View className="flex-row flex-wrap gap-1.5">
              {(plan?.credits ?? []).map((c) => (
                <HeroGlassChip
                  key={c.intervalSeconds}
                  className="px-2.5 py-1"
                >
                  <Typography type="body-xs" weight="semibold" className="text-[11px] text-white">
                    {formatIntervalLabel(c.intervalSeconds)}: {c.remaining}/{c.total}
                  </Typography>
                </HeroGlassChip>
              ))}
            </View>
          </LinearGradient>
        </PressableFeedback>

        {/* Quick action — settings-style glass shell */}
        <View className="mb-2">
          <Typography
            type="body-xs"
            weight="semibold"
            className="mx-5 mb-2 uppercase tracking-wider text-muted"
          >
            Actions
          </Typography>
          <GlassSurface intensity="settings" className="mx-3">
            <View className="p-3">
              <BrandButton
                className="min-h-12"
                onPress={() => {
                  setSelectedType(null);
                  setCreateOpen(true);
                }}
              >
                <Ionicons name="add" size={18} color="#121212" />
                <BrandButton.Label>Create New Search</BrandButton.Label>
              </BrandButton>
            </View>
          </GlassSurface>
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
            <GlassSurface intensity="settings" className="mx-3">
              <EmptyState className="px-5 py-10">
                <EmptyState.Header>
                  <EmptyState.Title>No Active Searches</EmptyState.Title>
                  <EmptyState.Description>
                    Create your first search to start finding deals. We&apos;ll notify you
                    instantly when new listings match.
                  </EmptyState.Description>
                </EmptyState.Header>
              </EmptyState>
            </GlassSurface>
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
                <GlassSurface
                  intensity="sheet"
                  bordered={false}
                  className={`rounded-2xl border ${
                    selected ? "border-accent/55" : "border-white/12"
                  }`}
                >
                  <View className="flex-row items-center gap-3 p-3.5">
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-xl ${
                        selected ? "bg-accent/15" : "bg-white/10"
                      }`}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={selected ? "#1DB954" : "#B3B3B3"}
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
                      <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
                    ) : null}
                  </View>
                </GlassSurface>
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
                  description: "Mock only — create flow not ported yet.",
                  duration: 2400,
                });
              }}
              animation={{ scale: { value: 0.98 } }}
            >
              <GlassSurface intensity="sheet" className="rounded-2xl">
                <View className="flex-row items-center gap-3 p-3.5">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/8">
                    <Ionicons name={action.icon} size={18} color="#B3B3B3" />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Typography type="body-sm" weight="semibold" className="text-foreground">
                      {action.title}
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      {action.desc}
                    </Typography>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B6B6B" />
                </View>
              </GlassSurface>
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
