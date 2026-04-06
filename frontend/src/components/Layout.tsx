import type { ReactNode } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { CompareArrows, Home, GridView } from '@mui/icons-material'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            textdistance ER
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<Home />}
            color={isActive('/') ? 'secondary' : 'inherit'}
            sx={{ ml: 1 }}
          >
            Home
          </Button>
          <Button
            component={RouterLink}
            to="/showcases"
            startIcon={<GridView />}
            color={isActive('/showcases') ? 'secondary' : 'inherit'}
            sx={{ ml: 1 }}
          >
            Showcases
          </Button>
          <Button
            component={RouterLink}
            to="/compare"
            startIcon={<CompareArrows />}
            color={isActive('/compare') ? 'secondary' : 'inherit'}
            sx={{ ml: 1 }}
          >
            Compare
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}
