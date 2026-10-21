import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Alert,
} from '@mui/material'
import { ExpandMore, CheckCircle, Cancel } from '@mui/icons-material'
import type { TestCase } from '../types'
import { useQuery } from '@tanstack/react-query'
import { compare } from '../api/client'
import AlgorithmBar from './AlgorithmBar'

interface CaseCardProps {
  testCase: TestCase
}

export default function CaseCard({ testCase }: CaseCardProps) {
  const [expanded, setExpanded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['compare', testCase.text1, testCase.text2],
    queryFn: () => compare(testCase.text1, testCase.text2).then(r => r.data),
    enabled: expanded,
  })

  const difficultyColor = {
    easy: 'success',
    medium: 'warning',
    hard: 'error',
  } as const

  return (
    <Card sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton size="small" sx={{ mr: 1 }}>
          <ExpandMore
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {testCase.shouldMatch ? (
              <CheckCircle fontSize="small" color="success" />
            ) : (
              <Cancel fontSize="small" color="error" />
            )}
            <Typography variant="body2" color="text.secondary">
              {testCase.shouldMatch ? 'Should Match' : 'Should NOT Match'}
            </Typography>
            <Chip
              label={testCase.difficulty}
              size="small"
              color={difficultyColor[testCase.difficulty]}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
            "{testCase.text1}" ↔ "{testCase.text2}"
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, textAlign: 'right' }}>
          {testCase.notes}
        </Typography>
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <CardContent sx={{ bgcolor: 'background.paper' }}>
          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : data ? (
            <>
              {testCase.highlightHardPositive && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Hard positive:</strong> these strings look very different but
                  SHOULD match. Algorithms marked KEY are the ones that cope with this
                  case &mdash; Levenshtein usually does not.
                </Alert>
              )}
              {testCase.highlightHardNegative && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Hard negative:</strong> these strings look similar but should
                  NOT match. Algorithms marked KEY are the ones that wrongly score them
                  as a match.
                </Alert>
              )}
              <AlgorithmBar
                scores={data.scores}
                shouldMatch={testCase.shouldMatch}
                highlightAlgorithms={[
                  ...(testCase.highlightHardPositive || []),
                  ...(testCase.highlightHardNegative || []),
                ]}
              />
            </>
          ) : null}
        </CardContent>
      </Collapse>
    </Card>
  )
}
