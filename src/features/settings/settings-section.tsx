import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX, ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { ListGroup, Separator, Surface, Typography } from "heroui-native";

type IonName = ComponentProps<typeof Ionicons>["name"];

const ICON = "#B3B3B3";
const ICON_WELL = "rgba(255,255,255,0.06)";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

/** Elevated card section — subtle 3D via border highlight + shadow. */
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
      <Surface
        variant="secondary"
        className="mx-3 overflow-hidden rounded-2xl border border-white/10"
        style={styles.elevated}
      >
        <ListGroup variant="transparent">{children}</ListGroup>
      </Surface>
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
          <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: well }}>
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

const styles = StyleSheet.create({
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
});
