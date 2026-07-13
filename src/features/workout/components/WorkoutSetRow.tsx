import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { GlassCard, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

export const SIGNAL_SET_TABLE_COLUMNS = {
  done: 48,
  label: 40,
} as const;

type WorkoutSetRowProps = {
  completed: boolean;
  index: number;
  isActive: boolean;
  isEditable?: boolean;
  lbsValue: string;
  onChangeLbs: (next: string) => void;
  onChangeReps: (next: string) => void;
  onChangeRpe: (next: string) => void;
  onToggleComplete: () => void;
  repsValue: string;
  rpeValue: string;
  setLabel: string;
  signalMode?: boolean;
  weightInputRef?: (node: TextInput | null) => void;
};

export function WorkoutSetRow({
  completed,
  index,
  isActive,
  isEditable = true,
  lbsValue,
  onChangeLbs,
  onChangeReps,
  onChangeRpe,
  onToggleComplete,
  repsValue,
  rpeValue,
  setLabel,
  signalMode,
  weightInputRef,
}: WorkoutSetRowProps) {
  const isEnabled = isEditable && !completed;
  const cardTone = completed
    ? signalMode
      ? "opacity-60"
      : "opacity-70"
      : isActive
        ? signalMode
          ? "bg-white/[0.03]"
          : "bg-white/90 border-white shadow-luxury"
        : signalMode
          ? ""
          : "bg-white/60 border-white/70";

  const indicator = isActive ? (
    <View className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full ${signalMode ? "bg-emerald" : "bg-graphite"}`} />
  ) : null;

  return signalMode ? (
    <View
      className={cn(
        "relative flex-row items-center gap-2 border-b border-white/10 py-2.5",
        completed ? "bg-emerald/8" : isActive ? "bg-white/[0.04]" : "bg-transparent",
        !isEditable ? "opacity-70" : "",
      )}
    >
      {indicator}
      <View className="items-center justify-center pr-1" style={{ width: SIGNAL_SET_TABLE_COLUMNS.label }}>
        <Typography tone={completed ? "accent" : "inverse"} variant="bodyLg">
          {index}
        </Typography>
      </View>
      <View className="flex-1">
        <View
          className={cn(
            "h-10 items-center justify-center rounded-sm border px-1.5",
            completed
              ? "border-emerald/40 bg-emerald/12"
              : isActive
                ? "border-emerald/40 bg-white/[0.04]"
                : "border-white/10 bg-transparent",
          )}
        >
          <TextInput
            editable={isEnabled}
            keyboardType="numeric"
            onChangeText={onChangeReps}
            placeholder="-"
            placeholderTextColor="rgba(255,255,255,0.62)"
            selectionColor={colors.emerald}
            style={[
              styles.setFieldInput,
              styles.setFieldInputSignal,
              completed ? styles.setFieldInputCompleted : null,
              isActive ? styles.setFieldInputActive : null,
            ]}
            value={repsValue}
          />
        </View>
      </View>
      <View className="flex-1">
        <View
          className={cn(
            "h-10 items-center justify-center rounded-sm border px-1.5",
            completed
              ? "border-emerald/40 bg-emerald/12"
              : isActive
                ? "border-emerald/40 bg-white/[0.04]"
                : "border-white/10 bg-transparent",
          )}
        >
          <TextInput
            editable={isEnabled}
            keyboardType="numeric"
            onChangeText={onChangeLbs}
            placeholder="-"
            placeholderTextColor="rgba(255,255,255,0.62)"
            ref={weightInputRef}
            selectionColor={colors.emerald}
            style={[
              styles.setFieldInput,
              styles.setFieldInputSignal,
              completed ? styles.setFieldInputCompleted : null,
              isActive ? styles.setFieldInputActive : null,
            ]}
            value={lbsValue}
          />
        </View>
      </View>
      <View className="flex-1">
        <View
          className={cn(
            "h-10 items-center justify-center rounded-sm border px-1.5",
            completed
              ? "border-emerald/40 bg-emerald/12"
              : isActive
                ? "border-emerald/40 bg-white/[0.04]"
                : "border-white/10 bg-transparent",
          )}
        >
          <TextInput
            editable={isEnabled}
            keyboardType="numeric"
            onChangeText={onChangeRpe}
            placeholder="-"
            placeholderTextColor="rgba(255,255,255,0.62)"
            selectionColor={colors.emerald}
            style={[
              styles.setFieldInput,
              styles.setFieldInputSignal,
              completed ? styles.setFieldInputCompleted : null,
              isActive ? styles.setFieldInputActive : null,
            ]}
            value={rpeValue}
          />
        </View>
      </View>
      <View className="items-center justify-center" style={{ width: SIGNAL_SET_TABLE_COLUMNS.done }}>
        <Pressable
          accessibilityLabel={completed ? "Set complete" : "Mark set complete"}
          accessibilityRole="button"
          className={cn(
            "h-10 w-10 items-center justify-center rounded-md border",
            completed
              ? "border-emerald bg-emerald"
              : isEnabled && isActive
                ? "border-white/30 bg-white/[0.08]"
                : "border-white/12 bg-white/[0.03] opacity-70",
          )}
          disabled={!isEnabled || !isActive}
          hitSlop={8}
          onPress={onToggleComplete}
        >
          <Ionicons color={colors.white} name={completed ? "checkmark-circle" : "checkmark"} size={15} />
        </Pressable>
      </View>
    </View>
  ) : (
    <GlassCard className={`relative overflow-hidden rounded-2xl border p-4 ${cardTone}`}>
      {indicator}
      <View className={isActive ? "flex-row items-center justify-between gap-3 pl-3" : "flex-row items-center justify-between gap-3"}>
        <View className="flex-row items-center gap-4">
          <Typography tone="secondary" variant="headlineLg">
            {index}
          </Typography>
          <Typography className="uppercase tracking-widest" tone="secondary" variant="labelSm">
            {setLabel}
          </Typography>
        </View>

        <View className="flex-row items-center gap-6">
          <TextInput
            editable={isEditable && !completed}
            keyboardType="numeric"
            onChangeText={onChangeReps}
            placeholder="-"
            placeholderTextColor={signalMode ? "rgba(255,255,255,0.35)" : colors.graphiteSubtle}
            selectionColor={colors.emerald}
            style={[
              styles.setInput,
              signalMode ? styles.setInputSignal : null,
              completed ? styles.setInputCompleted : null,
              isActive ? styles.setInputActive : null,
            ]}
            value={repsValue}
          />
          <TextInput
            editable={isEditable && !completed}
            keyboardType="numeric"
            onChangeText={onChangeLbs}
            placeholder="-"
            placeholderTextColor={signalMode ? "rgba(255,255,255,0.35)" : colors.graphiteSubtle}
            ref={weightInputRef}
            selectionColor={colors.emerald}
            style={[
              styles.setInput,
              signalMode ? styles.setInputSignal : null,
              completed ? styles.setInputCompleted : null,
              isActive ? styles.setInputActive : null,
            ]}
            value={lbsValue}
          />
          <TextInput
            editable={isEditable && !completed}
            keyboardType="numeric"
            onChangeText={onChangeRpe}
            placeholder="-"
            placeholderTextColor={signalMode ? "rgba(255,255,255,0.35)" : colors.graphiteSubtle}
            selectionColor={colors.emerald}
            style={[
              styles.setInput,
              signalMode ? styles.setInputSignal : null,
              completed ? styles.setInputCompleted : null,
              isActive ? styles.setInputActive : null,
            ]}
            value={rpeValue}
          />

          <Pressable
            accessibilityLabel={completed ? "Set complete" : "Mark set complete"}
            accessibilityRole="button"
            className={
              completed
                ? "h-10 w-10 items-center justify-center rounded-full bg-emerald"
                : isActive
                  ? signalMode
                    ? "h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-white/10"
                    : "h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-white/50"
                  : signalMode
                    ? "h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 opacity-60"
                    : "h-9 w-9 items-center justify-center rounded-full border-2 border-border/50 bg-transparent opacity-60"
            }
            disabled={completed || !isActive || !isEditable}
            hitSlop={8}
            onPress={onToggleComplete}
          >
            <Ionicons color={completed ? colors.white : signalMode ? colors.white : colors.graphiteMuted} name="checkmark" size={16} />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  setFieldInput: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    height: 22,
    includeFontPadding: false,
    lineHeight: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  setFieldInputActive: { color: colors.white },
  setFieldInputCompleted: { color: "rgba(255,255,255,0.85)" },
  setFieldInputSignal: { color: colors.white },
  setInput: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: colors.graphite,
    minWidth: 56,
    paddingBottom: 4,
    textAlign: "center",
  },
  setInputActive: { borderBottomColor: colors.graphite, borderBottomWidth: 2 },
  setInputCompleted: { borderBottomColor: colors.border, color: colors.graphiteMuted },
  setInputSignal: { borderBottomColor: "rgba(255,255,255,0.24)", color: colors.white },
});
