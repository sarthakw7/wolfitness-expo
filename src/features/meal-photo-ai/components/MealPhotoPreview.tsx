import { memo } from "react";
import { Image, View } from "react-native";

import { Typography } from "@/src/components/primitives";

import type { MealPhotoUploadImage } from "../types";

type MealPhotoPreviewProps = {
  image: MealPhotoUploadImage;
};

function formatFileSize(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function MealPhotoPreviewComponent({ image }: MealPhotoPreviewProps) {
  const fileSizeLabel = formatFileSize(image.size);

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Typography variant="headlineLg">Preview</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Check the photo before analyzing. You can change it at any time.
        </Typography>
      </View>

      <View className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
        <Image source={{ uri: image.uri }} style={{ aspectRatio: 4 / 3, width: "100%" }} />
      </View>

      <View className="flex-row flex-wrap gap-3">
        <Typography tone="secondary" variant="labelSm">
          {image.width ? `${image.width}px wide` : "Image selected"}
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          {image.height ? `${image.height}px tall` : " "}
        </Typography>
        {fileSizeLabel ? (
          <Typography tone="secondary" variant="labelSm">
            {fileSizeLabel}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}

export const MealPhotoPreview = memo(MealPhotoPreviewComponent);
