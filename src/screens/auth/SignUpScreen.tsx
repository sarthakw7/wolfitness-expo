import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo, type RefObject, useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type PressableStateCallbackType,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { useAuth } from "@/src/hooks/useAuth";
import { spacing, typography } from "@/src/theme";

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

type FloatingUnderlineInputProps = {
  accessibilityLabel: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: TextInputProps["autoComplete"];
  blurOnSubmit?: boolean;
  importantForAutofill?: TextInputProps["importantForAutofill"];
  inputRef?: RefObject<TextInput | null>;
  inputMode?: "email" | "text";
  keyboardType?: "default" | "email-address";
  label: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  secureTextEntry?: boolean;
  textContentType?: TextInputProps["textContentType"];
  value: string;
};

function FloatingUnderlineInput({
  accessibilityLabel,
  autoCapitalize,
  autoComplete,
  blurOnSubmit = false,
  importantForAutofill,
  inputRef,
  inputMode,
  keyboardType,
  label,
  onChangeText,
  onBlur,
  onSubmitEditing,
  returnKeyType,
  secureTextEntry,
  textContentType,
  value,
}: FloatingUnderlineInputProps) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.trim().length > 0;
  const borderColor = focused ? "#47664b" : "#c2c8bf";

  return (
    <View className="relative">
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        blurOnSubmit={blurOnSubmit}
        importantForAutofill={importantForAutofill}
        inputMode={inputMode}
        keyboardType={keyboardType}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onSubmitEditing={onSubmitEditing}
        placeholder={raised ? "" : " "}
        placeholderTextColor="#c2c8bf"
        ref={inputRef}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        selectionColor="#47664b"
        textContentType={textContentType}
        style={{
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
          color: "#1a1c18",
          fontFamily: typography.bodyMd.fontFamily,
          fontSize: typography.bodyMd.fontSize,
          paddingBottom: spacing[2],
          paddingHorizontal: 0,
          paddingTop: 12,
        }}
        value={value}
      />
      <Typography
        className={cn("absolute left-0", raised ? "uppercase tracking-[3px]" : null)}
        style={{
          color: focused ? "#47664b" : "#5f5e5e",
          transform: [{ translateY: raised ? -18 : 10 }],
        }}
        variant={raised ? "labelSm" : "bodyMd"}
      >
        {label}
      </Typography>
    </View>
  );
}

function PrimaryCreateButton({
  disabled,
  isLoading,
  onPress,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
}) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      className="w-full items-center justify-center rounded-lg bg-[#86a789] px-6 py-4"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }: PressableStateCallbackType) =>
        pressed && !isDisabled ? { opacity: 0.92, transform: [{ translateY: -1 }] } : null
      }
    >
      {isLoading ? (
        <Ionicons color="#1f3c25" name="ellipsis-horizontal" size={20} />
      ) : (
        <Typography
          align="center"
          className="uppercase tracking-[3px]"
          style={[
            typography.labelSm,
            { color: "#1f3c25", textTransform: "uppercase" },
          ]}
          variant="labelSm"
        >
          CREATE ACCOUNT
        </Typography>
      )}
    </Pressable>
  );
}

function GoogleContinueButton({
  disabled,
  isLoading,
  onPress,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
}) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "w-full flex-row items-center justify-center gap-3 rounded-lg border border-[#c2c8bf] bg-[#fafaf2] px-6 py-4",
        isDisabled ? "opacity-100" : null,
      )}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }: PressableStateCallbackType) =>
        pressed && !isDisabled ? { opacity: 0.92 } : null
      }
    >
      <Image
        accessibilityIgnoresInvertColors
        source={require("@/assets/images/google-g.png")}
        style={{ height: 20, width: 20 }}
      />
      <Typography style={{ color: "#1a1c18" }} variant="labelMd">
        Continue with Google
      </Typography>
    </Pressable>
  );
}

function SignUpScreenComponent() {
  const { isConfigured, signInWithGoogle, signUp } = useAuth();
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<"form" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isSubmitting = pendingAction !== null;

  const canSubmit = useMemo(() => {
    if (!isConfigured) return false;
    if (fullName.trim().length < 2) return false;
    if (!isValidEmail(email.trim())) return false;
    if (password.length < 8) return false;
    return true;
  }, [email, fullName, isConfigured, password.length]);

  const fullNameError = useMemo(() => {
    if (!fullNameTouched && !didSubmit) return null;
    if (fullName.trim().length === 0) return "Full name is required.";
    if (fullName.trim().length < 2) return "Enter your full name.";
    return null;
  }, [didSubmit, fullName, fullNameTouched]);

  const emailError = useMemo(() => {
    if (!emailTouched && !didSubmit) return null;
    if (email.trim().length === 0) return "Email is required.";
    if (!isValidEmail(email.trim())) return "Enter a valid email address.";
    return null;
  }, [didSubmit, email, emailTouched]);

  const passwordError = useMemo(() => {
    if (!passwordTouched && !didSubmit) return null;
    if (password.length === 0) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }, [didSubmit, password.length, passwordTouched]);

  const handleSubmit = useCallback(async () => {
    setDidSubmit(true);
    if (fullName.trim().length < 2) {
      setError(null);
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError(null);
      return;
    }
    if (password.length < 8) {
      setError(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setPendingAction("form");
    const result = await signUp({ email, fullName, password });
    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess("Account created. Check your email if confirmation is required.");
    }
    setPendingAction(null);
  }, [email, fullName, password, signUp]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setPendingAction("google");
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error.message);
    }
    setPendingAction(null);
  }, [signInWithGoogle]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#fafaf2]"
    >
      <ScreenContainer
        scroll
        className="bg-[#fafaf2]"
        contentClassName="flex-grow items-center justify-center px-0 py-0"
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          width: "100%",
        }}
      >
        <View
          className="w-full gap-10"
          style={{
            alignSelf: "center",
            maxWidth: 448,
            width: "100%",
          }}
        >
          <View className="items-center gap-6">
            <View className="h-16 w-16 items-center justify-center">
              <Image
                accessibilityLabel="Wolfitness logo"
                className="h-16 w-16 opacity-90"
                resizeMode="contain"
                source={require("@/assets/images/landing.png")}
              />
            </View>
            <View className="items-center gap-2">
              <Typography align="center" className="text-[#1a1c18]" variant="headlineXl">
                Join the Elite
              </Typography>
              <Typography align="center" className="text-[#424842]" variant="bodyMd">
                Begin your journey to refined performance.
              </Typography>
            </View>
          </View>

          <View className="gap-6">
            <View className="w-full gap-6">
              <FloatingUnderlineInput
                accessibilityLabel="Full name"
                autoCapitalize="words"
                autoComplete="name"
                blurOnSubmit={false}
                importantForAutofill="yes"
                inputRef={fullNameRef}
                inputMode="text"
                label="Full Name"
                onChangeText={(next) => {
                  setFullName(next);
                  if (error) setError(null);
                  if (success) setSuccess(null);
                }}
                onBlur={() => setFullNameTouched(true)}
                onSubmitEditing={() => emailRef.current?.focus()}
                returnKeyType="next"
                textContentType="name"
                value={fullName}
              />
              {fullNameError ? (
                <Typography className="mt-1" tone="danger" variant="labelSm">
                  {fullNameError}
                </Typography>
              ) : null}
              <FloatingUnderlineInput
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoComplete="email"
                blurOnSubmit={false}
                importantForAutofill="yes"
                inputRef={emailRef}
                inputMode="email"
                keyboardType="email-address"
                label="Email Address"
                onChangeText={(next) => {
                  setEmail(next);
                  if (error) setError(null);
                  if (success) setSuccess(null);
                }}
                onBlur={() => setEmailTouched(true)}
                onSubmitEditing={() => passwordRef.current?.focus()}
                returnKeyType="next"
                textContentType="emailAddress"
                value={email}
              />
              {emailError ? (
                <Typography className="mt-1" tone="danger" variant="labelSm">
                  {emailError}
                </Typography>
              ) : null}
              <View className="relative">
                <FloatingUnderlineInput
                  accessibilityLabel="Create password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  blurOnSubmit
                  importantForAutofill="yes"
                  inputRef={passwordRef}
                  inputMode="text"
                  label="Create Password"
                  onChangeText={(next) => {
                    setPassword(next);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  onSubmitEditing={() => {
                    if (canSubmit && !isSubmitting) {
                      handleSubmit();
                      return;
                    }
                    passwordRef.current?.blur();
                  }}
                  returnKeyType="done"
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  value={password}
                />
                <Pressable
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                  className="absolute right-0 top-3"
                  hitSlop={8}
                  onPress={() => setShowPassword((current) => !current)}
                >
                  <Ionicons
                    color={showPassword ? "#47664b" : "#5f5e5e"}
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                  />
                </Pressable>
              </View>
              {passwordError ? (
                <Typography className="mt-1" tone="danger" variant="labelSm">
                  {passwordError}
                </Typography>
              ) : null}
            </View>

            {error ? <Typography tone="danger" variant="bodyMd">{error}</Typography> : null}
            {success ? <Typography tone="accent" variant="bodyMd">{success}</Typography> : null}
            {!isConfigured ? (
              <Typography tone="secondary" variant="bodyMd">
                Supabase environment variables are required before authentication can connect.
              </Typography>
            ) : null}

            <View className="gap-4">
              <PrimaryCreateButton
                disabled={!canSubmit || isSubmitting}
                isLoading={pendingAction === "form"}
                onPress={handleSubmit}
              />

              <View className="flex-row items-center py-2">
                <View className="h-px flex-1 bg-[#e3e3db]" />
                <Typography className="mx-4" style={{ color: "#5f5e5e" }} variant="labelSm">
                  OR
                </Typography>
                <View className="h-px flex-1 bg-[#e3e3db]" />
              </View>

              <GoogleContinueButton
                disabled={!isConfigured || isSubmitting}
                isLoading={pendingAction === "google"}
                onPress={handleGoogle}
              />
            </View>
          </View>

          <View className="items-center mt-4">
            <Typography align="center" className="text-[#5f5e5e]" variant="bodyMd">
              Already a member?{" "}
              <Link href="/(auth)/sign-in" suppressHighlighting>
                <Typography
                  className="underline"
                  style={{ color: "#47664b" }}
                  variant="bodyMd"
                >
                  Sign in
                </Typography>
              </Link>
            </Typography>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

export const SignUpScreen = memo(SignUpScreenComponent);
