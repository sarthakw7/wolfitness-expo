import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useNutritionCoach } from "@/src/hooks/mutations";
import { useAuth } from "@/src/hooks/useAuth";
import type { NutritionCoachResponse } from "@/src/services/nutrition.service";
import { colors } from "@/src/theme";

type AssistantMessage = NutritionCoachResponse & {
  id: string;
  prompt: string;
  timestamp: string;
  type: "assistant";
};

type UserMessage = {
  id: string;
  text: string;
  timestamp: string;
  type: "user";
};

type ChatMessage = AssistantMessage | UserMessage;

type StoredConversation = {
  answer: string;
  followUpQuestion: string;
  macroStatus: NutritionCoachResponse["macroStatus"];
  prompt: string;
  reasoningTags: string[];
  recommendedMeals: NutritionCoachResponse["recommendedMeals"];
  timestamp: string;
};

const HISTORY_KEY_PREFIX = "wolfitness:ai:nutrition:history";
const MAX_CONVERSATIONS = 20;

const QUICK_PROMPTS = [
  { label: "What should I eat next?", prompt: "What should I eat next?", icon: "sparkles-outline" },
  { label: "Meal ideas", prompt: "Meal ideas that fit my macros", icon: "restaurant-outline" },
  { label: "How much protein left?", prompt: "How much protein do I have left today?", icon: "barbell-outline" },
  { label: "Post workout meals", prompt: "What should I eat after my workout today?", icon: "fitness-outline" },
  { label: "Need Protein", prompt: "Give me a high-protein meal suggestion that fits my remaining macros.", icon: "flash-outline" },
  { label: "Recovery Meal", prompt: "Suggest a recovery meal for today that fits my remaining macros.", icon: "leaf-outline" },
  { label: "Low Calorie Snack", prompt: "Suggest a low-calorie snack that fits my remaining macros.", icon: "cafe-outline" },
  { label: "Vegetarian Meal", prompt: "Suggest a vegetarian meal that fits my remaining macros.", icon: "nutrition-outline" },
] as const satisfies ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  prompt: string;
}>;

function PromptPill({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2"
      hitSlop={6}
      onPress={onPress}
    >
      <Ionicons color={colors.graphiteMuted} name={icon} size={14} />
      <Typography className="uppercase tracking-widest" variant="labelSm">
        {label}
      </Typography>
    </Pressable>
  );
}

function AssistantBubble({ children }: { children: string }) {
  return (
    <View className="w-full max-w-[85%] flex-row items-end gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted">
        <Ionicons color={colors.emeraldDeep} name="leaf-outline" size={16} />
      </View>
      <View className="flex-1 rounded-2xl rounded-bl-md border border-border bg-surface-muted p-5">
        <Typography variant="bodyMd">{children}</Typography>
      </View>
    </View>
  );
}

function UserBubble({ children }: { children: string }) {
  return (
    <View className="w-full items-end">
      <View className="w-full max-w-[85%] rounded-2xl rounded-br-md bg-emerald p-6">
        <Typography tone="inverse" variant="bodyMd">
          {children}
        </Typography>
      </View>
    </View>
  );
}

function MacroStatusCard({ macroStatus }: Pick<AssistantMessage, "macroStatus">) {
  const items = [
    { label: "Protein Left", suffix: "g", value: macroStatus.proteinRemaining },
    { label: "Calories Left", suffix: "kcal", value: macroStatus.caloriesRemaining },
    { label: "Carbs Left", suffix: "g", value: macroStatus.carbsRemaining },
    { label: "Fat Left", suffix: "g", value: macroStatus.fatRemaining },
  ].filter((item) => item.value !== null);

  if (!items.length) {
    return null;
  }

  return (
    <EditorialCard className="gap-4">
      <Typography className="uppercase tracking-widest" tone="secondary" variant="labelSm">
        Macro Status
      </Typography>
      <View className="flex-row flex-wrap gap-3">
        {items.map((item) => (
          <View className="min-w-[120px] flex-1 rounded-xl bg-surface-muted p-3" key={item.label}>
            <Typography tone="secondary" variant="labelSm">
              {item.label}
            </Typography>
            <Typography variant="headlineLg">
              {Math.round(item.value ?? 0)} {item.suffix}
            </Typography>
          </View>
        ))}
      </View>
    </EditorialCard>
  );
}

function MealRecommendationCard({
  onActionPress,
  meal,
}: {
  onActionPress: (action: "add_to_tracker" | "log_meal" | "use_suggestion", mealName: string) => void;
  meal: AssistantMessage["recommendedMeals"][number];
}) {
  return (
    <EditorialCard className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography variant="headlineLg">{meal.name}</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {meal.why}
          </Typography>
        </View>
        <View className="items-end">
          <Typography variant="headlineLg">{meal.estimatedCalories ?? "--"}</Typography>
          <Typography tone="secondary" variant="labelSm">
            kcal
          </Typography>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-4">
        <Typography tone="secondary" variant="labelSm">
          Protein {meal.estimatedProtein ?? "--"}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          Carbs {meal.estimatedCarbs ?? "--"}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          Fat {meal.estimatedFat ?? "--"}g
        </Typography>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <AppButton className="rounded-full" onPress={() => onActionPress("log_meal", meal.name)} size="sm" variant="secondary">
          Log Meal
        </AppButton>
        <AppButton className="rounded-full" onPress={() => onActionPress("add_to_tracker", meal.name)} size="sm" variant="ghost">
          Add To Tracker
        </AppButton>
        <AppButton className="rounded-full" onPress={() => onActionPress("use_suggestion", meal.name)} size="sm" variant="ghost">
          Use Suggestion
        </AppButton>
      </View>
    </EditorialCard>
  );
}

function isStoredConversation(value: unknown): value is StoredConversation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const conversation = value as Partial<StoredConversation>;
  return (
    typeof conversation.prompt === "string" &&
    typeof conversation.answer === "string" &&
    typeof conversation.followUpQuestion === "string" &&
    typeof conversation.timestamp === "string" &&
    Array.isArray(conversation.recommendedMeals)
  );
}

function buildMessagesFromHistory(history: StoredConversation[]): ChatMessage[] {
  return history.flatMap((conversation, index) => {
    const baseId = `${conversation.timestamp}-${index}`;

    return [
      {
        id: `user-${baseId}`,
        text: conversation.prompt,
        timestamp: conversation.timestamp,
        type: "user" as const,
      },
      {
        answer: conversation.answer,
        followUpQuestion: conversation.followUpQuestion,
        id: `assistant-${baseId}`,
        macroStatus: conversation.macroStatus,
        prompt: conversation.prompt,
        reasoningTags: conversation.reasoningTags,
        recommendedMeals: conversation.recommendedMeals,
        timestamp: conversation.timestamp,
        type: "assistant" as const,
      },
    ];
  });
}

function getHistoryStorageKey(userId: string) {
  return `${HISTORY_KEY_PREFIX}:${userId}`;
}

function AiNutritionAssistantScreenComponent() {
  const { user } = useAuth();
  const nutritionCoachMutation = useNutritionCoach();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nutritionCoachMutation.error) {
      console.warn("[nutrition-ai]", "Wolf AI Coach screen request failed.", {
        message:
          nutritionCoachMutation.error instanceof Error
            ? nutritionCoachMutation.error.message
            : String(nutritionCoachMutation.error),
        screen: "AiNutritionAssistant",
      });
    }
  }, [nutritionCoachMutation.error]);

  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      setLastPrompt(null);
      return;
    }

    const historyKey = getHistoryStorageKey(user.id);

    AsyncStorage.getItem(historyKey)
      .then((raw) => {
        if (!raw) {
          return;
        }

        try {
          const parsed = JSON.parse(raw) as unknown;
          if (!Array.isArray(parsed)) {
            throw new Error("Stored nutrition AI history is not an array.");
          }

          const history = parsed.filter(isStoredConversation).slice(-MAX_CONVERSATIONS);
          setMessages(buildMessagesFromHistory(history));
          setLastPrompt(history.at(-1)?.prompt ?? null);
        } catch (storageError) {
          console.warn("[nutrition-ai]", "Failed to restore nutrition AI history.", {
            message: storageError instanceof Error ? storageError.message : String(storageError),
            userId: user.id,
            screen: "AiNutritionAssistant",
            type: "history-parse",
          });
          setMessages([]);
          setLastPrompt(null);
          AsyncStorage.removeItem(historyKey).catch(() => {});
        }
      })
      .catch((storageError) => {
        console.warn("[nutrition-ai]", "Failed to read nutrition AI history.", {
          message: storageError instanceof Error ? storageError.message : String(storageError),
          userId: user.id,
          screen: "AiNutritionAssistant",
          type: "history-read",
        });
        setMessages([]);
        setLastPrompt(null);
      });
  }, [user?.id]);

  const persistConversation = useCallback(async (conversation: StoredConversation) => {
    if (!user?.id) {
      return;
    }

    const historyKey = getHistoryStorageKey(user.id);

    try {
      const raw = await AsyncStorage.getItem(historyKey);
      let history: StoredConversation[] = [];

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            history = parsed.filter(isStoredConversation);
          } else {
            throw new Error("Stored nutrition AI history is not an array.");
          }
        } catch (storageError) {
          console.warn("[nutrition-ai]", "Failed to parse nutrition AI history during save.", {
            message: storageError instanceof Error ? storageError.message : String(storageError),
            screen: "AiNutritionAssistant",
            type: "history-save-parse",
            userId: user.id,
          });
          history = [];
        }
      }

      const nextHistory = [...history, conversation].slice(-MAX_CONVERSATIONS);
      await AsyncStorage.setItem(historyKey, JSON.stringify(nextHistory));
    } catch (storageError) {
      console.warn("[nutrition-ai]", "Failed to persist nutrition AI history.", {
        message: storageError instanceof Error ? storageError.message : String(storageError),
        screen: "AiNutritionAssistant",
        type: "history-write",
        userId: user.id,
      });
    }
  }, [user?.id]);

  const handleClearChat = useCallback(async () => {
    if (!user?.id) {
      setMessages([]);
      setLastPrompt(null);
      setError(null);
      return;
    }

    const historyKey = getHistoryStorageKey(user.id);

    try {
      await AsyncStorage.removeItem(historyKey);
    } catch (storageError) {
      console.warn("[nutrition-ai]", "Failed to clear nutrition AI history.", {
        message: storageError instanceof Error ? storageError.message : String(storageError),
        screen: "AiNutritionAssistant",
        type: "history-clear",
        userId: user.id,
      });
    }

    setMessages([]);
    setLastPrompt(null);
    setError(null);
  }, [user?.id]);

  const handleMealAction = useCallback(
    (action: "add_to_tracker" | "log_meal" | "use_suggestion", mealName: string) => {
      console.info("[nutrition-ai]", "Meal action tapped.", {
        action,
        mealName,
        screen: "AiNutritionAssistant",
      });

      router.push({
        params: { prefillMealName: mealName },
        pathname: "/(modals)/add-meal",
      });
    },
    [],
  );

  const submitPrompt = useCallback(
    async (prompt: string, options?: { appendUser?: boolean; clearInput?: boolean }) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt || nutritionCoachMutation.isPending) {
        return;
      }

      setError(null);
      setLastPrompt(trimmedPrompt);
      console.info("[nutrition-ai]", "Prompt sent.", {
        prompt: trimmedPrompt,
        screen: "AiNutritionAssistant",
      });

      if (options?.appendUser ?? true) {
        const userTimestamp = new Date().toISOString();
        setMessages((current) => [
          ...current,
          {
            id: `user-${Date.now()}`,
            text: trimmedPrompt,
            timestamp: userTimestamp,
            type: "user",
          },
        ]);
      }

      if (options?.clearInput ?? true) {
        setInput("");
      }

      try {
        const response = await nutritionCoachMutation.mutateAsync({ message: trimmedPrompt });
        const timestamp = new Date().toISOString();
        const conversation: StoredConversation = {
          answer: response.answer,
          followUpQuestion: response.followUpQuestion,
          macroStatus: response.macroStatus,
          prompt: trimmedPrompt,
          reasoningTags: response.reasoningTags,
          recommendedMeals: response.recommendedMeals,
          timestamp,
        };

        setMessages((current) => [
          ...current,
          {
            ...response,
            id: `assistant-${Date.now()}`,
            prompt: trimmedPrompt,
            timestamp,
            type: "assistant",
          },
        ]);
        await persistConversation(conversation);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to reach Wolf AI Coach.");
      }
    },
    [nutritionCoachMutation, persistConversation],
  );

  const footer = (
    <View className="px-container pb-6">
      <View className="flex-row items-center gap-3 rounded-full border border-border bg-surface-raised p-2">
        <View className="pl-2">
          <Ionicons color={colors.graphiteMuted} name="mic-outline" size={22} />
        </View>
        <TextInput
          accessibilityLabel="Ask Wolf AI Coach"
          editable={!nutritionCoachMutation.isPending}
          onChangeText={(text) => {
            setError(null);
            setInput(text);
          }}
          onSubmitEditing={() => submitPrompt(input)}
          placeholder="Ask about nutrition, recovery, or macros..."
          placeholderTextColor={colors.graphiteSubtle}
          style={{
            color: colors.graphite,
            flex: 1,
            fontFamily: "Manrope",
            fontSize: 16,
            paddingVertical: 8,
          }}
          value={input}
        />
        <Pressable
          accessibilityLabel="Send message"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-graphite"
          disabled={nutritionCoachMutation.isPending}
          hitSlop={8}
          onPress={() => submitPrompt(input)}
          style={({ pressed }) => ({ opacity: pressed || nutritionCoachMutation.isPending ? 0.7 : 1 })}
        >
          <Ionicons color={colors.white} name="arrow-up" size={18} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <ScreenScaffold
      bottomChrome="none"
      footer={footer}
      header={<AppTopBar centered title="Wolfitness" />}
      taskMode
    >
      <View className="gap-4 px-gutter">
        <View className="items-center py-2">
          <Typography className="uppercase tracking-widest" tone="secondary" variant="labelSm">
            Today
          </Typography>
        </View>

        {messages.length === 0 ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Wolf AI Coach</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your AI nutrition coach already knows your goals, meals and workouts.
            </Typography>
          </EditorialCard>
        ) : null}

        <View className="flex-row flex-wrap gap-2">
          {QUICK_PROMPTS.map((item) => (
            <PromptPill
              icon={item.icon}
              key={item.label}
              label={item.label}
              onPress={() => submitPrompt(item.prompt, { appendUser: true, clearInput: false })}
            />
          ))}
          {messages.length > 0 ? (
            <AppButton onPress={handleClearChat} size="sm" variant="ghost">
              Clear Chat
            </AppButton>
          ) : null}
        </View>

        <View className="gap-4">
          {messages.map((message) => {
            if (message.type === "user") {
              return <UserBubble key={message.id}>{message.text}</UserBubble>;
            }

            return (
              <View className="gap-3" key={message.id}>
                <AssistantBubble>{message.answer}</AssistantBubble>
                <MacroStatusCard macroStatus={message.macroStatus} />
                {message.recommendedMeals.map((meal, index) => (
                  <MealRecommendationCard
                    key={`${message.id}-meal-${index}`}
                    meal={meal}
                    onActionPress={handleMealAction}
                  />
                ))}
                {message.reasoningTags.length ? (
                  <View className="flex-row flex-wrap gap-2">
                    {message.reasoningTags.map((tag) => (
                      <Chip key={`${message.id}-${tag}`} label={tag} />
                    ))}
                  </View>
                ) : null}
                <EditorialCard className="gap-2">
                  <Typography className="uppercase tracking-widest" tone="secondary" variant="labelSm">
                    Follow-up
                  </Typography>
                  <Typography tone="secondary" variant="bodyMd">
                    {message.followUpQuestion}
                  </Typography>
                </EditorialCard>
              </View>
            );
          })}
        </View>

        {nutritionCoachMutation.isPending ? (
          <EditorialCard className="gap-2">
            <Typography variant="headlineLg">Wolf AI is thinking...</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Building a response from your nutrition goals, meal logs, and workout context.
            </Typography>
          </EditorialCard>
        ) : null}

        {error ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to reach Wolf AI Coach</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {error}
            </Typography>
            {lastPrompt ? (
              <AppButton onPress={() => submitPrompt(lastPrompt, { appendUser: false, clearInput: false })} variant="secondary">
                Retry
              </AppButton>
            ) : null}
          </EditorialCard>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const AiNutritionAssistantScreen = memo(AiNutritionAssistantScreenComponent);
