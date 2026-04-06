import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Showcases from './pages/Showcases'
import ConsolidatedComparison from './pages/ConsolidatedComparison'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/showcases" element={<Showcases />} />
        <Route path="/compare" element={<ConsolidatedComparison />} />
      </Routes>
    </Layout>
  )
}

export default App
