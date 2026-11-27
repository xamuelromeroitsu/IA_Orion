import { useEffect, useState } from 'react'
import { api, normalizeApiError } from '../lib/api'
import { useSessionStore } from '../store/session'

export function useBootstrap() {
  const user = useSessionStore((state) => state.user)
  const projects = useSessionStore((state) => state.projects)
  const evaluations = useSessionStore((state) => state.evaluations)
  const activeProjectId = useSessionStore((state) => state.activeProjectId)
  const setUser = useSessionStore((state) => state.setUser)
  const setProjects = useSessionStore((state) => state.setProjects)
  const setEvaluations = useSessionStore((state) => state.setEvaluations)
  const setActiveProjectId = useSessionStore((state) => state.setActiveProjectId)
  const setConnectionStatus = useSessionStore((state) => state.setConnectionStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadBootstrap() {
      setIsLoading(true)
      setConnectionStatus('checking')
      try {
        const result = await api.get('/api/bootstrap')
        if (!isMounted) return
        const nextProjects = result?.projects ?? []
        setUser(result?.user ?? null)
        setProjects(nextProjects)
        setEvaluations(result?.evaluations ?? [])
        const currentProjectId = useSessionStore.getState().activeProjectId
        setActiveProjectId(
          currentProjectId && nextProjects.some((project) => project.id === currentProjectId)
            ? currentProjectId
            : nextProjects[0]?.id ?? null
        )
        setConnectionStatus('online')
        setError(null)
        void api.get('/api/health').catch(() => {})
      } catch (caught) {
        if (!isMounted) return
        const normalized = normalizeApiError(caught)
        setError(normalized)
        setConnectionStatus('offline')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadBootstrap()
    return () => {
      isMounted = false
    }
  }, [setUser, setProjects, setEvaluations, setActiveProjectId, setConnectionStatus])

  return { user, projects, evaluations, activeProjectId, isLoading, error }
}
