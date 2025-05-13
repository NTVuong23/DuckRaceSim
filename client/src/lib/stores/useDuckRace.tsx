import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { DEFAULT_DUCKS } from "@/constants/ducks";
import { useAudio } from "./useAudio";
import { v4 as uuidv4 } from "uuid";

export type RaceStatus = "idle" | "countdown" | "racing" | "finished";
export type Duck = {
  id: number;
  name: string;
  color: string;
  position: number; // 0-100 percentage of race completion
  lane: number;
  isWinner: boolean;
};

interface DuckRaceState {
  ducks: Duck[];
  raceDuration: number; // in seconds
  countdownTime: number; // in seconds
  raceStatus: RaceStatus;
  elapsedTime: number;
  showResults: boolean;
  predeterminedWinnerId: number | null;
  
  // Actions
  addDuck: () => void;
  removeDuck: (id: number) => void;
  updateDuck: (id: number, updates: Partial<Duck>) => void;
  updateDuckColor: (id: number, color: string) => void;
  updateRaceDuration: (duration: number) => void;
  setPredeterminedWinner: (id: number | null) => void;
  startRace: () => void;
  resetRace: () => void;
  updatePositions: (deltaTime: number) => void;
  finishRace: () => void;
  setShowResults: (show: boolean) => void;
  setDucksFromStorage: () => void;
  saveDucksToStorage: () => void;
}

export const useDuckRace = create<DuckRaceState>()(
  subscribeWithSelector((set, get) => ({
    ducks: [...DEFAULT_DUCKS],
    raceDuration: 10, // Default 10 seconds
    countdownTime: 3,
    raceStatus: "idle",
    elapsedTime: 0,
    showResults: false,
    predeterminedWinnerId: null,
    
    addDuck: () => {
      const { ducks } = get();
      if (ducks.length >= 100) return; // Maximum 100 ducks
      
      // Use UUID hash to generate a guaranteed unique number ID
      // Converting it to an integer to maintain compatibility with existing code
      const uniqueId = parseInt(uuidv4().replace(/-/g, '').substring(0, 8), 16);
      
      const newDuck: Duck = {
        id: uniqueId,
        name: `Vịt ${ducks.length + 1}`,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        position: 0,
        lane: ducks.length,
        isWinner: false,
      };
      
      set({ ducks: [...ducks, newDuck] });
      get().saveDucksToStorage();
    },
    
    removeDuck: (id) => {
      const { ducks } = get();
      if (ducks.length <= 1) return; // Minimum 1 duck
      
      const newDucks = ducks
        .filter(duck => duck.id !== id)
        .map((duck, index) => ({ ...duck, lane: index }));
      
      set({ ducks: newDucks });
      
      // If removed duck was predetermined winner, reset it
      if (get().predeterminedWinnerId === id) {
        set({ predeterminedWinnerId: null });
      }
      
      get().saveDucksToStorage();
    },
    
    updateDuck: (id, updates) => {
      const { ducks } = get();
      const newDucks = ducks.map(duck => 
        duck.id === id ? { ...duck, ...updates } : duck
      );
      set({ ducks: newDucks });
      get().saveDucksToStorage();
    },
    
    updateDuckColor: (id: number, color: string) => {
      const { ducks } = get();
      const newDucks = ducks.map(duck => 
        duck.id === id ? { ...duck, color } : duck
      );
      set({ ducks: newDucks });
      get().saveDucksToStorage();
    },
    
    updateRaceDuration: (duration) => {
      set({ raceDuration: Math.max(1, Math.min(60, duration)) });
      get().saveDucksToStorage();
    },
    
    setPredeterminedWinner: (id) => {
      set({ predeterminedWinnerId: id });
      get().saveDucksToStorage();
    },
    
    startRace: () => {
      // Start countdown
      set({ 
        raceStatus: "countdown", 
        elapsedTime: 0,
        showResults: false
      });
      
      // During countdown, reset all duck positions
      const { ducks } = get();
      const resetDucks = ducks.map(duck => ({
        ...duck,
        position: 0,
        isWinner: false
      }));
      set({ ducks: resetDucks });
      
      // After countdown, start racing
      setTimeout(() => {
        if (get().raceStatus === "countdown") {
          set({ raceStatus: "racing" });
          
          // Start background music
          const { backgroundMusic, isMuted } = useAudio.getState();
          if (backgroundMusic && !isMuted) {
            backgroundMusic.currentTime = 0;
            backgroundMusic.play().catch(err => console.log("Error playing music:", err));
          }
        }
      }, get().countdownTime * 1000);
    },
    
    resetRace: () => {
      // Stop music
      const { backgroundMusic } = useAudio.getState();
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      
      // Reset state
      set({
        raceStatus: "idle",
        elapsedTime: 0,
        showResults: false
      });
      
      // Reset duck positions
      const { ducks } = get();
      const resetDucks = ducks.map(duck => ({
        ...duck,
        position: 0,
        isWinner: false
      }));
      set({ ducks: resetDucks });
    },
    
    updatePositions: (deltaTime) => {
      const { ducks, raceStatus, raceDuration, elapsedTime, predeterminedWinnerId } = get();
      
      if (raceStatus !== "racing") return;
      
      const newElapsedTime = elapsedTime + deltaTime;
      
      // Check if any duck has already reached the finish line (100%)
      const anyDuckFinished = ducks.some(duck => duck.position >= 100);
      if (anyDuckFinished) {
        get().finishRace();
        return;
      }
      
      // Use exact race progress to time duck arrivals perfectly
      // This ensures ducks will reach finish line exactly at raceDuration
      const raceProgress = Math.min(1, newElapsedTime / (raceDuration * 1000));
      
      // Check if race is finished by time
      if (raceProgress >= 1) {
        get().finishRace();
        return;
      }
      
      // Get the winner's position (for predetermined races)
      const winnerDuck = predeterminedWinnerId !== null 
        ? ducks.find(d => d.id === predeterminedWinnerId) 
        : null;
      const winnerPosition = winnerDuck?.position || 0;
      
      // Update positions of all ducks with improved physics
      const newDucks = ducks.map(duck => {
        // If there's a predetermined winner, adjust speeds accordingly
        let newPosition = duck.position;
        
        if (predeterminedWinnerId !== null) {
          if (duck.id === predeterminedWinnerId) {
            // The predetermined winner will reach exactly 100% at race end
            // Using easing function for more natural movement
            
            // Ease-in-out curve: slow start, fast middle, slow finish
            const t = raceProgress;
            let curve;
            
            if (t < 0.5) {
              // Ease-in: start slow (quadratic curve)
              curve = 2 * t * t;
            } else {
              // Ease-out: end slow (flipped quadratic)
              curve = -1 + (4 - 2 * t) * t;
            }
            
            // Add some natural variation but ensure finish at 100%
            const variationAmplitude = Math.max(0, 2 * (1 - raceProgress));
            const naturalVariation = Math.sin(raceProgress * 10 + duck.id) * variationAmplitude;
            
            // Linear position progress plus curve adjustment
            newPosition = (curve * 100) + naturalVariation;
            
            // As we get closer to the end, reduce variation to ensure exact arrival
            if (raceProgress > 0.9) {
              // In the final 10%, gradually reduce variation and ensure arrival exactly at 100%
              const finalCorrection = (raceProgress - 0.9) * 10; // 0 to 1 in final 10%
              newPosition = newPosition * (1 - finalCorrection) + (100 * finalCorrection);
            }
          } else {
            // Others move somewhat slower and more realistic
            // Create various racing patterns for non-winners
            
            // Different ducks have different racing styles
            const duckStyle = (duck.id % 3);
            
            if (duckStyle === 0) {
              // Fast starter, slows down later
              const curve = Math.pow(Math.sin(raceProgress * Math.PI / 2), 1.5);
              newPosition = curve * 90 + Math.sin(raceProgress * 8) * 2;
            } else if (duckStyle === 1) {
              // Steady pacer with small variations
              newPosition = (raceProgress * 0.85 * 100) + Math.sin(raceProgress * 10) * 1.5;
            } else {
              // Slow starter, tries to catch up
              const curve = Math.pow(raceProgress, 0.7) * 85;
              newPosition = curve + Math.sin(raceProgress * 12) * 1.5;
            }
            
            // Ensure non-winners don't overtake the predetermined winner
            // and maintain good separation between ducks
            if (winnerPosition >= 90) {
              // When winner is close to finish, ensure others stay well behind
              const distanceFromWinner = winnerPosition - duck.position;
              
              // Make progress inversely proportional to distance (farther = slower)
              // This spreads out the non-winners nicely
              const slowProgress = Math.max(0.01, 0.03 - (distanceFromWinner * 0.005));
              
              // Only tiny increments to current position
              newPosition = duck.position + slowProgress;
              
              // Ensure max is 99.5 to prevent accidental finish
              newPosition = Math.min(99.5, newPosition);
            }
            else if (raceProgress > 0.8 && newPosition > winnerPosition - 5) {
              // In earlier parts of race, just keep them from getting too close
              newPosition = winnerPosition - 5 - Math.random() * 5;
            }
          }
        } else {
          // No predetermined winner - create racing based on progress
          // Each duck will follow a unique path but synchronized with timer
          
          // Create a unique racing pattern for each duck
          const duckPersonality = ((duck.id * 13) % 10) / 10; // 0.0 to 0.9
          
          // Each duck has a different pace and style but will arrive at the same time
          const personalProgressFactor = 0.85 + (duckPersonality * 0.3); // 0.85 to 1.15
          
          // Set a curve that will reach exactly 100 at the end
          const t = raceProgress;
          let baseCurve;
          
          // Apply a unique curve for each duck
          if (duckPersonality < 0.33) {
            // Fast starter, slows down
            baseCurve = Math.pow(t, 0.7) * 100;
          } else if (duckPersonality < 0.66) {
            // Steady pacer
            baseCurve = t * 100;
          } else {
            // Slow starter, speeds up
            baseCurve = Math.pow(t, 1.3) * 100;
          }
          
          // Check if any duck is already close to finish (90% or more)
          const isAnyDuckNearFinish = ducks.some(d => d.position >= 90);
          
          // Add some natural variation
          const variationAmplitude = Math.max(0, 3 * (1 - Math.pow(raceProgress, 2)));
          const naturalVariation = Math.sin(raceProgress * 8 + duck.id) * variationAmplitude;
          
          // Calculate position with personality and variation
          if (isAnyDuckNearFinish) {
            // Slow down all ducks when any is near finish to prevent multiple finishers
            // Create more spread between ducks
            const distanceFromLeader = ducks
              .reduce((max, d) => Math.max(max, d.position), 0) - duck.position;
            
            // Calculate a much slower rate of progress that maintains relative positions
            const slowProgress = Math.max(0.01, 0.05 - (distanceFromLeader * 0.01));
            
            // Current position plus tiny increment
            newPosition = duck.position + slowProgress + (naturalVariation * 0.1);
            
            // Cap non-leading ducks at 99.5% to prevent accidental finish
            if (duck.position < ducks.reduce((max, d) => Math.max(max, d.position), 0)) {
              newPosition = Math.min(99.5, newPosition);
            }
          } else {
            newPosition = baseCurve + naturalVariation;
          }
        }
        
        // Ensure position stays within bounds
        return {
          ...duck,
          position: Math.min(100, Math.max(0, newPosition))
        };
      });
      
      set({ ducks: newDucks, elapsedTime: newElapsedTime });
    },
    
    finishRace: () => {
      const { ducks, predeterminedWinnerId } = get();
      
      // Stop music
      const { backgroundMusic, playSuccess } = useAudio.getState();
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
      
      // Play success sound
      playSuccess();
      
      // Determine winner
      let newDucks = [...ducks];
      
      // Find the duck that triggered the finish (reached 100% or closest to it)
      // We don't want to change any positions, just mark the winner
      
      if (predeterminedWinnerId !== null) {
        // With predetermined winner - find it and mark as winner with 100%
        const winner = newDucks.find(duck => duck.id === predeterminedWinnerId);
        
        // Just mark the predetermined duck as winner without changing positions
        newDucks = newDucks.map(duck => ({
          ...duck,
          // Only change the position of the predetermined winner to exactly 100%
          position: duck.id === predeterminedWinnerId ? 100 : duck.position,
          isWinner: duck.id === predeterminedWinnerId
        }));
      } else {
        // No predetermined winner - find duck with highest position
        const sortedDucks = [...newDucks].sort((a, b) => b.position - a.position);
        const leadingDuck = sortedDucks[0];
        
        if (leadingDuck) {
          // Mark leading duck as winner without changing other positions
          newDucks = newDucks.map(duck => ({
            ...duck,
            // Only set the leading duck to 100%
            position: duck.id === leadingDuck.id ? 100 : duck.position,
            isWinner: duck.id === leadingDuck.id
          }));
        }
      }
      
      set({ 
        ducks: newDucks, 
        raceStatus: "finished", 
        showResults: true
      });
    },
    
    setShowResults: (show) => {
      set({ showResults: show });
    },
    
    setDucksFromStorage: () => {
      const savedRace = getLocalStorage("duckRace");
      if (savedRace) {
        set({
          ducks: savedRace.ducks || [...DEFAULT_DUCKS],
          raceDuration: savedRace.raceDuration || 10,
          predeterminedWinnerId: savedRace.predeterminedWinnerId || null,
        });
      }
    },
    
    saveDucksToStorage: () => {
      const { ducks, raceDuration, predeterminedWinnerId } = get();
      setLocalStorage("duckRace", {
        ducks,
        raceDuration,
        predeterminedWinnerId,
      });
    },
  }))
);
