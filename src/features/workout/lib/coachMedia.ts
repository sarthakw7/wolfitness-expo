import {
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  parseYouTubeVideoId,
} from "@/src/lib/youtube-media";
import type { WorkoutExercise } from "@/src/services/workout.service";

export type SignalCoachMediaPreview = {
  thumbnailUrl: string | null;
  title: string;
  url: string | null;
  videoId: string | null;
};

export function isValidHttpUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function buildSignalDemoSearchUrl(exerciseName: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise form`)}`;
}

export function getSignalCoachMediaPreview(workoutExercise: WorkoutExercise | null | undefined, exerciseName: string): SignalCoachMediaPreview | null {
  if (!workoutExercise) return null;

  const library = workoutExercise.exercise;
  const mediaItems = Array.isArray(library.media_items) ? library.media_items : [];
  const firstMedia = mediaItems[0] ?? null;
  const fallbackVideoId = firstMedia?.videoId ?? parseYouTubeVideoId(library.video_url);

  if (!firstMedia && !fallbackVideoId && !library.video_url) {
    return null;
  }

  return {
    thumbnailUrl: firstMedia?.thumbnailUrl ?? (fallbackVideoId ? buildYouTubeThumbnailUrl(fallbackVideoId) : null),
    title: firstMedia?.title?.trim() || library.video_title?.trim() || exerciseName,
    url: firstMedia?.url ?? (fallbackVideoId ? buildYouTubeWatchUrl(fallbackVideoId) : library.video_url),
    videoId: firstMedia?.videoId ?? fallbackVideoId,
  };
}
