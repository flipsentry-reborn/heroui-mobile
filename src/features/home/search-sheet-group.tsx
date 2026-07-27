import { Ionicons } from "@expo/vector-icons";
import type { JSX, ReactNode } from "react";
import { Pressable, View } from "react-native";
import {
  ListGroup,
  Separator,
  Typography,
  useThemeColor,
} from "heroui-native";

interface SearchSheetGroupProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Criteria-style section: optional label + ListGroup card. Reuse across New Search sheets. */
export function SearchSheetGroup({
  title,
  children,
  className,
}: SearchSheetGroupProps): JSX.Element {
  return (
    <View className={`mb-5 gap-2.5 ${title ? "mt-1" : "mt-5"} ${className ?? ""}`}>
      {title ? (
        <Typography type="body-xs" className="mx-5 text-muted">
          {title}
        </Typography>
      ) : null}
      <ListGroup className="mx-3">{children}</ListGroup>
    </View>
  );
}

interface SearchSheetRowProps {
  title: string;
  required?: boolean;
  /** Asterisk color — create search / filter use warning (yellow). */
  requiredTone?: "danger" | "warning";
  showSwap?: boolean;
  isLast: boolean;
  isDisabled?: boolean;
  /** Let the right slot take remaining row width (e.g. growing text inputs). */
  expandRight?: boolean;
  onPress?: () => void;
  right: ReactNode;
}

export function SearchSheetRow({
  title,
  required,
  requiredTone = "danger",
  showSwap,
  isLast,
  isDisabled,
  expandRight,
  onPress,
  right,
}: SearchSheetRowProps): JSX.Element {
  const [muted, danger, warning] = useThemeColor([
    "muted",
    "danger",
    "warning",
  ]);
  const requiredColor = requiredTone === "warning" ? warning : danger;
  const interactive = onPress != null && !isDisabled;

  const body = (
    <>
      <ListGroup.ItemContent className={expandRight ? "flex-none" : undefined}>
        <View className="flex-row items-center gap-1">
          <ListGroup.ItemTitle
            className={`text-[15px] font-normal ${
              isDisabled ? "text-muted" : "text-foreground"
            }`}
          >
            {title}
          </ListGroup.ItemTitle>
          {showSwap ? (
            <Ionicons
              name="swap-vertical"
              size={14}
              color={muted}
              style={isDisabled ? { opacity: 0.5 } : undefined}
            />
          ) : null}
          {required ? (
            <Typography
              type="body-sm"
              style={{ color: requiredColor, opacity: isDisabled ? 0.5 : 1 }}
            >
              *
            </Typography>
          ) : null}
        </View>
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix
        className={expandRight ? "min-w-0 flex-1 items-stretch" : undefined}
      >
        {right}
      </ListGroup.ItemSuffix>
    </>
  );

  return (
    <>
      {interactive ? (
        <Pressable onPress={onPress}>
          <ListGroup.Item disabled className="py-3.5">
            {body}
          </ListGroup.Item>
        </Pressable>
      ) : (
        <ListGroup.Item
          disabled
          className={`py-3.5 ${isDisabled ? "opacity-45" : ""}`}
        >
          {body}
        </ListGroup.Item>
      )}
      {!isLast ? <Separator className="mx-4 bg-muted/40" /> : null}
    </>
  );
}

interface SearchSheetValueProps {
  label: string;
  showChevron?: boolean;
  isDisabled?: boolean;
  emphasized?: boolean;
  /** Highlighted empty required value prompting a tap. */
  danger?: boolean;
  /** Prefer warning (yellow) for create-search / filter required empty state. */
  requiredEmpty?: boolean;
}

export function SearchSheetValue({
  label,
  showChevron = true,
  isDisabled,
  emphasized,
  danger,
  requiredEmpty,
}: SearchSheetValueProps): JSX.Element {
  const [muted, dangerColor, warningColor] = useThemeColor([
    "muted",
    "danger",
    "warning",
  ]);
  const highlight = requiredEmpty || danger;
  const highlightColor = requiredEmpty
    ? warningColor
    : danger
      ? dangerColor
      : muted;

  return (
    <View
      className={`shrink-0 flex-row items-center gap-1 ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <Typography
        type="body-sm"
        numberOfLines={1}
        className={`shrink-0 ${
          requiredEmpty
            ? "text-warning"
            : danger
              ? "text-danger"
              : emphasized
                ? "text-foreground"
                : "text-muted"
        }`}
      >
        {label}
      </Typography>
      {showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={highlight ? highlightColor : muted}
        />
      ) : null}
    </View>
  );
}
