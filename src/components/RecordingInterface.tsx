import React, { useState } from "react";
import {
  Mic,
  Square,
  Activity,
  Loader2,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useRecording } from "../contexts/RecordingContext";

const RecordingInterface: React.FC = () => {
  const {
    isRecording,
    isProcessing,
    currentDuration,
    processingStatus,
    audioLevel,
    audioSources,
    selectedAudioSources,
    startRecording,
    stopRecording,
    loadAudioSources,
    setSelectedAudioSources,
  } = useRecording();

  const [showAudioSettings, setShowAudioSettings] = useState(false);

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

  const handleAudioSourceToggle = (sourceId: string) => {
    const newSelection = selectedAudioSources.includes(sourceId)
      ? selectedAudioSources.filter((id) => id !== sourceId)
      : [...selectedAudioSources, sourceId];
    setSelectedAudioSources(newSelection);
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case "microphone":
        return <Mic className="w-4 h-4" />;
      case "system":
        return <Activity className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Meeting Recording
          </h2>

          {/* Status Display */}
          <div className="text-center mb-12">
            {isRecording && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                  Recording runnning...
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                    Processing of recording...
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

                <button
                  onClick={() => setShowAudioSettings(!showAudioSettings)}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {showAudioSettings ? "Hide" : "Show"} Audio Sources
                </button>
              </div>
            )}
          </div>

          {/* Audio Source Selection */}
          {showAudioSettings && !isRecording && !isProcessing && (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Audio Sources
                </h3>
                <button
                  onClick={loadAudioSources}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              <div className="space-y-3">
                {audioSources.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No audio sources found. Click refresh to scan for devices.
                  </p>
                ) : (
                  audioSources.map((source) => (
                    <label
                      key={source.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAudioSources.includes(source.id)}
                        onChange={() => handleAudioSourceToggle(source.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        {getSourceTypeIcon(source.type)}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {source.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {source.type}
                          </div>
                        </div>
                        {source.thumbnail && (
                          <img
                            src={source.thumbnail}
                            alt={source.name}
                            className="w-12 h-8 object-cover rounded border"
                          />
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedAudioSources.length === 0 && audioSources.length > 0 && (
                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Please select at least one audio source before recording.
                </p>
              )}
            </div>
          )}

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
          {isRecording && (
            <div className="mt-12">
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-fit">
                  Audio Level:
                </span>
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
            </div>
          )}

          {/* Tips */}
          {!isRecording && !isProcessing && (
            <div className="mt-24 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Make sure your microphone is correctly set
                up and you are in a quiet environment for best results. Don't
                forget to store your Groq API key in the settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingInterface;
