import { memo, type ReactNode } from "react";

import { Typography } from "@/src/components/primitives";

type Align = "auto" | "left" | "right" | "center" | "justify";

export const OnboardingQuestion = memo(function OnboardingQuestion({
  children,
  align,
}: {
  children: ReactNode;
  align?: Align;
}) {
  return (
    <Typography align={align} className="text-[#F4F1EE]" variant="displayLg">
      {children}
    </Typography>
  );
});

export const OnboardingSubtext = memo(function OnboardingSubtext({
  children,
  align,
}: {
  children: ReactNode;
  align?: Align;
}) {
  return (
    <Typography align={align} className="text-[#C4C7C7]" variant="bodyMd">
      {children}
    </Typography>
  );
});

