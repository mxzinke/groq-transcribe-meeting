import React from 'react';
import { Mic, Square, Activity, Loader2 } from 'lucide-react';
import { useRecording } from '../contexts/RecordingContext';

const RecordingInterface: React.FC = () => {
  const { 
    isRecording, 
    isProcessing, 
    currentDuration, 
    startRecording, 
    stopRecording 
  } = useRecording();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Meeting Aufnahme
          </h2>

          {/* Status Display */}
          <div className="text-center mb-12">
            {isRecording && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                  Aufnahme läuft...
                </span>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                  Verarbeitung läuft...
                </span>
              </div>
            )}

            {/* Duration Display */}
            {(isRecording || isProcessing) && (
              <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
                {formatDuration(currentDuration)}
              </div>
            )}

            {!isRecording && !isProcessing && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Klicken Sie auf den Button, um eine neue Aufnahme zu starten
              </p>
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
                  Aufnahme starten
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
                  Aufnahme beenden
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
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Audio Level:</span>
                <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          {!isRecording && !isProcessing && (
            <div className="mt-12 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tipp:</strong> Stellen Sie sicher, dass Ihr Mikrofon korrekt eingerichtet ist 
                und Sie sich in einer ruhigen Umgebung befinden für beste Ergebnisse.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingInterface;