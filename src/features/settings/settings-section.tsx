import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps, JSX, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ListGroup, Separator, Typography } from "heroui-native";

import { GlassSurface } from "@/components/ui/glass-surface";

type IonName = ComponentProps<typeof Ionicons>["name"];

const ICON = "#B3B3B3";
const ICON_WELL = "rgba(255,255,255,0.06)";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

/** Glass section card — soft blur + light edge, still quiet. */
export function SettingsSection({ title, children }: SettingsSectionProps): JSX.Element {
  return (
    <View className="mb-4 gap-2">
      <Typography
        type="body-xs"
        weight="semibold"
        className="mx-5 uppercase tracking-wider text-muted"
      >
        {title}
      </Typography>
      <GlassSurface intensity="settings" className="mx-3">
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0)"]}
          locations={[0, 0.55]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.85 }}
          style={StyleSheet.absoluteFill}
        />
        <ListGroup variant="transparent">{children}</ListGroup>
      </GlassSurface>
    </View>
  );
}

interface SettingsRowProps {
  icon: IonName;
  title: string;
  onPress?: () => void;
  /** Only use for rare brand emphasis (e.g. subscription). Default muted. */
  accent?: boolean;
  right?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  icon,
  title,
  onPress,
  accent = false,
  right,
  showChevron = true,
  isLast = false,
}: SettingsRowProps): JSX.Element {
  const color = accent ? "#1DB954" : ICON;
  const well = accent ? "rgba(29,185,84,0.14)" : ICON_WELL;

  return (
    <>
      <ListGroup.Item onPress={onPress} disabled={!onPress && right == null} className="py-1">
        <ListGroup.ItemPrefix>
          <View
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: well }}
          >
            <Ionicons name={icon} size={18} color={color} />
          </View>
        </ListGroup.ItemPrefix>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-[15px]">{title}</ListGroup.ItemTitle>
        </ListGroup.ItemContent>
        {right != null ? (
          <ListGroup.ItemSuffix>{right}</ListGroup.ItemSuffix>
        ) : showChevron ? (
          <ListGroup.ItemSuffix />
        ) : (
          <ListGroup.ItemSuffix>
            <View />
          </ListGroup.ItemSuffix>
        )}
      </ListGroup.Item>
      {!isLast ? <Separator className="ml-14 mr-4 opacity-60" /> : null}
    </>
  );
}
