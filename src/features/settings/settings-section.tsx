import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX, ReactNode } from "react";
import { View } from "react-native";
import { ListGroup, PressableFeedback, Separator, Typography } from "heroui-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type IonName = ComponentProps<typeof Ionicons>["name"];

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps): JSX.Element {
  return (
    <View className="mb-4 gap-2">
      <Typography type="body-xs" className="mx-5 text-muted">
        {title}
      </Typography>
      <ListGroup className="mx-3">
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

function SettingsRowBody({
  icon,
  title,
  description,
  right,
  showChevron,
}: {
  icon: IonName;
  title: string;
  description?: string;
  right?: ReactNode;
  showChevron: boolean;
}): JSX.Element {
  return (
    <>
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
    </>
  );
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
  const body = (
    <SettingsRowBody
      icon={icon}
      title={title}
      description={description}
      right={right}
      showChevron={showChevron}
    />
  );

  return (
    <>
      {onPress ? (
        <PressableFeedback animation={false} onPress={onPress}>
          <PressableFeedback.Scale>
            <ListGroup.Item disabled className="py-2.5">
              {body}
            </ListGroup.Item>
          </PressableFeedback.Scale>
          <PressableFeedback.Highlight />
          <PressableFeedback.Ripple />
        </PressableFeedback>
      ) : (
        <ListGroup.Item disabled className="py-2.5">
          {body}
        </ListGroup.Item>
      )}
      {!isLast ? <Separator className="ml-12 mr-4 bg-muted/40" /> : null}
    </>
  );
}
