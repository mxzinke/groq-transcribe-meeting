import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecordingInterface from '../components/RecordingInterface';
import { RecordingProvider } from '../contexts/RecordingContext';

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => 
      Promise.resolve({
        getTracks: () => [],
      } as MediaStream)
    ),
  },
  configurable: true,
});

// Mock MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null,
  onstop: null,
  stream: {
    getTracks: () => [{
      stop: vi.fn(),
    }],
  },
})) as any;

describe('RecordingInterface', () => {
  it('renders start recording button initially', () => {
    render(
      <RecordingProvider>
        <RecordingInterface />
      </RecordingProvider>
    );

    expect(screen.getByText('Meeting Aufnahme')).toBeInTheDocument();
    expect(screen.getByText('Aufnahme starten')).toBeInTheDocument();
  });

  it('shows recording state when recording starts', async () => {
    render(
      <RecordingProvider>
        <RecordingInterface />
      </RecordingProvider>
    );

    const startButton = screen.getByText('Aufnahme starten');
    fireEvent.click(startButton);

    // Wait for state update
    await screen.findByText('Aufnahme läuft...');
    expect(screen.getByText('Aufnahme beenden')).toBeInTheDocument();
  });

  it('displays tip when not recording', () => {
    render(
      <RecordingProvider>
        <RecordingInterface />
      </RecordingProvider>
    );

    expect(screen.getByText(/Stellen Sie sicher, dass Ihr Mikrofon/)).toBeInTheDocument();
  });
});