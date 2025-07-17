import React, { useEffect } from 'react';
import { FileText, Trash2, Download, Calendar, Clock } from 'lucide-react';
import { useRecording } from '../contexts/RecordingContext';

const MeetingHistory: React.FC = () => {
  const { recordings, deleteRecording, refreshRecordings } = useRecording();

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
    if (window.confirm('Möchten Sie diese Aufnahme wirklich löschen?')) {
      await deleteRecording(id);
    }
  };

  if (recordings.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Keine Aufnahmen vorhanden
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Starten Sie eine neue Aufnahme, um sie hier zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Meeting Verlauf
      </h2>

      <div className="grid gap-4">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {recording.metadata.title || 'Unbenanntes Meeting'}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(recording.date).toLocaleDateString('de-DE')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(recording.duration)}
                  </div>
                </div>

                {recording.metadata.participants && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Teilnehmer: {recording.metadata.participants}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  {recording.transcriptPath && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Transkribiert
                    </span>
                  )}
                  {recording.summaryPath && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      Zusammengefasst
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Herunterladen"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(recording.id)}
                  className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingHistory;