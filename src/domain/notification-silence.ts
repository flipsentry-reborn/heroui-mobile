import type { UserNotificationSettings } from "@/models/user";

export type NotificationPromptVariant =
  | "os_permission"
  | "push_disabled"
  | "quiet_active";

export function getDeviceTimeZoneId(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatHourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const date = new Date(2020, 0, 1, normalized, 0);

  try {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: undefined,
    });
  } catch {
    const period = normalized >= 12 ? "PM" : "AM";
    const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
    return `${hour12}:00 ${period}`;
  }
}

export function isWithinHourRange(
  startHour: number,
  endHour: number,
  hour: number,
): boolean {
  if (startHour === endHour) return false;
  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour;
  }
  return hour >= startHour || hour < endHour;
}

/** Local hour in the given IANA timezone (matches backend silence window checks). */
export function getHourInTimeZone(
  timeZoneId: string,
  now: Date = new Date(),
): number | null {
  if (!timeZoneId.trim()) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      hour: "numeric",
      hourCycle: "h23",
    }).formatToParts(now);
    const hourPart = parts.find((part) => part.type === "hour")?.value;
    const hour = Number.parseInt(hourPart ?? "", 10);
    return Number.isFinite(hour) ? hour : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors backend `NotificationSilenceHelper`:
 * scheduled silence only applies when timezone is set and current local hour
 * in that zone falls inside the window.
 */
export function getLocalSilenceStatus(
  settings: UserNotificationSettings | null,
  now: Date = new Date(),
): {
  isSilenced: boolean;
  reason: UserNotificationSettings["silenceReason"];
} {
  if (!settings) {
    return { isSilenced: false, reason: null };
  }

  if (!settings.pushNotificationsEnabled) {
    return { isSilenced: true, reason: "push_disabled" };
  }

  if (!settings.scheduledSilenceEnabled) {
    return { isSilenced: false, reason: null };
  }

  const timeZoneId = settings.scheduledSilenceTimeZoneId?.trim() ?? "";
  if (!timeZoneId) {
    return { isSilenced: false, reason: null };
  }

  const localHour = getHourInTimeZone(timeZoneId, now);
  if (localHour == null) {
    return { isSilenced: false, reason: null };
  }

  if (
    isWithinHourRange(
      settings.scheduledSilenceStartHour,
      settings.scheduledSilenceEndHour,
      localHour,
    )
  ) {
    return { isSilenced: true, reason: "scheduled" };
  }

  return { isSilenced: false, reason: null };
}

export function getSilenceStatusMessage(
  settings: UserNotificationSettings | null,
  now: Date = new Date(),
): string | null {
  const status = getLocalSilenceStatus(settings, now);
  if (!status.isSilenced) return null;

  if (status.reason === "push_disabled") {
    return "Push notifications are turned off";
  }

  if (status.reason === "scheduled") {
    return `Alerts paused until ${formatHourLabel(settings!.scheduledSilenceEndHour)}`;
  }

  return null;
}

export function getQuietHoursSubtitle(
  settings: UserNotificationSettings | null,
  now: Date = new Date(),
): string {
  if (!settings?.scheduledSilenceEnabled) {
    return "Pause alerts during set times";
  }

  const status = getLocalSilenceStatus(settings, now);
  if (status.reason === "scheduled") {
    return `Active now · until ${formatHourLabel(settings.scheduledSilenceEndHour)}`;
  }

  return `${formatHourLabel(settings.scheduledSilenceStartHour)} – ${formatHourLabel(settings.scheduledSilenceEndHour)}`;
}

export function hourToTimeOption(hour: number): { value: string; label: string } {
  const normalized = ((hour % 24) + 24) % 24;
  const value = `${String(normalized).padStart(2, "0")}:00:00`;
  return { value, label: formatHourLabel(normalized) };
}

export function parseHourFromTimeValue(value: string | undefined): number | null {
  if (value == null || value.length === 0) return null;
  const hour = Number.parseInt(value.split(":")[0] ?? "", 10);
  if (!Number.isFinite(hour)) return null;
  return ((hour % 24) + 24) % 24;
}

export function applySilenceDerivedFields(
  settings: UserNotificationSettings,
  now: Date = new Date(),
): UserNotificationSettings {
  const status = getLocalSilenceStatus(settings, now);
  return {
    ...settings,
    isCurrentlySilenced: status.isSilenced,
    silenceReason: status.reason,
  };
}
