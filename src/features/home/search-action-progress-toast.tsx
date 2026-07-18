import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Toast, Typography, useToast } from "heroui-native";
import { ProgressBar } from "heroui-native-pro";

export type SearchActionKind = "delete" | "pause" | "start";

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

const ACTION_COPY: Record<
  SearchActionKind,
  {
    running: string;
    done: string;
    failed: string;
    color: ProgressColor;
    toastVariant: "danger" | "warning" | "success";
  }
> = {
  delete: {
    running: "Deleting search…",
    done: "Search deleted",
    failed: "Delete failed",
    color: "danger",
    toastVariant: "danger",
  },
  pause: {
    running: "Pausing search…",
    done: "Search paused",
    failed: "Pause failed",
    color: "warning",
    toastVariant: "warning",
  },
  start: {
    running: "Starting search…",
    done: "Search started",
    failed: "Start failed",
    color: "success",
    toastVariant: "success",
  },
};

/** ~1 in 4 delete runs fail so the failed ProgressBar state is easy to try. */
function shouldFakeFail(kind: SearchActionKind): boolean {
  if (kind !== "delete") return false;
  return Math.random() < 0.25;
}

function SearchActionProgressToast({
  hide,
  kind,
  title,
  onCommit,
  ...toastProps
}: ToastRenderProps & {
  kind: SearchActionKind;
  title: string;
  onCommit: () => Promise<boolean>;
}): JSX.Element {
  const copy = ACTION_COPY[kind];
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
    phase === "failed" ? "danger" : phase === "done" ? "success" : copy.toastVariant;
  const label =
    phase === "failed"
      ? copy.failed
      : phase === "done"
        ? copy.done
        : copy.running;

  return (
    <Toast
      variant={toastVariant}
      placement="top"
      hide={hide}
      {...toastProps}
    >
      <View className="w-full gap-2 pr-6">
        <Toast.Title>{label}</Toast.Title>
        <Typography type="body-xs" className="text-muted" numberOfLines={1}>
          {title}
        </Typography>
        <ProgressBar
          value={progress}
          color={color}
          size="sm"
          accessibilityLabel={label}
        >
          <View className="mb-1 flex-row items-center justify-between">
            <ProgressBar.Label className="text-xs">
              {phase === "failed"
                ? "Failed"
                : phase === "done"
                  ? "Done"
                  : "Progress"}
            </ProgressBar.Label>
            <ProgressBar.ValueLabel className="text-xs" />
          </View>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        {phase === "failed" ? (
          <Toast.Action
            onPress={() => {
              settled.current = false;
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </Toast.Action>
        ) : null}
      </View>
      <Toast.Close className="absolute top-0 right-0" />
    </Toast>
  );
}

export function showSearchActionProgress(
  toast: ToastApi,
  options: {
    kind: SearchActionKind;
    title: string;
    onCommit: () => Promise<boolean>;
  },
): string {
  return toast.show({
    duration: "persistent",
    component: (props) => (
      <SearchActionProgressToast
        {...props}
        kind={options.kind}
        title={options.title}
        onCommit={options.onCommit}
      />
    ),
  });
}
