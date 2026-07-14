import { useRouter } from "expo-router";
import type { JSX } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, ListGroup, Separator, Surface, Typography, useToast } from "heroui-native";

const WILL_DELETE = [
  {
    title: "All Search Settings",
    description: "Your saved searches and preferences will be permanently removed",
  },
  {
    title: "Favorites & Saved Items",
    description: "All items you've saved or marked as favorite will be deleted",
  },
  {
    title: "Account Information",
    description: "Your personal information and profile data will be erased",
  },
  {
    title: "Premium Access",
    description: "You will lose access to all premium features and subscriptions",
  },
] as const;

export default function DeleteAccountScreen(): JSX.Element {
  const router = useRouter();
  const { toast } = useToast();

  const confirmDelete = () => {
    Alert.alert(
      "Final Confirmation",
      "This action is permanent and cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            toast.show({
              variant: "danger",
              label: "Delete My Account",
              description: "Mock only — account not deleted.",
              duration: 2800,
            }),
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-10">
      <View className="gap-1">
        <Typography type="h4" weight="bold" className="text-foreground">
          Delete Account
        </Typography>
        <Typography type="body-sm" className="text-muted">
          Review what will be deleted
        </Typography>
      </View>

      <Surface variant="secondary" className="overflow-hidden rounded-2xl">
        <Typography type="body-xs" weight="semibold" className="px-4 pb-1 pt-3 uppercase text-muted">
          What will be deleted
        </Typography>
        <ListGroup variant="transparent">
          {WILL_DELETE.map((row, i) => (
            <View key={row.title}>
              {i > 0 ? <Separator className="mx-4" /> : null}
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{row.title}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{row.description}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <View />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </View>
          ))}
        </ListGroup>
      </Surface>

      <Surface variant="secondary" className="overflow-hidden rounded-2xl">
        <Typography type="body-xs" weight="semibold" className="px-4 pb-1 pt-3 uppercase text-muted">
          Consider these alternatives
        </Typography>
        <ListGroup variant="transparent">
          <ListGroup.Item onPress={() => router.push("/settings/notification")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Pause Notifications</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item onPress={() => router.push("/settings/subscription")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Manage Subscription</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Privacy Settings</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <View />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>
      </Surface>

      <Surface variant="secondary" className="gap-1 rounded-2xl border border-danger/30 p-4">
        <Typography type="body-sm" weight="semibold" className="text-danger">
          This Action is Permanent
        </Typography>
        <Typography type="body-xs" className="text-muted">
          Once you delete your account, there is no going back. Please be certain.
        </Typography>
      </Surface>

      <Button variant="danger" className="rounded-xl" onPress={confirmDelete}>
        <Button.Label>Delete My Account</Button.Label>
      </Button>
      <Button variant="secondary" className="rounded-xl" onPress={() => router.back()}>
        <Button.Label>Keep My Account</Button.Label>
      </Button>
    </ScrollView>
  );
}
