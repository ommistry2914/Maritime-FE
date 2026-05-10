import { HashRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import AppRoutes from './routes/AppRoute'

function App() {

  return (
    <HashRouter>
      <AppRoutes/>
      <Analytics />
    </HashRouter>

  )
}

export default App
