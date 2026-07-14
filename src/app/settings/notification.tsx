import type { JSX } from "react";
import { Linking, Platform, View } from "react-native";
import { Button, ListGroup, Separator, Typography, useToast } from "heroui-native";

export default function NotificationSettingsScreen(): JSX.Element {
  const { toast } = useToast();

  return (
    <View className="flex-1 gap-3 bg-background p-4">
      <ListGroup variant="secondary" className="overflow-hidden rounded-2xl">
        <ListGroup.Item>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Notification Permission</ListGroup.ItemTitle>
            <ListGroup.ItemDescription>Mock status for this build</ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <Typography type="body-xs" weight="semibold" className="text-success">
              Enabled
            </Typography>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
        <Separator className="mx-4" />
        <ListGroup.Item
          onPress={() =>
            toast.show({
              variant: "accent",
              label: "Enable Notifications",
              description: "Mock only — OS permission not requested.",
              duration: 2500,
            })
          }
        >
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Enable Notifications</ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix />
        </ListGroup.Item>
      </ListGroup>

      <ListGroup variant="secondary" className="overflow-hidden rounded-2xl">
        <ListGroup.Item onPress={() => void Linking.openSettings()}>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>
              {Platform.OS === "ios"
                ? "iOS Notification Settings"
                : "Android Notification Settings"}
            </ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix />
        </ListGroup.Item>
        <Separator className="mx-4" />
        <ListGroup.Item
          onPress={() =>
            toast.show({
              variant: "success",
              label: "Permission refreshed",
              duration: 2000,
            })
          }
        >
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Refresh Permission Status</ListGroup.ItemTitle>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix />
        </ListGroup.Item>
      </ListGroup>

      <Typography type="body-xs" className="px-1 text-muted">
        Notifications keep you updated about new listings matching your searches.
      </Typography>

      <Button
        variant="secondary"
        onPress={() =>
          toast.show({
            variant: "accent",
            label: "Enable Notifications",
            description: "Mock only.",
            duration: 2200,
          })
        }
      >
        <Button.Label>Enable Notifications</Button.Label>
      </Button>
    </View>
  );
}
