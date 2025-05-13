import { useDuckRace } from "@/lib/stores/useDuckRace";
import { useAudio } from "@/lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

const ControlPanel = () => {
  const { raceStatus, startRace, resetRace } = useDuckRace();
  const { toggleMute, isMuted } = useAudio();
  
  const canStart = raceStatus === "idle";
  const canReset = raceStatus === "racing" || raceStatus === "finished";
  
  const handleStartRace = () => {
    if (canStart) {
      startRace();
    }
  };
  
  const handleResetRace = () => {
    if (canReset) {
      resetRace();
    }
  };
  
  return (
    <div className="w-full flex flex-row items-center justify-center gap-6 my-6 max-w-lg mx-auto">
      <Button
        onClick={handleStartRace}
        disabled={!canStart}
        size="lg"
        className={`
          rounded-full px-8 py-6 text-lg font-bold shadow-lg transform transition-all duration-200
          ${canStart 
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-800 hover:scale-105 active:scale-95' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
        `}
      >
        <div className="flex items-center">
          <div className="bg-white bg-opacity-30 rounded-full p-1 mr-3">
            <Play size={22} />
          </div>
          <span>Bắt Đầu Đua</span>
        </div>
      </Button>
      
      <Button
        onClick={handleResetRace}
        disabled={!canReset}
        size="lg"
        className={`
          rounded-full px-8 py-6 text-lg font-bold shadow-lg transform transition-all duration-200
          ${canReset 
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:scale-105 active:scale-95' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
        `}
      >
        <div className="flex items-center">
          <div className="bg-white bg-opacity-30 rounded-full p-1 mr-3">
            <RotateCcw size={22} />
          </div>
          <span>Đặt Lại</span>
        </div>
      </Button>
      
      <Button
        onClick={toggleMute}
        size="lg"
        className="rounded-full p-3 bg-white shadow-lg hover:bg-gray-100 text-slate-800 transform transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isMuted ? (
          <VolumeX size={24} />
        ) : (
          <Volume2 size={24} />
        )}
      </Button>
    </div>
  );
};

export default ControlPanel;
