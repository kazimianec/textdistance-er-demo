import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material'
import { CompareArrows, Warning, CheckCircle, Cancel } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { compare } from '../api/client'
import { algorithmDescriptions } from '../data/showcases'

export default function ConsolidatedComparison() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [submitted1, setSubmitted1] = useState('')
  const [submitted2, setSubmitted2] = useState('')
  const [showLevenshteinLesson, setShowLevenshteinLesson] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['compare', submitted1, submitted2],
    queryFn: () => compare(submitted1, submitted2).then(r => r.data),
    enabled: submitted1.length > 0 && submitted2.length > 0,
  })

  const handleCompare = () => {
    setSubmitted1(text1)
    setSubmitted2(text2)
  }

  const sortedScores = data
    ? Object.entries(data.scores)
        .filter(([key]) => key !== 'identity')
        .sort(([, a], [, b]) => b - a)
    : []

  const highScores = sortedScores.filter(([, s]) => s >= 0.7).length
  const mediumScores = sortedScores.filter(([, s]) => s >= 0.4 && s < 0.7).length
  const lowScores = sortedScores.filter(([, s]) => s < 0.4).length

  const levenshteinScore = data?.scores['levenshtein'] ?? null
  const isLevenshteinHigh = levenshteinScore !== null && levenshteinScore >= 0.7
  const isLevenshteinLow = levenshteinScore !== null && levenshteinScore < 0.4

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Consolidated Comparison
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Enter two strings and see all 21 algorithms scored side-by-side with visual bars and rankings
      </Typography>

      <Paper sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              label="First string"
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              placeholder="e.g., International Business Machines"
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 'auto' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCompare}
              disabled={!text1 || !text2 || isLoading}
              startIcon={<CompareArrows />}
            >
              Compare
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              label="Second string"
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              placeholder="e.g., IBM"
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            />
          </Grid>
        </Grid>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 4 }} />}

      {data && !isLoading && (
        <>
          <Alert
            severity={isLevenshteinLow && highScores > 5 ? 'error' : 'info'}
            sx={{ mb: 3 }}
            icon={<Warning />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setShowLevenshteinLesson(!showLevenshteinLesson)}
              >
                {showLevenshteinLesson ? 'Hide' : 'Why?'}
              </Button>
            }
          >
            {isLevenshteinLow && highScores > 5 ? (
              <>
                <strong>Levenshtein failed here!</strong> Score: {levenshteinScore?.toFixed(2)} but{' '}
                {highScores} other algorithms score this as a match. This is a classic hard positive.
              </>
            ) : isLevenshteinHigh && lowScores > 5 ? (
              <>
                <strong>Levenshtein passed but {lowScores} algorithms disagree.</strong> This might be a hard
                negative. Check the algorithm rankings below.
              </>
            ) : (
              <>
                Levenshtein score: {levenshteinScore?.toFixed(2)} | High scores: {highScores} | Medium:{' '}
                {mediumScores} | Low: {lowScores}
              </>
            )}
          </Alert>

          <Alert severity="warning" sx={{ mb: 3 }} style={{ display: showLevenshteinLesson ? 'flex' : 'none' }}>
            <Typography variant="h6" gutterBottom>
              Why Levenshtein Distance Fails on Abbreviations
            </Typography>
            <Typography paragraph>
              Levenshtein distance counts character-level edits needed to transform one string into another.
              For "International Business Machines" (28 chars) vs "IBM" (3 chars), you need to:
            </Typography>
            <Typography component="pre" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.2)', p: 1 }}>
{`Levenshtein distance = 25 edits
Normalized = (28-25)/28 = 0.11`}
            </Typography>
            <Typography paragraph sx={{ mt: 2 }}>
              But these SHOULD match! Algorithms that understand semantics, abbreviations, or phonetic similarity
              handle this correctly.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip label="Use Jaro-Winkler for names" color="success" size="small" />
              <Chip label="Use Metaphone for sounds" color="success" size="small" />
              <Chip label="Use Sorensen-Dice for word overlap" color="success" size="small" />
              <Chip label="Use Cosine for n-gram patterns" color="success" size="small" />
            </Box>
          </Alert>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Algorithm Rankings
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Sorted by similarity score (highest to lowest)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {sortedScores.map(([name, score], index) => {
                    const info = algorithmDescriptions[name]
                    const isTop = index === 0
                    const isLev = name === 'levenshtein'
                    return (
                      <Box
                        key={name}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 1,
                          bgcolor: isLev ? 'rgba(124,77,255,0.1)' : 'transparent',
                          border: isLev ? '1px solid' : 'none',
                          borderColor: 'primary.main',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            width: 20,
                            color: isTop ? 'warning.main' : 'text.secondary',
                            fontWeight: isTop ? 700 : 400,
                          }}
                        >
                          {index + 1}
                        </Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isLev ? 700 : 500,
                              color: isLev ? 'primary.main' : 'text.primary',
                            }}
                          >
                            {info?.name || name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {info?.description}
                          </Typography>
                        </Box>
                        <Chip
                          label={score.toFixed(2)}
                          size="small"
                          color={score >= 0.7 ? 'success' : score >= 0.4 ? 'warning' : 'error'}
                        />
                      </Box>
                    )
                  })}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom>
                  Visual Score Comparison
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {sortedScores.map(([name, score]) => {
                    const info = algorithmDescriptions[name]
                    const isLev = name === 'levenshtein'
                    const color =
                      score >= 0.7 ? 'success.main' : score >= 0.4 ? 'warning.main' : 'error.main'

                    return (
                      <Box key={name}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: isLev ? 700 : 500,
                                color: isLev ? 'primary.main' : 'text.primary',
                              }}
                            >
                              {info?.name || name}
                            </Typography>
                            {isLev && (
                              <Chip
                                label="LEV"
                                size="small"
                                color="primary"
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {score.toFixed(3)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={score * 100}
                          sx={{
                            height: 24,
                            borderRadius: 1,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: color,
                              borderRadius: 1,
                            },
                          }}
                        />
                      </Box>
                    )
                  })}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Score Distribution
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.dark', borderRadius: 2, opacity: 0.8 }}>
                      <CheckCircle sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h4">{highScores}</Typography>
                      <Typography variant="caption">High (≥0.7)</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.dark', borderRadius: 2, opacity: 0.8 }}>
                      <Warning sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h4">{mediumScores}</Typography>
                      <Typography variant="caption">Medium (0.4-0.7)</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.dark', borderRadius: 2, opacity: 0.8 }}>
                      <Cancel sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h4">{lowScores}</Typography>
                      <Typography variant="caption">Low (&lt;0.4)</Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Key Observations
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {isLevenshteinLow && highScores > 3 && (
                    <Alert severity="error">
                      <strong>Levenshtein underestimates similarity.</strong> This pair has {highScores} algorithms
                      scoring ≥0.7, but Levenshtein gives only {levenshteinScore?.toFixed(2)}.
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Consider using Jaro-Winkler, Sorensen-Dice, or Metaphone instead.
                      </Typography>
                    </Alert>
                  )}
                  {isLevenshteinHigh && lowScores > 3 && (
                    <Alert severity="warning">
                      <strong>Levenshtein overestimates similarity.</strong> While Levenshtein scores{' '}
                      {levenshteinScore?.toFixed(2)}, {lowScores} algorithms score this as dissimilar.
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Cross-check with phonetic algorithms or compression-based similarity.
                      </Typography>
                    </Alert>
                  )}
                  {highScores > 10 && (
                    <Alert severity="success">
                      <strong>Strong consensus.</strong> {highScores} out of {sortedScores.length} algorithms agree
                      these strings are similar.
                    </Alert>
                  )}
                  {lowScores > 10 && (
                    <Alert severity="info">
                      <strong>Strong disagreement.</strong> Only {sortedScores.length - lowScores} algorithms see
                      similarity while {lowScores} see dissimilarity.
                    </Alert>
                  )}
                  {!isLevenshteinLow && !isLevenshteinHigh && highScores <= 10 && lowScores <= 10 && (
                    <Alert severity="info">
                      <strong>Moderate agreement.</strong> Levenshtein score ({levenshteinScore?.toFixed(2)}) is
                      consistent with other algorithm scores.
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mt: 4, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Side-by-Side Comparison
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  String 1
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{submitted1}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  String 2
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{submitted2}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}

      {!data && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CompareArrows sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter two strings above to compare all algorithms
          </Typography>
          <Typography color="text.disabled" sx={{ mt: 1 }}>
            Try "International Business Machines" vs "IBM" to see Levenshtein fail
          </Typography>
        </Box>
      )}
    </Box>
  )
}
