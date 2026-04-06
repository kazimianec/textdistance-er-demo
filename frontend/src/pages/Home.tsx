import { Box, Typography, Card, CardContent, Button, Grid, Alert } from '@mui/material'
import { Link } from 'react-router-dom'
import { CompareArrows, GridView, Info, Warning } from '@mui/icons-material'

export default function Home() {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          textdistance Entity Resolution
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
          Explore how different string distance algorithms perform on real-world entity matching challenges
        </Typography>
      </Box>

      <Alert severity="error" sx={{ mb: 4, maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          <Warning sx={{ verticalAlign: 'middle', mr: 1 }} />
          Levenshtein Distance Alone Is NOT Enough
        </Typography>
        <Typography>
          Many entity resolution tasks rely on Levenshtein edit distance, but it fails spectacularly on
          abbreviations (IBM vs "International Business Machines"), phonetic variants, and word reordering.
          This demo showcases when each algorithm shines — and where Levenshtein fails.
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <GridView sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Showcases
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Browse 14 categories with 70+ test cases covering hard positives and hard negatives
              </Typography>
              <Button component={Link} to="/showcases" variant="contained" size="large">
                Explore Showcases
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <CompareArrows sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Compare
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Enter any two strings and see all 21 algorithms scored side-by-side with visual bars
              </Typography>
              <Button component={Link} to="/compare" variant="contained" size="large" color="secondary">
                Try It Now
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Info sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Algorithms
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                21 distance/similarity metrics including Levenshtein, Jaro-Winkler, phonetic encodings, and more
              </Typography>
              <Button component={Link} to="/showcases" variant="outlined" size="large">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Hard Positives vs Hard Negatives
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Entity resolution is harder than it looks. Consider these challenges:
        </Typography>

        <Grid container spacing={2} sx={{ textAlign: 'left' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ bgcolor: 'success.dark', opacity: 0.9 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hard Positives (Should Match)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  "International Business Machines" ↔ "IBM"
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Levenshtein: 0.08 | Jaro-Winkler: 0.54 | Should be: MATCH
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 2 }}>
                  "Moscow" ↔ "Moskva"
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Levenshtein: 0.33 | Metaphone: Match! | Should be: MATCH
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ bgcolor: 'error.dark', opacity: 0.9 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hard Negatives (Should NOT Match)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  "Bank of America Corporation" ↔ "America Bank Corporation"
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Levenshtein: 0.76 | Looks similar | But should NOT match
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 2 }}>
                  "Jim Wilson" ↔ "James Wilson" (different person)
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Levenshtein: 0.71 | Same name! | But should NOT match
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
