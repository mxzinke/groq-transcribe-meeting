import React, { useState, useEffect } from 'react';
import { Moon, Sun, Key, Save, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsView: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [groqApiKey, setGroqApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load saved API key
    const loadApiKey = async () => {
      const savedKey = await window.electronAPI.store.get('groqApiKey');
      if (savedKey) {
        setGroqApiKey(savedKey);
      }
    };
    loadApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      await window.electronAPI.store.set('groqApiKey', groqApiKey);
      setSaveMessage('API-Schlüssel erfolgreich gespeichert!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Fehler beim Speichern des API-Schlüssels.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Einstellungen
      </h2>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Erscheinungsbild
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Dark Mode
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Schaltet zwischen hellem und dunklem Design um
              </p>
            </div>
            
            <button
              onClick={toggleTheme}
              className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              style={{ backgroundColor: isDarkMode ? '#3B82F6' : '#E5E7EB' }}
            >
              <span className="sr-only">Toggle dark mode</span>
              <span
                className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
              {isDarkMode ? (
                <Moon className="absolute right-1 w-3 h-3 text-white" />
              ) : (
                <Sun className="absolute left-1 w-3 h-3 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Groq API Konfiguration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API-Schlüssel
              </label>
              <input
                type="password"
                id="apiKey"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Erhalten Sie Ihren API-Schlüssel von{' '}
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.groq.com/keys
                </a>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveApiKey}
                disabled={isSaving || !groqApiKey}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Speichern...' : 'Speichern'}
              </button>

              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('erfolgreich') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-200">
                Datenschutz-Hinweis
              </h4>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Diese App speichert alle Daten lokal auf Ihrem Computer. Nur die Audio-Dateien 
                werden zur Transkription an Groq gesendet. Ihre Meeting-Inhalte werden nicht 
                dauerhaft auf externen Servern gespeichert.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;