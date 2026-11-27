import { randomUUID } from 'node:crypto';

function buildDeterministicAnswer(question, analyses) {
  const terms = question.toLowerCase().split(/\s+/).filter((term) => term.length > 3);
  const matches = analyses.filter((analysis) => {
    const text = [analysis.supplier, analysis.summary, analysis.conclusion, ...(analysis.findings ?? []).map((f) => f.title)]
      .join(' ')
      .toLowerCase();
    return terms.some((term) => text.includes(term));
  });
  const selected = matches.length > 0 ? matches : analyses;
  const lines = selected.slice(0, 4).map((analysis) => {
    const status = analysis.discardReasons?.length > 0 ? `descartada (${analysis.discardReasons[0]})` : 'válida';
    return `- **${analysis.supplier}**: ${status}. TCO ${analysis.tcoUsd.toFixed(2)} USD. ${analysis.conclusion || analysis.summary}`;
  });
  return {
    answer: lines.length > 0
      ? `Con base en ${analyses.length} análisis del proyecto:\n${lines.join('\n')}`
      : 'Todavía no hay documentos analizados en este proyecto.',
    sources: selected.slice(0, 4).map((analysis) => analysis.fileName)
  };
}

export class AskProjectDocumentsUseCase {
  constructor({ analysisRepository, chatRepository, aiAuditor }) {
    this.analysisRepository = analysisRepository;
    this.chatRepository = chatRepository;
    this.aiAuditor = aiAuditor;
  }

  async execute({ projectId, question }) {
    const analyses = await this.analysisRepository.listByProject(projectId);
    let result;

    try {
      result = await this.aiAuditor.ask({ question, analyses });
    } catch {
      result = buildDeterministicAnswer(question, analyses);
    }

    const userMessage = {
      id: randomUUID(),
      projectId,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString()
    };
    const assistantMessage = {
      id: randomUUID(),
      projectId,
      role: 'assistant',
      content: result.answer,
      createdAt: new Date().toISOString(),
      sources: result.sources ?? []
    };
    await this.chatRepository.save(userMessage);
    await this.chatRepository.save(assistantMessage);

    return assistantMessage;
  }
}
