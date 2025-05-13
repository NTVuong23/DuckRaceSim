import { useDuckRace, Duck } from "@/lib/stores/useDuckRace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

const ResultsDisplay = () => {
  const { ducks, raceStatus, setShowResults } = useDuckRace();
  
  // Sort ducks by position (highest first)
  const sortedDucks = [...ducks].sort((a, b) => b.position - a.position);
  
  // Find the winner
  const winner = sortedDucks.find(duck => duck.isWinner);
  
  // Close the results
  const handleClose = () => {
    setShowResults(false);
  };
  
  // Container animation
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  };
  
  // Item animation
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  // Confetti animation (using emoji for simplicity)
  const confettiEmojis = ['🎉', '🎊', '⭐', '✨', '🏆', '🥇'];
  
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti */}
      {raceStatus === "finished" && winner && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => {
            const emoji = confettiEmojis[i % confettiEmojis.length];
            const delay = Math.random() * 5;
            const duration = 2 + Math.random() * 3;
            const initialX = Math.random() * 100;
            const initialScale = 0.5 + Math.random() * 1.5;
            
            return (
              <motion.div
                key={i}
                className="text-2xl absolute top-0"
                initial={{ 
                  x: `${initialX}vw`, 
                  y: -20,
                  opacity: 0,
                  scale: initialScale,
                  rotate: Math.random() * 360
                }}
                animate={{ 
                  y: '100vh',
                  opacity: [0, 1, 1, 0],
                  rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)
                }}
                transition={{ 
                  duration: duration,
                  delay: delay,
                  ease: "linear"
                }}
              >
                {emoji}
              </motion.div>
            );
          })}
        </div>
      )}
      
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className="bg-white shadow-lg border-4 border-yellow-400">
          <CardHeader className="bg-yellow-400 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Kết Quả Đua</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
                className="hover:bg-yellow-500 rounded-full h-8 w-8 p-0"
              >
                <X size={18} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {winner && (
              <motion.div 
                className="bg-yellow-100 p-4 rounded-lg mb-6 text-center"
                variants={itemVariants}
              >
                <Trophy className="h-10 w-10 mx-auto text-yellow-500 mb-2" />
                <h3 className="text-xl font-bold">{winner.name} Thắng!</h3>
                <div 
                  className="w-8 h-8 rounded-full mx-auto mt-2"
                  style={{ backgroundColor: winner.color }}
                />
              </motion.div>
            )}
            
            <h3 className="font-bold text-lg mb-3">Vị Trí Cuối Cùng</h3>
            
            {/* Scrollable results list */}
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-3">
                {sortedDucks.map((duck: Duck, index: number) => (
                  <motion.div 
                    key={duck.id}
                    className="flex items-center p-3 rounded-lg"
                    style={{ 
                      backgroundColor: index === 0 
                        ? 'rgba(255, 215, 0, 0.1)' 
                        : index === 1
                          ? 'rgba(226, 232, 240, 0.3)'
                          : index === 2 
                            ? 'rgba(180, 83, 9, 0.1)'
                            : 'rgba(255, 255, 255, 0.5)',
                      border: index === 0 
                        ? '1px solid #FFD700' 
                        : index === 1
                          ? '1px solid #CBD5E0'
                          : index === 2
                            ? '1px solid #B45309'
                            : '1px solid #E2E8F0',
                      boxShadow: index < 3 ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'
                    }}
                    variants={itemVariants}
                  >
                    <div className="w-8 text-center font-bold">
                      {index === 0 && <Medal className="h-5 w-5 mx-auto text-yellow-500" />}
                      {index === 1 && <Medal className="h-5 w-5 mx-auto text-gray-400" />}
                      {index === 2 && <Medal className="h-5 w-5 mx-auto text-amber-700" />}
                      {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                    </div>
                    <div 
                      className="w-7 h-7 rounded-full mx-3 shadow-sm border border-white" 
                      style={{ backgroundColor: duck.color }}
                    />
                    <span className="flex-1 font-medium truncate">{duck.name}</span>
                    <span className="text-sm font-bold px-2 py-1 rounded-md bg-opacity-20"
                          style={{
                            backgroundColor: index === 0 
                              ? 'rgba(255, 215, 0, 0.2)'
                              : index === 1
                                ? 'rgba(160, 174, 192, 0.2)'
                                : index === 2
                                  ? 'rgba(180, 83, 9, 0.2)'
                                  : 'rgba(100, 100, 100, 0.1)',
                          }}>
                      {duck.isWinner ? "100%" : `${Math.min(99, Math.round(duck.position))}%`}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={handleClose} 
              className="w-full duck-btn duck-btn-secondary"
            >
              Đóng
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ResultsDisplay;
