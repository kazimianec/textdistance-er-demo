import { Box, LinearProgress, Typography, Chip, Tooltip } from '@mui/material'
import { algorithmDescriptions } from '../data/showcases'

interface AlgorithmBarProps {
  scores: Record<string, number>
  shouldMatch: boolean
  highlightAlgorithms?: string[]
}

type Verdict = 'correct' | 'wrong' | 'uncertain'

/** Thresholds used to turn a raw score into a match / no-match decision. */
const MATCH_THRESHOLD = 0.7
const NO_MATCH_THRESHOLD = 0.3

export default function AlgorithmBar({ scores, shouldMatch, highlightAlgorithms = [] }: AlgorithmBarProps) {
  const sortedScores = Object.entries(scores)
    .filter(([key]) => key !== 'identity')
    .sort(([, a], [, b]) => b - a)

  /** What the algorithm's score implies about a match, independent of ground truth. */
  const getVerdict = (score: number): Verdict => {
    if (score >= MATCH_THRESHOLD) return 'correct'
    if (score <= NO_MATCH_THRESHOLD) return 'wrong'
    return 'uncertain'
  }

  /**
   * Colour by whether the algorithm's implied verdict agrees with the ground truth.
   * A highlighted algorithm is NOT forced green: on a hard negative the highlighted
   * algorithms are precisely the ones that fail, and hiding that would be a lie.
   */
  const getColor = (verdict: Verdict): string => {
    if (verdict === 'correct') return 'success.main'
    if (verdict === 'uncertain') return 'warning.main'
    return 'error.main'
  }

  const isCorrect = (score: number): boolean => {
    const verdict = getVerdict(score)
    if (shouldMatch) return verdict === 'correct'
    return verdict === 'wrong'
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {sortedScores.map(([name, score]) => {
        const info = algorithmDescriptions[name]
        const verdict = getVerdict(score)
        const color = getColor(verdict)
        const correct = isCorrect(score)
        const isHighlight = highlightAlgorithms.includes(name)

        return (
          <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`${info?.description || ''}`} arrow>
              <Typography
                variant="caption"
                sx={{
                  width: 140,
                  fontFamily: 'monospace',
                  fontWeight: isHighlight ? 700 : 400,
                  color: isHighlight ? 'primary.light' : 'text.secondary',
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {info?.name || name}
              </Typography>
            </Tooltip>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <LinearProgress
                variant="determinate"
                value={score * 100}
                sx={{
                  height: 20,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                    borderRadius: 1,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.primary',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                }}
              >
                {score.toFixed(2)}
              </Typography>
            </Box>
            {isHighlight && (
              <Chip label="KEY" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem' }} />
            )}
            {correct ? (
              <Chip
                label="✓"
                size="small"
                color="success"
                sx={{ height: 20, minWidth: 24 }}
                title={shouldMatch ? 'Correctly identifies a match' : 'Correctly rules out a match'}
              />
            ) : (
              <Chip
                label="✗"
                size="small"
                color="error"
                sx={{ height: 20, minWidth: 24 }}
                title={shouldMatch ? 'Misses a real match' : 'Falsely predicts a match'}
              />
            )}
          </Box>
        )
      })}
    </Box>
  )
}
