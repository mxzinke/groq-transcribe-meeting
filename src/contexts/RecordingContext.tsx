import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import AIService from "../services/aiService";

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
    additionalContext?: string;
  };
}

interface RecordingContextType {
  isRecording: boolean;
  isProcessing: boolean;
  currentDuration: number;
  recordings: Recording[];
  processingStatus: string;
  audioLevel: number;
  meetingTitle: string;
  meetingParticipants: string;
  additionalContext: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<void>;
  refreshRecordings: () => Promise<void>;
  setMeetingTitle: (title: string) => void;
  setMeetingParticipants: (participants: string) => void;
  setAdditionalContext: (context: string) => void;
  clearMeetingMetadata: () => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(
  undefined,
);

const createMixedAudioStream = async (): Promise<MediaStream> => {
  try {
    console.log("Mixed audio stream created (mic + system)");
    return await (window as any).getLoopbackAudioMediaStream();
  } catch (error) {
    console.error("Failed to create mixed audio stream:", error);
    // Fallback to microphone only
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    });
  }
};

export const RecordingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [processingStatus, setProcessingStatus] = useState("");
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingParticipants, setMeetingParticipants] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentStreamRef = useRef<null | MediaStream>(null);

  // Initialize AI Service when API key is available
  useEffect(() => {
    const initializeAIService = async () => {
      const apiKey = await window.electronAPI.store.get("groqApiKey");
      if (apiKey && typeof apiKey === "string") {
        const service = new AIService(apiKey);
        const isValid = await service.checkApiKey();
        if (isValid) {
          setAiService(service);
        } else {
          console.error("Invalid Groq API key");
        }
      }
    };

    initializeAIService();
    loadRecordings();
    startAudioMonitoring();

    return () => {
      stopAudioMonitoring();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startAudioMonitoring = async () => {
    try {
      // Get microphone for audio level monitoring
      const micStream = await createMixedAudioStream();

      // Create audio context for monitoring
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // Create analyser node
      analyserRef.current = audioContext.createAnalyser();
      const analyser = analyserRef.current;
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.05;

      // Create audio source node
      const audioSource = audioContext.createMediaStreamSource(micStream);
      audioSource.connect(analyser);

      // Start audio level monitoring
      startAudioLevelLoop();

      console.log("Audio monitoring started");
    } catch (error) {
      console.error("Failed to start audio monitoring:", error);
      setAudioLevel(0);
    }
  };

  const startAudioLevelLoop = () => {
    const updateAudioLevel = () => {
      if (analyserRef.current) {
        try {
          const bufferLength = analyserRef.current.fftSize;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(dataArray);

          // Calculate RMS (Root Mean Square) for volume
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const sample = (dataArray[i] - 128) / 128;
            sum += sample * sample;
          }
          const rms = Math.sqrt(sum / bufferLength);
          const level = Math.min(rms * 200, 100);
          setAudioLevel(level);

          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        } catch (error) {
          console.error("Error in audio level monitoring:", error);
          setAudioLevel(0);
        }
      }
    };

    updateAudioLevel();
  };

  const stopAudioMonitoring = () => {
    console.log("Stopping audio monitoring...");

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (currentStreamRef.current && !isRecording) {
      currentStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      currentStreamRef.current = null;
    }

    setAudioLevel(0);
    console.log("Audio monitoring stopped");
  };

  const loadRecordings = async () => {
    try {
      const savedRecordings = await window.electronAPI.store.get("recordings");
      if (savedRecordings && Array.isArray(savedRecordings)) {
        setRecordings(
          savedRecordings.map((rec: any) => ({
            ...rec,
            date: new Date(rec.date),
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load recordings:", error);
    }
  };

  const saveRecordings = async (updatedRecordings: Recording[]) => {
    try {
      await window.electronAPI.store.set("recordings", updatedRecordings);
      setRecordings(updatedRecordings);
    } catch (error) {
      console.error("Failed to save recordings:", error);
    }
  };

  const startRecording = async () => {
    try {
      // Create audio stream with mic + system audio
      const audioStream = currentStreamRef.current || (await createMixedAudioStream());

      // Create media recorder
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await saveRecording(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000);
      setIsRecording(true);
      setCurrentDuration(0);

      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCurrentDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Error starting recording. Please check permissions.");
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      setProcessingStatus("Stopping recording...");

      mediaRecorderRef.current.stop();

      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setIsRecording(false);
      console.log("Recording stopped");
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    try {
      const recordingId = Date.now().toString();
      const duration = currentDuration;

      // Create recording object
      const newRecording: Recording = {
        id: recordingId,
        date: new Date(),
        duration: duration,
        audioPath: `recording_${recordingId}.webm`,
        metadata: {
          title:
            meetingTitle || `Meeting from ${new Date().toLocaleDateString()}`,
          participants: meetingParticipants,
          additionalContext: additionalContext,
        },
      };

      // Save recording to state immediately
      const updatedRecordings = [newRecording, ...recordings];
      await saveRecordings(updatedRecordings);

      // Process with AI if service is available
      if (aiService) {
        try {
          // Transcribe audio
          setProcessingStatus("Transcribing audio...");
          const transcriptionResult = await aiService.transcribeAudio(
            audioBlob,
            (progress) => {
              setProcessingStatus(progress.message || "Processing...");
            },
          );

          newRecording.transcript = transcriptionResult.text;
          newRecording.transcriptPath = `transcript_${recordingId}.txt`;

          // Update recording with transcript
          const recordingsWithTranscript = updatedRecordings.map((rec) =>
            rec.id === recordingId ? newRecording : rec,
          );
          await saveRecordings(recordingsWithTranscript);

          // Generate summary
          setProcessingStatus("Generating summary...");
          const summary = await aiService.generateSummary(
            transcriptionResult.text,
            {
              date: new Date().toLocaleDateString(),
              duration: formatDuration(duration),
              participants: newRecording.metadata.participants,
              additionalContext: newRecording.metadata.additionalContext,
            },
          );

          newRecording.summary = summary;
          newRecording.summaryPath = `summary_${recordingId}.md`;

          // Final update with summary
          const finalRecordings = recordingsWithTranscript.map((rec) =>
            rec.id === recordingId ? newRecording : rec,
          );
          await saveRecordings(finalRecordings);
        } catch (error) {
          console.error("AI processing failed:", error);
          setProcessingStatus("AI processing failed");
        }
      } else {
        setProcessingStatus("No AI integration available");
      }

      // Clear meeting metadata after successful recording
      setMeetingTitle("");
      setMeetingParticipants("");
      setAdditionalContext("");

      setIsProcessing(false);
      setProcessingStatus("");
    } catch (error) {
      console.error("Failed to save recording:", error);
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const clearMeetingMetadata = () => {
    setMeetingTitle("");
    setMeetingParticipants("");
    setAdditionalContext("");
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const deleteRecording = async (id: string) => {
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    await saveRecordings(updatedRecordings);
  };

  const updateRecording = async (id: string, updates: Partial<Recording>) => {
    const updatedRecordings = recordings.map((rec) =>
      rec.id === id ? { ...rec, ...updates } : rec
    );
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
    audioLevel,
    meetingTitle,
    meetingParticipants,
    additionalContext,
    startRecording,
    stopRecording,
    deleteRecording,
    updateRecording,
    refreshRecordings,
    setMeetingTitle,
    setMeetingParticipants,
    setAdditionalContext,
    clearMeetingMetadata,
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
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};
