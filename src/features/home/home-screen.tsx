import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheet,
  Button,
  Chip,
  Surface,
  Typography,
  useToast,
} from "heroui-native";
import { EmptyState } from "heroui-native-pro";

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

export function HomeScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<HomeState | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SearchType | null>(null);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState(await getHome());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const plan = state?.plan;
  const groups = state?.groups ?? [];
  const editGroup = groups.find((g) => g.id === editGroupId) ?? null;

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
      <View className="px-5 pb-2 pt-2">
        <Typography type="h3" weight="bold" className="text-foreground">
          Home
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Hunter plan + search credits */}
        <Pressable
          onPress={() => router.push("/settings/subscription")}
          className="mx-3 mb-3 overflow-hidden rounded-2xl"
          style={styles.planShadow}
        >
          <LinearGradient
            colors={["#1ED760", "#1DB954", "#169c46"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planCard}
          >
            <View style={styles.planSheen} />
            <View className="mb-3 flex-row items-center justify-between">
              <Typography
                type="body-xs"
                weight="semibold"
                className="uppercase tracking-wider text-white/75"
              >
                Search Credits
              </Typography>
              <View className="flex-row items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1">
                <Ionicons name="diamond" size={12} color="#fff" />
                <Typography type="body-xs" weight="semibold" className="text-white">
                  {plan?.displayName ?? "Hunter"}
                </Typography>
              </View>
            </View>

            <View className="mb-3 flex-row items-end justify-between">
              <View>
                <Typography type="h4" weight="bold" className="text-white">
                  {plan?.usedSearches ?? 0} / {plan?.maxSearches ?? 8}
                </Typography>
                <Typography type="body-xs" className="text-white/80">
                  active searches
                </Typography>
              </View>
              <View className="rounded-full bg-white/20 px-4 py-2">
                <Typography type="body-xs" weight="semibold" className="text-white">
                  Upgrade
                </Typography>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {(plan?.credits ?? []).map((c) => (
                <View
                  key={c.intervalSeconds}
                  className="rounded-full bg-black/20 px-3 py-1.5"
                >
                  <Typography type="body-xs" weight="semibold" className="text-white">
                    {formatIntervalLabel(c.intervalSeconds)}: {c.remaining}/{c.total}
                  </Typography>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Pressable>

        <View className="mx-3 mb-4">
          <Button
            variant="primary"
            className="min-h-12 rounded-2xl"
            style={{ backgroundColor: "#1DB954" }}
            onPress={() => {
              setSelectedType(null);
              setCreateOpen(true);
            }}
          >
            <Ionicons name="add" size={18} color="#04140A" />
            <Button.Label style={{ color: "#04140A" }}>Create New Search</Button.Label>
          </Button>
        </View>

        {groups.length === 0 ? (
          <EmptyState className="px-6 py-10">
            <EmptyState.Header>
              <EmptyState.Title>No Active Searches</EmptyState.Title>
              <EmptyState.Description>
                Create your first search to start finding deals. We&apos;ll notify you
                instantly when new listings match.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        ) : (
          <>
            <View className="mb-2 flex-row items-center justify-between px-5">
              <Typography type="body-sm" weight="semibold" className="text-foreground">
                Your Searches
              </Typography>
              <Typography type="body-xs" className="text-muted">
                {groups.length} of {plan?.maxSearches ?? 8}
              </Typography>
            </View>
            <View className="mb-2 flex-row flex-wrap gap-2 px-5">
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>Car</Chip.Label>
              </Chip>
            </View>
            {groups.map((g) => (
              <SearchGroupCard
                key={g.id}
                group={g}
                onEdit={() => setEditGroupId(g.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Create type sheet */}
      <BottomSheet
        isOpen={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setSelectedType(null);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-3 px-1 pb-6 pt-2">
              <BottomSheet.Title>Choose Type</BottomSheet.Title>
              {CREATE_OPTIONS.map((opt) => {
                const selected = selectedType === opt.key;
                return (
                  <Pressable key={opt.key} onPress={() => setSelectedType(opt.key)}>
                    <Surface
                      variant={selected ? "secondary" : "tertiary"}
                      className="flex-row items-center gap-3 rounded-2xl border p-3.5"
                      style={{
                        borderColor: selected
                          ? "rgba(29,185,84,0.55)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/5">
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
                    </Surface>
                  </Pressable>
                );
              })}
              <Button
                variant="primary"
                className="mt-1 rounded-2xl"
                style={{ backgroundColor: "#1DB954" }}
                isDisabled={!selectedType}
                onPress={handleCreateConfirm}
              >
                <Button.Label style={{ color: "#04140A" }}>Create Search</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet
        isOpen={editGroupId != null}
        onOpenChange={(open) => {
          if (!open) setEditGroupId(null);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-2 px-1 pb-6 pt-2">
              <BottomSheet.Title className="mb-1">Edit Search</BottomSheet.Title>
              {(
                [
                  ["Edit Location & Radius", "Change search area"],
                  ["Edit Platforms", "Add or remove platforms"],
                  ["Edit Search Query", "Change what you're searching for"],
                  ["Edit Filters", "Price, year, mileage"],
                ] as const
              ).map(([title, desc]) => (
                <Pressable
                  key={title}
                  onPress={() => {
                    setEditGroupId(null);
                    toast.show({
                      variant: "accent",
                      label: title,
                      description: "Mock only — create flow not ported yet.",
                      duration: 2400,
                    });
                  }}
                >
                  <Surface variant="tertiary" className="rounded-2xl border border-white/8 p-3.5">
                    <Typography type="body-sm" weight="semibold" className="text-foreground">
                      {title}
                    </Typography>
                    <Typography type="body-xs" className="text-muted">
                      {desc}
                    </Typography>
                  </Surface>
                </Pressable>
              ))}

              <Button
                variant="secondary"
                className="mt-1 rounded-2xl"
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
                variant="secondary"
                className="rounded-2xl border border-white/10"
                onPress={handleDelete}
              >
                <Button.Label className="text-foreground">Delete Search</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  planShadow: {
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  planCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  planSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
