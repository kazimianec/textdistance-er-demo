import { useQuery } from "@tanstack/react-query";
import { compare, CompareResponse } from "../api/client";

export function useCompare(text1: string, text2: string, enabled = true) {
  return useQuery<CompareResponse>({
    queryKey: ["compare", text1, text2],
    queryFn: () => compare(text1, text2).then((r) => r.data),
    enabled: enabled && text1.trim().length > 0 && text2.trim().length > 0,
    staleTime: 30_000,
  });
}
