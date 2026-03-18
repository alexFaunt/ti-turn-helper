import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { ContextViewScreen } from './screens/ContextViewScreen'
import { ManageScreen } from './screens/ManageScreen'

export function App() {
  return (
    <BrowserRouter basename="/ti-turn-helper">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/game/:gameId" element={<DashboardScreen />} />
        <Route path="/game/:gameId/context/:windowPrefix" element={<ContextViewScreen />} />
        <Route path="/game/:gameId/manage" element={<ManageScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
