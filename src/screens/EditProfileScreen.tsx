import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { ModalSheet } from "@/src/components/layout";
import { AppButton, AppInput } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { supabase } from "@/src/lib/supabase";

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function EditProfileScreenComponent() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialName = useMemo(() => {
    const fromMeta = user?.user_metadata?.full_name as string | undefined;
    const fromName = user?.user_metadata?.name as string | undefined;
    return fromMeta ?? fromName ?? "";
  }, [user?.user_metadata]);

  useEffect(() => {
    setFullName(initialName);
  }, [initialName]);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    const next = normalizeName(fullName);
    if (!next) {
      setError("Full name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Update auth metadata (used by the top bar avatar/name fallbacks).
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: next },
      });
      if (authError) throw authError;

      // Best-effort update for the public profile row (may be blocked by RLS depending on your policies).
      await supabase.from("users").update({ full_name: next }).eq("id", user.id);

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  }, [fullName, user?.id]);

  return (
    <ModalSheet eyebrow="Profile" title="Edit Profile">
      <AppInput
        autoCapitalize="words"
        autoCorrect={false}
        label="Full name"
        onChangeText={(text) => {
          setError(null);
          setFullName(text);
        }}
        returnKeyType="done"
        value={fullName}
      />

      {error ? (
        <View>
          {/* AppInput already renders error; keep this for non-field errors */}
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppButton onPress={() => router.back()} variant="ghost">
            Cancel
          </AppButton>
        </View>
        <View className="flex-1">
          <AppButton isLoading={isSaving} onPress={handleSave} variant="secondary">
            Save
          </AppButton>
        </View>
      </View>
    </ModalSheet>
  );
}

export const EditProfileScreen = memo(EditProfileScreenComponent);

