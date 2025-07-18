import React, { useState } from "react";
import { X, FileText, Download, Copy, Check, Edit2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRecording } from "../contexts/RecordingContext";

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

interface MeetingDetailProps {
  recording: Recording;
  onClose: () => void;
}

const MeetingDetail: React.FC<MeetingDetailProps> = ({
  recording,
  onClose,
}) => {
  const { updateRecording } = useRecording();
  const [activeTab, setActiveTab] = useState<"transcript" | "summary">(
    "summary",
  );
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(
    recording.metadata.title || "",
  );

  const handleCopy = async (text: string, type: "transcript" | "summary") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "transcript") {
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
      } else {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() !== recording.metadata.title) {
      await updateRecording(recording.id, {
        metadata: {
          ...recording.metadata,
          title: editedTitle.trim() || "Untitled Meeting",
        },
      });
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(recording.metadata.title || "");
    setIsEditingTitle(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recording.metadata.title || "Meeting Details"}
                  </h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                    title="Edit title"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(recording.date).toLocaleString()}
              </p>
              {recording.metadata.participants && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Participants: {recording.metadata.participants}
                </p>
              )}
              {recording.metadata.additionalContext && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Additional Context:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {recording.metadata.additionalContext}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "summary"
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Zusammenfassung
            </button>
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "transcript"
                  ? "bg-primary text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Transkript
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "summary" && (
            <div>
              {recording.summary ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Summary
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleCopy(recording.summary!, "summary")
                        }
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {copiedSummary ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedSummary ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(
                            recording.summary!,
                            `summary_${recording.id}.md`,
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {recording.summary}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No summary available
                </p>
              )}
            </div>
          )}

          {activeTab === "transcript" && (
            <div>
              {recording.transcript ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Transcript
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleCopy(recording.transcript!, "transcript")
                        }
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {copiedTranscript ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedTranscript ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(
                            recording.transcript!,
                            `transcript_${recording.id}.txt`,
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {recording.transcript}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No transcript available
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;
