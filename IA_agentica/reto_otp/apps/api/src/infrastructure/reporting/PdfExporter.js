import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function buildExecutivePdf({ evaluation, analyses = [], project = null }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const recommended = evaluation.comparison.find((row) => row.analysisId === evaluation.recommendedId);

  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 595, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('ORION · Dictamen ejecutivo', 40, 45);
  doc.setFontSize(10);
  doc.text(project?.name ?? 'Evaluación de propuestas', 40, 68);

  doc.setTextColor(20, 35, 55);
  doc.setFontSize(11);
  doc.text(evaluation.summary ?? '', 40, 120, { maxWidth: 510 });

  doc.setFontSize(13);
  doc.text('Recomendación', 40, 165);
  doc.setFontSize(11);
  doc.text(
    recommended
      ? `${recommended.supplier} · TCO ajustado ${recommended.tcoUsd.toFixed(2)} USD`
      : 'No hay una propuesta recomendada.',
    40,
    185
  );

  autoTable(doc, {
    startY: 210,
    head: [['Proveedor', 'Declarado', 'Recalculado', 'Costos ocultos', 'TCO USD', 'Decisión']],
    body: evaluation.comparison.map((row) => [
      row.supplier,
      row.declaredTotal.toFixed(2),
      row.calculatedTotal.toFixed(2),
      row.hiddenCostsUsd.toFixed(2),
      row.tcoUsd.toFixed(2),
      row.decision
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 5 }
  });

  const detailStart = doc.lastAutoTable.finalY + 30;
  doc.setFontSize(13);
  doc.text('Hallazgos por propuesta', 40, detailStart);
  let cursorY = detailStart + 20;
  for (const analysis of analyses) {
    if (cursorY > 760) {
      doc.addPage();
      cursorY = 50;
    }
    doc.setFontSize(10);
    doc.setTextColor(11, 31, 58);
    doc.text(analysis.supplier, 40, cursorY);
    doc.setTextColor(60, 70, 85);
    const findings = (analysis.findings ?? []).slice(0, 4);
    for (const finding of findings) {
      cursorY += 14;
      doc.text(`• [${finding.severity}] ${finding.title}: ${finding.detail}`, 48, cursorY, { maxWidth: 500 });
    }
    cursorY += 22;
  }

  doc.setTextColor(120, 130, 145);
  doc.setFontSize(8);
  doc.text(`Generado por ORION · ${new Date().toLocaleString('es-VE')}`, 40, 820);

  return doc;
}
