import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
 BottomSheet,
 PressableFeedback,
 Surface,
 Typography,
 useThemeColor,
 useToast,
} from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { HomePlanCreditsCard } from "@/features/home/home-plan-credits-card";
import type { HomeState, SearchType } from "@/mocks/data/home";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import { getHome } from "@/mocks/services/home";
import { getSubscription } from "@/mocks/services/subscription";

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
 backgroundClassName="bg-surface-secondary"
 backgroundStyle={{
 borderTopLeftRadius: 32,
 borderTopRightRadius: 32,
 borderCurve: "continuous",
 }}
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
 const [accent, accentForeground, muted] = useThemeColor([
 "accent",
 "accent-foreground",
 "muted",
 ]);
 const [state, setState] = useState<HomeState | null>(null);
 const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
 const [createOpen, setCreateOpen] = useState(false);
 const [selectedType, setSelectedType] = useState<SearchType | null>(null);

 const load = useCallback(async () => {
 const [home, sub] = await Promise.all([getHome(), getSubscription()]);
 setState(home);
 const plan =
 sub.hasActiveSubscription && sub.currentTier != null
 ? (sub.plans.find((p) => p.id === sub.currentTier) ?? null)
 : null;
 setActivePlan(plan);
 }, []);

 useFocusEffect(
 useCallback(() => {
 void load();
 return () => {
 setCreateOpen(false);
 setSelectedType(null);
 };
 }, [load]),
 );

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
 <ScrollView
 className="flex-1"
 showsVerticalScrollIndicator={false}
 contentContainerClassName="pb-[110px] pt-2"
 >
 <HomePlanCreditsCard
 homePlan={state.plan}
 subscriptionPlan={activePlan}
 onPress={() => router.push("/settings/subscription")}
 />

 <View className="mx-5 mb-2">
 <BrandButton
 className="min-h-12"
 onPress={() => {
 setSelectedType(null);
 setCreateOpen(true);
 }}
 >
 <Ionicons name="add" size={18} color={accentForeground} />
 <BrandButton.Label>New Search</BrandButton.Label>
 </BrandButton>
 </View>
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
 </View>
 );
}
