import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Toast, useToast } from "heroui-native";
import { ProgressBar } from "heroui-native-pro";
import { withUniwind } from "uniwind";

export type SearchActionKind =
  | "delete"
  | "pause"
  | "start"
  | "create"
  | "update";

export type ActionSubject = "search" | "filter";

type ActionPhase = "running" | "failed" | "done";

type ToastApi = ReturnType<typeof useToast>["toast"];

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

type ProgressColor = "accent" | "success" | "warning" | "danger";
type IoniconName = ComponentProps<typeof Ionicons>["name"];

const StyledIonicons = withUniwind(Ionicons);

type ActionCopy = {
  running: string;
  done: string;
  failed: string;
  color: ProgressColor;
  toastVariant: "danger" | "warning" | "success";
  icon: IoniconName;
};

function capitalize(value: string): string {
  if (value.length === 0) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function actionCopy(kind: SearchActionKind, subject: ActionSubject): ActionCopy {
  const noun = subject;
  const Noun = capitalize(noun);

  switch (kind) {
    case "delete":
      return {
        running: `Deleting ${noun}…`,
        done: `${Noun} deleted`,
        failed: "Delete failed",
        color: "danger",
        toastVariant: "danger",
        icon: "trash-outline",
      };
    case "pause":
      return {
        running: `Pausing ${noun}…`,
        done: `${Noun} paused`,
        failed: "Pause failed",
        color: "warning",
        toastVariant: "warning",
        icon: "pause-outline",
      };
    case "start":
      return {
        running: `Starting ${noun}…`,
        done: `${Noun} started`,
        failed: "Start failed",
        color: "success",
        toastVariant: "success",
        icon: "play-outline",
      };
    case "create":
      return {
        running: `Creating ${noun}…`,
        done: `${Noun} created`,
        failed: "Create failed",
        color: "success",
        toastVariant: "success",
        icon: "add-outline",
      };
    case "update":
      return {
        running: `Updating ${noun}…`,
        done: `${Noun} updated`,
        failed: "Update failed",
        color: "accent",
        toastVariant: "success",
        icon: "create-outline",
      };
  }
}

/** ~1 in 4 delete runs fail so the failed ProgressBar state is easy to try. */
function shouldFakeFail(kind: SearchActionKind): boolean {
  if (kind !== "delete") return false;
  return Math.random() < 0.25;
}

function phaseIcon(kind: SearchActionKind, phase: ActionPhase, subject: ActionSubject): IoniconName {
  if (phase === "done") return "checkmark-circle";
  if (phase === "failed") return "alert-circle";
  return actionCopy(kind, subject).icon;
}

function SearchActionProgressToast({
  hide,
  kind,
  subject,
  title,
  onCommit,
  ...toastProps
}: ToastRenderProps & {
  kind: SearchActionKind;
  subject: ActionSubject;
  title: string;
  onCommit: () => Promise<boolean>;
}): JSX.Element {
  const copy = actionCopy(kind, subject);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<ActionPhase>("running");
  const [attempt, setAttempt] = useState(0);
  const settled = useRef(false);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    settled.current = false;
    setProgress(0);
    setPhase("running");

    let value = 0;
    const failAt: number | null = shouldFakeFail(kind)
      ? 55 + Math.floor(Math.random() * 25)
      : null;

    const tick = setInterval(() => {
      if (settled.current) return;

      value = Math.min(100, value + 8 + Math.floor(Math.random() * 10));
      setProgress(value);

      if (failAt != null && value >= failAt) {
        settled.current = true;
        clearInterval(tick);
        setProgress(failAt);
        setPhase("failed");
        return;
      }

      if (value >= 100) {
        settled.current = true;
        clearInterval(tick);
        void onCommitRef
          .current()
          .then((ok) => {
            if (!ok) {
              setPhase("failed");
              return;
            }
            setPhase("done");
            setTimeout(() => hide(), 700);
          })
          .catch(() => {
            setPhase("failed");
          });
      }
    }, 120);

    return () => {
      settled.current = true;
      clearInterval(tick);
    };
  }, [attempt, hide, kind]);

  const color: ProgressColor =
    phase === "failed" ? "danger" : phase === "done" ? "success" : copy.color;
  const toastVariant =
    phase === "failed"
      ? "danger"
      : phase === "done"
        ? "success"
        : copy.toastVariant;
  const label =
    phase === "failed"
      ? copy.failed
      : phase === "done"
        ? copy.done
        : copy.running;

  const iconClassName =
    phase === "failed"
      ? "text-danger"
      : phase === "done"
        ? "text-success"
        : color === "warning"
          ? "text-warning"
          : color === "danger"
            ? "text-danger"
            : color === "accent"
              ? "text-accent"
              : "text-success";

  return (
    <Toast
      variant={toastVariant}
      placement="top"
      hide={hide}
      className="rounded-2xl px-3.5 py-3"
      {...toastProps}
    >
      <View className="w-full gap-2.5 pr-6">
        <View className="flex-row items-center gap-2.5">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-default">
            <StyledIonicons
              name={phaseIcon(kind, phase, subject)}
              size={16}
              className={iconClassName}
            />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Toast.Title className="text-sm leading-5 font-medium">
              {label}
            </Toast.Title>
            <Toast.Description className="text-xs leading-4" numberOfLines={1}>
              {title}
            </Toast.Description>
          </View>
        </View>

        <ProgressBar
          value={progress}
          color={color}
          size="sm"
          className="gap-0"
          accessibilityLabel={label}
        >
          <ProgressBar.Track className="h-1 rounded-full">
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        {phase === "failed" ? (
          <Toast.Action
            size="sm"
            className="self-start"
            onPress={() => {
              settled.current = false;
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </Toast.Action>
        ) : null}
      </View>
      <Toast.Close className="absolute top-2 right-2" iconProps={{ size: 14 }} />
    </Toast>
  );
}

export function showSearchActionProgress(
  toast: ToastApi,
  options: {
    kind: SearchActionKind;
    title: string;
    /** Defaults to search; pass `filter` for filter create/update/delete/pause. */
    subject?: ActionSubject;
    onCommit: () => Promise<boolean>;
  },
): string {
  const subject = options.subject ?? "search";
  return toast.show({
    duration: "persistent",
    component: (props) => (
      <SearchActionProgressToast
        {...props}
        kind={options.kind}
        subject={subject}
        title={options.title}
        onCommit={options.onCommit}
      />
    ),
  });
}
