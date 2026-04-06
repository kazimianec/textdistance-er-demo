import { Box, LinearProgress, Typography, Chip, Tooltip } from '@mui/material'
import { algorithmDescriptions } from '../data/showcases'

interface AlgorithmBarProps {
  scores: Record<string, number>
  shouldMatch: boolean
  highlightAlgorithms?: string[]
}

export default function AlgorithmBar({ scores, shouldMatch, highlightAlgorithms = [] }: AlgorithmBarProps) {
  const sortedScores = Object.entries(scores)
    .filter(([key]) => key !== 'identity')
    .sort(([, a], [, b]) => b - a)

  const getColor = (score: number, name: string) => {
    const isHighlighted = highlightAlgorithms.includes(name)
    const isHigh = score >= 0.8
    const isMedium = score >= 0.5

    if (isHighlighted && shouldMatch) {
      return 'success.main'
    }
    if (shouldMatch) {
      if (isHigh) return 'success.main'
      if (isMedium) return 'warning.main'
      return 'error.main'
    } else {
      if (score < 0.3) return 'success.main'
      if (score < 0.6) return 'warning.main'
      return 'error.main'
    }
  }

  const getPrediction = (score: number): 'match' | 'no-match' | 'uncertain' => {
    if (score >= 0.7) return 'match'
    if (score <= 0.3) return 'no-match'
    return 'uncertain'
  }

  const isCorrect = (score: number): boolean => {
    const prediction = getPrediction(score)
    if (shouldMatch) return prediction === 'match'
    return prediction === 'no-match'
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {sortedScores.map(([name, score]) => {
        const info = algorithmDescriptions[name]
        const correct = isCorrect(score)
        const color = getColor(score, name)
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
              <Chip label="✓" size="small" color="success" sx={{ height: 20, minWidth: 24 }} />
            ) : (
              <Chip label="✗" size="small" color="error" sx={{ height: 20, minWidth: 24 }} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}
