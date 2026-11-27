import { createClient } from '@supabase/supabase-js';
import {
  LocalAnalysisRepository,
  LocalChatRepository,
  LocalDocumentRepository,
  LocalEvaluationRepository,
  LocalProjectRepository
} from './LocalRepositories.js';

function mapProject(record) {
  if (!record) return null;
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? '',
    operationType: record.operation_type ?? 'compra',
    businessType: record.business_type ?? '',
    location: record.location ?? '',
    budgetReferenceUsd: Number(record.budget_reference_usd ?? 0),
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function mapDocument(record) {
  if (!record) return null;
  return {
    id: record.id,
    projectId: record.project_id,
    fileName: record.file_name,
    mime: record.mime,
    kind: record.kind,
    size: Number(record.size_bytes ?? 0),
    storagePath: record.storage_path,
    iv: record.iv,
    tag: record.tag,
    uploadedAt: record.created_at,
    extractedText: record.extracted_text ?? '',
    sheets: record.sheets ?? []
  };
}

function mapAnalysis(record) {
  if (!record) return null;
  return {
    id: record.id,
    documentId: record.document_id,
    projectId: record.project_id,
    fileName: record.file_name ?? '',
    supplier: record.supplier ?? 'Proveedor sin identificar',
    kind: record.kind ?? 'unknown',
    currency: record.currency ?? 'USD',
    declaredTotal: Number(record.declared_total ?? 0),
    calculatedTotal: Number(record.calculated_total ?? 0),
    realTotalUsd: Number(record.real_total_usd ?? 0),
    tcoUsd: Number(record.tco_usd ?? 0),
    hiddenCosts: record.hidden_costs ?? [],
    warrantyMonths: Number(record.warranty_months ?? 0),
    injectionDetected: Boolean(record.injection_detected),
    scopeComplete: Boolean(record.scope_complete),
    summary: record.summary ?? '',
    conclusion: record.conclusion ?? '',
    pros: record.pros ?? [],
    cons: record.cons ?? [],
    finePrint: record.fine_print ?? [],
    items: record.items ?? [],
    findings: record.findings ?? [],
    confidence: Number(record.confidence ?? 0),
    source: record.source ?? 'deterministic',
    analyzedAt: record.analyzed_at ?? record.created_at,
    discardReasons: record.discard_reasons ?? []
  };
}

function mapEvaluation(record) {
  if (!record) return null;
  return {
    id: record.id,
    projectId: record.project_id,
    status: record.status,
    startedAt: record.started_at,
    finishedAt: record.finished_at,
    ranking: record.ranking ?? [],
    comparison: record.comparison ?? [],
    summary: record.summary ?? '',
    recommendedId: record.recommended_id ?? null,
    exchangeRate: Number(record.exchange_rate ?? 1),
    exchangeRateDate: record.exchange_rate_date ?? null,
    reviewedBy: record.reviewed_by ?? null,
    reviewNotes: record.review_notes ?? null,
    approvedBy: record.approved_by ?? null
  };
}

async function withFallback(primary, fallback) {
  try {
    return await primary();
  } catch {
    return fallback();
  }
}

export function createSupabaseClient({ url, key }) {
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export class SupabaseProjectRepository extends LocalProjectRepository {
  constructor(client) {
    super();
    this.client = client;
  }

  async list() {
    return withFallback(async () => {
      const { data, error } = await this.client.from('projects')
        .select('id,name,description,operation_type,business_type,location,budget_reference_usd,status,created_at,updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProject);
    }, () => super.list());
  }

  async getById(id) {
    return withFallback(async () => {
      const { data, error } = await this.client.from('projects')
        .select('id,name,description,operation_type,business_type,location,budget_reference_usd,status,created_at,updated_at')
        .eq('id', id).maybeSingle();
      if (error) throw error;
      return mapProject(data);
    }, () => super.getById(id));
  }

  async create(project) {
    await super.create(project);
    await withFallback(async () => {
      const { error } = await this.client.from('projects').insert({
        id: project.id,
        name: project.name,
        description: project.description,
        operation_type: project.operationType,
        business_type: project.businessType,
        location: project.location,
        budget_reference_usd: project.budgetReferenceUsd,
        status: project.status,
        owner_id: project.ownerId ?? null
      });
      if (error) throw error;
    }, async () => undefined);
    return project;
  }

  async updateStatus(id, status) {
    await super.updateStatus(id, status);
    await withFallback(async () => {
      const { error } = await this.client.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    }, async () => undefined);
    return super.getById(id);
  }
}

export class SupabaseDocumentRepository extends LocalDocumentRepository {
  constructor(client) {
    super();
    this.client = client;
  }

  async listByProject(projectId) {
    return withFallback(async () => {
      const { data, error } = await this.client.from('project_documents')
        .select('id,project_id,file_name,mime,kind,size_bytes,storage_path,extracted_text,sheets,created_at')
        .eq('project_id', projectId).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapDocument);
    }, () => super.listByProject(projectId));
  }

  async getById(id) {
    const document = await withFallback(async () => {
      const { data, error } = await this.client.from('project_documents')
        .select('id,project_id,file_name,mime,kind,size_bytes,storage_path,iv,tag,extracted_text,sheets,created_at')
        .eq('id', id).maybeSingle();
      if (error) throw error;
      return mapDocument(data);
    }, async () => null);
    return document ?? super.getById(id);
  }

  async save(document) {
    await super.save(document);
    if (!this.client) return document;

    try {
      const { error } = await this.client.from('project_documents').insert({
        id: document.id,
        project_id: document.projectId,
        file_name: document.fileName,
        mime: document.mime,
        kind: document.kind,
        size_bytes: document.size,
        storage_path: document.storagePath,
        extracted_text: document.extractedText,
        sheets: document.sheets,
        sha256: document.sha256 ?? null,
        iv: document.iv ?? null,
        tag: document.tag ?? null
      });
      if (error) {
        const saveError = new Error('No se pudo registrar el documento en project_documents', { cause: error });
        saveError.status = 500;
        saveError.code = 'document_record_save_failed';
        throw saveError;
      }
    } catch (cause) {
      if (cause.code === 'document_record_save_failed') throw cause;
      const saveError = new Error('No se pudo registrar el documento en project_documents', { cause });
      saveError.status = 500;
      saveError.code = 'document_record_save_failed';
      throw saveError;
    }
    return document;
  }
}

export class SupabaseAnalysisRepository extends LocalAnalysisRepository {
  constructor(client) {
    super();
    this.client = client;
  }

  async listByProject(projectId) {
    return withFallback(async () => {
      const { data, error } = await this.client.from('document_analyses')
        .select('id,project_id,document_id,file_name,supplier,currency,declared_total,calculated_total,real_total_usd,tco_usd,summary,conclusion,pros,cons,fine_print,items,findings,confidence,source,analyzed_at,hidden_costs,warranty_months,injection_detected,scope_complete,discard_reasons')
        .eq('project_id', projectId).order('analyzed_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapAnalysis);
    }, () => super.listByProject(projectId));
  }

  async save(analysis) {
    await super.save(analysis);
    await withFallback(async () => {
      const { error } = await this.client.from('document_analyses').insert({
        id: analysis.id,
        project_id: analysis.projectId,
        document_id: analysis.documentId,
        file_name: analysis.fileName,
        supplier: analysis.supplier,
        currency: analysis.currency,
        declared_total: analysis.declaredTotal,
        calculated_total: analysis.calculatedTotal,
        real_total_usd: analysis.realTotalUsd,
        tco_usd: analysis.tcoUsd,
        summary: analysis.summary,
        conclusion: analysis.conclusion,
        pros: analysis.pros,
        cons: analysis.cons,
        fine_print: analysis.finePrint,
        items: analysis.items,
        findings: analysis.findings,
        confidence: analysis.confidence,
        source: analysis.source,
        analyzed_at: analysis.analyzedAt,
        hidden_costs: analysis.hiddenCosts ?? [],
        warranty_months: analysis.warrantyMonths ?? 0,
        injection_detected: analysis.injectionDetected ?? false,
        scope_complete: analysis.scopeComplete ?? true,
        discard_reasons: analysis.discardReasons ?? []
      });
      if (error) throw error;
    }, async () => undefined);
    return analysis;
  }
}

export class SupabaseEvaluationRepository extends LocalEvaluationRepository {
  constructor(client) {
    super();
    this.client = client;
  }

  async list() {
    return withFallback(async () => {
      const { data, error } = await this.client.from('evaluations')
        .select('id,project_id,status,started_at,finished_at,ranking,comparison,summary,recommended_id,exchange_rate,exchange_rate_date,reviewed_by,review_notes,approved_by')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapEvaluation);
    }, () => super.list());
  }

  async getById(id) {
    return withFallback(async () => {
      const { data, error } = await this.client.from('evaluations')
        .select('id,project_id,status,started_at,finished_at,ranking,comparison,summary,recommended_id,exchange_rate,exchange_rate_date,reviewed_by,review_notes,approved_by')
        .eq('id', id).maybeSingle();
      if (error) throw error;
      return mapEvaluation(data);
    }, () => super.getById(id));
  }

  async save(evaluation) {
    await super.save(evaluation);
    await withFallback(async () => {
      const { error } = await this.client.from('evaluations').insert({
        id: evaluation.id,
        project_id: evaluation.projectId,
        status: evaluation.status,
        started_at: evaluation.startedAt,
        finished_at: evaluation.finishedAt,
        ranking: evaluation.ranking,
        comparison: evaluation.comparison,
        summary: evaluation.summary,
        recommended_id: evaluation.recommendedId,
        exchange_rate: evaluation.exchangeRate,
        exchange_rate_date: evaluation.exchangeRateDate
      });
      if (error) throw error;
    }, async () => undefined);
    return evaluation;
  }

  async updateReview(id, payload) {
    await super.updateReview(id, payload);
    await withFallback(async () => {
      const { error } = await this.client.from('evaluations')
        .update({ review_notes: payload.notes, reviewed_by: payload.reviewer }).eq('id', id);
      if (error) throw error;
    }, async () => undefined);
    return super.getById(id);
  }

  async approve(id, approver) {
    await super.approve(id, approver);
    await withFallback(async () => {
      const { error } = await this.client.from('evaluations').update({ approved_by: approver }).eq('id', id);
      if (error) throw error;
    }, async () => undefined);
    return super.getById(id);
  }
}

export class SupabaseChatRepository extends LocalChatRepository {
  constructor(client) {
    super();
    this.client = client;
  }

  async listByProject(projectId) {
    return withFallback(async () => {
      const { data, error } = await this.client.from('chat_messages')
        .select('id,project_id,role,content,sources,created_at')
        .eq('project_id', projectId).order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((record) => ({
        id: record.id,
        projectId: record.project_id,
        role: record.role,
        content: record.content,
        sources: record.sources ?? [],
        createdAt: record.created_at
      }));
    }, () => super.listByProject(projectId));
  }

  async save(message) {
    await super.save(message);
    await withFallback(async () => {
      const { error } = await this.client.from('chat_messages').insert({
        id: message.id,
        project_id: message.projectId,
        role: message.role,
        content: message.content,
        sources: message.sources ?? []
      });
      if (error) throw error;
    }, async () => undefined);
    return message;
  }
}
