import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX, ReactNode } from "react";
import { Pressable, View } from "react-native";
import { ListGroup, Separator, Typography, useThemeColor } from "heroui-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type IonName = ComponentProps<typeof Ionicons>["name"];

interface SearchBottomSheetRowProps {
  icon: IonName;
  title: string;
  description?: string;
  onPress?: () => void;
  right?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  iconClassName?: string;
  required?: boolean;
  showSwap?: boolean;
  /** Non-interactive + muted until prerequisites (e.g. search type) are met. */
  disabled?: boolean;
  /** Skip the divider under this row (e.g. Location + Platforms grouped). */
  hideSeparator?: boolean;
}

function RowBody({
  icon,
  title,
  description,
  right,
  showChevron,
  iconClassName,
  required,
  showSwap,
}: {
  icon: IonName;
  title: string;
  description?: string;
  right?: ReactNode;
  showChevron: boolean;
  iconClassName: string;
  required?: boolean;
  showSwap?: boolean;
}): JSX.Element {
  const [muted, danger] = useThemeColor(["muted", "danger"]);

  return (
    <>
      <ListGroup.ItemPrefix>
        <StyledIonicons name={icon} size={20} className={iconClassName} />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <View className="flex-row items-center gap-1">
          <ListGroup.ItemTitle className="text-[15px] font-normal text-foreground">
            {title}
          </ListGroup.ItemTitle>
          {showSwap ? (
            <Ionicons name="swap-vertical" size={14} color={muted} />
          ) : null}
          {required ? (
            <Typography type="body-sm" style={{ color: danger }}>
              *
            </Typography>
          ) : null}
        </View>
        {description ? (
          <ListGroup.ItemDescription className="text-xs text-muted">
            {description}
          </ListGroup.ItemDescription>
        ) : null}
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
    </>
  );
}

export function SearchBottomSheetRow({
  icon,
  title,
  description,
  onPress,
  right,
  showChevron = true,
  isLast = false,
  iconClassName = "text-muted",
  required,
  showSwap,
  disabled = false,
  hideSeparator = false,
}: SearchBottomSheetRowProps): JSX.Element {
  const body = (
    <RowBody
      icon={icon}
      title={title}
      description={description}
      right={right}
      showChevron={showChevron}
      iconClassName={disabled ? "text-muted/50" : iconClassName}
      required={required}
      showSwap={showSwap}
    />
  );

  const itemClassName = disabled ? "py-3.5 opacity-45" : "py-3.5";
  const canPress = onPress != null && !disabled;
  const showDivider = !isLast && !hideSeparator;

  return (
    <>
      {canPress ? (
        <Pressable onPress={onPress}>
          <ListGroup.Item disabled className={itemClassName}>
            {body}
          </ListGroup.Item>
        </Pressable>
      ) : (
        <ListGroup.Item disabled className={itemClassName}>
          {body}
        </ListGroup.Item>
      )}
      {showDivider ? <Separator className="ml-12 mr-4 bg-muted/40" /> : null}
    </>
  );
}
