/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Initialize electron-audio-loopback in renderer
async function getLoopbackAudioMediaStream() {
  // Tell the main process to enable system audio loopback.
  // This will override the default `getDisplayMedia` behavior.
  await window.electronAPI.enableLoopbackAudio();

  // Get a MediaStream with system audio loopback.
  // `getDisplayMedia` will fail if you don't request `video: true`.
  const stream = await navigator.mediaDevices.getDisplayMedia({ 
    video: true,
    audio: true,
  });
  
  // Remove video tracks that we don't need.
  // Note: You may find bugs if you don't remove video tracks.
  const videoTracks = stream.getVideoTracks();

  videoTracks.forEach(track => {
      track.stop();
      stream.removeTrack(track);
  });

  // Tell the main process to disable system audio loopback.
  // This will restore full `getDisplayMedia` functionality.
  await window.electronAPI.disableLoopbackAudio();
  
  // Boom! You've got a MediaStream with system audio loopback.
  // Use it with an audio element or Web Audio API.
  return stream;
}

// Make it available globally for the context
(window as any).getLoopbackAudioMediaStream = getLoopbackAudioMediaStream;

// Create root element and render React app
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    React.createElement(React.StrictMode, null, React.createElement(App)),
  );
} else {
  console.error("Root element not found");
}
