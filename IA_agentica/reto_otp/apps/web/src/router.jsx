import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './presentation/components/AppShell'
import DashboardPage from './presentation/pages/DashboardPage'
import DocumentsPage from './presentation/pages/DocumentsPage'
import EvaluationPage from './presentation/pages/EvaluationPage'
import ComparisonPage from './presentation/pages/ComparisonPage'
import ChatPage from './presentation/pages/ChatPage'
import ReportsPage from './presentation/pages/ReportsPage'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="evaluacion" element={<EvaluationPage />} />
        <Route path="comparativa" element={<ComparisonPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
