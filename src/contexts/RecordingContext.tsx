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
  };
}

interface AudioSourceOption {
  id: string;
  name: string;
  type: "microphone" | "system" | "screen";
  thumbnail?: string;
}

interface RecordingContextType {
  isRecording: boolean;
  isProcessing: boolean;
  currentDuration: number;
  recordings: Recording[];
  processingStatus: string;
  audioLevel: number;
  audioSources: AudioSourceOption[];
  selectedAudioSources: string[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  refreshRecordings: () => Promise<void>;
  loadAudioSources: () => Promise<void>;
  setSelectedAudioSources: (sources: string[]) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(
  undefined,
);

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
  const [audioSources, setAudioSources] = useState<AudioSourceOption[]>([]);
  const [selectedAudioSources, setSelectedAudioSources] = useState<string[]>(
    [],
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
    loadAudioSources();

    // Cleanup function
    return () => {
      stopAudioAnalysis();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

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

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;

      // Create analyser node
      analyserRef.current = audioContext.createAnalyser();
      const analyser = analyserRef.current;

      // Configure analyser
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // Create microphone source
      microphoneRef.current = audioContext.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyser);

      // Start audio level monitoring
      startAudioLevelMonitoring();
    } catch (error) {
      console.error("Failed to setup audio analysis:", error);
    }
  };

  const startAudioLevelMonitoring = () => {
    const updateAudioLevel = () => {
      if (analyserRef.current && isRecording) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (Root Mean Square) for more accurate volume representation
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += (dataArray[i] / 255) ** 2;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Convert to percentage and apply some smoothing
        const level = Math.min(rms * 100, 100);
        setAudioLevel(level);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
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
      const audioStreams: MediaStream[] = [];

      // Get selected audio sources
      const microphoneSources = selectedAudioSources.filter(
        (id) =>
          audioSources.find((source) => source.id === id)?.type ===
          "microphone",
      );
      const systemSources = selectedAudioSources.filter(
        (id) =>
          audioSources.find((source) => source.id === id)?.type === "system",
      );

      // Get microphone audio if selected
      if (microphoneSources.length > 0) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId:
                microphoneSources[0] !== "default"
                  ? { exact: microphoneSources[0] }
                  : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          });
          audioStreams.push(micStream);
        } catch (error) {
          console.warn("Failed to get microphone audio:", error);
        }
      }

      // Get system audio if selected
      if (systemSources.length > 0) {
        try {
          // Request screen capture permission first
          const hasPermission =
            await window.electronAPI.audio.requestScreenCapturePermission();
          if (!hasPermission) {
            throw new Error("Screen capture permission denied");
          }

          for (const sourceId of systemSources) {
            const systemStream = await (
              navigator.mediaDevices as any
            ).getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: sourceId,
                },
              },
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: sourceId,
                },
              },
            });

            // Extract only audio track
            const audioTrack = systemStream.getAudioTracks()[0];
            if (audioTrack) {
              const audioOnlyStream = new MediaStream([audioTrack]);
              audioStreams.push(audioOnlyStream);
            }

            // Stop video track as we only need audio
            systemStream
              .getVideoTracks()
              .forEach((track: MediaStreamTrack) => track.stop());
          }
        } catch (error) {
          console.warn("Failed to get system audio:", error);
        }
      }

      // If no audio streams available, fallback to default microphone
      if (audioStreams.length === 0) {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });
        audioStreams.push(fallbackStream);
      }

      // Combine multiple audio streams if needed
      let finalStream: MediaStream;
      if (audioStreams.length === 1) {
        finalStream = audioStreams[0];
      } else {
        // Mix multiple audio streams using Web Audio API
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();

        audioStreams.forEach((stream) => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(destination);
        });

        finalStream = destination.stream;
      }

      // Setup audio analysis for level monitoring
      setupAudioAnalysis(finalStream);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(finalStream, {
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
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setCurrentDuration(0);

      // Start duration timer
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCurrentDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert(
        "Fehler beim Starten der Aufnahme. Bitte überprüfen Sie die Audio-Berechtigungen und gewählten Quellen.",
      );
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      setProcessingStatus("Aufnahme wird beendet...");

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop audio analysis
      stopAudioAnalysis();

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
          title: `Meeting vom ${new Date().toLocaleDateString("de-DE")}`,
        },
      };

      // Save recording to state immediately
      const updatedRecordings = [newRecording, ...recordings];
      await saveRecordings(updatedRecordings);

      // Process with AI if service is available
      if (aiService) {
        try {
          // Transcribe audio
          setProcessingStatus("Audio wird transkribiert...");
          const transcriptionResult = await aiService.transcribeAudio(
            audioBlob,
            (progress) => {
              setProcessingStatus(progress.message || "Verarbeitung...");
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
          setProcessingStatus("Zusammenfassung wird erstellt...");
          const summary = await aiService.generateSummary(
            transcriptionResult.text,
            {
              date: new Date().toLocaleDateString("de-DE"),
              duration: formatDuration(duration),
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
          setProcessingStatus("AI-Verarbeitung fehlgeschlagen");
        }
      } else {
        setProcessingStatus("Keine AI-Integration verfügbar");
      }

      setIsProcessing(false);
      setProcessingStatus("");
    } catch (error) {
      console.error("Failed to save recording:", error);
      setIsProcessing(false);
      setProcessingStatus("");
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
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    await saveRecordings(updatedRecordings);
  };

  const refreshRecordings = async () => {
    await loadRecordings();
  };

  const loadAudioSources = async () => {
    try {
      // Get microphone devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphoneDevices = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          id: device.deviceId,
          name: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          type: "microphone" as const,
        }));

      // Get system audio sources (screen/window capture)
      const systemSources = await window.electronAPI.audio.getSources();
      const systemAudioSources = systemSources.map((source) => ({
        id: source.id,
        name: `System Audio: ${source.name}`,
        type: "system" as const,
        thumbnail: source.thumbnail,
      }));

      const allSources = [...microphoneDevices, ...systemAudioSources];
      setAudioSources(allSources);

      // Set default selections if none are selected
      if (selectedAudioSources.length === 0 && allSources.length > 0) {
        const defaultMic =
          microphoneDevices.find((device) =>
            device.name.toLowerCase().includes("default"),
          ) || microphoneDevices[0];
        if (defaultMic) {
          setSelectedAudioSources([defaultMic.id]);
        }
      }
    } catch (error) {
      console.error("Failed to load audio sources:", error);
    }
  };

  const value: RecordingContextType = {
    isRecording,
    isProcessing,
    currentDuration,
    recordings,
    processingStatus,
    audioLevel,
    audioSources,
    selectedAudioSources,
    startRecording,
    stopRecording,
    deleteRecording,
    refreshRecordings,
    loadAudioSources,
    setSelectedAudioSources,
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
