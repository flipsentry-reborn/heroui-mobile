import type { JSX } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Alert,
  BottomSheet,
  Button,
  Checkbox,
  ControlField,
  Label,
  Typography,
  useBottomSheet,
  useToast,
} from "heroui-native";
import { ProgressButton } from "heroui-native-pro";

import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { mockDeleteAccount } from "@/mocks/services/settings";

type DeleteStep = "confirm" | "hold";

const LOSE_ACCESS_ITEMS = [
  "Saved searches and preferences",
  "Active subscription and credits",
  "Listings history and feed data",
] as const;

function DeleteAccountContent({
  onDeleted,
}: {
  onDeleted: () => void;
}): JSX.Element {
  const { toast } = useToast();
  const { onOpenChange } = useBottomSheet();
  const [step, setStep] = useState<DeleteStep>("confirm");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dismiss = () => onOpenChange(false);

  const handleHoldComplete = () => {
    if (deleting || !acknowledged) return;
    setDeleting(true);
    void mockDeleteAccount()
      .then(() => {
        onDeleted();
        toast.show({
          variant: "default",
          label: "Account deleted",
          duration: 2200,
        });
      })
      .catch(() => {
        setDeleting(false);
        toast.show({
          variant: "danger",
          label: "Delete failed",
          duration: 2200,
        });
      });
  };

  if (step === "confirm") {
    return (
      <BottomSheet.Content
        className={SHEET_CONTENT_CLASS_NAME}
        backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
        handleComponent={null}
        contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
      >
        <View>
          <View className="items-center px-8 pt-3 pb-2">
            <Typography type="body" weight="normal">
              Delete Account
            </Typography>
          </View>

          <View className="gap-5 px-5 pb-6 pt-2">
            <Typography type="body-sm" className="text-center text-muted">
              You want to delete your account?
            </Typography>

            <View className="flex-row gap-3">
              <Button
                className="min-h-12 flex-1"
                onPress={dismiss}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                className="min-h-12 flex-1"
                onPress={() => setStep("hold")}
              >
                <Button.Label>Delete Account</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </BottomSheet.Content>
    );
  }

  return (
    <BottomSheet.Content
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
    >
      <View>
        <View className="items-center px-8 pt-3 pb-2">
          <Typography type="body" weight="normal">
            Delete Account
          </Typography>
        </View>

        <View className="gap-4 px-5 pb-6 pt-2">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>You will lose all access</Alert.Title>
              <Alert.Description>
                Deleting your account is permanent and cannot be undone.
              </Alert.Description>
            </Alert.Content>
          </Alert>

          <View className="gap-2 px-1">
            {LOSE_ACCESS_ITEMS.map((item) => (
              <Typography key={item} type="body-sm" className="text-muted">
                • {item}
              </Typography>
            ))}
          </View>

          <ControlField
            isSelected={acknowledged}
            onSelectedChange={setAcknowledged}
            isDisabled={deleting}
            className="items-start gap-3"
          >
            <ControlField.Indicator className="mt-0.5">
              <Checkbox />
            </ControlField.Indicator>
            <Label className="flex-1 text-sm">
              I understand I will lose all access
            </Label>
          </ControlField>

          <ProgressButton
            variant="danger"
            holdDuration={2000}
            isDisabled={!acknowledged || deleting}
            onComplete={handleHoldComplete}
            className="w-full"
          >
            <ProgressButton.Label>
              {deleting ? "Deleting…" : "Hold to delete account"}
            </ProgressButton.Label>
            <ProgressButton.Overlay>
              <ProgressButton.MaskLabel>
                {deleting ? "Deleting…" : "Hold to delete account"}
              </ProgressButton.MaskLabel>
            </ProgressButton.Overlay>
          </ProgressButton>

          <Button
            className="min-h-12 w-full"
            isDisabled={deleting}
            onPress={() => {
              setAcknowledged(false);
              setStep("confirm");
            }}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface DeleteAccountSheetsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountSheets({
  isOpen,
  onOpenChange,
}: DeleteAccountSheetsProps): JSX.Element | null {
  const [contentKey, setContentKey] = useState(0);

  useEffect(() => {
    if (isOpen) setContentKey((key) => key + 1);
  }, [isOpen]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <DeleteAccountContent
        key={contentKey}
        onDeleted={() => onOpenChange(false)}
      />
    </SheetShell>
  );
}
