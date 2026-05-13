import { forwardRef, memo, useId, useState } from "react";
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
  (
    {
      className,
      containerClassName,
      error,
      label,
      nativeID,
      onBlur,
      onFocus,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = nativeID ?? generatedId;
    const hasError = Boolean(error);
    const [isFocused, setIsFocused] = useState(false);

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
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.graphiteSubtle}
          selectionColor={colors.emerald}
          style={[
            styles.input,
            isFocused ? styles.inputFocused : null,
            hasError ? styles.inputError : null,
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
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: colors.graphite,
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    minHeight: 44,
    paddingBottom: spacing[2],
    paddingHorizontal: 0,
  },
  inputError: {
    borderBottomColor: colors.danger,
  },
  inputFocused: {
    borderBottomColor: colors.emerald,
  },
});

export const AppInput = memo(AppInputComponent);
