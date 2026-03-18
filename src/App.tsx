import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { ContextViewScreen } from './screens/ContextViewScreen'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/game/:gameId" element={<DashboardScreen />} />
        <Route path="/game/:gameId/context/:windowPrefix" element={<ContextViewScreen />} />
        <Route path="/game/:gameId/manage" element={<div>Manage (coming next)</div>} />
      </Routes>
    </BrowserRouter>
  )
}
