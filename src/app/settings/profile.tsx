import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
 Avatar,
 Chip,
 ListGroup,
 Separator,
 Skeleton,
 Surface,
 Typography,
 useThemeColor,
} from "heroui-native";

import type { MockUserProfile } from "@/mocks/data/settings";
import { getSettings } from "@/mocks/services/settings";
import { getSubscription } from "@/mocks/services/subscription";

function ProfileRow({
 label,
 value,
 badge,
 isLast,
}: {
 label: string;
 value: string;
 badge?: string;
 isLast?: boolean;
}): JSX.Element {
 return (
 <>
 <ListGroup.Item className="px-4 py-3.5">
 <ListGroup.ItemContent>
 <ListGroup.ItemTitle className="text-muted">{label}</ListGroup.ItemTitle>
 <ListGroup.ItemDescription className="mt-0.5 text-[15px] text-foreground">
 {value || "Not provided"}
 </ListGroup.ItemDescription>
 </ListGroup.ItemContent>
 {badge ? (
 <ListGroup.ItemSuffix>
 <Chip
 size="sm"
 variant="soft"
 color={badge === "Verified" ? "success" : "warning"}
 >
 <Chip.Label className="text-[10px]">{badge}</Chip.Label>
 </Chip>
 </ListGroup.ItemSuffix>
 ) : (
 <ListGroup.ItemSuffix>
 <View />
 </ListGroup.ItemSuffix>
 )}
 </ListGroup.Item>
 {!isLast ? <Separator className="mx-4" /> : null}
 </>
 );
}

function ProfileSection({
 title,
 icon,
 children,
}: {
 title: string;
 icon: keyof typeof Ionicons.glyphMap;
 children: ReactNode;
}): JSX.Element {
 const accent = useThemeColor("accent");

 return (
 <Surface
 variant="secondary"
 className="overflow-hidden rounded-2xl border border-border"
 >
 <View className="flex-row items-center gap-2 px-4 pb-1 pt-3.5">
 <Ionicons name={icon} size={14} color={accent} />
 <Typography
 type="body-xs"
 weight="semibold"
 className="uppercase tracking-wide text-muted"
 >
 {title}
 </Typography>
 </View>
 <ListGroup variant="transparent">{children}</ListGroup>
 </Surface>
 );
}

export default function ProfileScreen(): JSX.Element {
 const [profile, setProfile] = useState<MockUserProfile | null>(null);
 const [planLabel, setPlanLabel] = useState("Hunter");
 const [background, surfaceSecondary, foreground] = useThemeColor([
 "background",
 "surface-secondary",
 "foreground",
 ]);

 useEffect(() => {
 void Promise.all([getSettings(), getSubscription()]).then(([settings, sub]) => {
 setProfile(settings.profile);
 const tier = sub.currentTier;
 const plan = sub.plans.find((p) => p.id === tier);
 setPlanLabel(plan?.displayName ?? "Free");
 });
 }, []);

 if (!profile) {
 return (
 <View className="flex-1 gap-3 bg-background p-4">
 <Skeleton className="h-36 rounded-2xl" />
 <Skeleton className="h-28 rounded-2xl" />
 <Skeleton className="h-28 rounded-2xl" />
 </View>
 );
 }

 const fullName = `${profile.firstName} ${profile.lastName}`;
 const initials =
 `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

 return (
 <ScrollView
 className="flex-1 bg-background"
 contentContainerClassName="pb-10"
 showsVerticalScrollIndicator={false}
 >
 {/* Hero - neutral fade into surface */}
 <LinearGradient
 colors={[background, surfaceSecondary, surfaceSecondary]}
 locations={[0, 0.5, 1]}
 start={{ x: 0.5, y: 0 }}
 end={{ x: 0.5, y: 1 }}
 style={{
 alignItems: "center",
 paddingHorizontal: 20,
 paddingTop: 20,
 paddingBottom: 22,
 }}
 >
 <Avatar size="lg" alt={fullName} className="mb-3 border-2 border-border bg-surface">
 <Avatar.Fallback className="bg-surface-secondary text-lg text-foreground">
 {initials}
 </Avatar.Fallback>
 </Avatar>
 <Typography type="h4" weight="bold" className="text-center text-foreground">
 {fullName}
 </Typography>
 <Typography type="body-xs" className="mt-0.5 text-center text-muted">
 {profile.email}
 </Typography>
 <View className="mt-2.5 flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
 <Ionicons name="diamond" size={12} color={foreground} />
 <Typography type="body-xs" weight="semibold" className="text-foreground">
 {planLabel}
 </Typography>
 </View>
 </LinearGradient>

 <View className="mt-4 gap-3 px-4">
 <ProfileSection title="Personal" icon="person-outline">
 <ProfileRow label="First Name" value={profile.firstName} />
 <ProfileRow label="Last Name" value={profile.lastName} isLast />
 </ProfileSection>

 <ProfileSection title="Contact" icon="mail-outline">
 <ProfileRow
 label="Email"
 value={profile.email}
 badge={profile.emailConfirmed ? "Verified" : "Unverified"}
 />
 <ProfileRow
 label="Phone Number"
 value={profile.phoneNumber ?? "Not provided"}
 badge={
 profile.phoneNumber
 ? profile.numberConfirmed
 ? "Verified"
 : "Unverified"
 : undefined
 }
 isLast
 />
 </ProfileSection>

 <ProfileSection title="Membership" icon="shield-checkmark-outline">
 <ProfileRow label="Account Status" value="Active" />
 <ProfileRow
 label="Member Since"
 value={new Date().toLocaleDateString()}
 isLast
 />
 </ProfileSection>
 </View>
 </ScrollView>
 );
}
