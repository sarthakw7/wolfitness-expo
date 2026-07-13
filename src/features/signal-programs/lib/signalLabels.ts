export function getSignalBlockLabel(blockIndex: number) {
  if (blockIndex >= 0 && blockIndex < 26) {
    return String.fromCharCode(65 + blockIndex);
  }

  return `${blockIndex + 1}`;
}

export function getSignalExerciseLabel(blockLabel: string, exerciseIndex: number) {
  return `${blockLabel}${exerciseIndex + 1}`;
}
