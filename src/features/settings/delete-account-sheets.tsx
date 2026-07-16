import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { BottomSheet, Button, Typography, useToast } from "heroui-native";
import { ProgressButton } from "heroui-native-pro";

import { mockDeleteAccount } from "@/mocks/services/settings";

const SHEET_BACKGROUND_STYLE = {
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  borderCurve: "continuous" as const,
};

function AccountSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setIsOpen(false);
      return;
    }
    const id = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          backgroundClassName="bg-surface-secondary"
          backgroundStyle={SHEET_BACKGROUND_STYLE}
          handleIndicatorClassName="bg-separator"
        >
          {children}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
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
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmOpen(false);
      setHoldOpen(false);
      setDeleting(false);
      return;
    }
    const id = requestAnimationFrame(() => setConfirmOpen(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const closeAll = () => {
    setHoldOpen(false);
    setConfirmOpen(false);
    setDeleting(false);
    onOpenChange(false);
  };

  const handleProceed = () => {
    requestAnimationFrame(() => setHoldOpen(true));
  };

  const handleHoldComplete = () => {
    if (deleting) return;
    setDeleting(true);
    void mockDeleteAccount()
      .then(() => {
        closeAll();
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

  if (!isOpen) return null;

  return (
    <>
      <AccountSheet visible={confirmOpen} onClose={closeAll}>
        <View className="gap-5 px-5 pb-5 pt-2">
          <View className="items-center gap-1.5">
            <BottomSheet.Title className="text-center text-danger">
              Delete Account
            </BottomSheet.Title>
            <Typography type="body-sm" className="text-center text-muted">
              You want to delete your account?
            </Typography>
          </View>
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              className="min-h-12 flex-1"
              onPress={closeAll}
            >
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              variant="primary"
              className="min-h-12 flex-1 bg-accent"
              onPress={handleProceed}
            >
              <Button.Label className="text-accent-foreground">Proceed</Button.Label>
            </Button>
          </View>
        </View>
      </AccountSheet>

      <AccountSheet
        visible={holdOpen}
        onClose={() => {
          if (!deleting) setHoldOpen(false);
        }}
      >
        <View className="gap-3 px-5 pb-5 pt-3">
          <ProgressButton
            variant="danger"
            holdDuration={2000}
            isDisabled={deleting}
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
            variant="secondary"
            className="min-h-12 w-full"
            isDisabled={deleting}
            onPress={() => setHoldOpen(false)}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
        </View>
      </AccountSheet>
    </>
  );
}
