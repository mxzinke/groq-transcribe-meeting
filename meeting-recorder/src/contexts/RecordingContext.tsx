import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface Recording {
  id: string;
  date: Date;
  duration: number;
  audioPath: string;
  transcriptPath?: string;
  summaryPath?: string;
  metadata: {
    title?: string;
    participants?: string;
  };
}

interface RecordingContextType {
  isRecording: boolean;
  isProcessing: boolean;
  currentDuration: number;
  recordings: Recording[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  refreshRecordings: () => Promise<void>;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timer | null>(null);

  const startRecording = async () => {
    try {
      // Get user media with audio
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await saveRecording(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setCurrentDuration(0);

      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCurrentDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Fehler beim Starten der Aufnahme. Bitte überprüfen Sie die Mikrofonberechtigungen.');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      setIsRecording(false);
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      // TODO: Implement actual file saving and AI processing
      // For now, just create a mock recording
      const newRecording: Recording = {
        id: Date.now().toString(),
        date: new Date(),
        duration: currentDuration,
        audioPath: 'mock-path.webm',
        metadata: {
          title: `Meeting vom ${new Date().toLocaleDateString('de-DE')}`,
        }
      };

      setRecordings(prev => [newRecording, ...prev]);
      setIsProcessing(false);

    } catch (error) {
      console.error('Failed to save recording:', error);
      setIsProcessing(false);
    }
  };

  const deleteRecording = async (id: string) => {
    // TODO: Implement actual file deletion
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };

  const refreshRecordings = async () => {
    // TODO: Load recordings from file system
  };

  const value: RecordingContextType = {
    isRecording,
    isProcessing,
    currentDuration,
    recordings,
    startRecording,
    stopRecording,
    deleteRecording,
    refreshRecordings,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
};