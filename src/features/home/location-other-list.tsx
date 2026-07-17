import { Ionicons } from "@expo/vector-icons";
import { Fragment, type JSX } from "react";
import { Pressable, View } from "react-native";
import {
  ListGroup,
  Select,
  Separator,
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

const StyledIonicons = withUniwind(Ionicons);
const INSTANT_YELLOW = "#eab308";

interface LocationOtherListProps {
  places: LocationResult[];
  speeds: Record<string, LocationRunSpeed>;
  onSpeedChange: (id: string, speed: LocationRunSpeed) => void;
  loading?: boolean;
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
  onChange,
}: {
  speed: LocationRunSpeed;
  onChange: (speed: LocationRunSpeed) => void;
}): JSX.Element {
  const [accent, muted] = useThemeColor(["accent", "muted"]);
  const selected = LOCATION_RUN_SPEEDS.find((option) => option.id === speed);
  const label = locationRunSpeedLabel(speed);
  const isActive = speed !== "none";

  return (
    <Select
      value={
        selected ? { value: selected.id, label: selected.label } : undefined
      }
      onValueChange={(next: LooseSelectOption) => {
        if (next === undefined || !isLocationRunSpeed(next.value)) return;
        onChange(next.value);
      }}
    >
      <Select.Trigger variant="unstyled" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Run speed ${label}`}
          className="flex-row items-center gap-1"
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
          {LOCATION_RUN_SPEEDS.map((option, index) => (
            <Fragment key={option.id}>
              <Select.Item
                value={option.id}
                label={option.label}
                className="py-3"
              >
                {({ isSelected }) => (
                  <>
                    {option.id === "instant" ? (
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
              {index < LOCATION_RUN_SPEEDS.length - 1 ? (
                <Separator className="mx-4 bg-muted/40" />
              ) : null}
            </Fragment>
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}

export function LocationOtherList({
  places,
  speeds,
  onSpeedChange,
  loading = false,
}: LocationOtherListProps): JSX.Element {
  return (
    <View className="gap-2.5">
      <View className="mx-1 gap-1">
        <Typography type="body-xs" className="text-muted">
          Other Locations
        </Typography>
        <Typography type="body-xs" className="text-muted">
          Pick a speed to include a nearby area
        </Typography>
      </View>

      {loading ? (
        <Typography type="body-sm" className="mx-1 text-muted">
          Loading nearby places...
        </Typography>
      ) : places.length === 0 ? (
        <Typography type="body-sm" className="mx-1 text-muted">
          No nearby suggestions for this area
        </Typography>
      ) : (
        <ListGroup>
          {places.map((place, index) => {
            const speed = speeds[place.id] ?? "none";
            const isLast = index === places.length - 1;

            return (
              <View key={place.id}>
                <ListGroup.Item disabled className="py-3.5">
                  <ListGroup.ItemContent className="min-w-0 flex-1">
                    <ListGroup.ItemTitle
                      className="text-[15px] font-normal text-foreground"
                      numberOfLines={1}
                    >
                      {place.name}
                    </ListGroup.ItemTitle>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <LocationSpeedSelect
                      speed={speed}
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
