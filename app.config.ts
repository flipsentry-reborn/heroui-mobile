import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Expo app config with Mock / Live API switches.
 *
 * - EXPO_PUBLIC_USE_MOCK=true|false (default true)
 * - EXPO_PUBLIC_API_URL (default http://192.168.0.106:9000)
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const useMock =
    (process.env.EXPO_PUBLIC_USE_MOCK ?? "true").toLowerCase() !== "false";
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.106:9000";

  return {
    ...config,
    name: "heroui-mobile",
    slug: "heroui-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "heroui-native-app",
    userInterfaceStyle: "dark",
    backgroundColor: "#1F1F1F",
    ios: {
      supportsTablet: true,
      backgroundColor: "#1F1F1F",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#121212",
      },
      predictiveBackGestureEnabled: false,
      // @ts-expect-error Expo Android type lag — cleartext needed for LAN HTTP API
      usesCleartextTraffic: true,
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#121212",
        },
      ],
      "expo-status-bar",
      "expo-image",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      useMock,
      apiUrl,
    },
  };
};
