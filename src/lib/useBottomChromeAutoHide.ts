import { useCallback, useMemo, useRef } from "react";
import { Animated } from "react-native";

const TOP_RESET_THRESHOLD = 40;
const SCROLL_HIDE_THRESHOLD = 6;

/** Twitter-style bottom chrome: hide on scroll down, show on scroll up. */
export function useBottomChromeAutoHide(hiddenOffset: number) {
  const hideTranslateY = useRef(new Animated.Value(0)).current;
  const hideAnimRunning = useRef(false);
  const isHidden = useRef(false);

  const hideOpacity = useMemo(
    () =>
      hideTranslateY.interpolate({
        inputRange: [0, hiddenOffset],
        outputRange: [1, 0.72],
        extrapolate: "clamp",
      }),
    [hideTranslateY, hiddenOffset],
  );

  const animateTo = useCallback(
    (toValue: number) => {
      if (hideAnimRunning.current) {
        hideTranslateY.stopAnimation();
      }

      hideAnimRunning.current = true;
      Animated.spring(hideTranslateY, {
        toValue,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start(({ finished }) => {
        if (finished) {
          hideAnimRunning.current = false;
        }
      });
    },
    [hideTranslateY],
  );

  const resetVisibility = useCallback(() => {
    isHidden.current = false;
    if (hideAnimRunning.current) {
      hideTranslateY.stopAnimation();
    }
    hideAnimRunning.current = false;
    Animated.spring(hideTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
  }, [hideTranslateY]);

  const handleScroll = useCallback(
    (scrollDiff: number, scrollY: number) => {
      if (scrollY < TOP_RESET_THRESHOLD) {
        if (isHidden.current) {
          isHidden.current = false;
          animateTo(0);
        }
        return;
      }

      if (Math.abs(scrollDiff) < SCROLL_HIDE_THRESHOLD) {
        return;
      }

      const shouldHide = scrollDiff > 0;
      if (shouldHide === isHidden.current) {
        return;
      }

      isHidden.current = shouldHide;
      animateTo(shouldHide ? hiddenOffset : 0);
    },
    [animateTo, hiddenOffset],
  );

  const handleSnap = useCallback(() => {
    animateTo(isHidden.current ? hiddenOffset : 0);
  }, [animateTo, hiddenOffset]);

  return {
    handleScroll,
    handleSnap,
    hideOpacity,
    hideTranslateY,
    resetVisibility,
  };
}
