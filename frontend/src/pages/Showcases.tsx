import { useState } from 'react'
import { Box, Typography, Tabs, Tab, Grid, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { showcases, coreShowcases, additionalShowcases } from '../data/showcases'
import CaseCard from '../components/CaseCard'

export default function Showcases() {
  const [activeTab, setActiveTab] = useState(0)
  const [expandedShowcase, setExpandedShowcase] = useState<string | false>(false)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setExpandedShowcase(false)
  }

  const displayShowcases = activeTab === 0 ? showcases : activeTab === 1 ? coreShowcases : additionalShowcases

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Showcase Gallery
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        14 showcase categories with 70+ test cases demonstrating hard positives and hard negatives
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
        <Tab label={`All (${showcases.length})`} />
        <Tab label={`Core (${coreShowcases.length})`} />
        <Tab label={`Additional (${additionalShowcases.length})`} />
      </Tabs>

      <Box>
        {displayShowcases.map((showcase) => (
          <Accordion
            key={showcase.id}
            expanded={expandedShowcase === showcase.id}
            onChange={(_, expanded) => setExpandedShowcase(expanded ? showcase.id : false)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="h6">{showcase.name}</Typography>
                <Chip
                  label={showcase.difficulty}
                  size="small"
                  color={
                    showcase.difficulty === 'foundation'
                      ? 'success'
                      : showcase.difficulty === 'intermediate'
                      ? 'warning'
                      : 'error'
                  }
                />
                <Chip label={showcase.category} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {showcase.cases.length} test cases
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {showcase.description}
              </Typography>
              <Grid container spacing={2}>
                {showcase.cases.map((testCase) => (
                  <Grid size={12} key={testCase.id}>
                    <CaseCard testCase={testCase} />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  )
}
