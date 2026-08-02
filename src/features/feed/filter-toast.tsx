import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Toast, useToast } from "heroui-native";
import { withUniwind } from "uniwind";

const StyledIonicons = withUniwind(Ionicons);

type ToastApi = ReturnType<typeof useToast>["toast"];
type IoniconName = ComponentProps<typeof Ionicons>["name"];
type ToastVariant = "default" | "accent" | "success" | "warning" | "danger";

/** Mirrors HeroUI `ToastComponentProps` (not re-exported from the package root). */
type ToastRenderProps = {
  id: string;
  index: number;
  total: SharedValue<number>;
  heights: SharedValue<Record<string, number>>;
  maxVisibleToasts?: number;
  show: ToastApi["show"];
  hide: ToastApi["hide"];
};

export type FilterToastKind =
  | "enabled"
  | "disabled"
  | "notificationsOn"
  | "notificationsOff"
  | "error";

type FilterToastCopy = {
  label: string;
  variant: ToastVariant;
  icon: IoniconName;
  iconClassName: string;
};

function filterToastCopy(kind: FilterToastKind, errorLabel?: string): FilterToastCopy {
  switch (kind) {
    case "enabled":
      return {
        label: "Filter enabled",
        variant: "success",
        icon: "play-outline",
        iconClassName: "text-success",
      };
    case "disabled":
      return {
        label: "Filter disabled",
        variant: "warning",
        icon: "pause-outline",
        iconClassName: "text-warning",
      };
    case "notificationsOn":
      return {
        label: "Notifications enabled",
        variant: "success",
        icon: "notifications-outline",
        iconClassName: "text-success",
      };
    case "notificationsOff":
      return {
        label: "Notifications disabled",
        variant: "warning",
        icon: "notifications-off-outline",
        iconClassName: "text-warning",
      };
    case "error":
      return {
        label: errorLabel?.trim() || "Could not update filter",
        variant: "danger",
        icon: "alert-circle",
        iconClassName: "text-danger",
      };
  }
}

function FilterInfoToast({
  hide,
  kind,
  title,
  errorLabel,
  ...toastProps
}: ToastRenderProps & {
  kind: FilterToastKind;
  title?: string;
  errorLabel?: string;
}): JSX.Element {
  const copy = filterToastCopy(kind, errorLabel);

  return (
    <Toast
      variant={copy.variant}
      placement="top"
      hide={hide}
      className="rounded-2xl px-3.5 py-3"
      {...toastProps}
    >
      <View className="w-full flex-row items-center gap-2.5">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-default">
          <StyledIonicons name={copy.icon} size={16} className={copy.iconClassName} />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Toast.Title className="text-sm font-medium leading-5">{copy.label}</Toast.Title>
          {title != null && title.length > 0 ? (
            <Toast.Description className="text-xs leading-4" numberOfLines={1}>
              {title}
            </Toast.Description>
          ) : null}
        </View>
      </View>
    </Toast>
  );
}

/** HeroUI toast for filter enable/select/notification feedback. */
export function showFilterToast(
  toast: ToastApi,
  options: {
    kind: FilterToastKind;
    title?: string;
    errorLabel?: string;
    duration?: number;
  }
): string {
  return toast.show({
    duration: options.duration ?? (options.kind === "error" ? 2500 : 2200),
    component: (props) => (
      <FilterInfoToast
        {...props}
        kind={options.kind}
        title={options.title}
        errorLabel={options.errorLabel}
      />
    ),
  });
}
