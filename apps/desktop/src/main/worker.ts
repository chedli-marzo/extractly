import { utilityProcess, type UtilityProcess } from 'electron';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
import type { WorkerAck, WorkerJob } from '@app/shared';

/**
 * The pipeline worker, spawned and killed by main.
 *
 * It is handed a job — ids only, never a database handle and never a file path
 * (docs/architecture.md, "Process model"). Cancelling a job kills the process
 * rather than hoping a promise notices.
 */
export function spawnPipelineWorker(): UtilityProcess {
  return utilityProcess.fork(join(here, 'worker.cjs'));
}

export function sendJob(worker: UtilityProcess, job: WorkerJob): void {
  worker.postMessage(job);
}

export function onWorkerAck(
  worker: UtilityProcess,
  handler: (ack: WorkerAck) => void,
): void {
  worker.on('message', handler as (message: unknown) => void);
}

export function killPipelineWorker(worker: UtilityProcess): boolean {
  return worker.kill();
}
