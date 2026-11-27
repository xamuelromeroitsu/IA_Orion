import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { batchOutputSchema } from '@orion/shared';
import { ProposalId } from '../src/domain/valueObjects/ProposalId.js';
import {
  analysisRepository,
  createAuditor,
  documentRepository,
  documentStore,
  evaluateBatchUseCase,
  exchangeRatePort,
  manageProjectWorkflowUseCase
} from '../src/infrastructure/container.js';
import { extractDocument } from '../src/infrastructure/parsing/TextExtractor.js';
import { AnalyzeDocumentUseCase } from '../src/application/useCases/AnalyzeDocumentUseCase.js';

function currentDirectory() {
  return path.dirname(fileURLToPath(import.meta.url));
}

function isoCaracas(date = new Date()) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Caracas',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-04:00`;
}

function parseArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') args.input = argv[index + 1];
    if (argv[index] === '--out') args.out = argv[index + 1];
  }
  return args;
}

const silentPublisher = { publish() {} };

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (!args.input) throw new Error('Uso: npm run batch -- --input <carpeta> --out salida.json');
  const inputDirectory = path.resolve(args.input);
  const proposalsDirectory = await fs.stat(path.join(inputDirectory, 'propuestas'))
    .then(() => path.join(inputDirectory, 'propuestas'))
    .catch(() => inputDirectory);
  const files = (await fs.readdir(proposalsDirectory))
    .filter((fileName) => /\.(pdf|jpe?g|png|xlsx)$/i.test(fileName))
    .sort();
  if (files.length === 0) throw new Error(`No hay propuestas en ${proposalsDirectory}`);

  const inicio = isoCaracas();
  const processed = [];
  const project = await manageProjectWorkflowUseCase.createProject({
    name: `Lote ${path.basename(inputDirectory)}`,
    description: 'Evaluación automática por modo lote',
    operationType: 'compra',
    businessType: 'Equipos de computación',
    location: 'Caracas, Venezuela'
  });

  for (const fileName of files) {
    const buffer = await fs.readFile(path.join(proposalsDirectory, fileName));
    const extracted = await extractDocument({ buffer, fileName, mime: mimeFromName(fileName) });
    const stored = await documentStore.save({ buffer, fileName, projectId: project.id });
    const document = {
      id: stored.id,
      projectId: project.id,
      fileName,
      mime: mimeFromName(fileName),
      kind: extracted.kind,
      size: buffer.length,
      storagePath: stored.storagePath,
      uploadedAt: new Date().toISOString(),
      extractedText: extracted.extractedText,
      sheets: extracted.sheets
    };
    await documentRepository.save(document);
    const useCase = new AnalyzeDocumentUseCase({
      aiAuditor: createAuditor(extracted.kind === 'image' ? buffer.toString('base64') : null),
      analysisRepository,
      eventPublisher: silentPublisher,
      exchangeRatePort
    });
    await useCase.execute({ projectId: project.id, document, requirement: project });
    processed.push({ archivo: fileName, hora: isoCaracas() });
  }

  const evaluation = await evaluateBatchUseCase.execute({
    projectId: project.id,
    eventPublisher: silentPublisher
  });
  const analyses = await analysisRepository.listByProject(project.id);
  const ranking = evaluation.ranking.map((analysisId) => {
    const analysis = analyses.find((item) => item.id === analysisId);
    return ProposalId.fromFileName(analysis?.fileName ?? analysisId).toString();
  });

  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: path.resolve(currentDirectory(), '../../../../..'),
    encoding: 'utf8'
  }).trim();
  const output = {
    reto: 'propuesta_servicios',
    repositorio: process.env.BATCH_REPOSITORY ?? 'https://gitlab.nube.gob.ve/grupo/chuao/chuao_grupo1/reto_otp.git',
    commit,
    inicio,
    fin: isoCaracas(),
    procesados: processed,
    ranking
  };
  batchOutputSchema.parse(output);
  const outPath = path.resolve(args.out ?? 'salida.json');
  await fs.writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`salida.json escrito en ${outPath} (${ranking.length} propuestas, commit ${commit.slice(0, 8)})`);
}

function mimeFromName(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }[extension] ?? 'application/octet-stream';
}

main().catch((error) => {
  console.error(`Error en modo lote: ${error.message}`);
  process.exitCode = 1;
});
