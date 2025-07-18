export interface IElectronAPI {
  getAppPath: () => Promise<string>;
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  audio: {
    requestPermission: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}