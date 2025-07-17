import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import AIService from '../services/aiService';

interface Recording {
  id: string;
  date: Date;
  duration: number;
  audioPath: string;
  transcriptPath?: string;
  summaryPath?: string;
  transcript?: string;
  summary?: string;
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
  processingStatus: string;
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
  const [processingStatus, setProcessingStatus] = useState('');
  const [aiService, setAiService] = useState<AIService | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timer | null>(null);

  // Initialize AI Service when API key is available
  useEffect(() => {
    const initializeAIService = async () => {
      const apiKey = await window.electronAPI.store.get('groqApiKey');
      if (apiKey && typeof apiKey === 'string') {
        const service = new AIService(apiKey);
        const isValid = await service.checkApiKey();
        if (isValid) {
          setAiService(service);
        } else {
          console.error('Invalid Groq API key');
        }
      }
    };
    
    initializeAIService();
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const savedRecordings = await window.electronAPI.store.get('recordings');
      if (savedRecordings && Array.isArray(savedRecordings)) {
        setRecordings(savedRecordings.map((rec: any) => ({
          ...rec,
          date: new Date(rec.date)
        })));
      }
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const saveRecordings = async (updatedRecordings: Recording[]) => {
    try {
      await window.electronAPI.store.set('recordings', updatedRecordings);
      setRecordings(updatedRecordings);
    } catch (error) {
      console.error('Failed to save recordings:', error);
    }
  };

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
      setProcessingStatus('Aufnahme wird beendet...');
      
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
      const recordingId = Date.now().toString();
      const duration = currentDuration;
      
      // Create initial recording object
      const newRecording: Recording = {
        id: recordingId,
        date: new Date(),
        duration: duration,
        audioPath: `recording_${recordingId}.webm`,
        metadata: {
          title: `Meeting vom ${new Date().toLocaleDateString('de-DE')}`,
        }
      };

      // Save recording to state immediately
      const updatedRecordings = [newRecording, ...recordings];
      await saveRecordings(updatedRecordings);

      // Process with AI if service is available
      if (aiService) {
        try {
          // Transcribe audio
          setProcessingStatus('Audio wird transkribiert...');
          const transcriptionResult = await aiService.transcribeAudio(audioBlob, (progress) => {
            setProcessingStatus(progress.message || 'Verarbeitung...');
          });

          newRecording.transcript = transcriptionResult.text;
          newRecording.transcriptPath = `transcript_${recordingId}.txt`;

          // Update recording with transcript
          const recordingsWithTranscript = updatedRecordings.map(rec => 
            rec.id === recordingId ? newRecording : rec
          );
          await saveRecordings(recordingsWithTranscript);

          // Generate summary
          setProcessingStatus('Zusammenfassung wird erstellt...');
          const summary = await aiService.generateSummary(transcriptionResult.text, {
            date: new Date().toLocaleDateString('de-DE'),
            duration: formatDuration(duration)
          });

          newRecording.summary = summary;
          newRecording.summaryPath = `summary_${recordingId}.md`;

          // Final update with summary
          const finalRecordings = recordingsWithTranscript.map(rec => 
            rec.id === recordingId ? newRecording : rec
          );
          await saveRecordings(finalRecordings);

        } catch (error) {
          console.error('AI processing failed:', error);
          setProcessingStatus('AI-Verarbeitung fehlgeschlagen');
        }
      } else {
        setProcessingStatus('Keine AI-Integration verfügbar');
      }

      setIsProcessing(false);
      setProcessingStatus('');

    } catch (error) {
      console.error('Failed to save recording:', error);
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const deleteRecording = async (id: string) => {
    const updatedRecordings = recordings.filter(rec => rec.id !== id);
    await saveRecordings(updatedRecordings);
  };

  const refreshRecordings = async () => {
    await loadRecordings();
  };

  const value: RecordingContextType = {
    isRecording,
    isProcessing,
    currentDuration,
    recordings,
    processingStatus,
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