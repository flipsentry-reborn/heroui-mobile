import { readJson, removeKey, writeJson } from "@/lib/storage";

export const ONBOARDING_STORAGE_KEY = "@flipsentry/onboarding-v1";

export type OnboardingStorageStatus = "done" | "skipped";

export async function getOnboardingStatus(): Promise<OnboardingStorageStatus | null> {
  const value = await readJson<OnboardingStorageStatus>(ONBOARDING_STORAGE_KEY);
  if (value === "done" || value === "skipped") return value;
  return null;
}

export async function setOnboardingStatus(
  status: OnboardingStorageStatus,
): Promise<void> {
  await writeJson(ONBOARDING_STORAGE_KEY, status);
}

/** Clear local onboarding flag so the wizard can run again. */
export async function clearOnboardingStatus(): Promise<void> {
  await removeKey(ONBOARDING_STORAGE_KEY);
}

/** True when wizard should run (not finished locally and user has no searches). */
export async function needsOnboarding(searchGroupCount: number): Promise<boolean> {
  if (searchGroupCount > 0) return false;
  const status = await getOnboardingStatus();
  return status == null;
}
