import { Ionicons } from "@expo/vector-icons";
import { Fragment, type JSX } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import {
  ListGroup,
  Select,
  Separator,
  Spinner,
  Typography,
  useThemeColor,
} from "heroui-native";
import { withUniwind } from "uniwind";

import {
  LOCATION_RUN_SPEEDS,
  locationRunSpeedLabel,
  type LocationResult,
  type LocationRunSpeed,
} from "@/mocks/data/locations";
import { cityFromLocation } from "@/mocks/services/home";

const StyledIonicons = withUniwind(Ionicons);
const StyledAnimatedView = withUniwind(Animated.View);
const INSTANT_YELLOW = "#eab308";

export interface LocationSpeedOptionState {
  speed: LocationRunSpeed;
  enabled: boolean;
}

interface LocationOtherListProps {
  places: LocationResult[];
  speeds: Record<string, LocationRunSpeed>;
  onSpeedChange: (id: string, speed: LocationRunSpeed) => void;
  loading?: boolean;
  disabled?: boolean;
  /** Tier-filtered speeds with enable flags per location. */
  speedOptionsByLocation?: Record<string, LocationSpeedOptionState[]>;
}

type LooseSelectOption = { value: string; label: string } | undefined;

function isLocationRunSpeed(value: string): value is LocationRunSpeed {
  return (
    value === "none" ||
    value === "instant" ||
    value === "3min" ||
    value === "5min"
  );
}

function LocationSpeedSelect({
  speed,
  options,
  disabled,
  onChange,
}: {
  speed: LocationRunSpeed;
  options: LocationSpeedOptionState[];
  disabled?: boolean;
  onChange: (speed: LocationRunSpeed) => void;
}): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);
  const selectedMeta = LOCATION_RUN_SPEEDS.find((option) => option.id === speed);
  const label = locationRunSpeedLabel(speed);
  const isActive = speed !== "none";

  return (
    <Select
      value={
        selectedMeta
          ? { value: selectedMeta.id, label: selectedMeta.label }
          : undefined
      }
      onValueChange={(next: LooseSelectOption) => {
        if (next === undefined || !isLocationRunSpeed(next.value)) return;
        const option = options.find((item) => item.speed === next.value);
        if (option != null && !option.enabled) return;
        onChange(next.value);
      }}
      isDisabled={disabled}
    >
      <Select.Trigger variant="unstyled" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Run speed ${label}`}
          disabled={disabled}
          className={`flex-row items-center gap-1 ${disabled ? "opacity-40" : ""}`}
        >
          {speed === "instant" ? (
            <View className="flex-row items-center gap-1">
              <StyledIonicons
                name="flash"
                size={14}
                className="text-yellow-500"
              />
              <Typography
                type="body-sm"
                className={isActive ? "text-foreground" : "text-muted"}
              >
                Instant
              </Typography>
            </View>
          ) : (
            <Typography
              type="body-sm"
              className={isActive ? "text-foreground" : "text-muted"}
            >
              {label}
            </Typography>
          )}
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </Pressable>
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay className="bg-backdrop" />
        <Select.Content
          presentation="popover"
          placement="bottom"
          align="end"
          width={220}
          className="rounded-2xl"
        >
          {options.map((option, index) => {
            const meta = LOCATION_RUN_SPEEDS.find(
              (item) => item.id === option.speed,
            );
            if (meta == null) return null;
            return (
              <Fragment key={option.speed}>
                <Select.Item
                  value={option.speed}
                  label={meta.label}
                  className={`py-3 ${option.enabled ? "" : "opacity-40"}`}
                >
                  {({ isSelected }) => (
                    <>
                      {option.speed === "instant" ? (
                        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                          <Ionicons
                            name="flash"
                            size={14}
                            color={INSTANT_YELLOW}
                          />
                          <Select.ItemLabel />
                        </View>
                      ) : (
                        <Select.ItemLabel />
                      )}
                      <View className="items-center justify-center">
                        <Ionicons
                          name={
                            isSelected ? "radio-button-on" : "radio-button-off"
                          }
                          size={18}
                          color={isSelected ? accent : muted}
                        />
                      </View>
                    </>
                  )}
                </Select.Item>
                {index < options.length - 1 ? (
                  <Separator className="mx-4 bg-muted/40" />
                ) : null}
              </Fragment>
            );
          })}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

function NearbyLocationsLoading(): JSX.Element {
  const accent = useThemeColor("accent");

  return (
    <StyledAnimatedView
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(160)}
      className="items-center gap-5 rounded-3xl bg-surface px-6 py-10"
    >
      <View className="items-center justify-center">
        <View className="absolute h-[72px] w-[72px] rounded-full bg-accent/10" />
        <View className="absolute h-14 w-14 rounded-full bg-accent/5" />
        <Spinner size="lg" color={accent}>
          <Spinner.Indicator animation={{ rotation: { speed: 1.35 } }} />
        </Spinner>
      </View>

      <View className="items-center gap-2 px-2">
        <View className="flex-row items-center gap-2">
          <StyledIonicons
            name="navigate-circle-outline"
            size={22}
            className="text-accent"
          />
          <Typography className="text-center text-lg font-semibold text-foreground">
            Finding best locations…
          </Typography>
        </View>
        <Typography
          type="body-sm"
          className="max-w-[260px] text-center text-muted"
        >
          Scanning nearby cities within your search radius
        </Typography>
      </View>
    </StyledAnimatedView>
  );
}

export function LocationOtherList({
  places,
  speeds,
  onSpeedChange,
  loading = false,
  disabled = false,
  speedOptionsByLocation = {},
}: LocationOtherListProps): JSX.Element {
  const defaultOptions: LocationSpeedOptionState[] = LOCATION_RUN_SPEEDS.map(
    (item) => ({ speed: item.id, enabled: true }),
  );

  return (
    <View className={`gap-2.5 ${disabled && !loading ? "opacity-50" : ""}`}>
      <View className="mx-1 gap-1">
        <Typography type="body-xs" className="text-muted">
          Multiple Locations
        </Typography>
        {disabled && !loading ? (
          <Typography type="body-xs" className="text-muted/80">
            Select at least one platform to choose locations.
          </Typography>
        ) : null}
      </View>

      {loading ? (
        <NearbyLocationsLoading />
      ) : places.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl bg-surface px-6 py-8">
          <StyledIonicons
            name="location-outline"
            size={28}
            className="text-muted"
          />
          <Typography type="body-sm" className="text-center text-muted">
            No nearby suggestions for this area
          </Typography>
        </View>
      ) : (
        <ListGroup>
          {places.map((place, index) => {
            const speed = speeds[place.id] ?? "none";
            const isLast = index === places.length - 1;
            const options =
              speedOptionsByLocation[place.id] ?? defaultOptions;

            return (
              <View key={place.id}>
                <ListGroup.Item disabled className="py-3.5">
                  <ListGroup.ItemContent className="min-w-0 flex-1">
                    <ListGroup.ItemTitle
                      className="text-[15px] font-normal text-foreground"
                      numberOfLines={1}
                    >
                      {cityFromLocation(place.displayName || place.name)}
                    </ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <LocationSpeedSelect
                      speed={speed}
                      options={options}
                      disabled={disabled}
                      onChange={(next) => onSpeedChange(place.id, next)}
                    />
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
                {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
              </View>
            );
          })}
        </ListGroup>
      )}
    </View>
  );
}
