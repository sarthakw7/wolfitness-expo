import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useRef, useState, type ElementRef } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import { MEAL_CATEGORY_OPTIONS, MEAL_CATEGORY_PLACEHOLDER } from "../constants";
import type { MealPhotoCategoryValue } from "../types";
import { MealPhotoSourceAction } from "./MealPhotoSourceAction";

type MealPhotoPickerProps = {
  error?: string | null;
  isBusy?: boolean;
  mealCategory: MealPhotoCategoryValue | "";
  onMealCategoryChange: (value: MealPhotoCategoryValue | "") => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
};

type MenuAnchor = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function MealPhotoPickerComponent({
  error,
  isBusy = false,
  mealCategory,
  onMealCategoryChange,
  onPickCamera,
  onPickGallery,
}: MealPhotoPickerProps) {
  const { height, width } = useWindowDimensions();
  const fieldRef = useRef<ElementRef<typeof View> | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const stackActions = width < 360;

  const selectedOption = useMemo(
    () => MEAL_CATEGORY_OPTIONS.find((option) => option.value === mealCategory) ?? null,
    [mealCategory],
  );

  const closeMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const openMenu = useCallback(() => {
    if (isBusy) return;

    fieldRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      setMenuAnchor({
        height: measuredHeight,
        width: measuredWidth,
        x,
        y,
      });
    });
  }, [isBusy]);

  const handleToggleMenu = useCallback(() => {
    if (isBusy) return;
    if (menuAnchor) {
      closeMenu();
      return;
    }
    openMenu();
  }, [closeMenu, isBusy, menuAnchor, openMenu]);

  const handleSelectCategory = useCallback(
    (value: MealPhotoCategoryValue) => {
      onMealCategoryChange(value);
      closeMenu();
    },
    [closeMenu, onMealCategoryChange],
  );

  const menuWidth = menuAnchor ? Math.max(0, Math.min(menuAnchor.width, width - 32)) : 0;
  const menuLeft = menuAnchor
    ? Math.max(
        16,
        Math.min(menuAnchor.x, Math.max(16, width - menuWidth - 16)),
      )
    : 16;
  const menuTop = menuAnchor ? menuAnchor.y + menuAnchor.height + 8 : 0;
  const availableBelow = menuAnchor ? height - menuAnchor.y - menuAnchor.height - 24 : 0;
  const menuMaxHeight = Math.max(176, Math.min(280, availableBelow));
  const fieldLabel = selectedOption?.label ?? MEAL_CATEGORY_PLACEHOLDER;

  return (
    <View className="gap-5">
      <View className={stackActions ? "gap-3" : "flex-row gap-3"}>
        <MealPhotoSourceAction
          accessibilityLabel="Take a meal photo with the camera"
          description="Use your camera"
          disabled={isBusy}
          icon="camera-outline"
          label="Take Photo"
          className={stackActions ? "w-full" : "flex-1"}
          onPress={onPickCamera}
          tone="primary"
        />
        <MealPhotoSourceAction
          accessibilityLabel="Choose a meal photo from the gallery"
          description="Pick an existing photo"
          disabled={isBusy}
          icon="images-outline"
          label="Choose from Gallery"
          className={stackActions ? "w-full" : "flex-1"}
          onPress={onPickGallery}
        />
      </View>

      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          Meal category
        </Typography>
        <View ref={fieldRef} collapsable={false}>
          <Pressable
            accessibilityLabel="Choose meal category"
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy, expanded: Boolean(menuAnchor) }}
            className={cn(
              "flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-4",
              isBusy ? "opacity-60" : "opacity-100",
            )}
            disabled={isBusy}
            onPress={handleToggleMenu}
            style={({ pressed }) => ({
              transform: [{ scale: pressed && !isBusy ? 0.992 : 1 }],
            })}
          >
            <View className="flex-row flex-1 items-center gap-3 min-w-0">
              <View
                className="h-11 w-11 items-center justify-center rounded-full border border-border"
                style={{ backgroundColor: colors.surfaceMuted }}
              >
                <Ionicons color={colors.graphite} name="restaurant-outline" size={18} />
              </View>
              <View className="flex-1 min-w-0">
                <Typography
                  tone={mealCategory ? "primary" : "secondary"}
                  className="leading-6"
                  numberOfLines={1}
                  variant="labelMd"
                >
                  {fieldLabel}
                </Typography>
              </View>
            </View>
            <Ionicons
              color={colors.graphiteMuted}
              name={menuAnchor ? "chevron-up" : "chevron-down"}
              size={18}
            />
          </Pressable>
        </View>
        <Typography tone="secondary" variant="labelSm">
          Optional. Helps Wolf AI understand the context of the meal.
        </Typography>
      </View>

      {error ? (
        <View className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3">
          <Typography tone="danger" variant="labelSm">
            {error}
          </Typography>
        </View>
      ) : null}

      <View className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
        <View className="flex-row items-start gap-3">
          <View
            className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surfaceRaised }}
          >
            <Ionicons color={colors.graphiteMuted} name="bulb-outline" size={16} />
          </View>
          <Typography tone="secondary" variant="labelSm">
            Use good lighting and keep the full meal visible.
          </Typography>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={closeMenu}
        transparent
        visible={Boolean(menuAnchor)}
      >
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          {menuAnchor ? (
            <View
              pointerEvents="box-none"
              style={[
                styles.menu,
                {
                  left: menuLeft,
                  maxHeight: menuMaxHeight,
                  top: menuTop,
                  width: menuWidth,
                },
              ]}
            >
              <View className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: menuMaxHeight }}
                >
                  {MEAL_CATEGORY_OPTIONS.map((option, index) => {
                    const active = option.value === mealCategory;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        className={cn(
                          "flex-row items-center justify-between gap-3 px-4 py-3",
                          index > 0 ? "border-t border-border" : null,
                          active ? "bg-emerald/10" : "bg-transparent",
                        )}
                        key={option.value}
                        onPress={() => handleSelectCategory(option.value)}
                      >
                        <Typography variant="labelMd">{option.label}</Typography>
                        {active ? <Ionicons color={colors.emerald} name="checkmark" size={18} /> : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

export const MealPhotoPicker = memo(MealPhotoPickerComponent);

const styles = StyleSheet.create({
  menu: {
    position: "absolute",
    zIndex: 20,
  },
});
