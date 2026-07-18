import type { JSX } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Accordion,
  Checkbox,
  cn,
  ControlField,
  Label,
  Separator,
  Typography,
  useAccordionItem,
} from "heroui-native";
import { withUniwind } from "uniwind";

import PlatformIcon from "@/components/icons/PlatformIcon";
import { SEARCH_PLATFORMS } from "@/features/home/search-bottom-sheet-platforms-sheet";
import type { LocationPlatform } from "@/mocks/data/locations";

const StyledAnimatedView = withUniwind(Animated.View);

/** Matches HeroUI Native / search-cards `AccordionWithDepthEffect` layout spring. */
const DEPTH_LAYOUT_TRANSITION = LinearTransition.springify()
  .damping(70)
  .stiffness(1000)
  .mass(2);

function togglePlatform(
  platforms: LocationPlatform[],
  platform: LocationPlatform,
  selected: boolean,
): LocationPlatform[] {
  if (selected) {
    if (platforms.includes(platform)) return platforms;
    return SEARCH_PLATFORMS.map((item) => item.id).filter(
      (id) => platforms.includes(id) || id === platform,
    );
  }
  return platforms.filter((id) => id !== platform);
}

function PlatformsDepthItem({
  platforms,
  onPlatformsChange,
}: {
  platforms: LocationPlatform[];
  onPlatformsChange: (next: LocationPlatform[]) => void;
}): JSX.Element {
  const { isExpanded } = useAccordionItem();
  const scale = useSharedValue(isExpanded ? 1 : 0.97);

  useEffect(() => {
    scale.value = withTiming(isExpanded ? 1 : 0.97, { duration: 200 });
  }, [isExpanded, scale]);

  const depthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View layout={DEPTH_LAYOUT_TRANSITION} style={depthStyle}>
      <StyledAnimatedView
        layout={DEPTH_LAYOUT_TRANSITION}
        className={cn(
          "overflow-hidden bg-surface",
          isExpanded ? "rounded-2xl" : "rounded-3xl",
        )}
      >
        <Accordion.Trigger className="gap-2 px-4 py-3.5">
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
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content className="px-0 pb-1 pt-0">
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
        </Accordion.Content>
      </StyledAnimatedView>
    </Animated.View>
  );
}

interface LocationPlatformsSectionProps {
  platforms: LocationPlatform[];
  onPlatformsChange: (next: LocationPlatform[]) => void;
}

/** Depth accordion for platform pickers (replaces nested Platforms bottom sheet). */
export function LocationPlatformsSection({
  platforms,
  onPlatformsChange,
}: LocationPlatformsSectionProps): JSX.Element {
  return (
    <Accordion
      selectionMode="single"
      isCollapsible
      hideSeparator
      defaultValue={["platforms"]}
      className="w-auto overflow-visible"
      animation={{
        layout: {
          value: DEPTH_LAYOUT_TRANSITION,
        },
      }}
    >
      <Accordion.Item value="platforms" className="overflow-visible">
        <PlatformsDepthItem
          platforms={platforms}
          onPlatformsChange={onPlatformsChange}
        />
      </Accordion.Item>
    </Accordion>
  );
}
