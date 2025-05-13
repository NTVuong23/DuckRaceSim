// Duck drawing and animation logic
class DuckRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ducks = [];
        this.finishLinePosition = 0.95; // 95% of canvas width
        this.setupCanvas();
        
        // Animation states for each duck
        this.animationStates = new Map();
    }

    setupCanvas() {
        // Make canvas responsive
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // Maintain aspect ratio (2:1)
        const height = containerWidth / 2;
        
        this.canvas.width = containerWidth;
        this.canvas.height = height;
        
        // Redraw after resize
        this.render();
    }

    setDucks(ducks) {
        this.ducks = ducks;
        
        // Initialize animation states for new ducks
        ducks.forEach(duck => {
            if (!this.animationStates.has(duck.id)) {
                this.animationStates.set(duck.id, this.createAnimationState());
            }
        });
        
        // Remove animation states for ducks that no longer exist
        const existingIds = new Set(ducks.map(d => d.id));
        [...this.animationStates.keys()].forEach(id => {
            if (!existingIds.has(id)) {
                this.animationStates.delete(id);
            }
        });
    }

    createAnimationState() {
        return {
            paddleAngle: 0,
            paddleDirection: 1,
            splashOffset: Math.random() * 5,
            rippleSize: Math.random() * 3 + 2,
            bobAmount: Math.random() * 0.8 + 0.2,
            rotation: (Math.random() * 5 - 2.5) * (Math.PI / 180), // Slight random rotation in radians
            speed: 0,
            targetSpeed: 0,
            lastPosition: 0
        };
    }

    render() {
        if (!this.ctx) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const laneHeight = height / Math.max(this.ducks.length, 4);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw water background
        this.drawWater(width, height);
        
        // Draw finish line
        this.drawFinishLine(width, height);
        
        // Draw each duck
        this.ducks.forEach(duck => {
            const duckX = (duck.position / 100) * width * this.finishLinePosition;
            const duckY = duck.lane * laneHeight + laneHeight / 2;
            const duckSize = Math.min(laneHeight * 0.7, 40);
            
            this.drawDuck(duckX, duckY, duckSize, duck.color, duck.id);
        });
    }

    drawWater(width, height) {
        // Water background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#3498DB');
        gradient.addColorStop(1, '#2980B9');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw subtle wave pattern
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1.5;
        
        const time = performance.now() / 1000;
        const waveAmplitude = 3;
        const waveFrequency = 0.05;
        
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            
            for (let x = 0; x < width; x += 5) {
                const y = Math.sin((x * waveFrequency) + time + i) * waveAmplitude + 
                          (height * (i + 1) / 4);
                
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
    }

    drawFinishLine(width, height) {
        const finishX = width * this.finishLinePosition;
        
        // Red background
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(finishX, 0, width - finishX, height);
        
        // White stripes
        this.ctx.fillStyle = 'white';
        const stripeWidth = (width - finishX) / 5;
        
        for (let i = 0; i < 5; i += 2) {
            this.ctx.fillRect(finishX + i * stripeWidth, 0, stripeWidth, height);
        }
        
        // "FINISH" text
        this.ctx.save();
        this.ctx.translate(finishX + (width - finishX) / 2, height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = 'bold 20px Nunito, sans-serif';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('ĐÍCH', 0, 0);
        this.ctx.restore();
    }

    drawDuck(x, y, duckSize, duckColor, duckId) {
        const ctx = this.ctx;
        const state = this.animationStates.get(duckId);
        
        if (!state) return;
        
        // Update animation state
        this.updateAnimationState(state);
        
        // Apply duck bobbing motion
        const bobOffset = Math.sin(performance.now() / 500) * state.bobAmount;
        y += bobOffset;
        
        // Save the current state
        ctx.save();
        
        // Move to the duck position and apply slight rotation
        ctx.translate(x, y);
        ctx.rotate(state.rotation);
        
        // Duck body - oval shape
        ctx.fillStyle = duckColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, duckSize / 1.8, duckSize / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle highlight to the body for 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            -duckSize / 6, 
            -duckSize / 10, 
            duckSize / 3.5, 
            duckSize / 6, 
            Math.PI / 10, // slight angle for more natural look
            0, 
            Math.PI 
        );
        ctx.fill();
        
        // Add a subtle shadow under duck
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(
            0, 
            duckSize / 2.5,
            duckSize / 2.2, 
            duckSize / 10, 
            0, 
            0, 
            Math.PI * 2 
        );
        ctx.fill();
        
        // Duck head - more oval shaped for realism
        const headX = duckSize / 2.2;
        const headY = -duckSize / 10;
        
        ctx.fillStyle = duckColor;
        ctx.beginPath();
        ctx.ellipse(headX, headY, duckSize / 3.5, duckSize / 4, Math.PI / 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Duck eye
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(headX + duckSize / 8, headY - duckSize / 12, duckSize / 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Duck bill - curved for more natural look
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(headX + duckSize / 4, headY);
        ctx.quadraticCurveTo(
            headX + duckSize / 2.5, headY - duckSize / 15,
            headX + duckSize / 2, headY - duckSize / 25
        );
        ctx.lineTo(headX + duckSize / 3, headY + duckSize / 8);
        ctx.quadraticCurveTo(
            headX + duckSize / 4, headY + duckSize / 15,
            headX + duckSize / 5, headY
        );
        ctx.closePath();
        ctx.fill();
        
        // Draw swimming feet/paddles
        this.drawPaddles(ctx, duckSize, state);
        
        // Draw water ripples and splash
        this.drawWaterEffects(ctx, duckSize, state);
        
        // Restore the canvas state
        ctx.restore();
    }

    drawPaddles(ctx, duckSize, state) {
        const paddleSize = duckSize / 3;
        const paddleY = duckSize / 2;
        
        // Only animate paddles if duck is moving
        if (state.speed > 0.1) {
            state.paddleAngle += state.paddleDirection * (state.speed * 0.1);
            
            if (Math.abs(state.paddleAngle) > 0.5) {
                state.paddleDirection *= -1;
            }
        }
        
        // Left paddle
        ctx.fillStyle = 'orange';
        ctx.save();
        ctx.translate(-paddleSize / 1.5, paddleY);
        ctx.rotate(state.paddleAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-paddleSize / 2, paddleSize / 1.5);
        ctx.lineTo(paddleSize / 2, paddleSize / 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Right paddle
        ctx.fillStyle = 'orange';
        ctx.save();
        ctx.translate(paddleSize / 1.5, paddleY);
        ctx.rotate(-state.paddleAngle); // opposite direction
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-paddleSize / 2, paddleSize / 1.5);
        ctx.lineTo(paddleSize / 2, paddleSize / 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawWaterEffects(ctx, duckSize, state) {
        // Only draw water effects if duck is moving
        if (state.speed < 0.1) return;
        
        const time = performance.now() / 1000;
        
        // Draw ripples behind the duck
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 3; i++) {
            const rippleDistance = i * duckSize / 1.5 + state.splashOffset;
            const rippleY = duckSize / 2 + Math.sin(time * 2 + i) * 2;
            
            ctx.beginPath();
            ctx.arc(-rippleDistance, rippleY, state.rippleSize * i, 0, Math.PI, true);
            ctx.stroke();
        }
        
        // Draw splash effect if duck is moving fast
        if (state.speed > 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            
            // Left splash
            ctx.beginPath();
            ctx.arc(-duckSize / 3, duckSize / 2, duckSize / 8 * state.speed, 0, Math.PI * 2);
            ctx.fill();
            
            // Right splash
            ctx.beginPath();
            ctx.arc(duckSize / 5, duckSize / 2, duckSize / 10 * state.speed, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    updateAnimationState(state) {
        // Smoothly adjust speed
        state.speed += (state.targetSpeed - state.speed) * 0.1;
        
        // Ensure speed doesn't go negative
        if (state.speed < 0) state.speed = 0;
    }

    updateDuckSpeed(duckId, newPosition) {
        const state = this.animationStates.get(duckId);
        if (!state) return;
        
        // Get position delta and calculate target speed
        const delta = Math.abs(newPosition - state.lastPosition);
        state.targetSpeed = Math.min(delta * 2, 1);
        state.lastPosition = newPosition;
    }
}

// Export the DuckRenderer class
window.DuckRenderer = DuckRenderer;