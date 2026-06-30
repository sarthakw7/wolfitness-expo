import AsyncStorage from "@react-native-async-storage/async-storage";

export type OnboardingDraft = {
  dateOfBirth?: string; // YYYY-MM-DD
  equipmentAccess?: string;
  experienceLevel?: string;
  gender?: string;
  heightCm?: number;
  injuries?: string[];
  primaryGoal?: string;
  trainingAvailability?: string[];
  weightKg?: number;
  vibeType?: string;
  vibeMetrics?: {
    power: number;
    endurance: number;
    mobility: number;
  };
};

const DRAFT_KEY = "wolfitness:onboarding-draft";

export async function readOnboardingDraft(): Promise<OnboardingDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export async function writeOnboardingDraft(next: OnboardingDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}

export async function mergeOnboardingDraft(patch: Partial<OnboardingDraft>): Promise<OnboardingDraft> {
  const current = (await readOnboardingDraft()) ?? {};
  const merged = { ...current, ...patch };
  await writeOnboardingDraft(merged);
  return merged;
}

export async function clearOnboardingDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}
