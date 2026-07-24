import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import {
  BottomSheet,
  Button,
  Checkbox,
  ControlField,
  Label,
  Separator,
  Typography,
  useBottomSheet,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { SEARCH_PLATFORMS } from "@/features/home/search-bottom-sheet-platforms-sheet";
import {
  SHEET_BACKGROUND_CLASS_NAME,
  SHEET_CONTENT_CLASS_NAME,
  SHEET_CONTENT_CONTAINER_CLASS_NAME,
} from "@/features/home/sheet-chrome";
import { SheetShell } from "@/features/home/sheet-shell";
import type { LocationPlatform } from "@/mocks/data/locations";

const StyledIonicons = withUniwind(Ionicons);

function togglePlatform(
  platforms: LocationPlatform[],
  platform: LocationPlatform,
  selected: boolean,
  catalog: LocationPlatform[],
): LocationPlatform[] {
  if (selected) {
    if (platforms.includes(platform)) return platforms;
    return catalog.filter(
      (id) => platforms.includes(id) || id === platform,
    );
  }
  return platforms.filter((id) => id !== platform);
}

function PlatformsSheetContent({
  platforms,
  availablePlatforms,
  onPlatformsChange,
}: {
  platforms: LocationPlatform[];
  availablePlatforms: LocationPlatform[];
  onPlatformsChange: (next: LocationPlatform[]) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const [draft, setDraft] = useState(platforms);
  const dismiss = () => onOpenChange(false);
  const catalog =
    availablePlatforms.length > 0
      ? SEARCH_PLATFORMS.filter((item) =>
          availablePlatforms.includes(item.id),
        )
      : SEARCH_PLATFORMS;

  useEffect(() => {
    setDraft(platforms);
  }, [platforms]);

  return (
    <BottomSheet.Content
      enableDynamicSizing
      enableOverDrag={false}
      className={SHEET_CONTENT_CLASS_NAME}
      backgroundClassName={SHEET_BACKGROUND_CLASS_NAME}
      handleComponent={null}
      contentContainerClassName={SHEET_CONTENT_CONTAINER_CLASS_NAME}
    >
      <View>
        <View className="items-center px-5 pb-1 pt-4">
          <Typography type="body" weight="normal">
            Platforms
          </Typography>
        </View>

        <View className="mx-3 mb-2 overflow-hidden rounded-3xl bg-surface shadow-surface">
          {catalog.map((platform, index) => {
            const isSelected = draft.includes(platform.id);
            const isLast = index === catalog.length - 1;

            return (
              <View key={platform.id}>
                <ControlField
                  isSelected={isSelected}
                  onSelectedChange={(next) =>
                    setDraft(
                      togglePlatform(
                        draft,
                        platform.id,
                        next,
                        catalog.map((item) => item.id),
                      ),
                    )
                  }
                  className="items-center gap-3 px-4 py-3.5"
                >
                  <PlatformIcon platform={platform.id} size={22} />
                  <Label className="flex-1 text-[15px] font-normal">
                    {platform.label}
                  </Label>
                  <ControlField.Indicator>
                    <Checkbox />
                  </ControlField.Indicator>
                </ControlField>
                {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
              </View>
            );
          })}
        </View>

        <View className="flex-row gap-3 px-5 pb-6 pt-2">
          <Button
            variant="tertiary"
            className="min-h-12 flex-1 rounded-2xl bg-surface"
            onPress={dismiss}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1 rounded-2xl"
            onPress={() => {
              onPlatformsChange(draft);
              dismiss();
            }}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface LocationPlatformsRowProps {
  platforms: LocationPlatform[];
  onPress: () => void;
}

/** Non-expandable row — opens platforms sheet via parent (keeps sheet out of scroll tree). */
export function LocationPlatformsRow({
  platforms,
  onPress,
}: LocationPlatformsRowProps): JSX.Element {
  const [muted] = useThemeColor(["muted"]);

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-3xl bg-surface shadow-surface"
    >
      <View className="flex-row items-center gap-2 px-4 py-3.5">
        <Typography
          type="body-sm"
          weight="semibold"
          className="text-foreground"
        >
          Platforms
        </Typography>
        <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
          {platforms.length > 0 ? (
            platforms.map((platform) => (
              <PlatformIcon key={platform} platform={platform} size={20} />
            ))
          ) : (
            <Typography type="body-sm" className="text-muted">
              None
            </Typography>
          )}
        </View>
        <StyledIonicons
          name="chevron-forward"
          size={16}
          className="text-muted"
          color={muted}
        />
      </View>
    </Pressable>
  );
}

interface LocationPlatformsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: LocationPlatform[];
  /** When set, only these platforms are listed (from /api/platform/available). */
  availablePlatforms?: LocationPlatform[];
  onPlatformsChange: (next: LocationPlatform[]) => void;
}

/** Nested sheet — render as sibling of location SheetShell, not inside its ScrollView. */
export function LocationPlatformsSheet({
  isOpen,
  onOpenChange,
  platforms,
  availablePlatforms = [],
  onPlatformsChange,
}: LocationPlatformsSheetProps): JSX.Element | null {
  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <PlatformsSheetContent
        platforms={platforms}
        availablePlatforms={availablePlatforms}
        onPlatformsChange={onPlatformsChange}
      />
    </SheetShell>
  );
}
