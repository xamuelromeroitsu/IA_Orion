import { create } from 'zustand'

const maxEvents = 400

export const useEvaluationStore = create((set) => ({
  activeEvaluationId: null,
  events: [],
  isStreaming: false,
  setActiveEvaluationId: (activeEvaluationId) => set({ activeEvaluationId, events: [] }),
  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        { ...event, key: event?.key ?? `${event?.at ?? Date.now()}-${state.events.length}` }
      ].slice(-maxEvents)
    })),
  setEvents: (events) => set({ events: events.slice(-maxEvents) }),
  clearEvents: () => set({ events: [] }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  resetRun: () => set({ activeEvaluationId: null, events: [], isStreaming: false })
}))
