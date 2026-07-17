import type { JSX } from "react";
import { View } from "react-native";
import { Label, Slider, Typography } from "heroui-native";

import {
  MAX_RADIUS_MILES,
  MIN_RADIUS_MILES,
  RADIUS_STEP_MILES,
} from "@/mocks/data/locations";

interface LocationRadiusProps {
  value: number;
  onChange: (miles: number) => void;
}

export function LocationRadius({
  value,
  onChange,
}: LocationRadiusProps): JSX.Element {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Label className="text-[15px]">Radius</Label>
        <Typography type="body-sm" className="text-foreground">
          {value} mi
        </Typography>
      </View>
      <Slider
        value={value}
        minValue={MIN_RADIUS_MILES}
        maxValue={MAX_RADIUS_MILES}
        step={RADIUS_STEP_MILES}
        onChange={(next) => {
          const miles = Array.isArray(next) ? next[0] : next;
          if (typeof miles === "number") onChange(miles);
        }}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <View className="flex-row justify-between">
        <Typography type="body-xs" className="text-muted">
          {MIN_RADIUS_MILES} mi
        </Typography>
        <Typography type="body-xs" className="text-muted">
          {MAX_RADIUS_MILES} mi
        </Typography>
      </View>
    </View>
  );
}
