import React, { useEffect, useState } from "react";
import {
  Mic,
  Square,
  Activity,
  Loader2,
  Users,
  MessageSquare,
} from "lucide-react";
import { useRecording } from "../contexts/RecordingContext";

const RecordingInterface: React.FC = () => {
  const [hasApiKeySet, setHasApiKeySet] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      const apiKey = await window.electronAPI.store.get("apiKey");
      setHasApiKeySet(!!apiKey);
    };
    checkApiKey();
  }, []);

  const {
    isRecording,
    isProcessing,
    currentDuration,
    processingStatus,
    audioLevel,
    meetingTitle,
    meetingParticipants,
    additionalContext,
    startRecording,
    stopRecording,
    setMeetingTitle,
    setMeetingParticipants,
    setAdditionalContext,
    clearMeetingMetadata,
  } = useRecording();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 h-screen">
      <div className="max-w-2xl w-full h-fit max-h-[calc(100vh-100px)] bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 overflow-y-auto scrollbar-trans">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Meeting Recording
        </h2>

        {/* Meeting Details Section */}
        {!isProcessing && (
          <div className="mb-8">
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g., Weekly Team Standup"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Participants
                </label>
                <input
                  type="text"
                  value={meetingParticipants}
                  onChange={(e) => setMeetingParticipants(e.target.value)}
                  placeholder="e.g., John, Sarah, Mike"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Additional Context for AI Analysis
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g., This is a quarterly review meeting. Please focus on budget decisions and action items..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white resize-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This context will help the AI provide more accurate summaries
                  and insights.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearMeetingMetadata}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Display */}
        <div className="text-center mb-12">
          {isRecording && (
            <div className="flex items-center justify-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-red-500 animate-pulse" />
              <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                Recording in progress...
              </span>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                  Processing recording...
                </span>
              </div>
              {processingStatus && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {processingStatus}
                </span>
              )}
            </div>
          )}

          {/* Duration Display */}
          {(isRecording || isProcessing) && (
            <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
              {formatDuration(currentDuration)}
            </div>
          )}

          {!isRecording && !isProcessing && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                Click the button to start a new recording
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Recording will capture both microphone and system audio
              </p>
            </div>
          )}
        </div>

        {/* Recording Button */}
        <div className="flex justify-center">
          {!isRecording && !isProcessing && (
            <button
              onClick={startRecording}
              className="group relative inline-flex items-center justify-center p-8 rounded-full bg-primary hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Mic className="w-12 h-12 text-white" />
              <span className="absolute -bottom-8 text-sm font-medium text-gray-600 dark:text-gray-400">
                Start recording
              </span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="group relative inline-flex items-center justify-center p-8 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg animate-pulse"
            >
              <Square className="w-10 h-10 text-white" />
              <span className="absolute -bottom-8 text-sm font-medium text-gray-600 dark:text-gray-400">
                Stop recording
              </span>
            </button>
          )}

          {isProcessing && (
            <button
              disabled
              className="group relative inline-flex items-center justify-center p-8 rounded-full bg-gray-300 dark:bg-gray-600 cursor-not-allowed shadow-lg"
            >
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </button>
          )}
        </div>

        {/* Audio Level Indicator */}
        <div className="mt-12">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Mic
                className={`w-4 h-4 transition-colors duration-200 ${
                  audioLevel > 10
                    ? "text-green-500"
                    : audioLevel > 5
                    ? "text-yellow-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-fit">
                Audio Level:
              </span>
            </div>
            <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full transition-all duration-100 ease-out"
                style={{
                  width: `${Math.max(audioLevel * 1.5, 2)}%`,
                  maxWidth: "100%",
                }}
              />
              {/* Peak indicators */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full flex justify-between px-1">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 h-1 rounded-full ${
                        audioLevel > (i + 1) * 10
                          ? "bg-white opacity-80"
                          : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-500 min-w-fit">
              {audioLevel.toFixed(0)}%
            </span>
          </div>
          {/* Recording status indicator */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                Recording in progress
              </span>
            </div>
          )}
        </div>

        {/* Tips */}
        {!isRecording && !isProcessing && (
          <div className="mt-16 space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Audio Setup:</strong> The app will automatically record
                both your microphone and system audio. Make sure to grant
                necessary permissions when prompted.
              </p>
            </div>
            {hasApiKeySet && (
              <div className="p-4 bg-amber-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>AI Processing:</strong> Don't forget to configure your
                  Groq API key in the settings for automatic transcription and
                  summarization.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingInterface;
