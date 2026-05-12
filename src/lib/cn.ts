type ClassValue = false | null | string | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((className): className is string => Boolean(className)).join(" ");
}
