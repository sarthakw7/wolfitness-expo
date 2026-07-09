export const SIGNAL_LIFECYCLE_COPY = {
  completed: {
    badge: "Completed",
    description: "Program completed. Restart from Week 1 Day 1 or view your completed workout history.",
  },
  noEnrollment: {
    badge: "No active program",
    description: "You are not currently joined to this program.",
  },
} as const;

export const SIGNAL_LIFECYCLE_ACTION_COPY = {
  reset: {
    confirmationBody:
      "Restart this program from Week 1 Day 1? Completed workout history will stay saved. Unfinished workout progress will be cleared.",
    confirmationTitle: "Reset program?",
    label: "Reset Program",
    pendingLabel: "Resetting...",
  },
  summary: {
    label: "View Summary",
    pendingLabel: "Opening Summary...",
  },
  session: {
    readyLabel: "Start Session",
    resumeLabel: "Resume Session",
    startPendingLabel: "Starting...",
    resumePendingLabel: "Resuming...",
  },
  unjoin: {
    confirmationBody:
      "Leave this program? Completed workout history will stay saved. Any unfinished workout progress will be cleared.",
    confirmationTitle: "Leave program?",
    label: "Unjoin Program",
    pendingLabel: "Leaving...",
  },
} as const;
