import React, { useEffect, useState } from "react";
import {
  FileText,
  Trash2,
  Download,
  Calendar,
  Clock,
  Eye,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { useRecording } from "../contexts/RecordingContext";
import MeetingDetail from "./MeetingDetail";

const MeetingHistory: React.FC = () => {
  const { recordings, deleteRecording, updateRecording, refreshRecordings } =
    useRecording();
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  useEffect(() => {
    refreshRecordings();
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this recording?")) {
      await deleteRecording(id);
    }
  };

  const handleStartEdit = (recording: any) => {
    setEditingId(recording.id);
    setEditedTitle(recording.metadata.title || "");
  };

  const handleSaveEdit = async (id: string) => {
    const recording = recordings.find((r) => r.id === id);
    if (recording && editedTitle.trim() !== recording.metadata.title) {
      await updateRecording(id, {
        metadata: {
          ...recording.metadata,
          title: editedTitle.trim() || "Untitled Meeting",
        },
      });
    }
    setEditingId(null);
    setEditedTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedTitle("");
  };
  if (recordings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <div className="text-center h-fit">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No recordings found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start a new recording to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Meeting History
        </h2>

        <div className="grid gap-4">
          {recordings.map((recording) => (
            <div
              key={`${recording.id}-${recording.metadata.title}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === recording.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 text-lg font-semibold bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(recording.id);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(recording.id)}
                        className="p-1 text-green-600 hover:text-green-700 rounded"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-600 hover:text-gray-700 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {recording.metadata.title || "Untitled Meeting"}
                      </h3>
                      <button
                        onClick={() => handleStartEdit(recording)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                        title="Edit title"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(recording.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(recording.duration)}
                    </div>
                  </div>

                  {recording.metadata.participants && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Participants: {recording.metadata.participants}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    {recording.transcript && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Transcribed
                      </span>
                    )}
                    {recording.summary && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        Summarized
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {(recording.transcript || recording.summary) && (
                    <button
                      onClick={() => setSelectedRecordingId(recording.id)}
                      className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Show details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  )}
                  {/* <button
                    onClick={() => handleDownloadAudio(recording)}
                    className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button> */}
                  <button
                    onClick={() => handleDelete(recording.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Detail Modal */}
      {selectedRecordingId && (
        <MeetingDetail
          recording={recordings.find((r) => r.id === selectedRecordingId)!}
          onClose={() => setSelectedRecordingId(null)}
        />
      )}
    </>
  );
};

export default MeetingHistory;
