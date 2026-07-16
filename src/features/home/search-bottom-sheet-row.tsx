import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX, ReactNode } from "react";
import { View } from "react-native";
import { ListGroup, PressableFeedback, Separator } from "heroui-native";
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
}

function RowBody({
  icon,
  title,
  description,
  right,
  showChevron,
  iconClassName,
}: {
  icon: IonName;
  title: string;
  description?: string;
  right?: ReactNode;
  showChevron: boolean;
  iconClassName: string;
}): JSX.Element {
  return (
    <>
      <ListGroup.ItemPrefix>
        <StyledIonicons name={icon} size={20} className={iconClassName} />
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

export function SearchBottomSheetRow({
  icon,
  title,
  description,
  onPress,
  right,
  showChevron = true,
  isLast = false,
  iconClassName = "text-muted",
}: SearchBottomSheetRowProps): JSX.Element {
  const body = (
    <RowBody
      icon={icon}
      title={title}
      description={description}
      right={right}
      showChevron={showChevron}
      iconClassName={iconClassName}
    />
  );

  return (
    <>
      {onPress ? (
        <PressableFeedback animation={false} onPress={onPress}>
          <PressableFeedback.Scale>
            <ListGroup.Item disabled className="py-2">
              {body}
            </ListGroup.Item>
          </PressableFeedback.Scale>
          <PressableFeedback.Highlight />
          <PressableFeedback.Ripple />
        </PressableFeedback>
      ) : (
        <ListGroup.Item disabled className="py-2">
          {body}
        </ListGroup.Item>
      )}
      {!isLast ? <Separator className="ml-12 mr-4 opacity-50" /> : null}
    </>
  );
}
