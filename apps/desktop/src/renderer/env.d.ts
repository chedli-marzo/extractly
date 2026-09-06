/// <reference types="vite/client" />
import type { DesktopApi } from '@app/shared';

declare global {
  interface Window {
    readonly desktop: DesktopApi;
  }
}
