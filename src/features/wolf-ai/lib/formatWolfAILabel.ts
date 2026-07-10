const KNOWN_LABELS: Record<string, string> = {
  fat_loss: "Fat Loss",
  general_fitness: "General Fitness",
  improve_endurance: "Improve Endurance",
  muscle_gain: "Muscle Gain",
};

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

export function formatWolfAILabel(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return "";

  const mapped = KNOWN_LABELS[normalized.toLowerCase()];
  return mapped ?? titleCase(normalized);
}
