// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // State management
    const appState = {
        ducks: [],
        raceDuration: 10,
        countdownTime: 3,
        raceStatus: 'idle', // 'idle', 'countdown', 'racing', 'finished'
        elapsedTime: 0,
        predeterminedWinnerId: null,
        showResults: false,
        
        // Audio
        backgroundMusic: null,
        hitSound: null,
        successSound: null,
        isMuted: true
    };
    
    // Elements
    const elements = {
        duckCanvas: document.getElementById('duck-canvas'),
        duckList: document.getElementById('duck-list'),
        duckCount: document.getElementById('duck-count'),
        startRaceBtn: document.getElementById('start-race'),
        resetRaceBtn: document.getElementById('reset-race'),
        countdown: document.getElementById('countdown'),
        status: document.getElementById('status'),
        raceDurationInput: document.getElementById('race-duration'),
        winnerSelect: document.getElementById('winner-select'),
        resultsContainer: document.getElementById('results-container'),
        resultsList: document.getElementById('results-list'),
        closeResultsBtn: document.getElementById('close-results'),
        addDuckBtn: document.getElementById('add-duck'),
        bulkInputBtn: document.getElementById('bulk-input'),
        bulkModal: document.getElementById('bulk-modal'),
        bulkNames: document.getElementById('bulk-names'),
        submitBulkBtn: document.getElementById('submit-bulk'),
        cancelBulkBtn: document.getElementById('cancel-bulk'),
        closeModalBtn: document.querySelector('.close-modal')
    };
    
    // Initialize duck renderer
    const duckRenderer = new DuckRenderer(elements.duckCanvas);
    
    // Animation frame ID for cancelling
    let animationFrameId = null;
    let lastTimestamp = 0;
    
    // API functions
    const api = {
        async getDucks() {
            try {
                const response = await fetch('/api/ducks');
                if (!response.ok) throw new Error('Lỗi tải dữ liệu vịt');
                
                const ducks = await response.json();
                return ducks;
            } catch (error) {
                console.error('Error fetching ducks:', error);
                return [];
            }
        },
        
        async addDuck() {
            try {
                const response = await fetch('/api/ducks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Lỗi thêm vịt');
                }
                
                await refreshDucks();
                return true;
            } catch (error) {
                console.error('Error adding duck:', error);
                showNotification(error.message, 'error');
                return false;
            }
        },
        
        async removeDuck(id) {
            try {
                const response = await fetch(`/api/ducks/${id}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Lỗi xóa vịt');
                }
                
                await refreshDucks();
                return true;
            } catch (error) {
                console.error('Error removing duck:', error);
                showNotification(error.message, 'error');
                return false;
            }
        },
        
        async updateDuck(id, updates) {
            try {
                const response = await fetch(`/api/ducks/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Lỗi cập nhật vịt');
                }
                
                await refreshDucks();
                return true;
            } catch (error) {
                console.error('Error updating duck:', error);
                showNotification(error.message, 'error');
                return false;
            }
        },
        
        async getSettings() {
            try {
                const response = await fetch('/api/settings');
                if (!response.ok) throw new Error('Lỗi tải cài đặt');
                
                const settings = await response.json();
                return settings;
            } catch (error) {
                console.error('Error fetching settings:', error);
                return { raceDuration: 10, predeterminedWinnerId: null };
            }
        },
        
        async updateSettings(updates) {
            try {
                const response = await fetch('/api/settings', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updates)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Lỗi cập nhật cài đặt');
                }
                
                const settings = await response.json();
                return settings;
            } catch (error) {
                console.error('Error updating settings:', error);
                showNotification(error.message, 'error');
                return null;
            }
        }
    };
    
    // UI functions
    function renderDuckList() {
        elements.duckList.innerHTML = '';
        elements.duckCount.textContent = appState.ducks.length;
        
        appState.ducks.forEach(duck => {
            const duckItem = document.createElement('div');
            duckItem.className = 'duck-item';
            
            const colorPickerContainer = document.createElement('div');
            colorPickerContainer.className = 'duck-color-picker';
            
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = duck.color;
            colorPicker.title = 'Chọn màu vịt';
            colorPicker.disabled = appState.raceStatus !== 'idle';
            colorPicker.addEventListener('change', (e) => {
                api.updateDuck(duck.id, { color: e.target.value });
            });
            
            const colorDisplay = document.createElement('div');
            colorDisplay.className = 'duck-color';
            colorDisplay.style.backgroundColor = duck.color;
            
            colorPickerContainer.appendChild(colorPicker);
            colorPickerContainer.appendChild(colorDisplay);
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'duck-name';
            nameInput.value = duck.name;
            nameInput.placeholder = `Vịt ${duck.lane + 1}`;
            nameInput.maxLength = 20;
            nameInput.disabled = appState.raceStatus !== 'idle';
            nameInput.addEventListener('change', (e) => {
                api.updateDuck(duck.id, { name: e.target.value });
            });
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'duck-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Xóa vịt';
            removeBtn.disabled = appState.raceStatus !== 'idle' || appState.ducks.length <= 1;
            removeBtn.addEventListener('click', () => {
                api.removeDuck(duck.id);
            });
            
            duckItem.appendChild(colorPickerContainer);
            duckItem.appendChild(nameInput);
            
            if (appState.predeterminedWinnerId === duck.id) {
                const winnerIcon = document.createElement('div');
                winnerIcon.className = 'duck-winner';
                winnerIcon.innerHTML = '👑';
                winnerIcon.title = 'Vịt được chọn để thắng';
                duckItem.appendChild(winnerIcon);
            }
            
            duckItem.appendChild(removeBtn);
            elements.duckList.appendChild(duckItem);
        });
    }
    
    function updateWinnerSelect() {
        elements.winnerSelect.innerHTML = '';
        
        const noneOption = document.createElement('option');
        noneOption.value = 'none';
        noneOption.textContent = 'Kết quả ngẫu nhiên';
        elements.winnerSelect.appendChild(noneOption);
        
        appState.ducks.forEach(duck => {
            const option = document.createElement('option');
            option.value = duck.id;
            
            const colorSquare = document.createElement('span');
            colorSquare.style.display = 'inline-block';
            colorSquare.style.width = '10px';
            colorSquare.style.height = '10px';
            colorSquare.style.backgroundColor = duck.color;
            colorSquare.style.marginRight = '5px';
            
            option.textContent = duck.name;
            option.selected = appState.predeterminedWinnerId === duck.id;
            
            elements.winnerSelect.appendChild(option);
        });
        
        // Disable during race
        elements.winnerSelect.disabled = appState.raceStatus !== 'idle';
    }
    
    function updateUI() {
        // Update duck canvas
        duckRenderer.setDucks(appState.ducks);
        duckRenderer.render();
        
        // Update duck list
        renderDuckList();
        
        // Update winner select
        updateWinnerSelect();
        
        // Update race duration input
        elements.raceDurationInput.value = appState.raceDuration;
        elements.raceDurationInput.disabled = appState.raceStatus !== 'idle';
        
        // Update race status
        const statusText = {
            'idle': 'Sẵn sàng',
            'countdown': 'Chuẩn bị...',
            'racing': 'Đang đua!',
            'finished': 'Kết thúc!'
        };
        
        elements.status.textContent = statusText[appState.raceStatus] || 'Sẵn sàng';
        
        // Update countdown
        if (appState.raceStatus === 'countdown') {
            elements.countdown.textContent = Math.ceil(appState.countdownTime - appState.elapsedTime) + 's';
        } else if (appState.raceStatus === 'racing') {
            elements.countdown.textContent = Math.ceil(appState.raceDuration - appState.elapsedTime) + 's';
        } else {
            elements.countdown.textContent = appState.raceDuration + 's';
        }
        
        // Update buttons
        elements.startRaceBtn.disabled = appState.raceStatus !== 'idle';
        elements.addDuckBtn.disabled = appState.raceStatus !== 'idle' || appState.ducks.length >= 100;
        elements.bulkInputBtn.disabled = appState.raceStatus !== 'idle';
        
        // Show/hide results
        elements.resultsContainer.classList.toggle('hidden', !appState.showResults);
    }
    
    function renderResults() {
        elements.resultsList.innerHTML = '';
        
        // Sort ducks by position (highest first)
        const sortedDucks = [...appState.ducks].sort((a, b) => b.position - a.position);
        
        sortedDucks.forEach((duck, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const position = document.createElement('div');
            position.className = 'result-position';
            position.textContent = `#${index + 1}`;
            
            const duckInfo = document.createElement('div');
            duckInfo.className = 'result-duck';
            
            const colorDot = document.createElement('div');
            colorDot.className = 'result-color';
            colorDot.style.backgroundColor = duck.color;
            
            const name = document.createElement('div');
            name.className = 'result-name';
            name.textContent = duck.name;
            
            duckInfo.appendChild(colorDot);
            duckInfo.appendChild(name);
            
            resultItem.appendChild(position);
            resultItem.appendChild(duckInfo);
            
            if (duck.isWinner) {
                const winnerIcon = document.createElement('div');
                winnerIcon.className = 'result-winner';
                winnerIcon.innerHTML = '🏆';
                winnerIcon.title = 'Chiến thắng';
                resultItem.appendChild(winnerIcon);
            }
            
            elements.resultsList.appendChild(resultItem);
        });
    }
    
    function showNotification(message, type = 'info') {
        // Simple notification
        alert(message);
    }
    
    // Game logic functions
    async function refreshDucks() {
        const ducks = await api.getDucks();
        appState.ducks = ducks;
        updateUI();
    }
    
    async function refreshSettings() {
        const settings = await api.getSettings();
        appState.raceDuration = settings.raceDuration;
        appState.predeterminedWinnerId = settings.predeterminedWinnerId;
        updateUI();
    }
    
    function startRace() {
        if (appState.raceStatus !== 'idle') return;
        
        // Reset positions
        appState.ducks.forEach(duck => {
            duck.position = 0;
            duck.isWinner = false;
        });
        
        appState.raceStatus = 'countdown';
        appState.elapsedTime = 0;
        
        // Start the animation loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
        
        updateUI();
    }
    
    function resetRace() {
        // Cancel animation if running
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Reset state
        appState.raceStatus = 'idle';
        appState.elapsedTime = 0;
        appState.showResults = false;
        
        // Reset duck positions
        appState.ducks.forEach(duck => {
            duck.position = 0;
            duck.isWinner = false;
        });
        
        updateUI();
    }
    
    function gameLoop(timestamp) {
        // Calculate delta time in seconds
        const deltaTime = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        
        // Update game state based on current phase
        if (appState.raceStatus === 'countdown') {
            appState.elapsedTime += deltaTime;
            
            if (appState.elapsedTime >= appState.countdownTime) {
                // Start racing
                appState.raceStatus = 'racing';
                appState.elapsedTime = 0;
            }
        } else if (appState.raceStatus === 'racing') {
            appState.elapsedTime += deltaTime;
            updatePositions(deltaTime);
            
            // Check if race is over
            if (appState.elapsedTime >= appState.raceDuration || 
                appState.ducks.some(duck => duck.position >= 100)) {
                finishRace();
            }
        }
        
        // Update UI
        updateUI();
        
        // Continue animation if not finished
        if (appState.raceStatus !== 'finished') {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
    
    function updatePositions(deltaTime) {
        // Determine if we have a predetermined winner
        const hasWinner = appState.predeterminedWinnerId !== null;
        let winnerId = appState.predeterminedWinnerId;
        
        // If no predetermined winner, randomly select one
        if (!hasWinner) {
            const randomIndex = Math.floor(Math.random() * appState.ducks.length);
            winnerId = appState.ducks[randomIndex].id;
        }
        
        const totalTime = appState.raceDuration;
        const progress = appState.elapsedTime / totalTime;
        
        // Update each duck's position
        appState.ducks.forEach(duck => {
            const isWinner = duck.id === winnerId;
            
            // Determine the duck's target position based on progress
            let targetPosition;
            
            if (isWinner) {
                // The winner should reach 100% at the end
                targetPosition = Math.min(100, progress * 120); // Slightly faster than others
            } else {
                // Non-winners should not reach 100%
                const maxPosition = 95 + (Math.random() * 5); // Between 95% and 100%
                const duckSpeed = 0.8 + (Math.random() * 0.4); // Random speed variation
                targetPosition = Math.min(maxPosition, progress * 100 * duckSpeed);
            }
            
            // Add some randomness to movement
            const randomMovement = (Math.random() - 0.5) * 5 * deltaTime;
            
            // Calculate new position with some easing
            const newPosition = duck.position + ((targetPosition - duck.position) * deltaTime * 2) + randomMovement;
            
            // Update duck position, ensuring it doesn't go backwards
            duck.position = Math.max(duck.position, Math.min(100, newPosition));
            
            // Update duck speed for animation
            duckRenderer.updateDuckSpeed(duck.id, duck.position);
        });
    }
    
    function finishRace() {
        appState.raceStatus = 'finished';
        
        // Determine the winner (the duck with highest position)
        const sortedDucks = [...appState.ducks].sort((a, b) => b.position - a.position);
        const winner = sortedDucks[0];
        
        if (winner) {
            winner.isWinner = true;
            winner.position = 100; // Ensure winner is at 100%
        }
        
        // Show results after a short delay
        setTimeout(() => {
            renderResults();
            appState.showResults = true;
            updateUI();
        }, 1000);
    }
    
    function processBulkNames() {
        const text = elements.bulkNames.value.trim();
        if (!text) return;
        
        // Split by newlines and filter out empty lines
        const names = text.split('\\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        if (names.length === 0) return;
        
        // Process the names (add new ducks or update existing ones)
        processDuckNames(names);
        
        // Close the modal
        elements.bulkModal.classList.add('hidden');
        elements.bulkNames.value = '';
    }
    
    async function processDuckNames(names) {
        try {
            // Limit to 100 ducks
            const validNames = names.slice(0, 100);
            
            // Update existing ducks
            for (let i = 0; i < Math.min(appState.ducks.length, validNames.length); i++) {
                await api.updateDuck(appState.ducks[i].id, { name: validNames[i] });
            }
            
            // Add new ducks if needed
            if (validNames.length > appState.ducks.length) {
                for (let i = appState.ducks.length; i < validNames.length; i++) {
                    const newDuck = await api.addDuck();
                    if (newDuck) {
                        await api.updateDuck(newDuck.id, { name: validNames[i] });
                    }
                }
            }
            
            // Remove extra ducks if we have more than names
            if (appState.ducks.length > validNames.length && validNames.length > 0) {
                for (let i = appState.ducks.length - 1; i >= validNames.length; i--) {
                    await api.removeDuck(appState.ducks[i].id);
                }
            }
            
            // Refresh data
            await refreshDucks();
            
            showNotification(`Đã nhập ${validNames.length} tên vịt`);
        } catch (error) {
            console.error('Error processing bulk names:', error);
            showNotification('Lỗi khi nhập tên vịt hàng loạt', 'error');
        }
    }
    
    // Event listeners
    function setupEventListeners() {
        // Start race button
        elements.startRaceBtn.addEventListener('click', startRace);
        
        // Reset race button
        elements.resetRaceBtn.addEventListener('click', resetRace);
        
        // Add duck button
        elements.addDuckBtn.addEventListener('click', api.addDuck);
        
        // Race duration input
        elements.raceDurationInput.addEventListener('change', async () => {
            const duration = parseInt(elements.raceDurationInput.value, 10);
            await api.updateSettings({ raceDuration: duration });
            refreshSettings();
        });
        
        // Winner select
        elements.winnerSelect.addEventListener('change', async () => {
            const winnerId = elements.winnerSelect.value;
            await api.updateSettings({ predeterminedWinnerId: winnerId });
            refreshSettings();
        });
        
        // Close results button
        elements.closeResultsBtn.addEventListener('click', () => {
            appState.showResults = false;
            updateUI();
        });
        
        // Bulk input button
        elements.bulkInputBtn.addEventListener('click', () => {
            elements.bulkModal.classList.remove('hidden');
        });
        
        // Submit bulk names
        elements.submitBulkBtn.addEventListener('click', processBulkNames);
        
        // Cancel bulk input
        elements.cancelBulkBtn.addEventListener('click', () => {
            elements.bulkModal.classList.add('hidden');
            elements.bulkNames.value = '';
        });
        
        // Close modal button
        elements.closeModalBtn.addEventListener('click', () => {
            elements.bulkModal.classList.add('hidden');
            elements.bulkNames.value = '';
        });
        
        // Window resize event
        window.addEventListener('resize', () => {
            duckRenderer.render();
        });
    }
    
    // Initialization
    async function init() {
        try {
            await refreshDucks();
            await refreshSettings();
            setupEventListeners();
            updateUI();
        } catch (error) {
            console.error('Initialization error:', error);
            showNotification('Lỗi khởi tạo ứng dụng. Vui lòng tải lại trang.', 'error');
        }
    }
    
    // Start the app
    init();
});