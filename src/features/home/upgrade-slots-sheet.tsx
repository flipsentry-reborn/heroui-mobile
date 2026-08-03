import type { JSX } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  Typography,
  useBottomSheet,
} from "heroui-native";
import { useRouter } from "expo-router";
import { observer } from "mobx-react-lite";

import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { SheetContent } from "@/features/home/sheet-content";
import { useStore } from "@/store/store";

const UpgradeSlotsContent = observer(function UpgradeSlotsContent(): JSX.Element {
  const router = useRouter();
  const { onOpenChange } = useBottomSheet();
  const { subscriptionStore } = useStore();
  const hasAccess = subscriptionStore.hasSearchAccess;

  const dismiss = () => onOpenChange(false);

  return (
    <SheetContent
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
    >
      <View>
        <View className="items-center px-8 pt-3 pb-2">
          <Typography type="body" weight="normal">
            Upgrade required
          </Typography>
        </View>

        <View className="gap-5 px-5 pb-6 pt-2">
          <Typography type="body-sm" className="text-center text-muted">
            {hasAccess
              ? "You've used all search slots on your plan. Upgrade to create more searches."
              : "Subscribe to unlock search slots and start getting deal alerts."}
          </Typography>

          <Button
            variant="primary"
            className="min-h-12 w-full rounded-2xl"
            onPress={() => {
              dismiss();
              router.push("/settings/subscription");
            }}
          >
            <Button.Label>Upgrade</Button.Label>
          </Button>
        </View>
      </View>
    </SheetContent>
  );
});

interface UpgradeSlotsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeSlotsSheet({
  isOpen,
  onOpenChange,
}: UpgradeSlotsSheetProps): JSX.Element | null {
  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <UpgradeSlotsContent />
    </SheetShell>
  );
}
