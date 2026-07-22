/**
 * Dev-friendly structured logs. Info/debug only in __DEV__; warn/error always.
 * Copy Metro console output when reporting reconnect/catch-up issues.
 */

type LogPayload = Record<string, unknown>;

function format(tag: string, message: string, payload?: LogPayload): unknown[] {
  if (payload == null) return [`[${tag}] ${message}`];
  return [`[${tag}] ${message}`, payload];
}

export const debugLog = {
  info(tag: string, message: string, payload?: LogPayload): void {
    if (!__DEV__) return;
    console.log(...format(tag, message, payload));
  },
  warn(tag: string, message: string, payload?: LogPayload): void {
    console.warn(...format(tag, message, payload));
  },
  error(tag: string, message: string, payload?: LogPayload): void {
    console.error(...format(tag, message, payload));
  },
};
