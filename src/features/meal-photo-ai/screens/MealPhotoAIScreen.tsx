import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenScaffold } from "@/src/components/layout";
import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import { useAddMealLog } from "@/src/hooks/mutations";
import { colors } from "@/src/theme";

import {
  MEAL_PHOTO_AI_ERROR_MESSAGES,
  MEAL_PHOTO_AI_INFO_TEXT,
  MEAL_PHOTO_AI_TITLE,
} from "../constants";
import { MealAnalysisSummary } from "../components/MealAnalysisSummary";
import { MealDraftEditor } from "../components/MealDraftEditor";
import { MealPhotoPicker } from "../components/MealPhotoPicker";
import { MealPhotoPreview } from "../components/MealPhotoPreview";
import { useMealPhotoAnalysis } from "../hooks/useMealPhotoAnalysis";
import { useMealPhotoDraft } from "../hooks/useMealPhotoDraft";
import { pickMealPhotoFromCamera, pickMealPhotoFromLibrary, shouldBlockMealPhotoAnalysis } from "../lib/mealPhotoImage";
import { MealPhotoAIError } from "../types";
import type { MealPhotoCategoryValue, MealPhotoDraftItem, MealPhotoUploadImage } from "../types";

function toIsoDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function MealPhotoAIScreenComponent() {
  const { width } = useWindowDimensions();
  const mealPhotoAnalysis = useMealPhotoAnalysis();
  const addMealLogMutation = useAddMealLog();
  const [selectedImage, setSelectedImage] = useState<MealPhotoUploadImage | null>(null);
  const [mealCategory, setMealCategory] = useState<MealPhotoCategoryValue | "">("");
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [seedMealCategory, setSeedMealCategory] = useState("");
  const [allowDiscardNavigation, setAllowDiscardNavigation] = useState(false);
  const navigation = useNavigation();
  const pagePaddingHorizontal = width < 360 ? 20 : 24;
  const hasSelectedImage = Boolean(selectedImage);
  const selectedImageIsTooLarge = Boolean(selectedImage && shouldBlockMealPhotoAnalysis(selectedImage));
  const canAnalyze = hasSelectedImage && !mealPhotoAnalysis.isAnalyzing && !selectedImageIsTooLarge;

  const result = mealPhotoAnalysis.data;
  const analysisError = mealPhotoAnalysis.error;
  const {
    addItem,
    draft: mealDraft,
    hasUnsavedChanges,
    isValid,
    removeItem,
    resetToAiEstimate,
    totals,
    updateItem,
    updateMealCategory,
    updateMealName,
    validationErrors,
  } = useMealPhotoDraft(result);

  const clearAnalysisState = useCallback(() => {
    mealPhotoAnalysis.reset();
    setPickerError(null);
    setIsReviewing(false);
    setSaveError(null);
    setSaveSucceeded(false);
    setSubmitAttempted(false);
  }, [mealPhotoAnalysis]);

  useEffect(() => {
    if (!result) {
      setIsReviewing(false);
      setSaveSucceeded(false);
      setSaveError(null);
      setSubmitAttempted(false);
      setAllowDiscardNavigation(false);
      return;
    }

    setIsReviewing(false);
    setSaveSucceeded(false);
    setSaveError(null);
    setSubmitAttempted(false);
    setAllowDiscardNavigation(false);

    const trimmedCategory = seedMealCategory.trim();
    if (trimmedCategory) {
      updateMealCategory(trimmedCategory);
    }
  }, [result, seedMealCategory, updateMealCategory]);

  useEffect(() => {
    if (!__DEV__) return;

    console.info("[Meal Photo AI]", "Selected image state", {
      hasSelectedImage,
      hasSelectedImageTooLarge: selectedImageIsTooLarge,
      isAnalyzeEnabled: canAnalyze,
      isAnalyzing: mealPhotoAnalysis.isAnalyzing,
    });
  }, [canAnalyze, hasSelectedImage, mealPhotoAnalysis.isAnalyzing, selectedImageIsTooLarge]);

  const handleSelectImage = useCallback(
    async (source: "camera" | "library") => {
      try {
        setPickerError(null);
        const nextImage = source === "camera" ? await pickMealPhotoFromCamera() : await pickMealPhotoFromLibrary();

        if (!nextImage) {
          return;
        }

        setSelectedImage(nextImage);
        clearAnalysisState();

        if (shouldBlockMealPhotoAnalysis(nextImage)) {
          setPickerError("That image is still larger than the backend limit. Try a tighter crop or a smaller photo.");
        }
      } catch (error) {
        const message =
          error instanceof MealPhotoAIError
            ? error.message
            : MEAL_PHOTO_AI_ERROR_MESSAGES.pickerUnavailable;
        setPickerError(message);
      }
    },
    [clearAnalysisState],
  );

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) {
      setPickerError(MEAL_PHOTO_AI_ERROR_MESSAGES.noSelection);
      return;
    }

    if (__DEV__) {
      console.info("[Meal Photo AI]", "Analyze pressed", {
        hasSelectedImage: Boolean(selectedImage),
        mealCategory: mealCategory || null,
        canAnalyze,
      });
    }

    setPickerError(null);
    setSaveError(null);
    setIsReviewing(false);
    setSaveSucceeded(false);
    setSubmitAttempted(false);
    setSeedMealCategory(mealCategory.trim());
    await mealPhotoAnalysis.analyze(selectedImage, mealCategory || null);
  }, [canAnalyze, mealCategory, mealPhotoAnalysis, selectedImage]);

  const handleChangePhoto = useCallback(() => {
    setSelectedImage(null);
    setMealCategory("");
    setSeedMealCategory("");
    clearAnalysisState();
  }, [clearAnalysisState]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (allowDiscardNavigation || (!hasUnsavedChanges && !addMealLogMutation.isPending)) {
        return;
      }

      event.preventDefault();

      if (!hasUnsavedChanges) {
        return;
      }

      Alert.alert(
        "Discard meal edits?",
        "You have unsaved changes to this meal draft. Leaving will discard them.",
        [
          { style: "cancel", text: "Keep Editing" },
          {
            style: "destructive",
            text: "Discard",
            onPress: () => {
              setAllowDiscardNavigation(true);
              router.back();
            },
          },
        ],
      );
    });

    return unsubscribe;
  }, [addMealLogMutation.isPending, allowDiscardNavigation, hasUnsavedChanges, navigation]);

  const handleEnterReview = useCallback(() => {
    setSaveError(null);
    setSubmitAttempted(false);
    setIsReviewing(true);
  }, []);

  const handleUpdateMealName = useCallback(
    (value: string) => {
      setSaveError(null);
      updateMealName(value);
    },
    [updateMealName],
  );

  const handleUpdateMealCategory = useCallback(
    (value: string) => {
      setSaveError(null);
      updateMealCategory(value);
    },
    [updateMealCategory],
  );

  const handleUpdateItem = useCallback(
    (itemId: string, field: keyof MealPhotoDraftItem, value: string) => {
      setSaveError(null);
      updateItem(itemId, { [field]: value } as Partial<MealPhotoDraftItem>);
    },
    [updateItem],
  );

  const handleAddItem = useCallback(() => {
    setSaveError(null);
    addItem();
  }, [addItem]);

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      setSaveError(null);
      removeItem(itemId);
    },
    [removeItem],
  );

  const handleResetToAiEstimate = useCallback(() => {
    resetToAiEstimate();
    setSaveError(null);
    setSubmitAttempted(false);
  }, [resetToAiEstimate]);

  const handleSaveMeal = useCallback(async () => {
    if (!mealDraft || addMealLogMutation.isPending || mealPhotoAnalysis.isAnalyzing) {
      return;
    }

    setSubmitAttempted(true);
    setSaveError(null);

    if (!isValid) {
      return;
    }

    try {
      await addMealLogMutation.mutateAsync({
        calories: totals.calories,
        carbs: totals.carbs,
        fat: totals.fat,
        foodName: mealDraft.mealName.trim(),
        loggedAt: toIsoDate(),
        mealCategory: mealDraft.mealCategory.trim() || null,
        protein: totals.protein,
      });
      setSaveSucceeded(true);
      setIsReviewing(false);
      setSubmitAttempted(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save meal log.";
      console.warn("[nutrition]", "Meal save failed in meal photo modal.", {
        message,
      });
      setSaveError(message);
    }
  }, [addMealLogMutation, isValid, mealDraft, mealPhotoAnalysis.isAnalyzing, totals]);

  const footer = useMemo(() => {
    if (saveSucceeded) {
      return (
        <AppButton onPress={() => router.back()} variant="secondary">
          Back to Nutrition
        </AppButton>
      );
    }

    if (!selectedImage) return null;

    if (isReviewing && mealDraft) {
      const isSaving = addMealLogMutation.isPending;

      return (
        <View className="gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AppButton disabled={isSaving} onPress={handleResetToAiEstimate} variant="ghost">
                Reset to AI Estimate
              </AppButton>
            </View>
            <View className="flex-1">
              <AppButton
                disabled={isSaving || mealPhotoAnalysis.isAnalyzing}
                isLoading={isSaving}
                onPress={() => void handleSaveMeal()}
                variant="secondary"
              >
                {isSaving ? "Saving..." : "Save Meal"}
              </AppButton>
            </View>
          </View>
          <Typography align="center" tone="secondary" variant="labelSm">
            {MEAL_PHOTO_AI_INFO_TEXT}
          </Typography>
        </View>
      );
    }

    return (
      <View className="gap-3">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <AppButton disabled={mealPhotoAnalysis.isAnalyzing} onPress={handleChangePhoto} variant="ghost">
              Change Photo
            </AppButton>
          </View>
          <View className="flex-1">
            <AppButton
              disabled={!canAnalyze}
              isLoading={mealPhotoAnalysis.isAnalyzing}
              onPress={() => void handleAnalyze()}
              variant="primary"
            >
              {mealPhotoAnalysis.isAnalyzing ? "Analyzing..." : "Analyze Meal"}
            </AppButton>
          </View>
        </View>
        <Typography align="center" tone="secondary" variant="labelSm">
          {MEAL_PHOTO_AI_INFO_TEXT}
        </Typography>
      </View>
    );
  }, [
    addMealLogMutation.isPending,
    canAnalyze,
    handleAnalyze,
    handleChangePhoto,
    handleResetToAiEstimate,
    handleSaveMeal,
    isReviewing,
    mealDraft,
    mealPhotoAnalysis.isAnalyzing,
    saveSucceeded,
    selectedImage,
  ]);

  const limitMessage = mealPhotoAnalysis.usage
    ? mealPhotoAnalysis.usage.isLimitReached
      ? MEAL_PHOTO_AI_ERROR_MESSAGES.limitReached
      : `${mealPhotoAnalysis.usage.remaining} Wolf AI actions left today.`
    : null;

  return (
    <ScreenScaffold
      backgroundClassName="bg-surface"
      bottomChrome="none"
      contentClassName="gap-6 px-0"
      footer={footer}
      header={
        <View style={{ paddingHorizontal: pagePaddingHorizontal, paddingTop: 8 }}>
          <View className="items-center pb-3">
            <View className="h-1 w-12 rounded-full bg-border-strong" />
          </View>
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <Typography tone="secondary" variant="labelSm">
                Nutrition
              </Typography>
              <Typography variant="headlineXl">{MEAL_PHOTO_AI_TITLE}</Typography>
            </View>
            <Pressable
              accessibilityLabel="Close meal photo modal"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-raised"
              hitSlop={8}
              onPress={() => router.back()}
            >
              <Ionicons color={colors.graphite} name="close" size={20} />
            </Pressable>
          </View>
          <View className="mt-4 h-1 w-14 rounded-full bg-emerald" />
        </View>
      }
    >
      <View style={{ paddingHorizontal: pagePaddingHorizontal }} className="gap-6">
        <View className="gap-2 max-w-[640px]">
          <Typography variant="headlineLg">Estimate a meal from a photo</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Take or upload a clear meal photo. Wolf AI will estimate foods, calories, and macros for you to review before saving.
          </Typography>
          {limitMessage ? (
            <Typography tone="secondary" variant="labelSm">
              {limitMessage}
            </Typography>
          ) : null}
        </View>

        {saveSucceeded ? (
          <GlassCard className="gap-3">
            <Typography variant="headlineLg">Meal saved</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your finalized meal entry has been added to today&apos;s nutrition log.
            </Typography>
          </GlassCard>
        ) : null}

        {!selectedImage ? (
          <MealPhotoPicker
            error={pickerError}
            isBusy={mealPhotoAnalysis.isAnalyzing}
            mealCategory={mealCategory}
            onMealCategoryChange={setMealCategory}
            onPickCamera={() => void handleSelectImage("camera")}
            onPickGallery={() => void handleSelectImage("library")}
          />
        ) : (
          <>
            <MealPhotoPreview image={selectedImage} />

            {!saveSucceeded ? (
              <MealAnalysisSummary
                cached={mealPhotoAnalysis.cached}
                error={analysisError}
                isAnalyzing={mealPhotoAnalysis.isAnalyzing}
                hasSelectedImage={hasSelectedImage}
                onReviewEdit={result && !isReviewing ? handleEnterReview : undefined}
                onRetry={selectedImage ? () => void handleAnalyze() : undefined}
                result={result}
                safetyCategory={mealPhotoAnalysis.safetyCategory}
                usedFallback={mealPhotoAnalysis.usedFallback}
              />
            ) : null}

            {isReviewing && mealDraft ? (
              <MealDraftEditor
                draft={mealDraft}
                errors={submitAttempted ? validationErrors : null}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onUpdateItem={handleUpdateItem}
                onUpdateMealCategory={handleUpdateMealCategory}
                onUpdateMealName={handleUpdateMealName}
                saveError={saveError}
                showValidationErrors={submitAttempted}
                totals={totals}
              />
            ) : null}
          </>
        )}
      </View>
    </ScreenScaffold>
  );
}

export const MealPhotoAIScreen = memo(MealPhotoAIScreenComponent);
