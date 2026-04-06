export interface TestCase {
  id: string
  text1: string
  text2: string
  shouldMatch: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  notes: string
  highlightHardPositive?: string[]
  highlightHardNegative?: string[]
}

export interface Showcase {
  id: string
  name: string
  description: string
  category: 'core' | 'additional'
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  cases: TestCase[]
}

export interface AlgorithmScore {
  name: string
  score: number
  normalized: 'high' | 'medium' | 'low'
}

export interface CompareResult {
  text1: string
  text2: string
  scores: Record<string, number>
  correctPredictions: string[]
  incorrectPredictions: string[]
  levenshteinFail: boolean
}
