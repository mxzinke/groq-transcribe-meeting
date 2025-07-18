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

interface AudioDevice {
  deviceId: string;
  label: string;
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
  availableDevices: AudioDevice[];
  selectedDeviceId: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
  updateRecording: (id: string, updates: Partial<Recording>) => Promise<void>;
  refreshRecordings: () => Promise<void>;
  setMeetingTitle: (title: string) => void;
  setMeetingParticipants: (participants: string) => void;
  setAdditionalContext: (context: string) => void;
  clearMeetingMetadata: () => void;
  setSelectedDeviceId: (deviceId: string) => void;
  refreshDevices: () => Promise<void>;
}

const RecordingContext = createContext<RecordingContextType | undefined>(
  undefined,
);

// Audio mixer class for combining microphone and system audio
class AudioMixer {
  private audioContext: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private systemSource: MediaStreamAudioSourceNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private analyser: AnalyserNode | null = null;

  async createCombinedStream(
    micStream: MediaStream,
    systemStream?: MediaStream,
  ): Promise<{ combinedStream: MediaStream; analyser: AnalyserNode }> {
    // Create audio context
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Create analyser for audio level monitoring
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;

    // Create sources
    this.micSource = this.audioContext.createMediaStreamSource(micStream);

    if (systemStream) {
      // If we have system audio, mix both streams
      this.systemSource =
        this.audioContext.createMediaStreamSource(systemStream);

      // Create merger to combine audio
      this.merger = this.audioContext.createChannelMerger(2);

      // Connect microphone to left channel and system audio to right channel
      this.micSource.connect(this.merger, 0, 0);
      this.systemSource.connect(this.merger, 0, 1);

      // Create destination stream
      this.destination = this.audioContext.createMediaStreamDestination();
      this.merger.connect(this.destination);
      this.merger.connect(this.analyser);
    } else {
      // Only microphone audio
      this.destination = this.audioContext.createMediaStreamDestination();
      this.micSource.connect(this.destination);
      this.micSource.connect(this.analyser);
    }

    return {
      combinedStream: this.destination.stream,
      analyser: this.analyser,
    };
  }

  cleanup() {
    this.micSource?.disconnect();
    this.systemSource?.disconnect();
    this.merger?.disconnect();
    this.destination?.disconnect();
    this.analyser?.disconnect();

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.micSource = null;
    this.systemSource = null;
    this.merger = null;
    this.destination = null;
    this.analyser = null;
  }
}

const createMicrophoneStream = async (
  deviceId?: string,
): Promise<MediaStream> => {
  try {
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error("Failed to create microphone stream:", error);
    throw error;
  }
};

const createSystemAudioStream = async (): Promise<MediaStream | null> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `Attempting to get system audio stream (attempt ${attempt}/${MAX_RETRIES})`,
      );

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("System audio timeout")), 10000),
      );

      const streamPromise = (window as any).getLoopbackAudioMediaStream();

      const stream = await Promise.race([streamPromise, timeoutPromise]);

      // Validate that the stream has audio tracks
      if (stream && stream.getAudioTracks().length > 0) {
        const audioTracks = stream.getAudioTracks();
        console.log(
          `System audio stream acquired with ${audioTracks.length} audio track(s)`,
        );

        // Verify that at least one audio track is enabled
        const enabledTracks = audioTracks.filter(
          (track: MediaStreamTrack) => track.enabled,
        );
        if (enabledTracks.length === 0) {
          console.warn("System audio tracks are disabled, enabling them");
          audioTracks.forEach(
            (track: MediaStreamTrack) => (track.enabled = true),
          );
        }

        return stream;
      } else {
        throw new Error("No audio tracks found in system stream");
      }
    } catch (error) {
      console.error(`System audio attempt ${attempt} failed:`, error);

      // If this isn't the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  console.warn("Failed to acquire system audio after all retries");
  return null;
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
  const [availableDevices, setAvailableDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioMixerRef = useRef<AudioMixer | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

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
    refreshDevices();
    startAudioMonitoring();

    return () => {
      stopAudioMonitoring();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const refreshDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        }));

      setAvailableDevices(audioInputs);

      // Set default device if none selected
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Failed to enumerate audio devices:", error);
    }
  };

  const startAudioMonitoring = async () => {
    try {
      await stopAudioMonitoring(); // Clean up any existing monitoring

      // Create microphone stream
      const micStream = await createMicrophoneStream(selectedDeviceId);
      micStreamRef.current = micStream;

      // Try to get system audio stream
      const systemStream = await createSystemAudioStream();
      systemStreamRef.current = systemStream;

      // Create audio mixer
      audioMixerRef.current = new AudioMixer();
      const { combinedStream, analyser } =
        await audioMixerRef.current.createCombinedStream(
          micStream,
          systemStream || undefined,
        );

      combinedStreamRef.current = combinedStream;
      analyserRef.current = analyser;

      // Start audio level monitoring
      startAudioLevelLoop();

      console.log("Audio monitoring started with combined stream");
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

  const stopAudioMonitoring = async () => {
    console.log("Stopping audio monitoring...");

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clean up audio mixer
    if (audioMixerRef.current) {
      audioMixerRef.current.cleanup();
      audioMixerRef.current = null;
    }

    // Stop and clean up streams
    if (micStreamRef.current && !isRecording) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (systemStreamRef.current && !isRecording) {
      systemStreamRef.current.getTracks().forEach((track) => track.stop());
      systemStreamRef.current = null;
    }

    if (combinedStreamRef.current && !isRecording) {
      combinedStreamRef.current.getTracks().forEach((track) => track.stop());
      combinedStreamRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    console.log("Audio monitoring stopped");
  };

  // Restart audio monitoring when device changes
  useEffect(() => {
    if (!isRecording) {
      startAudioMonitoring();
    }
  }, [selectedDeviceId]);

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
      // Use the existing combined stream or create a new one
      let recordingStream = combinedStreamRef.current;

      if (!recordingStream) {
        // Create streams if not available
        const micStream = await createMicrophoneStream(selectedDeviceId);
        const systemStream = await createSystemAudioStream();

        audioMixerRef.current = new AudioMixer();
        const { combinedStream } =
          await audioMixerRef.current.createCombinedStream(
            micStream,
            systemStream || undefined,
          );
        recordingStream = combinedStream;
      }

      // Create media recorder
      const mediaRecorder = new MediaRecorder(recordingStream, {
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

      console.log("Recording started with combined stream");
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert(
        "Error starting recording. Please check permissions and device selection.",
      );
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      setProcessingStatus("Stopping recording...");

      mediaRecorderRef.current.stop();

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setIsRecording(false);

      // Restart audio monitoring after recording stops
      setTimeout(() => {
        startAudioMonitoring();
      }, 100);

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
      rec.id === id ? { ...rec, ...updates } : rec,
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
    availableDevices,
    selectedDeviceId,
    startRecording,
    stopRecording,
    deleteRecording,
    updateRecording,
    refreshRecordings,
    setMeetingTitle,
    setMeetingParticipants,
    setAdditionalContext,
    clearMeetingMetadata,
    setSelectedDeviceId,
    refreshDevices,
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
