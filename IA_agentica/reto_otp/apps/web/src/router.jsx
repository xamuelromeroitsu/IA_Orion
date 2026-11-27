import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './presentation/components/AppShell'
import { LoadingBlock } from './presentation/components/Skeleton'

const DashboardPage = lazy(() => import('./presentation/pages/DashboardPage'))
const DocumentsPage = lazy(() => import('./presentation/pages/DocumentsPage'))
const EvaluationPage = lazy(() => import('./presentation/pages/EvaluationPage'))
const ComparisonPage = lazy(() => import('./presentation/pages/ComparisonPage'))
const ChatPage = lazy(() => import('./presentation/pages/ChatPage'))
const ReportsPage = lazy(() => import('./presentation/pages/ReportsPage'))
const LegalPage = lazy(() => import('./presentation/pages/LegalPage'))

// Cada ruta se suspende de forma independiente para no descargar todo el front al entrar.
function lazyPage(Component, props = {}) {
  return (
    <Suspense fallback={<div className="px-4 py-6"><LoadingBlock label="Cargando sección…" lines={4} /></div>}>
      <Component {...props} />
    </Suspense>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={lazyPage(DashboardPage)} />
        <Route path="documentos" element={lazyPage(DocumentsPage)} />
        <Route path="evaluacion" element={lazyPage(EvaluationPage)} />
        <Route path="comparativa" element={lazyPage(ComparisonPage)} />
        <Route path="chat" element={lazyPage(ChatPage)} />
        <Route path="reportes" element={lazyPage(ReportsPage)} />
        <Route path="privacidad" element={lazyPage(LegalPage, { type: 'privacidad' })} />
        <Route path="terminos" element={lazyPage(LegalPage, { type: 'terminos' })} />
        <Route path="seguridad" element={lazyPage(LegalPage, { type: 'seguridad' })} />
        <Route path="accesibilidad" element={lazyPage(LegalPage, { type: 'accesibilidad' })} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
