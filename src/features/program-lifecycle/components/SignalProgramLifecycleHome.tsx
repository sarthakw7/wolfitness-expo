import { useCallback, useMemo } from "react";
import { Alert, RefreshControl, View } from "react-native";

import { AppTopBar, ScreenScaffold } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { router } from "expo-router";

import { SIGNAL_LIFECYCLE_COPY } from "../constants";
import { findFirstPlayableSignalStartPoint } from "../services/signalProgramLifecycle.service";
import { useRestartSignalProgram } from "../hooks/useRestartSignalProgram";
import { useUnjoinSignalProgram } from "../hooks/useUnjoinSignalProgram";
import { useAuth } from "@/src/hooks/useAuth";
import type { SignalProgramLifecycleRow } from "../types";
import { ProgramLifecycleCard } from "./ProgramLifecycleCard";

type SignalProgramLifecycleHomeProps = {
  lifecycle: SignalProgramLifecycleRow;
  isLifecycleFetching: boolean;
  refetchLifecycle: () => Promise<unknown>;
};

export function SignalProgramLifecycleHome({
  lifecycle,
  isLifecycleFetching,
  refetchLifecycle,
}: SignalProgramLifecycleHomeProps) {
  const { user } = useAuth();
  const workoutProgramQuery = useWorkoutProgram(lifecycle.source_program_id, null);
  const restartSignalProgramMutation = useRestartSignalProgram(user?.id);
  const unjoinSignalProgramMutation = useUnjoinSignalProgram(user?.id);
  const latestPublishedProgram = workoutProgramQuery.data ?? null;
  const firstPlayableStart = useMemo(
    () => findFirstPlayableSignalStartPoint(latestPublishedProgram?.weeks ?? []),
    [latestPublishedProgram?.weeks],
  );
  const programTitle = latestPublishedProgram?.program.title ?? "Signal Program";
  const isCompleted = lifecycle.status === "completed";
  const isBusy = restartSignalProgramMutation.isPending || unjoinSignalProgramMutation.isPending;

  const handleJoinProgram = useCallback(() => {
    if (!firstPlayableStart) {
      Alert.alert(
        "Join unavailable",
        "This program does not have a playable starting workout.",
      );
      return;
    }

    Alert.alert(
      "Join program?",
      "Start this program from Week 1 Day 1? Your completed workout history will remain saved.",
      [
        { style: "cancel", text: "Cancel" },
        {
          text: "Rejoin Program",
          onPress: () => {
            restartSignalProgramMutation
              .mutateAsync({
                completedLifecycleId: lifecycle.id,
                firstPlayableStart,
                signalProgramId: lifecycle.source_program_id,
                signalProgramVersion: latestPublishedProgram?.versionId ?? lifecycle.source_program_version ?? null,
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to join this program.";
                Alert.alert("Join unavailable", message);
              });
          },
        },
      ],
    );
  }, [
    firstPlayableStart,
    latestPublishedProgram?.versionId,
    lifecycle.id,
    lifecycle.source_program_id,
    lifecycle.source_program_version,
    restartSignalProgramMutation,
  ]);

  const handleRestartProgram = useCallback(() => {
    if (!firstPlayableStart) {
      Alert.alert(
        "Restart unavailable",
        "This program does not have a playable starting workout.",
      );
      return;
    }

    Alert.alert(
      "Restart program?",
      "Start this program again from Week 1 Day 1? Your previous completion and workout history will remain saved.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Restart Program",
          onPress: () => {
            restartSignalProgramMutation
              .mutateAsync({
                completedLifecycleId: lifecycle.id,
                firstPlayableStart,
                signalProgramId: lifecycle.source_program_id,
                signalProgramVersion: latestPublishedProgram?.versionId ?? lifecycle.source_program_version ?? null,
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to restart this program.";
                Alert.alert("Restart unavailable", message);
              });
          },
        },
      ],
    );
  }, [
    firstPlayableStart,
    latestPublishedProgram?.versionId,
    lifecycle.id,
    lifecycle.source_program_id,
    lifecycle.source_program_version,
    restartSignalProgramMutation,
  ]);

  const handleViewHistory = useCallback(() => {
    router.push("/(tabs)/history" as never);
  }, []);

  const handleLeaveProgram = useCallback(() => {
    Alert.alert(
      "Leave program?",
      "Leave this program? Your completed workout history will stay saved.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Leave Program",
          onPress: () => {
            unjoinSignalProgramMutation
              .mutateAsync({
                activeProgramId: lifecycle.id,
                signalProgramId: lifecycle.source_program_id,
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to leave this program.";
                Alert.alert("Leave unavailable", message);
              });
          },
        },
      ],
    );
  }, [lifecycle.id, lifecycle.source_program_id, unjoinSignalProgramMutation]);

  return (
    <ScreenScaffold
      contentClassName="gap-6"
      header={<AppTopBar centered subtitle="Training Home" title="Workouts" />}
      refreshControl={
        <RefreshControl
          onRefresh={async () => {
            await Promise.all([workoutProgramQuery.refetch(), refetchLifecycle()]);
          }}
          refreshing={isLifecycleFetching || workoutProgramQuery.isFetching}
        />
      }
    >
      <View className="gap-4 px-2">
        <ProgramLifecycleCard
          badge={isCompleted ? SIGNAL_LIFECYCLE_COPY.completed.badge : SIGNAL_LIFECYCLE_COPY.noEnrollment.badge}
          description={isCompleted ? SIGNAL_LIFECYCLE_COPY.completed.description : SIGNAL_LIFECYCLE_COPY.noEnrollment.description}
          isPrimaryDisabled={isBusy || (isCompleted && !firstPlayableStart)}
          isPrimaryLoading={restartSignalProgramMutation.isPending}
          isSecondaryDisabled={isBusy}
          isSecondaryLoading={false}
          isTertiaryDisabled={isBusy}
          isTertiaryLoading={unjoinSignalProgramMutation.isPending}
          onPrimaryAction={isCompleted ? handleRestartProgram : handleJoinProgram}
          onSecondaryAction={isCompleted ? handleViewHistory : undefined}
          onTertiaryAction={isCompleted ? handleLeaveProgram : undefined}
          primaryActionLabel={
            restartSignalProgramMutation.isPending
              ? isCompleted
                ? "Restarting..."
                : "Joining..."
              : isCompleted
                ? "Restart Program"
                : "Rejoin Program"
          }
          primaryActionVariant={isCompleted ? "secondary" : "primary"}
          secondaryActionLabel={isCompleted ? "View History" : undefined}
          secondaryActionVariant="ghost"
          tertiaryActionLabel={isCompleted ? "Leave Program" : undefined}
          tertiaryActionVariant="danger"
          title={programTitle}
        />

        {restartSignalProgramMutation.error ? (
          <Typography tone="danger" variant="labelSm">
            {restartSignalProgramMutation.error instanceof Error
              ? restartSignalProgramMutation.error.message
              : "Unable to restart this program."}
          </Typography>
        ) : null}

        {isCompleted ? null : (
          <Typography align="center" tone="secondary" variant="labelSm">
            Completed workout history is always preserved.
          </Typography>
        )}
      </View>
    </ScreenScaffold>
  );
}
