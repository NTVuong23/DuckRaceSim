import { Suspense, useEffect, useState } from "react";
import { Toaster } from "sonner";
import "@fontsource/inter";

import DuckForm from "./components/DuckRace/DuckForm";
import DuckCanvas from "./components/DuckRace/DuckCanvas";
import ControlPanel from "./components/DuckRace/ControlPanel";
import ResultsDisplay from "./components/DuckRace/ResultsDisplay";
import { useDuckRace } from "./lib/stores/useDuckRace";
import { useAudio } from "./lib/stores/useAudio";

// Main App component
function App() {
  const { showResults, setDucksFromStorage } = useDuckRace();
  const [showSettings, setShowSettings] = useState(true);
  
  // Initialize audio resources
  const { isMuted, toggleMute, setBackgroundMusic, setSuccessSound } = useAudio();
  
  useEffect(() => {
    // Load audio resources
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);
    
    const success = new Audio("/sounds/success.mp3");
    success.volume = 0.5;
    setSuccessSound(success);
    
    // Load ducks from local storage
    setDucksFromStorage();
  }, [setBackgroundMusic, setSuccessSound, setDucksFromStorage]);
  
  // Toggle settings visibility
  const handleToggleSettings = () => {
    setShowSettings(prev => !prev);
  };
  
  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gradient-to-b from-green-400 to-green-600 font-nunito text-slate-800">
      <header className="w-full bg-gradient-to-r from-green-500 to-green-600 py-3 text-center relative shadow-lg">
        <div className="flex justify-between items-center px-4">
          <div className="flex space-x-3">
            <button 
              className="bg-white rounded-full p-2.5 shadow-md hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95"
              onClick={handleToggleSettings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button 
              className="bg-white rounded-full p-2.5 shadow-md hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95"
              onClick={toggleMute}
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-x"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" x2="17" y1="9" y2="15"></line><line x1="17" x2="23" y1="9" y2="15"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">Đua Vịt</h1>
          </div>
          
          <div>
            {/* Placeholder to keep header balanced - timer is now in canvas */}
            <div className="w-16"></div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-6xl flex flex-col items-center">
        <Suspense fallback={<div>Loading...</div>}>
          {showSettings && !showResults && <DuckForm />}
          
          <div className="relative w-full my-2">
            <DuckCanvas />
          </div>
          
          <ControlPanel />
          
          {showResults && <ResultsDisplay />}
        </Suspense>
      </main>
      
      <footer className="w-full bg-gradient-to-r from-green-600 to-green-500 py-2 text-center text-white text-sm">
        <p>Trò Chơi Đua Vịt &copy; {new Date().getFullYear()}</p>
      </footer>
      
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
