import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Alert, BottomSheet, Switch } from "heroui-native";

import { SearchBottomSheetHeader } from "@/features/home/search-bottom-sheet-header";
import { SearchBottomSheetRow } from "@/features/home/search-bottom-sheet-row";
import { SearchSheetGroup } from "@/features/home/search-sheet-group";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import type { UserPreferences } from "@/mocks/data/settings";

type IonName = ComponentProps<typeof Ionicons>["name"];

export type HideListingsPrefsPatch = Pick<
  UserPreferences,
  | "showScams"
  | "showDealers"
  | "showDealerships"
  | "showMajorDamaged"
  | "showRebuiltTitle"
  | "showSalvageTitle"
>;

interface HideRow {
  key: string;
  icon: IonName;
  title: string;
  description: string;
  isHidden: boolean;
  onChange: (hidden: boolean) => void;
}

function pickHidePrefs(prefs: UserPreferences): HideListingsPrefsPatch {
  return {
    showScams: prefs.showScams,
    showDealers: prefs.showDealers,
    showDealerships: prefs.showDealerships,
    showMajorDamaged: prefs.showMajorDamaged ?? true,
    showRebuiltTitle: prefs.showRebuiltTitle ?? true,
    showSalvageTitle: prefs.showSalvageTitle ?? true,
  };
}

function areHidePrefsEqual(
  a: HideListingsPrefsPatch,
  b: HideListingsPrefsPatch,
): boolean {
  return (
    a.showScams === b.showScams &&
    a.showDealers === b.showDealers &&
    a.showDealerships === b.showDealerships &&
    a.showMajorDamaged === b.showMajorDamaged &&
    a.showRebuiltTitle === b.showRebuiltTitle &&
    a.showSalvageTitle === b.showSalvageTitle
  );
}

function HideListingsContent({
  prefs,
  onSave,
  onDismiss,
}: {
  prefs: UserPreferences;
  onSave: (prefs: HideListingsPrefsPatch) => Promise<boolean>;
  onDismiss: () => void;
}): JSX.Element {
  const initial = useMemo(() => pickHidePrefs(prefs), [prefs]);
  const [draft, setDraft] = useState<HideListingsPrefsPatch>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const dirty = !areHidePrefsEqual(draft, initial);

  const rows: HideRow[] = [
    {
      key: "spam",
      icon: "warning-outline",
      title: "Spam",
      description: "Hide spam and scam listings",
      isHidden: !draft.showScams,
      onChange: (hidden) =>
        setDraft((current) => ({ ...current, showScams: !hidden })),
    },
    {
      key: "dealer",
      icon: "storefront-outline",
      title: "Dealer",
      description: "Hide dealer and dealership listings",
      isHidden: !draft.showDealerships,
      onChange: (hidden) =>
        setDraft((current) => ({
          ...current,
          showDealers: !hidden,
          showDealerships: !hidden,
        })),
    },
    {
      key: "major",
      icon: "car-outline",
      title: "Major damage",
      description: "Hide listings with major damage",
      isHidden: !draft.showMajorDamaged,
      onChange: (hidden) =>
        setDraft((current) => ({ ...current, showMajorDamaged: !hidden })),
    },
    {
      key: "rebuilt",
      icon: "construct-outline",
      title: "Rebuilt",
      description: "Hide rebuilt title listings",
      isHidden: !draft.showRebuiltTitle,
      onChange: (hidden) =>
        setDraft((current) => ({ ...current, showRebuiltTitle: !hidden })),
    },
    {
      key: "salvage",
      icon: "alert-circle-outline",
      title: "Salvage",
      description: "Hide salvage title listings",
      isHidden: !draft.showSalvageTitle,
      onChange: (hidden) =>
        setDraft((current) => ({ ...current, showSalvageTitle: !hidden })),
    },
  ];

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const ok = await onSave(draft);
      if (ok) onDismiss();
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet.Content
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
    >
      <View>
        <SearchBottomSheetHeader
          title="Hide listings"
          onCancel={onDismiss}
          onSave={() => {
            void handleSave();
          }}
          cancelDisabled={saving}
          saveDisabled={!dirty || saving}
          saveLabel={saving ? "Saving…" : "Save"}
        />

        <View className="mt-5 px-3">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content className="min-w-0 flex-1">
              <Alert.Title>
                This automatically applies to your notification settings. Use with
                caution.
              </Alert.Title>
            </Alert.Content>
          </Alert>
        </View>

        <SearchSheetGroup>
          {rows.map((row, index) => (
            <SearchBottomSheetRow
              key={row.key}
              icon={row.icon}
              title={row.title}
              description={row.description}
              showChevron={false}
              isLast={index === rows.length - 1}
              onPress={() => {
                if (!saving) row.onChange(!row.isHidden);
              }}
              right={
                <Switch
                  isSelected={row.isHidden}
                  isDisabled={saving}
                  onSelectedChange={row.onChange}
                />
              }
            />
          ))}
        </SearchSheetGroup>
      </View>
    </BottomSheet.Content>
  );
}

interface HideListingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: UserPreferences;
  onSave: (prefs: HideListingsPrefsPatch) => Promise<boolean>;
}

export function HideListingsSheet({
  isOpen,
  onOpenChange,
  prefs,
  onSave,
}: HideListingsSheetProps): JSX.Element | null {
  const [session, setSession] = useState(0);

  useEffect(() => {
    if (isOpen) setSession((value) => value + 1);
  }, [isOpen]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <HideListingsContent
        key={session}
        prefs={prefs}
        onSave={onSave}
        onDismiss={() => onOpenChange(false)}
      />
    </SheetShell>
  );
}
