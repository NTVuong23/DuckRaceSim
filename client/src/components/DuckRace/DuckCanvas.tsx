import { useEffect, useRef } from "react";
import { useDuckRace, Duck } from "@/lib/stores/useDuckRace";
import { DUCK_SVG, FINISH_LINE_SVG } from "@/constants/ducks";

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  try {
    // Remove the # if present
    color = color.replace('#', '');
    
    // Ensure the color is valid
    if (!/^[0-9A-Fa-f]{6}$/.test(color)) {
      // Return a default light yellow if color is invalid
      return amount > 0 ? '#FFEB3B' : '#FFC107';
    }
    
    // Parse the color components
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return amount > 0 ? '#FFEB3B' : '#FFC107';
    }
    
    // Adjust brightness
    const newR = Math.min(255, Math.max(0, r + amount));
    const newG = Math.min(255, Math.max(0, g + amount));
    const newB = Math.min(255, Math.max(0, b + amount));
    
    // Convert back to hex
    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  } catch (err) {
    console.error("Error in adjustColor:", err);
    return amount > 0 ? '#FFEB3B' : '#FFC107';
  }
}

// Interface to track duck animation state
interface DuckAnimationState {
  paddleAngle: number;
  paddleDirection: number;
  splashOffset: number;
  rippleSize: number;
  bobAmount: number;
  rotation: number;
  speed: number;
  targetSpeed: number;
  lastPosition: number;
}

const DuckCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  // Keep track of animation states for each duck
  const animationStatesRef = useRef<Map<number, DuckAnimationState>>(new Map());
  
  const { 
    ducks, 
    raceStatus, 
    updatePositions,
    countdownTime, 
    elapsedTime 
  } = useDuckRace();
  
  // Create or get animation state for a duck
  const getAnimationState = (duckId: number): DuckAnimationState => {
    if (!animationStatesRef.current.has(duckId)) {
      // Create initial animation state with some randomness for natural variation
      animationStatesRef.current.set(duckId, {
        paddleAngle: 0,
        paddleDirection: Math.random() > 0.5 ? 1 : -1,
        splashOffset: Math.random() * 10,
        rippleSize: 0,
        bobAmount: Math.random() * 0.5 + 0.5,
        rotation: 0,
        speed: 0,
        targetSpeed: 0,
        lastPosition: 0
      });
    }
    return animationStatesRef.current.get(duckId)!;
  };
  
  // Parse SVG string to create a DOM element with animation elements - simpler version
  const getSvgElement = (
    svgString: string, 
    color?: string, 
    animationState?: DuckAnimationState,
    isRacing?: boolean
  ): HTMLImageElement => {
    // Create a new SVG string with the color directly inserted
    let modifiedSvg = svgString;
    
    // Replace currentColor with the actual color
    if (color) {
      modifiedSvg = modifiedSvg.replace(/fill="currentColor"/g, `fill="${color}"`);
    }
    
    // Create a parser to manipulate the SVG DOM
    const parser = new DOMParser();
    let svgDoc = parser.parseFromString(modifiedSvg, 'image/svg+xml');
    
    // Apply animations if racing
    if (animationState && isRacing) {
      // Animate the feet
      const leftFoot = svgDoc.querySelector('.left-foot');
      const rightFoot = svgDoc.querySelector('.right-foot');
      
      if (leftFoot && rightFoot) {
        // Calculate paddle animation values based on speed
        const paddleFrequency = 0.5 + animationState.speed * 0.05;
        const paddleTime = Date.now() * paddleFrequency % 1000;
        const paddleFactor = Math.sin(paddleTime / 1000 * Math.PI * 2);
        
        // Simple translate up/down animation for feet
        const paddleOffset = paddleFactor * 3;
        
        leftFoot.setAttribute('transform', `translate(0, ${paddleOffset})`);
        rightFoot.setAttribute('transform', `translate(0, ${-paddleOffset})`);
      }
    }
    
    // Convert the modified SVG to a data URL
    const serializer = new XMLSerializer();
    const svgString2 = serializer.serializeToString(svgDoc);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString2)}`;
    
    // Create an image element with the data URL
    const img = new Image();
    img.src = dataUrl;
    
    return img;
  };
  
  // Animation loop
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }
    
    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;
    
    // Only update during racing
    if (raceStatus === "racing") {
      // Update duck positions from the game state
      updatePositions(deltaTime);
      
      // Update animation states for each duck
      ducks.forEach(duck => {
        const animState = getAnimationState(duck.id);
        
        // Calculate current speed based on position change
        const positionDelta = duck.position - animState.lastPosition;
        const currentSpeedTarget = positionDelta * 0.2; // Normalize speed
        
        // Smooth speed changes for natural acceleration/deceleration
        animState.targetSpeed = currentSpeedTarget;
        animState.speed += (animState.targetSpeed - animState.speed) * 0.1;
        
        // Update paddle animation
        animState.paddleAngle += animState.speed * 0.5 * animState.paddleDirection;
        if (Math.abs(animState.paddleAngle) > 30) {
          animState.paddleDirection *= -1;
        }
        
        // Update bob animation (up and down movement)
        animState.bobAmount = 0.5 + Math.sin(time / 500) * 0.2;
        
        // Update rotation based on speed changes (lean forward when accelerating)
        const targetRotation = (positionDelta > 0) ? Math.min(15, positionDelta * 20) : 0;
        animState.rotation += (targetRotation - animState.rotation) * 0.1;
        
        // Update ripple effect
        animState.rippleSize = Math.min(1, animState.speed * 0.5);
        
        // Store current position for next frame
        animState.lastPosition = duck.position;
      });
    }
    
    // Draw canvas
    renderCanvas();
    
    // Continue animation loop
    requestRef.current = requestAnimationFrame(animate);
  };
  
  // Render canvas content
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Resize canvas to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw water and grass background similar to online-stopwatch.com
    // First draw the entire background as grass
    ctx.fillStyle = '#4CAF50'; // Grass color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Then add a horizontal strip of water in the middle (deeper in the center)
    const waterStartY = canvas.height * 0.15; // Start water from 15% down
    const waterEndY = canvas.height * 0.85;   // End water at 85% down
    const waterHeight = waterEndY - waterStartY;
    
    // Create water with gradient (darker in middle, lighter at edges)
    const waterGradient = ctx.createLinearGradient(0, waterStartY, 0, waterEndY);
    waterGradient.addColorStop(0, '#3498DB');      // Light blue at top
    waterGradient.addColorStop(0.5, '#2980B9');    // Darker blue in middle
    waterGradient.addColorStop(1, '#3498DB');      // Light blue at bottom
    
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, waterStartY, canvas.width, waterHeight);
    
    // Add horizontal water wave lines for effect - multiple waves
    const waveCount = 5; // Number of wave lines
    const waveSpacing = waterHeight / (waveCount + 1);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    for (let i = 1; i <= waveCount; i++) {
      const waveY = waterStartY + (i * waveSpacing);
      const waveAmplitude = 3; // Wave height
      const waveFrequency = 20; // Wave frequency
      
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      
      for (let x = 0; x < canvas.width; x += 5) {
        const offset = (Date.now() / 1000 + i * 0.3) * 2; // Animated offset, different for each wave
        const y = waveY + Math.sin((x / waveFrequency) + offset) * waveAmplitude;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
    
    // Draw horizontal lanes across the water
    const laneHeight = waterHeight / Math.max(4, ducks.length);
    const laneStartY = waterStartY;
    
    // Draw starting positions edge 
    ctx.fillStyle = '#000000';
    ctx.fillRect(70, waterStartY - 5, 10, waterHeight + 10);
    
    // Draw white/black checkered pattern for starting position
    const squareSize = 20;
    const checkerboardHeight = waterHeight + 10;
    const checkerboardWidth = 40; // Width of the checkerboard pattern
    
    for (let y = 0; y < checkerboardHeight; y += squareSize) {
      for (let x = 0; x < checkerboardWidth; x += squareSize) {
        // Alternate colors based on position
        const isEvenRow = Math.floor(y / squareSize) % 2 === 0;
        const isEvenCol = Math.floor(x / squareSize) % 2 === 0;
        
        if ((isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)) {
          ctx.fillStyle = '#FFFFFF';
        } else {
          ctx.fillStyle = '#000000';
        }
        
        ctx.fillRect(
          70 + x, 
          waterStartY - 5 + y,
          Math.min(squareSize, checkerboardWidth - x),
          Math.min(squareSize, checkerboardHeight - y)
        );
      }
    }
    
    // Draw lane number circles
    for (let i = 0; i < ducks.length; i++) {
      const laneY = laneStartY + (i * laneHeight) + (laneHeight / 2);
      
      // Draw lane number circle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(40, laneY, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw lane number
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((i + 1).toString(), 40, laneY);
    }
    
    // Draw finish line (black/white checkerboard pattern)
    const finishLineX = canvas.width - 40;
    const finishLineWidth = 40;
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(finishLineX, waterStartY - 5, finishLineWidth, waterHeight + 10);
    
    // Draw checkerboard pattern
    for (let y = 0; y < checkerboardHeight; y += squareSize) {
      for (let x = 0; x < finishLineWidth; x += squareSize) {
        // Alternate white squares
        const isEvenRow = Math.floor(y / squareSize) % 2 === 0;
        const isEvenCol = Math.floor(x / squareSize) % 2 === 0;
        
        if ((isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol)) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(
            finishLineX + x,
            waterStartY - 5 + y,
            Math.min(squareSize, finishLineWidth - x),
            Math.min(squareSize, checkerboardHeight - y)
          );
        }
      }
    }
    
    // Draw water ripples / splash effects (when racing)
    if (raceStatus === "racing") {
      ducks.forEach((duck: Duck) => {
        const animState = getAnimationState(duck.id);
        const duckSize = Math.min(60, canvas.width * 0.1);
        const x = (duck.position / 100) * (canvas.width - duckSize - finishLineWidth) + (duckSize / 4);
        const y = (duck.lane * laneHeight) + (laneHeight / 2) - (duckSize / 2);
        
        // Only draw ripples if the duck is moving
        if (animState.speed > 0.01) {
          // Draw water splash effects (small circles)
          const splashCount = Math.floor(animState.speed * 5) + 2;
          
          for (let i = 0; i < splashCount; i++) {
            const splashTime = (Date.now() + i * 120 + duck.id * 50) % 1000 / 1000;
            const splashOpacity = 0.7 - splashTime * 0.7;
            const splashSize = (1 - splashTime) * 4 * animState.speed;
            
            if (splashOpacity > 0 && splashSize > 0) {
              ctx.fillStyle = `rgba(255, 255, 255, ${splashOpacity})`;
              ctx.beginPath();
              ctx.arc(
                x + duckSize/2 + Math.cos(splashTime * Math.PI * 4) * 15 * splashTime,
                y + duckSize - 10 + Math.sin(splashTime * Math.PI * 2) * 5,
                splashSize,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }
          
          // Draw water trail
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          
          // Wave pattern behind duck
          const trailLength = animState.speed * 40;
          if (trailLength > 5) {
            ctx.beginPath();
            for (let i = 0; i < trailLength; i++) {
              const waveX = x + duckSize/2 - i * 2;
              const waveY = y + duckSize - 5 + Math.sin(i * 0.5 + Date.now() / 200) * 2;
              
              if (i === 0) {
                ctx.moveTo(waveX, waveY);
              } else {
                ctx.lineTo(waveX, waveY);
              }
            }
            ctx.stroke();
          }
        }
      });
    }
    
    // Draw ducks
    ducks.forEach((duck: Duck) => {
      const animState = getAnimationState(duck.id);
      const duckSize = Math.min(50, canvas.width * 0.08); // Make ducks slightly smaller
      
      // Position calculation - account for starting position (checkerboard) and finish line
      // The actual race area is between the start (80px from left) and finish line (40px from right)
      const startX = 80; // Start position after the checkerboard
      const endX = finishLineX - duckSize; // End position before the finish line
      const raceDistance = endX - startX;
      
      // Calculate duck position along the race track
      const x = startX + (duck.position / 100) * raceDistance;
      
      // Calculate duck's vertical position in its lane
      const laneY = laneStartY + (duck.lane * laneHeight);
      let y = laneY + (laneHeight / 2) - (duckSize / 2);
      
      // Apply bob animation for smooth up/down movement
      if (raceStatus === "racing") {
        // Add subtle bobbing when swimming
        y += Math.sin(Date.now() / 300 + duck.id) * 3 * animState.bobAmount;
      }
      
      // Draw duck with improved visuals
      ctx.save();
      
      // Apply slight rotation when racing for swimming effect
      if (raceStatus === "racing") {
        const swimAngle = Math.sin(Date.now() / 300 + duck.id) * 2;
        ctx.translate(x + duckSize/2, y + duckSize/2);
        ctx.rotate(swimAngle * Math.PI / 180);
        ctx.translate(-(x + duckSize/2), -(y + duckSize/2));
      }
      
      // Shadow for depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.ellipse(
        x + duckSize/2 + 3, 
        y + duckSize/2 + 4, 
        duckSize/2, 
        duckSize/3, 
        0, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      
      // Main duck body - more duck-like shape with gradient fill
      const bodyGradient = ctx.createRadialGradient(
        x + duckSize/2, y + duckSize/2 - 5, 0,
        x + duckSize/2, y + duckSize/2, duckSize/1.5
      );
      
      // Create color variations based on the duck color
      const baseColor = duck.color;
      // Handle the case where the color may not be a valid hex
      let lighterColor = baseColor;
      try {
        if (baseColor.startsWith('#') && baseColor.length >= 7) {
          lighterColor = adjustColor(baseColor, 40); // Lighter version for highlights
        }
      } catch (err) {
        console.error("Error processing color:", err);
      }
      
      bodyGradient.addColorStop(0, lighterColor);
      bodyGradient.addColorStop(1, baseColor);
      
      // Create a more duck-like body shape
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      
      // Start at the top-back of the duck
      ctx.moveTo(x + duckSize/5, y + duckSize/3);
      
      // Draw top curve of body - plumper in the middle
      ctx.bezierCurveTo(
        x + duckSize/4, y + duckSize/5,  // control point 1
        x + duckSize/1.5, y + duckSize/5, // control point 2
        x + duckSize/1.2, y + duckSize/2.2  // end point (slightly down for head connection)
      );
      
      // Draw bottom curve - rounder bottom
      ctx.bezierCurveTo(
        x + duckSize/1.5, y + duckSize/1.4, // control point 1
        x + duckSize/3, y + duckSize/1.4,  // control point 2
        x + duckSize/5, y + duckSize/3      // back to starting point
      );
      
      ctx.closePath();
      ctx.fill();
      
      // Add subtle highlight to the body for 3D effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(
        x + duckSize/3, 
        y + duckSize/2.5, 
        duckSize/3.5, 
        duckSize/6, 
        Math.PI/10, // slight angle for more natural look
        0, 
        Math.PI 
      );
      ctx.fill();
      
      // Add a subtle shadow under duck
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.ellipse(
        x + duckSize/2, 
        y + duckSize - duckSize/10,
        duckSize/2.2, 
        duckSize/10, 
        0, 
        0, 
        Math.PI * 2 
      );
      ctx.fill();
      
      // Duck head - more oval shaped for realism
      const headX = x + duckSize - duckSize/15;
      const headY = y + duckSize/2.5;
      const headGradient = ctx.createRadialGradient(
        headX, headY - 2, 0,
        headX, headY, duckSize/3.5
      );
      
      // Use the same lightColor we calculated earlier (already safely created)
      headGradient.addColorStop(0, lighterColor);
      headGradient.addColorStop(1, baseColor);
      
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      
      // Draw a slightly stretched oval for the head
      ctx.ellipse(
        headX, 
        headY, 
        duckSize/5,  // X radius (slightly smaller than before)
        duckSize/4.5, // Y radius (slightly taller)
        0, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      
      // Add the neck connection between body and head
      ctx.beginPath();
      ctx.moveTo(x + duckSize/1.3, y + duckSize/2.5);
      ctx.lineTo(headX - duckSize/6, headY - duckSize/10);
      ctx.lineTo(headX - duckSize/6, headY + duckSize/10);
      ctx.closePath();
      ctx.fillStyle = bodyGradient;
      ctx.fill();
      
      // Position eye correctly on the head
      const eyeX = headX + duckSize/8;
      const eyeY = headY - duckSize/9;
      
      // Eye with gleam
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(
        eyeX, 
        eyeY, 
        duckSize/18, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      
      // Eye gleam
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(
        eyeX + duckSize/50, 
        eyeY - duckSize/50, 
        duckSize/45, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      
      // Beak with gradient
      // Better duck bill positioning
      const beakStartX = headX + duckSize/6;
      const beakStartY = headY + duckSize/20;
      const beakLength = duckSize/5;
      
      const beakGradient = ctx.createLinearGradient(
        beakStartX, beakStartY,
        beakStartX + beakLength, beakStartY
      );
      
      // More vibrant duck bill colors
      beakGradient.addColorStop(0, '#FF9800');
      beakGradient.addColorStop(1, '#FF5722');
      
      // Draw a more curved, realistic duck bill
      ctx.fillStyle = beakGradient;
      ctx.beginPath();
      
      // Start at top of bill
      ctx.moveTo(beakStartX, beakStartY - duckSize/40);
      
      // Create curved top 
      ctx.quadraticCurveTo(
        beakStartX + beakLength/2, beakStartY - duckSize/10,
        beakStartX + beakLength, beakStartY - duckSize/30
      );
      
      // Create rounded tip
      ctx.quadraticCurveTo(
        beakStartX + beakLength + duckSize/40, beakStartY + duckSize/30,
        beakStartX + beakLength, beakStartY + duckSize/20
      );
      
      // Create curved bottom
      ctx.quadraticCurveTo(
        beakStartX + beakLength/2, beakStartY + duckSize/15,
        beakStartX, beakStartY + duckSize/20
      );
      
      ctx.closePath();
      ctx.fill();
      
      // Legs and feet (only visible when racing)
      if (raceStatus === "racing" || raceStatus === "countdown") {
        const feetOffset = Math.sin(Date.now() / 250 + duck.id) * 3;
        
        // Legs
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FF9800';
        
        // Left leg
        ctx.beginPath();
        ctx.moveTo(x + duckSize/4, y + duckSize - 5);
        ctx.lineTo(x + duckSize/6, y + duckSize + 3 + feetOffset);
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.moveTo(x + duckSize/2, y + duckSize - 5);
        ctx.lineTo(x + duckSize/2 - 5, y + duckSize + 3 - feetOffset);
        ctx.stroke();
        
        // Left foot
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.moveTo(x + duckSize/6, y + duckSize + 3 + feetOffset);
        ctx.lineTo(x + duckSize/6 - 8, y + duckSize + 7 + feetOffset);
        ctx.lineTo(x + duckSize/6 + 2, y + duckSize + 7 + feetOffset);
        ctx.closePath();
        ctx.fill();
        
        // Right foot
        ctx.beginPath();
        ctx.moveTo(x + duckSize/2 - 5, y + duckSize + 3 - feetOffset);
        ctx.lineTo(x + duckSize/2 - 13, y + duckSize + 7 - feetOffset);
        ctx.lineTo(x + duckSize/2 - 3, y + duckSize + 7 - feetOffset);
        ctx.closePath();
        ctx.fill();
      }
      
      // Water ripple effects when racing
      if (raceStatus === "racing") {
        const rippleTime = Date.now() % 2000 / 2000;
        const rippleSize = (rippleTime < 0.5 ? rippleTime : 1 - rippleTime) * 20;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + duckSize/4, y + duckSize/1.5, rippleSize, 0, Math.PI);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x + duckSize/2, y + duckSize/1.5, rippleSize * 0.6, 0, Math.PI);
        ctx.stroke();
      }
      
      ctx.restore();
      
      // Draw duck name with white background for better visibility
      const nameY = laneY - 5;
      const nameText = duck.name;
      ctx.font = 'bold 14px Arial, sans-serif';
      
      // Measure text width for background
      const textWidth = ctx.measureText(nameText).width;
      const textPadding = 5;
      
      // Draw white background for name
      ctx.fillStyle = 'white';
      ctx.fillRect(
        x - textWidth/2 - textPadding, 
        nameY - 14, 
        textWidth + textPadding*2, 
        20
      );
      
      // Draw text
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nameText, x, nameY);
    });
    
    // Draw timer directly on canvas in a modern style
    // Create a semi-transparent overlay at the top
    const timerHeight = 60;
    const timerWidth = 180;
    const timerX = canvas.width / 2 - timerWidth / 2;
    const timerY = 15;
    
    // Format time based on race status
    let timerText = "00:00:00";
    
    if (raceStatus === "countdown") {
      const countdown = Math.ceil(countdownTime - (elapsedTime / 1000));
      timerText = `00:00:0${countdown}`;
      
      // Also display large countdown in the center of screen
      ctx.font = 'bold 100px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      
      const countdownText = countdown.toString();
      const countdownX = canvas.width / 2;
      const countdownY = canvas.height / 2;
      
      // Add pulse animation to countdown
      const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.15;
      
      ctx.save();
      ctx.translate(countdownX, countdownY);
      ctx.scale(pulseScale, pulseScale);
      ctx.fillText(countdownText, 0, 0);
      ctx.strokeText(countdownText, 0, 0);
      ctx.restore();
    } else if (raceStatus === "racing") {
      // Format time as 00:00:XX
      const elapsedSecs = Math.floor(elapsedTime / 1000);
      const mins = Math.floor(elapsedSecs / 60);
      const secs = elapsedSecs % 60;
      const centisecs = Math.floor((elapsedTime % 1000) / 10);
      
      timerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centisecs.toString().padStart(2, '0')}`;
    }
    
    // Draw a glass-like timer background with rounded corners and gradient
    ctx.save();
    
    // Create a glass-like background with rounded corners
    const cornerRadius = 10;
    
    // Create a semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(timerX + cornerRadius, timerY);
    ctx.lineTo(timerX + timerWidth - cornerRadius, timerY);
    ctx.arcTo(timerX + timerWidth, timerY, timerX + timerWidth, timerY + cornerRadius, cornerRadius);
    ctx.lineTo(timerX + timerWidth, timerY + timerHeight - cornerRadius);
    ctx.arcTo(timerX + timerWidth, timerY + timerHeight, timerX + timerWidth - cornerRadius, timerY + timerHeight, cornerRadius);
    ctx.lineTo(timerX + cornerRadius, timerY + timerHeight);
    ctx.arcTo(timerX, timerY + timerHeight, timerX, timerY + timerHeight - cornerRadius, cornerRadius);
    ctx.lineTo(timerX, timerY + cornerRadius);
    ctx.arcTo(timerX, timerY, timerX + cornerRadius, timerY, cornerRadius);
    ctx.closePath();
    ctx.fill();
    
    // Add a subtle inner glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw time text
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timerText, timerX + timerWidth / 2, timerY + timerHeight / 2);
    
    ctx.restore();
  };
  
  // Setup canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      renderCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Start animation loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [raceStatus, ducks]);
  
  return (
    <div 
      ref={containerRef} 
      className="race-track shadow-lg"
      style={{ height: `${Math.max(400, ducks.length * 60)}px` }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default DuckCanvas;
