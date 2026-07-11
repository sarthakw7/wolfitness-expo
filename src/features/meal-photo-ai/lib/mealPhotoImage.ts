import * as ImagePicker from "expo-image-picker";

import {
  MEAL_PHOTO_ACCEPTED_IMAGE_TYPES,
  MEAL_PHOTO_AI_ERROR_MESSAGES,
  MEAL_PHOTO_AI_MAX_UPLOAD_BYTES,
  MEAL_PHOTO_AI_PICKER_OPTIONS,
} from "../constants";
import { MealPhotoAIError, type MealPhotoUploadImage } from "../types";

function logPickerEvent(event: string, details?: Record<string, unknown>) {
  if (!__DEV__) return;
  console.info("[Meal Photo AI]", event, details ?? {});
}

function logPickerFailure(event: string, error: unknown, details?: Record<string, unknown>) {
  if (!__DEV__) return;

  const safeError =
    error instanceof Error
      ? {
          code: typeof (error as { code?: unknown }).code === "string" ? (error as { code?: string }).code : null,
          message: error.message,
          name: error.name,
        }
      : {
          message: typeof error === "string" ? error : "Unknown error",
          name: typeof error,
        };

  console.error("[Meal Photo AI]", event, {
    ...details,
    error: safeError,
  });
}

function inferMimeType(fileName: string | null | undefined, uri: string) {
  const lowerName = fileName?.trim().toLowerCase() ?? "";
  const lowerUri = uri.trim().toLowerCase();

  if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || lowerUri.endsWith(".heic") || lowerUri.endsWith(".heif")) {
    return null;
  }

  if (lowerName.endsWith(".png") || lowerUri.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp") || lowerUri.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function normalizeUploadImage(asset: ImagePicker.ImagePickerAsset): MealPhotoUploadImage {
  if (!asset.uri) {
    logPickerFailure("Picker normalization failed", new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.invalidImage, "INVALID_IMAGE"), {
      reason: "missing-uri",
    });
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.invalidImage, "INVALID_IMAGE");
  }

  const explicitMimeType = typeof asset.mimeType === "string" ? asset.mimeType.trim().toLowerCase() : null;
  if (explicitMimeType && explicitMimeType.startsWith("image/") && !MEAL_PHOTO_ACCEPTED_IMAGE_TYPES.includes(explicitMimeType as (typeof MEAL_PHOTO_ACCEPTED_IMAGE_TYPES)[number])) {
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.invalidImage, "INVALID_IMAGE");
  }

  const mimeType = explicitMimeType ?? inferMimeType(asset.fileName, asset.uri);

  if (!mimeType || !MEAL_PHOTO_ACCEPTED_IMAGE_TYPES.includes(mimeType as (typeof MEAL_PHOTO_ACCEPTED_IMAGE_TYPES)[number])) {
    logPickerFailure("Picker normalization failed", new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.invalidImage, "INVALID_IMAGE"), {
      fileName: asset.fileName ?? null,
      mimeType: explicitMimeType ?? null,
      reason: "unsupported-mime",
      uri: asset.uri,
    });
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.invalidImage, "INVALID_IMAGE");
  }

  logPickerEvent("Picker normalization succeeded", {
    fileName: asset.fileName ?? null,
    fileSize: typeof asset.fileSize === "number" ? asset.fileSize : null,
    height: typeof asset.height === "number" ? asset.height : null,
    mimeType,
    width: typeof asset.width === "number" ? asset.width : null,
  });

  return {
    height: typeof asset.height === "number" ? asset.height : null,
    mimeType,
    name: asset.fileName?.trim() || `meal-photo-${Date.now()}.${mimeType.split("/")[1] ?? "jpg"}`,
    size: typeof asset.fileSize === "number" ? asset.fileSize : null,
    uri: asset.uri,
    width: typeof asset.width === "number" ? asset.width : null,
  };
}

async function resolvePickerPermission(source: "camera" | "library") {
  logPickerEvent("Picker permission requested", { source });
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  logPickerEvent("Picker permission resolved", {
    granted: permission.granted,
    source,
  });

  if (!permission.granted) {
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.permissionDenied, "PERMISSION_DENIED");
  }
}

async function launchMealPhotoPicker(source: "camera" | "library") {
  logPickerEvent("Picker launch started", { source });

  try {
    await resolvePickerPermission(source);
  } catch (error) {
    logPickerFailure("Picker permission failed", error, { source });
    throw error;
  }

  let result: ImagePicker.ImagePickerResult;
  try {
    result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(MEAL_PHOTO_AI_PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(MEAL_PHOTO_AI_PICKER_OPTIONS);
  } catch (error) {
    logPickerFailure("Picker launch failed", error, { source });
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.pickerUnavailable, "PICKER_UNAVAILABLE");
  }

  if (result.canceled || !result.assets?.length) {
    logPickerEvent("Picker cancelled", { source });
    return null;
  }

  const asset = result.assets[0] as ImagePicker.ImagePickerAsset;
  logPickerEvent("Picker asset selected", {
    fileName: asset.fileName ?? null,
    fileSize: typeof asset.fileSize === "number" ? asset.fileSize : null,
    height: typeof asset.height === "number" ? asset.height : null,
    mimeType: asset.mimeType ?? null,
    source,
    width: typeof asset.width === "number" ? asset.width : null,
  });

  try {
    return normalizeUploadImage(asset);
  } catch (error) {
    logPickerFailure("Picker normalization threw", error, { source });
    if (error instanceof MealPhotoAIError) {
      throw error;
    }
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.pickerUnavailable, "PICKER_UNAVAILABLE");
  }
}

export async function pickMealPhotoFromCamera() {
  return launchMealPhotoPicker("camera");
}

export async function pickMealPhotoFromLibrary() {
  return launchMealPhotoPicker("library");
}

export function isMealPhotoUploadTooLarge(image: MealPhotoUploadImage) {
  return typeof image.size === "number" ? image.size > MEAL_PHOTO_AI_MAX_UPLOAD_BYTES : false;
}

export function shouldBlockMealPhotoAnalysis(image: MealPhotoUploadImage) {
  return isMealPhotoUploadTooLarge(image);
}
