import type { WorkerAck, WorkerJob } from '@app/shared';

/**
 * The pipeline worker. It does nothing yet — parsing arrives at MS-04.
 *
 * What it establishes now is the contract: it receives ids, it holds no
 * database connection, and it can be killed at any point without leaving the
 * application in a half-written state.
 */
process.parentPort.on('message', (event) => {
  const job = event.data as WorkerJob;
  const ack: WorkerAck = { jobId: job.jobId, status: 'received' };
  process.parentPort.postMessage(ack);
});
