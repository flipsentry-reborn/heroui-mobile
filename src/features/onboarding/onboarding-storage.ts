import { readJson, removeKey, writeJson } from "@/lib/storage";
import type { SearchType } from "@/mocks/data/home";

export const ONBOARDING_STORAGE_KEY = "@flipsentry/onboarding-v1";
export const ONBOARDING_ANSWERS_KEY = "@flipsentry/onboarding-answers-v1";

export type OnboardingStorageStatus = "done" | "skipped";

/** Collected wizard answers (local JSON + optional API payload). */
export type OnboardingAnswersJson = {
  category: SearchType;
  customQuery: string | null;
  monthlyVolume: string;
  averageMargin: string;
  triedOtherApps: boolean;
  completedAt: string;
};

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

export async function saveOnboardingAnswers(
  answers: OnboardingAnswersJson,
): Promise<void> {
  await writeJson(ONBOARDING_ANSWERS_KEY, answers);
}

export async function getOnboardingAnswers(): Promise<OnboardingAnswersJson | null> {
  return readJson<OnboardingAnswersJson>(ONBOARDING_ANSWERS_KEY);
}

export async function clearOnboardingAnswers(): Promise<void> {
  await removeKey(ONBOARDING_ANSWERS_KEY);
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
