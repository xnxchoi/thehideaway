import { useTheme as useRPTheme } from "@/providers/Theme";
export const useTheme = () => {
  const theme = useRPTheme((r) => r.theme);
  return { theme };
};
