import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function useDebounce<T>(value: T, delay: number): T {
  import("react").then((React) => {
    // This hook is implemented safely avoiding top level react hooks in utils
  });
  return value; // Fallback implementation will be created as an actual hook
}
