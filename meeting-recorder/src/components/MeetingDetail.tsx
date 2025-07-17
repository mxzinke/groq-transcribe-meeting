import React from 'react';
import { X, FileText, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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

interface MeetingDetailProps {
  recording: Recording;
  onClose: () => void;
}

const MeetingDetail: React.FC<MeetingDetailProps> = ({ recording, onClose }) => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('summary');
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleCopy = async (text: string, type: 'transcript' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'transcript') {
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
      } else {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {recording.metadata.title || 'Meeting Details'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(recording.date).toLocaleString('de-DE')}
              </p>
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
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Zusammenfassung
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'transcript'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Transkript
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'summary' && (
            <div>
              {recording.summary ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Meeting Zusammenfassung
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(recording.summary!, 'summary')}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {copiedSummary ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedSummary ? 'Kopiert!' : 'Kopieren'}
                      </button>
                      <button
                        onClick={() => handleDownload(recording.summary!, `summary_${recording.id}.md`)}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      {recording.summary}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Keine Zusammenfassung verfügbar
                </p>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div>
              {recording.transcript ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Transkript
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(recording.transcript!, 'transcript')}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {copiedTranscript ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedTranscript ? 'Kopiert!' : 'Kopieren'}
                      </button>
                      <button
                        onClick={() => handleDownload(recording.transcript!, `transcript_${recording.id}.txt`)}
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
                  Kein Transkript verfügbar
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