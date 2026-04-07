import axios from "axios";

export interface AlgorithmInfo {
  name: string;
  description: string;
  type: "distance" | "similarity";
  best_for: string[];
}

export interface CompareResponse {
  text1: string;
  text2: string;
  scores: Record<string, number>;
}

const api = axios.create({ baseURL: "" }); // Uses Vite proxy

export const compare = (text1: string, text2: string) =>
  api.post<CompareResponse>("/compare", { text1, text2 });

export const listAlgorithms = () =>
  api.get<AlgorithmInfo[]>("/algorithms");

export default api;
