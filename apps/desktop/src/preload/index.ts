import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, type AppVersion, type DesktopApi } from '@app/shared';

/**
 * The entire API surface available to the renderer.
 *
 * Hand-written, one method per channel. There is deliberately no
 * `invoke(channel, args)` passthrough: that single generic function would hand
 * the renderer every present and future handler in the main process
 * (docs/security.md).
 */
const api: DesktopApi = {
  getVersion: (): Promise<AppVersion> =>
    ipcRenderer.invoke(IPC_CHANNELS.getVersion) as Promise<AppVersion>,
};

contextBridge.exposeInMainWorld('desktop', api);
