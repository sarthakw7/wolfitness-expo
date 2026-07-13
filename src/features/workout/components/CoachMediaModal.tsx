import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";
import { WebView } from "react-native-webview";

import { AppButton, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type CoachMediaModalProps = {
  embedUrl: string | null;
  hasPlaybackError: boolean;
  onClose: () => void;
  onOpenOriginalVideo: () => void;
  onPlaybackError: () => void;
  paddingTop: number;
  title: string;
};

export function CoachMediaModal({
  embedUrl,
  hasPlaybackError,
  onClose,
  onOpenOriginalVideo,
  onPlaybackError,
  paddingTop,
  title,
}: CoachMediaModalProps) {
  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 px-4 pb-4" style={{ paddingTop }}>
        <View className="flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1316]">
          <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
            <View className="flex-1 pr-3">
              <Typography className="tracking-[1px] opacity-70" tone="inverse" variant="labelSm">
                COACH DEMO
              </Typography>
              <Typography numberOfLines={1} tone="inverse" variant="bodyLg">
                {title}
              </Typography>
            </View>
            <Pressable
              accessibilityLabel="Close demo"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
              hitSlop={8}
              onPress={onClose}
            >
              <Ionicons color={colors.white} name="close" size={18} />
            </Pressable>
          </View>

          <View className="flex-1 bg-black">
            {embedUrl && !hasPlaybackError ? (
              <WebView
                allowsFullscreenVideo
                javaScriptEnabled
                mediaPlaybackRequiresUserAction={false}
                onError={onPlaybackError}
                source={{ uri: embedUrl }}
                startInLoadingState
                renderLoading={() => (
                  <View className="flex-1 items-center justify-center bg-black">
                    <ActivityIndicator color={colors.emerald} />
                  </View>
                )}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Typography align="center" className="opacity-80" tone="inverse" variant="bodyMd">
                  We could not play this video in-app.
                </Typography>
                <AppButton className="mt-4" onPress={onOpenOriginalVideo} variant="secondary">
                  Open original video
                </AppButton>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
