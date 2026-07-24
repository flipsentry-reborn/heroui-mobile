import type { JSX } from "react";
import { View } from "react-native";
import { Slider, Typography } from "heroui-native";

import {
  MAX_RADIUS_MILES,
  MIN_RADIUS_MILES,
  RADIUS_STEP_MILES,
} from "@/mocks/data/locations";

interface LocationRadiusProps {
  value: number;
  /** Fires while dragging — update label / map only. */
  onChange: (miles: number) => void;
  /** Fires on thumb release — commit radius (e.g. re-suggest locations). */
  onChangeEnd?: (miles: number) => void;
}

function toMiles(next: number | number[]): number | null {
  const miles = Array.isArray(next) ? next[0] : next;
  return typeof miles === "number" ? miles : null;
}

export function LocationRadius({
  value,
  onChange,
  onChangeEnd,
}: LocationRadiusProps): JSX.Element {
  return (
    <View className="gap-2.5">
      <View className="mx-1 flex-row items-center justify-between">
        <Typography type="body-xs" className="text-muted">
          Radius
        </Typography>
        <Typography type="body-sm" className="text-muted">
          {value} mi
        </Typography>
      </View>

      <View className="rounded-3xl bg-surface px-4 py-4 shadow-surface">
        <Slider
          value={value}
          minValue={MIN_RADIUS_MILES}
          maxValue={MAX_RADIUS_MILES}
          step={RADIUS_STEP_MILES}
          onChange={(next) => {
            const miles = toMiles(next);
            if (miles != null) onChange(miles);
          }}
          onChangeEnd={(next) => {
            const miles = toMiles(next);
            if (miles != null) onChangeEnd?.(miles);
          }}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
        <View className="mt-2 flex-row justify-between">
          <Typography type="body-xs" className="text-muted">
            {MIN_RADIUS_MILES} mi
          </Typography>
          <Typography type="body-xs" className="text-muted">
            {MAX_RADIUS_MILES} mi
          </Typography>
        </View>
      </View>
    </View>
  );
}
