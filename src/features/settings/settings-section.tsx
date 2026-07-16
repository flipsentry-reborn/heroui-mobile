import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX, ReactNode } from "react";
import { View } from "react-native";
import { ListGroup, Separator, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type IonName = ComponentProps<typeof Ionicons>["name"];

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps): JSX.Element {
  return (
    <View className="mb-4 gap-1.5">
      <Typography type="body-xs" className="mx-5 text-muted">
        {title}
      </Typography>
      <ListGroup variant="secondary" className="mx-3">
        {children}
      </ListGroup>
    </View>
  );
}

interface SettingsRowProps {
  icon: IonName;
  title: string;
  description?: string;
  onPress?: () => void;
  right?: ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  icon,
  title,
  description,
  onPress,
  right,
  showChevron = true,
  isLast = false,
}: SettingsRowProps): JSX.Element {
  return (
    <>
      <ListGroup.Item
        onPress={onPress}
        disabled={!onPress && right == null}
        className="py-2"
      >
        <ListGroup.ItemPrefix>
          <StyledIonicons name={icon} size={20} className="text-muted" />
        </ListGroup.ItemPrefix>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle className="text-[15px] font-normal text-foreground">
            {title}
          </ListGroup.ItemTitle>
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
      </ListGroup.Item>
      {!isLast ? <Separator className="ml-12 mr-4 opacity-50" /> : null}
    </>
  );
}
