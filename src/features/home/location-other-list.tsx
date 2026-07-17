import type { JSX } from "react";
import { View } from "react-native";
import {
  Checkbox,
  ControlField,
  Label,
  ListGroup,
  Separator,
  Typography,
} from "heroui-native";

import type { LocationResult } from "@/mocks/data/locations";

interface LocationOtherListProps {
  places: LocationResult[];
  selectedIds: string[];
  onToggle: (id: string, selected: boolean) => void;
  loading?: boolean;
}

export function LocationOtherList({
  places,
  selectedIds,
  onToggle,
  loading = false,
}: LocationOtherListProps): JSX.Element {
  return (
    <View className="gap-2.5">
      <Label className="text-[15px]">Other Locations</Label>
      <Typography type="body-xs" className="text-muted">
        Nearby areas to expand coverage (optional)
      </Typography>

      {loading ? (
        <Typography type="body-sm" className="text-muted">
          Loading nearby places…
        </Typography>
      ) : places.length === 0 ? (
        <Typography type="body-sm" className="text-muted">
          No nearby suggestions for this area
        </Typography>
      ) : (
        <ListGroup>
          {places.map((place, index) => {
            const isSelected = selectedIds.includes(place.id);
            const isLast = index === places.length - 1;

            return (
              <View key={place.id}>
                <ControlField
                  isSelected={isSelected}
                  onSelectedChange={(next) => onToggle(place.id, next)}
                  className="items-center gap-3 px-4 py-3.5"
                >
                  <View className="min-w-0 flex-1">
                    <Label className="text-[15px] font-normal">
                      {place.name}
                    </Label>
                    <Typography type="body-xs" className="text-muted">
                      {place.secondaryText}
                    </Typography>
                  </View>
                  <ControlField.Indicator>
                    <Checkbox />
                  </ControlField.Indicator>
                </ControlField>
                {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
              </View>
            );
          })}
        </ListGroup>
      )}
    </View>
  );
}
