import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSessionStore = create(
  persist(
    (set) => ({
      user: null,
      role: 'cargador',
      connectionStatus: 'checking',
      projects: [],
      evaluations: [],
      activeProjectId: null,
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      setProjects: (projects) => set({ projects }),
      setEvaluations: (evaluations) => set({ evaluations }),
      setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
      upsertProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects.filter((item) => item.id !== project.id)],
          activeProjectId: project.id
        })),
      upsertEvaluation: (evaluation) =>
        set((state) => ({
          evaluations: [evaluation, ...state.evaluations.filter((item) => item.id !== evaluation.id)]
        }))
    }),
    {
      name: 'orion-session',
      partialize: (state) => ({ role: state.role })
    }
  )
)
