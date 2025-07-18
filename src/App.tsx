import React, { useState, useEffect } from "react";
import { Mic, Settings, Clock } from "lucide-react";
import RecordingInterface from "./components/RecordingInterface";
import MeetingHistory from "./components/MeetingHistory";
import SettingsView from "./components/SettingsView";
import { ThemeProvider } from "./contexts/ThemeContext";
import { RecordingProvider } from "./contexts/RecordingContext";

type View = "recording" | "history" | "settings";

function App() {
  const [currentView, setCurrentView] = useState<View>("recording");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference
    const loadTheme = async () => {
      const savedTheme = await window.electronAPI.store.get("theme");
      if (savedTheme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      await window.electronAPI.store.set("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      await window.electronAPI.store.set("theme", "light");
    }
  };

  return (
    <ThemeProvider value={{ isDarkMode, toggleTheme }}>
      <RecordingProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          {/* Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="p-6 pt-10">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Mic className="w-6 h-6 text-primary" />
                Meeting Recorder
              </h1>
            </div>

            <nav className="px-4 pb-4">
              <button
                onClick={() => setCurrentView("recording")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  currentView === "recording"
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Mic className="w-5 h-5" />
                Recording
              </button>

              <button
                onClick={() => setCurrentView("history")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors mt-2 ${
                  currentView === "history"
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Clock className="w-5 h-5" />
                History
              </button>

              <button
                onClick={() => setCurrentView("settings")}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors mt-2 ${
                  currentView === "settings"
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {currentView === "recording" && <RecordingInterface />}
            {currentView === "history" && <MeetingHistory />}
            {currentView === "settings" && <SettingsView />}
          </div>
        </div>
      </RecordingProvider>
    </ThemeProvider>
  );
}

export default App;
