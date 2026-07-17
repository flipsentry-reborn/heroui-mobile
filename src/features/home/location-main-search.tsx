import type { JSX } from "react";
import { View } from "react-native";
import {
  Label,
  ListGroup,
  PressableFeedback,
  SearchField,
  Separator,
} from "heroui-native";

import type { LocationResult } from "@/mocks/data/locations";

interface LocationMainSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  predictions: LocationResult[];
  showPredictions: boolean;
  onSelect: (place: LocationResult) => void;
  selected: LocationResult | null;
}

export function LocationMainSearch({
  query,
  onQueryChange,
  predictions,
  showPredictions,
  onSelect,
}: LocationMainSearchProps): JSX.Element {
  return (
    <View className="gap-2.5">
      <SearchField value={query} onChange={onQueryChange}>
        <Label className="text-[15px]">Main Location</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input
            placeholder="Search city or area"
            className="text-[15px]"
            autoCorrect={false}
            autoCapitalize="words"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {showPredictions ? (
        <ListGroup>
          {predictions.length === 0 ? (
            <ListGroup.Item disabled className="py-3">
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className="text-[15px] font-normal text-muted">
                  No matches
                </ListGroup.ItemTitle>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          ) : (
            predictions.map((place, index) => (
              <View key={place.id}>
                <PressableFeedback
                  animation={false}
                  onPress={() => onSelect(place)}
                >
                  <PressableFeedback.Scale>
                    <ListGroup.Item disabled className="py-3">
                      <ListGroup.ItemContent>
                        <ListGroup.ItemTitle
                          className="text-[15px] font-normal text-foreground"
                          numberOfLines={1}
                        >
                          {place.displayName}
                        </ListGroup.ItemTitle>
                      </ListGroup.ItemContent>
                      <ListGroup.ItemSuffix />
                    </ListGroup.Item>
                  </PressableFeedback.Scale>
                  <PressableFeedback.Ripple />
                </PressableFeedback>
                {index < predictions.length - 1 ? (
                  <Separator className="mx-4 bg-muted/40" />
                ) : null}
              </View>
            ))
          )}
        </ListGroup>
      ) : null}
    </View>
  );
}
