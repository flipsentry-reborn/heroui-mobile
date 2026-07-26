import { readJson, writeJson } from "@/lib/storage";

const DEVICE_ID_KEY = "@flipsentry/device-id";

function createId(): string {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable device id for start-trial / analytics. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await readJson<string>(DEVICE_ID_KEY);
  if (typeof existing === "string" && existing.length > 0) return existing;
  const id = createId();
  await writeJson(DEVICE_ID_KEY, id);
  return id;
}
