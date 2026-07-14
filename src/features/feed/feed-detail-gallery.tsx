import { Image } from "expo-image";
import type { JSX } from "react";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { PressableFeedback } from "heroui-native";

export const DETAIL_HERO_H = 360;
const SCREEN_W = Dimensions.get("window").width;
const THUMBS_H = 64;

interface FeedDetailGalleryProps {
  images: string[];
  /** Scroll offset — drives zoom + collapse as user scrolls down. */
  scrollY?: SharedValue<number>;
}

export function FeedDetailGallery({
  images,
  scrollY,
}: FeedDetailGalleryProps): JSX.Element {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(next);
  };

  const select = (i: number) => {
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const collapseStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = Math.max(0, scrollY.value);
    return {
      height: interpolate(
        y,
        [0, DETAIL_HERO_H],
        [DETAIL_HERO_H + THUMBS_H, 0],
        Extrapolation.CLAMP,
      ),
      opacity: interpolate(y, [0, DETAIL_HERO_H * 0.55], [1, 0], Extrapolation.CLAMP),
    };
  });

  const zoomStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = Math.max(0, scrollY.value);
    return {
      transform: [
        {
          scale: interpolate(y, [0, DETAIL_HERO_H], [1, 1.45], Extrapolation.CLAMP),
        },
        {
          translateY: interpolate(
            y,
            [0, DETAIL_HERO_H],
            [0, -DETAIL_HERO_H * 0.22],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.collapse, collapseStyle]}>
      <Animated.View style={[styles.zoomLayer, zoomStyle]}>
        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, i) => ({
            length: SCREEN_W,
            offset: SCREEN_W * i,
            index: i,
          })}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.hero} contentFit="cover" />
          )}
        />

        {images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            {images.map((uri, i) => (
              <PressableFeedback
                key={`${uri}-thumb-${i}`}
                onPress={() => select(i)}
                animation={{ scale: { value: 0.96 } }}
                style={[styles.thumbWrap, i === index ? styles.thumbActive : null]}
              >
                <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
              </PressableFeedback>
            ))}
          </ScrollView>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  collapse: {
    overflow: "hidden",
    backgroundColor: "#121212",
  },
  zoomLayer: {
    width: SCREEN_W,
  },
  hero: {
    width: SCREEN_W,
    height: DETAIL_HERO_H,
    backgroundColor: "#282828",
  },
  thumbs: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  thumbWrap: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: {
    borderColor: "#1DB954",
  },
  thumb: {
    width: 64,
    height: 48,
    backgroundColor: "#282828",
  },
});
