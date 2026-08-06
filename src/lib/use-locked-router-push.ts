import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * Guards against double-tap stacking the same push while a transition runs.
 * Lock clears when the source screen regains focus (user came back).
 */
export function useLockedRouterPush(): (href: Href) => void {
  const router = useRouter();
  const lockedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      lockedRef.current = false;
    }, []),
  );

  return useCallback(
    (href: Href) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      router.push(href);
    },
    [router],
  );
}
