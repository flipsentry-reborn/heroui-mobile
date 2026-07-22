import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import {
  Alert,
  BottomSheet,
  Button,
  Checkbox,
  ControlField,
  InputGroup,
  Label,
  TextField,
  Typography,
  useBottomSheet,
  useThemeColor,
  useToast,
} from "heroui-native";
import { ProgressButton } from "heroui-native-pro";

import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import { useStore } from "@/store/store";
import { USE_MOCK } from "@/api/config";
import { MOCK_ACCOUNT_CREDENTIALS } from "@/mocks/services/account";

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
  const { userStore } = useStore();
  const [muted] = useThemeColor(["muted"]);
  const [step, setStep] = useState<DeleteStep>("confirm");
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState(
    USE_MOCK ? MOCK_ACCOUNT_CREDENTIALS.password : "",
  );
  const [passwordVisible, setPasswordVisible] = useState(false);

  const dismiss = () => onOpenChange(false);

  const handleHoldComplete = () => {
    if (deleting || !acknowledged) return;
    if (!password.trim()) {
      toast.show({
        variant: "danger",
        label: "Password required",
        duration: 2200,
      });
      return;
    }
    setDeleting(true);
    void userStore
      .deleteAccount(password)
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
                variant="tertiary"
                className="min-h-12 flex-1 rounded-2xl bg-surface"
                onPress={dismiss}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                className="min-h-12 flex-1 rounded-2xl"
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

          <TextField>
            <Label>Password</Label>
            <InputGroup>
              <InputGroup.Input
                className="h-12"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                editable={!deleting}
                placeholder="Confirm with your password"
              />
              <InputGroup.Suffix>
                <Pressable
                  onPress={() => setPasswordVisible((v) => !v)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                  className="items-center justify-center px-1"
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={muted}
                  />
                </Pressable>
              </InputGroup.Suffix>
            </InputGroup>
          </TextField>

          <ProgressButton
            variant="danger"
            holdDuration={2000}
            isDisabled={!acknowledged || deleting || !password.trim()}
            onComplete={handleHoldComplete}
            className="w-full rounded-2xl"
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
            variant="tertiary"
            className="min-h-12 w-full rounded-2xl bg-surface"
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
