type ClassValue = string | false | null | undefined

/** Joins truthy class names with a single space. A tiny stand-in for `clsx`. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
