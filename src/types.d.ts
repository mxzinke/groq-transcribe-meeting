interface AudioSource {
  id: string;
  name: string;
  thumbnail: string;
  display_id?: string;
  appIcon?: string | null;
}

declare global {
  interface Window {
    electronAPI: {
      getAppPath: () => Promise<string>;
      store: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: any) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
      audio: {
        requestPermission: () => Promise<void>;
        getSources: () => Promise<AudioSource[]>;
        requestScreenCapturePermission: () => Promise<boolean>;
        getDevices: () => Promise<{ success: boolean; error?: string }>;
      };
    };
    webkitAudioContext: typeof AudioContext;
  }
}

export {};
