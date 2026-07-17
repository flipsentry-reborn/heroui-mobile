import type { JSX } from "react";
import { View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

import type { LocationResult } from "@/mocks/data/locations";

const MILES_TO_METERS = 1609.34;

function MapDot({
  colorClassName,
}: {
  colorClassName: string;
}): JSX.Element {
  return (
    <View
      className={`h-4 w-4 rounded-full border-2 border-white ${colorClassName}`}
    />
  );
}

interface LocationMapProps {
  main: LocationResult | null;
  radiusMiles: number;
  others: LocationResult[];
}

export function LocationMap({
  main,
  radiusMiles,
  others,
}: LocationMapProps): JSX.Element {
  const latitude = main?.latitude ?? 39.8283;
  const longitude = main?.longitude ?? -98.5795;
  const latitudeDelta = main == null ? 30 : Math.max(0.08, radiusMiles / 35);
  const longitudeDelta = latitudeDelta;

  return (
    <View
      className="h-48 w-full overflow-hidden rounded-2xl bg-surface"
      pointerEvents="none"
    >
      <MapView
        style={{ width: "100%", height: "100%" }}
        region={{
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {main != null ? (
          <>
            <Circle
              center={{
                latitude: main.latitude,
                longitude: main.longitude,
              }}
              radius={radiusMiles * MILES_TO_METERS}
              strokeWidth={2}
              strokeColor="rgba(16, 185, 129, 0.85)"
              fillColor="rgba(16, 185, 129, 0.12)"
            />
            <Marker
              coordinate={{
                latitude: main.latitude,
                longitude: main.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <MapDot colorClassName="bg-emerald-500" />
            </Marker>
          </>
        ) : null}
        {others.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <MapDot colorClassName="bg-amber-500" />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
