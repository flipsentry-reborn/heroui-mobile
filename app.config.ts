import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Expo app config with Mock / Live API switches.
 *
 * - EXPO_PUBLIC_USE_MOCK=true|false (default true)
 * - EXPO_PUBLIC_API_URL (default http://192.168.0.106:9000)
 * - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (Places / Geocoding / Maps SDK)
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const useMock =
    (process.env.EXPO_PUBLIC_USE_MOCK ?? "true").toLowerCase() !== "false";
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.0.106:9000";
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

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
      package: "com.flipsentry.mobile",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#121212",
      },
      predictiveBackGestureEnabled: false,
      // @ts-expect-error Expo Android type lag — cleartext needed for LAN HTTP API
      usesCleartextTraffic: true,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      "expo-router",
      "expo-dev-client",
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
      googleMapsApiKey,
    },
  };
};
