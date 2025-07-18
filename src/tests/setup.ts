import '@testing-library/jest-dom';

// Mock electron API
global.electronAPI = {
  getAppPath: async () => '/mock/path',
  store: {
    get: async (_key: string) => null,
    set: async (_key: string, _value: any) => { /* Mock implementation */ },
    delete: async (_key: string) => { /* Mock implementation */ },
  },
  audio: {
    requestPermission: async () => { /* Mock implementation */ },
  },
};