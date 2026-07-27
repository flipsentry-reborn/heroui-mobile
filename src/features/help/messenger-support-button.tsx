import { Ionicons } from "@expo/vector-icons";
import type { JSX } from "react";
import { Linking } from "react-native";
import { Button } from "heroui-native";

/** Facebook brand blue — fixed in light and dark. */
export const FACEBOOK_BLUE = "#1877F2";
export const SUPPORT_MESSENGER_URL = "https://m.me/flipsentry";

interface MessengerSupportButtonProps {
  label?: string;
}

/** Full-width Messenger CTA with Facebook blue (theme-independent). */
export function MessengerSupportButton({
  label = "Message support",
}: MessengerSupportButtonProps): JSX.Element {
  return (
    <Button
      variant="primary"
      className="min-h-11 w-full rounded-2xl !bg-[#1877F2]"
      onPress={() => void Linking.openURL(SUPPORT_MESSENGER_URL)}
    >
      <Ionicons name="logo-facebook" size={16} color="#FFFFFF" />
      <Button.Label className="text-sm !text-white">{label}</Button.Label>
    </Button>
  );
}
