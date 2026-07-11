export const MEAL_PHOTO_AI_FEATURE = "meal_analysis" as const;

export const MEAL_PHOTO_AI_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const MEAL_PHOTO_ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MEAL_CATEGORY_OPTIONS = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
  { label: "Pre-workout", value: "pre_workout" },
  { label: "Post-workout", value: "post_workout" },
  { label: "Other", value: "other" },
] as const;

export const MEAL_CATEGORY_PLACEHOLDER = "Choose meal category";

export const MEAL_PHOTO_AI_PICKER_OPTIONS = {
  aspect: [4, 3] as [number, number],
  allowsEditing: true,
  quality: 0.75,
};

export const MEAL_PHOTO_AI_ERROR_MESSAGES = {
  analysisFailed: "Meal analysis couldn’t complete right now. Try again with a clearer photo.",
  invalidImage: "Please choose a JPG, PNG, or WebP image.",
  limitReached: "You’ve used today’s Wolf AI actions. Your limit resets tomorrow.",
  network: "Meal photo analysis couldn’t refresh right now. Your latest result is still available.",
  noSelection: "Choose a meal photo before analyzing.",
  permissionDenied: "Photo access is required to scan meals.",
  pickerUnavailable: "Photo picker is temporarily unavailable. Restart the app and try again.",
  unauthorized: "Meal Photo AI needs you to sign in again.",
  unsupportedImage: "That image can’t be analyzed. Please choose a clearer meal photo.",
} as const;

export const MEAL_PHOTO_AI_INFO_TEXT = "AI estimate — review before saving.";

export const MEAL_PHOTO_AI_TITLE = "Scan Meal";
