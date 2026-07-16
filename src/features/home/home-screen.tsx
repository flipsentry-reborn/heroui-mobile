import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
 BottomSheet,
 Button,
 Typography,
 useThemeColor,
} from "heroui-native";

import { BrandButton } from "@/components/ui/brand-button";
import { HomePlanCreditsCard } from "@/features/home/home-plan-credits-card";
import type { HomeState } from "@/mocks/data/home";
import type { SubscriptionPlan } from "@/mocks/data/subscription";
import { getHome } from "@/mocks/services/home";
import { getSubscription } from "@/mocks/services/subscription";

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
 snapPoints={["100%"]}
 enableDynamicSizing={false}
 enableOverDrag={false}
 contentContainerClassName="h-full"
 backgroundClassName="bg-surface-secondary"
 backgroundStyle={{
 borderTopLeftRadius: 32,
 borderTopRightRadius: 32,
 borderCurve: "continuous",
 }}
 handleComponent={null}
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
 const [accentForeground, muted] = useThemeColor([
 "accent-foreground",
 "muted",
 ]);
 const [state, setState] = useState<HomeState | null>(null);
 const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
 const [createOpen, setCreateOpen] = useState(false);

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
 };
 }, [load]),
 );

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
 onPress={() => setCreateOpen(true)}
 >
 <Ionicons name="add" size={18} color={accentForeground} />
 <BrandButton.Label>New Search</BrandButton.Label>
 </BrandButton>
 </View>
 </ScrollView>

 <HomeBottomSheet
 visible={createOpen}
 onClose={() => setCreateOpen(false)}
 >
 <View className="flex-1" style={{ paddingTop: insets.top }}>
 <View className="flex-row items-center justify-between px-3 pb-2">
 <BottomSheet.Close>
 <Ionicons name="close-circle" size={28} color={muted} />
 </BottomSheet.Close>
 <Button
 isIconOnly
 size="sm"
 variant="tertiary"
 onPress={() => setCreateOpen(false)}
 >
 <Ionicons name="checkmark-circle" size={28} color={muted} />
 </Button>
 </View>
 </View>
 </HomeBottomSheet>
 </View>
 );
}
