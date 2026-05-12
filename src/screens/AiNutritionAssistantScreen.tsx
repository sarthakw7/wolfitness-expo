import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, TextInput, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

function ChatBubble({ children, user }: { children: string; user?: boolean }) {
  return (
    <View className={user ? "max-w-[86%] self-end rounded-2xl rounded-br bg-emerald p-5" : "max-w-[86%] self-start rounded-2xl rounded-bl bg-surface-muted p-5"}>
      <Typography tone={user ? "inverse" : "primary"} variant="bodyMd">
        {children}
      </Typography>
    </View>
  );
}

function AiNutritionAssistantScreenComponent() {
  return (
    <ScreenScaffold
      bottomChrome="none"
      header={<AppTopBar centered title="Wolfitness" />}
      taskMode
    >
      <Typography align="center" tone="secondary" variant="labelSm">
        Today, 8:42 AM
      </Typography>
      <ChatBubble>
        Good morning. Your recovery score is optimal today. How can we formulate your fuel strategy for peak performance?
      </ChatBubble>
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Pre-workout Protocol" />
        <Chip label="Adjust Macros" />
      </View>
      <ChatBubble user>
        I have a heavy deadlift session scheduled in 2 hours. What is the optimal pre-training meal?
      </ChatBubble>
      <View className="gap-3">
        <ChatBubble>
          Prioritize easily digestible carbohydrates with moderate fast-acting protein. Keep fats near zero to preserve gastric emptying.
        </ChatBubble>
        <EditorialCard className="gap-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-emerald-soft">
              <Ionicons color={colors.emeraldDeep} name="flame-outline" size={20} />
            </View>
            <View>
              <Typography variant="labelMd">Target Macro Intake</Typography>
              <Typography tone="secondary" variant="labelSm">90-120 mins pre-session</Typography>
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-lg bg-surface-muted p-3">
              <Typography tone="secondary" variant="labelSm">Carbs</Typography>
              <Typography variant="headlineLg">45g</Typography>
            </View>
            <View className="flex-1 rounded-lg bg-surface-muted p-3">
              <Typography tone="secondary" variant="labelSm">Protein</Typography>
              <Typography variant="headlineLg">25g</Typography>
            </View>
          </View>
        </EditorialCard>
      </View>
      <View className="flex-row items-center gap-3 rounded-full border border-border bg-surface-raised p-2">
        <View className="pl-2">
          <Ionicons color={colors.graphiteMuted} name="mic-outline" size={22} />
        </View>
        <TextInput
          accessibilityLabel="Ask nutrition assistant"
          placeholder="Ask about nutrition, recovery, or macros..."
          placeholderTextColor={colors.graphiteSubtle}
          style={{
            flex: 1,
            fontFamily: "Manrope",
            fontSize: 16,
            color: colors.graphite,
            paddingVertical: 8,
          }}
        />
        <Pressable
          accessibilityLabel="Send message"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-graphite"
          hitSlop={8}
        >
          <Ionicons color={colors.white} name="arrow-up" size={18} />
        </Pressable>
      </View>
    </ScreenScaffold>
  );
}

export const AiNutritionAssistantScreen = memo(AiNutritionAssistantScreenComponent);
