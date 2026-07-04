export type WorkoutExerciseMedia = {
  id: string;
  provider: "youtube";
  thumbnailUrl: string;
  title?: string | null;
  type: "youtube";
  url: string;
  videoId: string;
};

function createMediaId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `media_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function normalizeHostname(value: string) {
  return value.replace(/^www\./i, "").replace(/^m\./i, "").replace(/^music\./i, "").toLowerCase();
}

export function parseYouTubeVideoId(value: string | null | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const host = normalizeHostname(url.hostname);
    const path = url.pathname.replace(/^\/+/, "");

    if (host === "youtu.be") {
      const [videoId] = path.split("/");
      return videoId?.trim() || null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (path === "watch" || path === "") {
        return url.searchParams.get("v")?.trim() || null;
      }

      const [section, videoId] = path.split("/");
      if (section === "embed" || section === "shorts" || section === "live") {
        return videoId?.trim() || null;
      }

      return url.searchParams.get("v")?.trim() || null;
    }

    return null;
  } catch {
    return null;
  }
}

export function buildYouTubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYouTubeEmbedUrl(videoId: string, autoplay = true) {
  return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&autoplay=${autoplay ? "1" : "0"}`;
}

export function buildYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function buildWorkoutExerciseMedia(url: string, title?: string | null): WorkoutExerciseMedia | null {
  const videoId = parseYouTubeVideoId(url);
  if (!videoId) return null;

  return {
    id: createMediaId(),
    provider: "youtube",
    thumbnailUrl: buildYouTubeThumbnailUrl(videoId),
    title: title?.trim() || null,
    type: "youtube",
    url: buildYouTubeWatchUrl(videoId),
    videoId,
  };
}

function normalizeWorkoutExerciseMediaCandidate(value: unknown): WorkoutExerciseMedia | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<WorkoutExerciseMedia> & {
    thumbnail_url?: unknown;
    title?: unknown;
    url?: unknown;
    videoId?: unknown;
    video_id?: unknown;
  };

  const url = typeof candidate.url === "string" ? candidate.url : null;
  const videoId =
    typeof candidate.videoId === "string"
      ? candidate.videoId.trim() || null
      : typeof candidate.video_id === "string"
        ? candidate.video_id.trim() || null
        : parseYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  const thumbnailUrl =
    typeof candidate.thumbnailUrl === "string" && candidate.thumbnailUrl.trim()
      ? candidate.thumbnailUrl.trim()
      : typeof candidate.thumbnail_url === "string" && candidate.thumbnail_url.trim()
        ? candidate.thumbnail_url.trim()
        : buildYouTubeThumbnailUrl(videoId);

  return {
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : createMediaId(),
    provider: "youtube",
    thumbnailUrl,
    title: typeof candidate.title === "string" ? candidate.title.trim() || null : null,
    type: "youtube",
    url: buildYouTubeWatchUrl(videoId),
    videoId,
  };
}

export function normalizeWorkoutExerciseMediaList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === "string") {
      const normalized = buildWorkoutExerciseMedia(item);
      return normalized ? [normalized] : [];
    }

    const normalized = normalizeWorkoutExerciseMediaCandidate(item);
    return normalized ? [normalized] : [];
  });
}

