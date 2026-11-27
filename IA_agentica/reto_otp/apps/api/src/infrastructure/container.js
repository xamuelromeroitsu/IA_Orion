import pino from 'pino';
import { env, supabaseKey } from './config.js';
import { SseEventBus } from './events/SseEventBus.js';
import { DeterministicAuditor } from './ai/DeterministicAuditor.js';
import { GeminiAuditor } from './ai/GeminiAuditor.js';
import { BcvRateProvider } from './market/BcvRateProvider.js';
import { WebPriceProvider } from './market/WebPriceProvider.js';
import { DocumentStore } from './storage/DocumentStore.js';
import {
  createSupabaseClient,
  SupabaseAnalysisRepository,
  SupabaseChatRepository,
  SupabaseDocumentRepository,
  SupabaseEvaluationRepository,
  SupabaseProjectRepository
} from './persistence/SupabaseRepositories.js';
import { AnalyzeDocumentUseCase } from '../application/useCases/AnalyzeDocumentUseCase.js';
import { EvaluateBatchUseCase } from '../application/useCases/EvaluateBatchUseCase.js';
import { ManageProjectWorkflowUseCase } from '../application/useCases/ManageProjectWorkflowUseCase.js';
import { RecordHumanReviewUseCase } from '../application/useCases/RecordHumanReviewUseCase.js';
import { AskProjectDocumentsUseCase } from '../application/useCases/AskProjectDocumentsUseCase.js';

export const logger = pino({ level: env.LOG_LEVEL });
export const eventBus = new SseEventBus();
export const supabase = createSupabaseClient({ url: env.SUPABASE_URL, key: supabaseKey });

export const projectRepository = new SupabaseProjectRepository(supabase);
export const documentRepository = new SupabaseDocumentRepository(supabase);
export const analysisRepository = new SupabaseAnalysisRepository(supabase);
export const evaluationRepository = new SupabaseEvaluationRepository(supabase);
export const chatRepository = new SupabaseChatRepository(supabase);

export const exchangeRatePort = new BcvRateProvider({
  sourceUrl: env.BCV_SOURCE_URL,
  fallbackRate: env.BCV_FALLBACK_RATE
});
export const marketPricePort = new WebPriceProvider({ apiKey: env.TAVILY_API_KEY });
export const documentStore = new DocumentStore({ client: supabase, aesKey: env.AES_KEY, logger });

export function scopedPublisher(evaluationId) {
  return {
    publish(event) {
      return eventBus.publish({ ...event, evaluationId });
    }
  };
}

export function createAuditor(inlineBase64 = null) {
  const fallback = new DeterministicAuditor();
  if (!env.GEMINI_API_KEY) return fallback;
  return new GeminiAuditor({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    extractionModel: env.GEMINI_EXTRACTION_MODEL,
    fallback,
    inlineData: inlineBase64
  });
}

export const defaultAuditor = createAuditor();

export const analyzeDocumentUseCase = new AnalyzeDocumentUseCase({
  aiAuditor: defaultAuditor,
  analysisRepository,
  eventPublisher: { publish: (event) => eventBus.publish(event) },
  exchangeRatePort
});

export const evaluateBatchUseCase = new EvaluateBatchUseCase({
  analysisRepository,
  documentRepository,
  evaluationRepository,
  projectRepository,
  eventPublisher: { publish: (event) => eventBus.publish(event) },
  exchangeRatePort,
  marketPricePort
});

export const manageProjectWorkflowUseCase = new ManageProjectWorkflowUseCase({
  projectRepository,
  eventPublisher: { publish: (event) => eventBus.publish(event) }
});

export const recordHumanReviewUseCase = new RecordHumanReviewUseCase({
  evaluationRepository,
  eventPublisher: { publish: (event) => eventBus.publish(event) }
});

export const askProjectDocumentsUseCase = new AskProjectDocumentsUseCase({
  analysisRepository,
  chatRepository,
  aiAuditor: defaultAuditor
});

export const demoUser = {
  id: env.DEMO_USER_ID,
  name: 'Usuario demo',
  role: 'cargador',
  isDemo: env.DEMO_MODE !== 'false'
};
