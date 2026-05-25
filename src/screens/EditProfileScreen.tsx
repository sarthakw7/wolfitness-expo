import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image, View } from "react-native";

import { ModalSheet } from "@/src/components/layout";
import { AppButton, AppInput } from "@/src/components/primitives";
import { useUpdateProfile } from "@/src/hooks/mutations";
import { useAuth } from "@/src/hooks/useAuth";
import { profileService } from "@/src/services";

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function EditProfileScreenComponent() {
  const { user } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [selectedLocalAvatarUri, setSelectedLocalAvatarUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialName = useMemo(() => {
    const fromMeta = user?.user_metadata?.full_name as string | undefined;
    const fromName = user?.user_metadata?.name as string | undefined;
    return fromMeta ?? fromName ?? "";
  }, [user?.user_metadata]);

  const initialAvatarUrl = useMemo(() => {
    const fromMeta = user?.user_metadata?.avatar_url as string | undefined;
    const fromPicture = user?.user_metadata?.picture as string | undefined;
    return fromMeta ?? fromPicture ?? null;
  }, [user?.user_metadata]);

  useEffect(() => {
    setFullName(initialName);
    setAvatarPreviewUri(initialAvatarUrl);
    setSelectedLocalAvatarUri(null);
  }, [initialAvatarUrl, initialName]);

  const handlePickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photos permission is required to choose a profile image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const uri = result.assets[0]?.uri;
    if (!uri) return;
    setError(null);
    setSelectedLocalAvatarUri(uri);
    setAvatarPreviewUri(uri);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id) return;
    const next = normalizeName(fullName);
    if (!next) {
      setError("Full name is required.");
      return;
    }

    setError(null);
    try {
      let avatarUrlPatch: string | undefined;
      if (selectedLocalAvatarUri) {
        avatarUrlPatch = await profileService.uploadProfileAvatar(user.id, selectedLocalAvatarUri);
      }

      await updateProfileMutation.mutateAsync({
        avatarUrl: avatarUrlPatch,
        fullName: next,
      });

      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile.");
    }
  }, [fullName, selectedLocalAvatarUri, updateProfileMutation, user?.id]);

  return (
    <ModalSheet eyebrow="Profile" title="Edit Profile">
      <View className="items-center gap-3">
        <View className="h-24 w-24 overflow-hidden rounded-full border border-border bg-surface-muted">
          {avatarPreviewUri ? (
            <Image source={{ uri: avatarPreviewUri }} style={{ height: "100%", width: "100%" }} />
          ) : null}
        </View>
        <AppButton onPress={handlePickAvatar} size="sm" variant="ghost">
          Change Photo
        </AppButton>
      </View>

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
          <AppButton isLoading={updateProfileMutation.isPending} onPress={handleSave} variant="secondary">
            Save
          </AppButton>
        </View>
      </View>
    </ModalSheet>
  );
}

export const EditProfileScreen = memo(EditProfileScreenComponent);
