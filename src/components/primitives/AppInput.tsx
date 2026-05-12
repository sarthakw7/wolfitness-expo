import { forwardRef, memo, useId } from "react";
import {
  StyleSheet,
  TextInput,
  type TextStyle,
  type TextInputProps,
  View,
} from "react-native";

import { cn } from "@/src/lib/cn";
import { colors, radius, spacing, typography } from "@/src/theme";

import { Typography } from "./Typography";

type AppInputProps = TextInputProps & {
  containerClassName?: string;
  error?: string;
  label?: string;
};

const AppInputComponent = forwardRef<TextInput, AppInputProps>(
  ({ className, containerClassName, error, label, nativeID, style, ...props }, ref) => {
    const generatedId = useId();
    const inputId = nativeID ?? generatedId;
    const hasError = Boolean(error);

    return (
      <View className={cn("gap-1.5", containerClassName)}>
        {label ? (
          <Typography nativeID={`${inputId}-label`} tone="secondary" variant="labelSm">
            {label}
          </Typography>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabelledBy={label ? `${inputId}-label` : undefined}
          nativeID={inputId}
          placeholderTextColor={colors.graphiteSubtle}
          selectionColor={colors.emerald}
          style={[
            styles.input,
            hasError ? styles.inputError : null,
            { backgroundColor: colors.surfaceMuted },
            style as TextStyle,
          ]}
          {...props}
        />
        {error ? (
          <Typography tone="danger" variant="labelSm">
            {error}
          </Typography>
        ) : null}
      </View>
    );
  },
);

AppInputComponent.displayName = "AppInput";

const styles = StyleSheet.create({
  input: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.graphite,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    minHeight: 52,
    paddingHorizontal: spacing[2],
  },
  inputError: {
    borderColor: colors.danger,
  },
});

export const AppInput = memo(AppInputComponent);
