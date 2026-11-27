import AppRouter from './router'
import ErrorBoundary from './presentation/components/ErrorBoundary'
import { ToastProvider } from './presentation/components/ToastProvider'
import { useBootstrap } from './presentation/hooks/useBootstrap'

export default function App() {
  useBootstrap()
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </ErrorBoundary>
  )
}
