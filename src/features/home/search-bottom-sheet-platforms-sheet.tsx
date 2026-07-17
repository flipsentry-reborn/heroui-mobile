import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  BottomSheet,
  Button,
  Checkbox,
  ControlField,
  FieldError,
  Label,
  Separator,
  Typography,
  useBottomSheet,
} from "heroui-native";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { SearchSheetGroup } from "@/features/home/search-sheet-group";
import { SheetShell } from "@/features/home/sheet-shell";
import type { HomePlatform } from "@/mocks/data/home";

export const SEARCH_PLATFORMS: { id: HomePlatform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "offerUp", label: "OfferUp" },
  { id: "craigslist", label: "Craigslist" },
  { id: "kijiji", label: "Kijiji" },
];

export const DEFAULT_SEARCH_PLATFORMS: HomePlatform[] = ["facebook"];

const PLATFORMS_REQUIRED_ERROR = "Select at least one platform";

export function formatPlatformsLabel(platforms: HomePlatform[]): string {
  if (platforms.length === 0) return "None";
  return String(platforms.length);
}

function togglePlatform(
  platforms: HomePlatform[],
  platform: HomePlatform,
  selected: boolean,
): HomePlatform[] {
  if (selected) {
    if (platforms.includes(platform)) return platforms;
    return SEARCH_PLATFORMS.map((item) => item.id).filter(
      (id) => platforms.includes(id) || id === platform,
    );
  }
  return platforms.filter((id) => id !== platform);
}

function PlatformsSheetContent({
  platforms,
  onPlatformsChange,
  onPersist,
}: {
  platforms: HomePlatform[];
  onPlatformsChange: (values: HomePlatform[]) => void;
  onPersist: (values: HomePlatform[]) => void;
}): JSX.Element {
  const { onOpenChange } = useBottomSheet();
  const snapPoints = useMemo(() => ["92%"], []);
  const isInvalid = platforms.length === 0;
  const dismiss = () => onOpenChange(false);

  const handleSave = () => {
    if (isInvalid) return;
    onPersist(platforms);
    dismiss();
  };

  return (
    <BottomSheet.Content
      snapPoints={snapPoints}
      className="overflow-hidden"
      backgroundClassName="rounded-t-[32px] bg-surface-secondary"
      handleComponent={null}
      contentContainerClassName="p-0"
    >
      <View>
        <View className="items-center px-5 pt-4 pb-1">
          <Typography type="body" weight="normal">
            Platforms
          </Typography>
        </View>

        <SearchSheetGroup>
          {SEARCH_PLATFORMS.map((platform, index) => {
            const isSelected = platforms.includes(platform.id);
            const isLast = index === SEARCH_PLATFORMS.length - 1;

            return (
              <View key={platform.id}>
                <ControlField
                  isSelected={isSelected}
                  onSelectedChange={(next) =>
                    onPlatformsChange(
                      togglePlatform(platforms, platform.id, next),
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
        </SearchSheetGroup>

        {isInvalid ? (
          <FieldError isInvalid className="mx-5 -mt-3">
            {PLATFORMS_REQUIRED_ERROR}
          </FieldError>
        ) : null}

        <View className="flex-row gap-3 px-5 pb-6 pt-2">
          <Button
            variant="secondary"
            className="min-h-12 flex-1"
            onPress={dismiss}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1"
            isDisabled={isInvalid}
            onPress={handleSave}
          >
            <Button.Label>Save</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheet.Content>
  );
}

interface SearchBottomSheetPlatformsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  platforms: HomePlatform[];
  onPlatformsChange: (values: HomePlatform[]) => void;
}

export function SearchBottomSheetPlatformsSheet({
  isOpen,
  onOpenChange,
  platforms,
  onPlatformsChange,
}: SearchBottomSheetPlatformsSheetProps): JSX.Element | null {
  const [draftPlatforms, setDraftPlatforms] = useState(platforms);

  useEffect(() => {
    if (!isOpen) return;
    setDraftPlatforms(platforms);
  }, [isOpen, platforms]);

  return (
    <SheetShell visible={isOpen} onClose={() => onOpenChange(false)}>
      <PlatformsSheetContent
        platforms={draftPlatforms}
        onPlatformsChange={setDraftPlatforms}
        onPersist={onPlatformsChange}
      />
    </SheetShell>
  );
}
