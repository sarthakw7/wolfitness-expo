import { useCallback, useEffect, useState } from "react";

import type { SignalCoachMediaPreview } from "@/src/features/workout/lib/coachMedia";

type UseSignalWorkoutPlayerStateInput = {
  signalDayId: string | null | undefined;
  signalInitialStepIndex: number;
  signalWeekId: string | null | undefined;
};

export function useSignalWorkoutPlayerState({
  signalDayId,
  signalInitialStepIndex,
  signalWeekId,
}: UseSignalWorkoutPlayerStateInput) {
  const [currentStepIndex, setCurrentStepIndex] = useState(signalInitialStepIndex);
  const [showRestTimerOptions, setShowRestTimerOptions] = useState(false);
  const [showCustomTimerInput, setShowCustomTimerInput] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [activeCoachMedia, setActiveCoachMedia] = useState<SignalCoachMediaPreview | null>(null);
  const [coachMediaError, setCoachMediaError] = useState(false);
  const [reflectionIntensity, setReflectionIntensity] = useState<number>(7);
  const [reflectionDurationMinutes, setReflectionDurationMinutes] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState<string>("");
  const [shareWithCoachAndTeam, setShareWithCoachAndTeam] = useState<boolean>(false);

  const closeTimerPanel = useCallback(() => {
    setShowCustomTimerInput(false);
    setShowRestTimerOptions(false);
  }, []);

  const closeCustomTimerInput = useCallback(() => {
    setShowCustomTimerInput(false);
    setCustomTimerInput("");
  }, []);

  const clearCustomTimerState = useCallback(() => {
    setShowCustomTimerInput(false);
    setShowRestTimerOptions(false);
    setCustomTimerInput("");
  }, []);

  const openCoachMedia = useCallback((preview: SignalCoachMediaPreview) => {
    setCoachMediaError(false);
    setActiveCoachMedia(preview);
  }, []);

  const closeCoachMedia = useCallback(() => {
    setActiveCoachMedia(null);
    setCoachMediaError(false);
  }, []);

  const markCoachMediaPlaybackError = useCallback(() => {
    setCoachMediaError(true);
  }, []);

  const resetReflectionState = useCallback(() => {
    setReflectionIntensity(7);
    setReflectionDurationMinutes("");
    setReflectionNote("");
    setShareWithCoachAndTeam(false);
  }, []);

  const toggleShareWithCoachAndTeam = useCallback(() => {
    setShareWithCoachAndTeam((current) => !current);
  }, []);

  const resetSignalPlayerState = useCallback(() => {
    setCurrentStepIndex(signalInitialStepIndex);
    resetReflectionState();
    clearCustomTimerState();
  }, [clearCustomTimerState, resetReflectionState, signalInitialStepIndex]);

  useEffect(() => {
    closeCoachMedia();
  }, [closeCoachMedia, signalDayId, signalWeekId]);

  return {
    activeCoachMedia,
    clearCustomTimerState,
    closeCoachMedia,
    closeCustomTimerInput,
    closeTimerPanel,
    coachMediaError,
    currentStepIndex,
    customTimerInput,
    markCoachMediaPlaybackError,
    openCoachMedia,
    reflectionDurationMinutes,
    reflectionIntensity,
    reflectionNote,
    resetReflectionState,
    resetSignalPlayerState,
    setCurrentStepIndex,
    setCustomTimerInput,
    setReflectionDurationMinutes,
    setReflectionIntensity,
    setReflectionNote,
    setShareWithCoachAndTeam,
    setShowCustomTimerInput,
    setShowRestTimerOptions,
    shareWithCoachAndTeam,
    showCustomTimerInput,
    showRestTimerOptions,
    toggleShareWithCoachAndTeam,
  };
}
