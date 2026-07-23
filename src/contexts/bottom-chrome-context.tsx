import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type JSX,
  type ReactNode,
} from "react";

type TabBarScrollHandler = (scrollDiff: number, scrollY: number) => void;
type TabBarSnapHandler = () => void;
type UnregisterHandler = () => void;

interface BottomChromeContextValue {
  onFeedScroll: (scrollDiff: number, scrollY: number) => void;
  onFeedScrollEnd: () => void;
  registerTabBarHandlers: (
    onScroll: TabBarScrollHandler,
    onSnap: TabBarSnapHandler,
  ) => UnregisterHandler;
  resetTabBar: () => void;
  registerTabBarReset: (callback: () => void) => UnregisterHandler;
}

const BottomChromeContext = createContext<BottomChromeContextValue | null>(
  null,
);

export function BottomChromeProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const tabBarScrollRefs = useRef(new Set<TabBarScrollHandler>());
  const tabBarSnapRefs = useRef(new Set<TabBarSnapHandler>());
  const tabBarResetRefs = useRef(new Set<() => void>());

  const onFeedScroll = useCallback((scrollDiff: number, scrollY: number) => {
    tabBarScrollRefs.current.forEach((handler) => handler(scrollDiff, scrollY));
  }, []);

  const onFeedScrollEnd = useCallback(() => {
    tabBarSnapRefs.current.forEach((handler) => handler());
  }, []);

  const registerTabBarHandlers = useCallback(
    (onScroll: TabBarScrollHandler, onSnap: TabBarSnapHandler) => {
      tabBarScrollRefs.current.add(onScroll);
      tabBarSnapRefs.current.add(onSnap);

      return () => {
        tabBarScrollRefs.current.delete(onScroll);
        tabBarSnapRefs.current.delete(onSnap);
      };
    },
    [],
  );

  const resetTabBar = useCallback(() => {
    tabBarResetRefs.current.forEach((handler) => handler());
  }, []);

  const registerTabBarReset = useCallback((callback: () => void) => {
    tabBarResetRefs.current.add(callback);

    return () => {
      tabBarResetRefs.current.delete(callback);
    };
  }, []);

  return (
    <BottomChromeContext.Provider
      value={{
        onFeedScroll,
        onFeedScrollEnd,
        registerTabBarHandlers,
        resetTabBar,
        registerTabBarReset,
      }}
    >
      {children}
    </BottomChromeContext.Provider>
  );
}

export function useBottomChrome(): BottomChromeContextValue {
  const context = useContext(BottomChromeContext);
  if (context == null) {
    throw new Error("useBottomChrome must be used within a BottomChromeProvider");
  }
  return context;
}
