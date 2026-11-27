import AppRouter from './router'
import { useBootstrap } from './presentation/hooks/useBootstrap'

export default function App() {
  useBootstrap()
  return <AppRouter />
}
