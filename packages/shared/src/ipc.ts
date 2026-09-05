/**
 * The IPC contract. Every channel the renderer can reach is named here, and
 * nowhere else.
 *
 * There is no generic `invoke(channel, args)` — that would hand the renderer
 * the main process (docs/security.md, "Preload is the entire API surface").
 * Adding a channel means adding a name here, a handler in main, and a method
 * on the preload bridge. Three deliberate edits, not one accidental one.
 */
export const IPC_CHANNELS = {
  getVersion: 'app:getVersion',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface AppVersion {
  readonly app: string;
  readonly electron: string;
}

/** The complete surface exposed to the renderer through `contextBridge`. */
export interface DesktopApi {
  getVersion(): Promise<AppVersion>;
}

/** What main sends a pipeline worker. Ids, never handles. */
export interface WorkerJob {
  readonly documentId: string;
  readonly jobId: string;
}

export interface WorkerAck {
  readonly jobId: string;
  readonly status: 'received';
}
