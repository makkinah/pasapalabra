// ================== VARIABLES ==================
let players = [];
let currentPlayer = 0;
let timerInterval;
let gameActive = false;
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let initialTime = 300;

// ================== TIEMPO ==================
function parseTimeInput(timeStr) {
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ================== CONFIG ==================
function generatePlayerInputs() {
    const numPlayers = parseInt(document.getElementById('playersCount').value);
    const container = document.getElementById('playersNames');
    const timeInput = document.getElementById('totalTimeInput');
    
    if (!timeInput.value) {
        alert('⚠️ Ingresa el tiempo primero');
        return;
    }
    
    initialTime = parseTimeInput(timeInput.value);
    container.innerHTML = '';
    
    for (let i = 0; i < numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'input-group player-input';
        playerDiv.innerHTML = `
            <label>Jugador ${i + 1}:</label>
            <input type="text" id="player${i}" placeholder="Nombre del Jugador ${i + 1}">
        `;
        container.appendChild(playerDiv);
    }
    
    document.getElementById('startBtn').style.display = 'inline-block';
}

// ================== START ==================
function startGame() {
    const numPlayers = parseInt(document.getElementById('playersCount').value);
    
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        const name = document.getElementById(`player${i}`).value.trim() || `Jugador ${i + 1}`;
        
        let playerLetters = {};
        letters.forEach(letter => {
            playerLetters[letter] = 'default';
        });
        
        players.push({ 
            name, 
            score: 0,
            letters: playerLetters,
            currentIndex: 0,
            timeLeft: initialTime
        });
    }
    
    currentPlayer = 0;
    gameActive = true;
    
    document.getElementById('configScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    
    createRosco();
    createMiniRoscos();
    startTimer();
    updateDisplay();
}

// ================== ROSCO GRANDE ==================
function createRosco() {
    const rosco = document.getElementById('rosco');
    rosco.innerHTML = '';
    
    letters.forEach((letter, index) => {
        const angle = (index / letters.length) * 360;
        const letterEl = document.createElement('div');
        letterEl.className = 'letter';
        letterEl.textContent = letter;
        letterEl.dataset.letter = letter;
        letterEl.dataset.index = index;

        // 🔥 MÁS ESPACIO ENTRE LETRAS
        letterEl.style.transform = `rotate(${angle}deg) translateX(320px) rotate(-${angle}deg)`;
        
        letterEl.addEventListener('click', () => goToLetter(index));
        rosco.appendChild(letterEl);
    });
}

// ================== MINI ROSCOS ==================
function createMiniRoscos() {
    const container = document.getElementById('miniRoscos');
    container.innerHTML = '';

    players.forEach((player, pIndex) => {
        const mini = document.createElement('div');
        mini.className = 'mini-rosco';
        mini.id = `mini-${pIndex}`;

        // NOMBRE
        const name = document.createElement('div');
        name.className = 'mini-name';
        name.textContent = player.name;
        mini.appendChild(name);

        letters.forEach((letter, index) => {
            const angle = (index / letters.length) * 360;

            const el = document.createElement('div');
            el.className = 'mini-letter';
            el.textContent = letter;

            el.style.transform = `rotate(${angle}deg) translateX(65px) rotate(-${angle}deg)`;

            mini.appendChild(el);
        });

        container.appendChild(mini);
    });
}

// ================== UPDATE ==================
function updateRosco() {
    document.querySelectorAll('.letter').forEach((el, index) => {
        const letter = el.dataset.letter;
        const state = players[currentPlayer].letters[letter];
        
        el.classList.remove('correct', 'incorrect', 'pass', 'current');
        
        if (state === 'correct') el.classList.add('correct');
        if (state === 'incorrect') el.classList.add('incorrect');
        if (state === 'pass') el.classList.add('pass');
        
        if (index === players[currentPlayer].currentIndex && gameActive) {
            el.classList.add('current');
        }
    });
}

function updateMiniRoscos() {
    players.forEach((player, pIndex) => {
        const mini = document.getElementById(`mini-${pIndex}`);
        if (!mini) return;

        mini.classList.toggle('active', pIndex === currentPlayer);

        const lettersEls = mini.querySelectorAll('.mini-letter');

        lettersEls.forEach((el, index) => {
            const letter = letters[index];
            const state = player.letters[letter];

            el.style.background = '#222';

            if (state === 'correct') el.style.background = '#00ff88';
            if (state === 'incorrect') el.style.background = '#ff4444';
            if (state === 'pass') el.style.background = '#ffaa00';
        });
    });
}

// ================== GAME ==================
function answer(type) {
    if (!gameActive) return;
    
    const player = players[currentPlayer];
    const currentLetter = letters[player.currentIndex];
    
    player.letters[currentLetter] = type;
    
    if (type === 'correct') player.score++;
    
    nextLetter();
    
    if (type === 'incorrect' || type === 'pass') {
        nextPlayer();
    }
    
    updateDisplay();
    playSound(type);
}

function nextLetter() {
    const player = players[currentPlayer];
    
    let hasDefault = Object.values(player.letters).includes('default');
    let hasPass = Object.values(player.letters).includes('pass');
    
    let targetState = hasDefault ? 'default' : 'pass';
    
    if (!hasDefault && !hasPass) {
        endGame();
        return;
    }
    
    for (let i = 0; i < letters.length; i++) {
        player.currentIndex = (player.currentIndex + 1) % letters.length;
        
        if (player.letters[letters[player.currentIndex]] === targetState) {
            return;
        }
    }
}

function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % players.length;
}

// ================== CLICK LETRA ==================
function goToLetter(index) {
    const player = players[currentPlayer];
    
    if (
        player.letters[letters[index]] === 'correct' ||
        player.letters[letters[index]] === 'incorrect'
    ) return;
    
    player.currentIndex = index;
    updateRosco();
}

// ================== TIMER ==================
function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        
        const player = players[currentPlayer];
        player.timeLeft--;
        
        if (player.timeLeft <= 0) {
            player.timeLeft = 0;
            nextPlayer();
        }
        
        updateDisplay();
    }, 1000);
}

// ================== DISPLAY ==================
function updateDisplay() {
    const player = players[currentPlayer];
    
    document.getElementById('currentPlayer').textContent = player.name;
    document.getElementById('currentScore').textContent = player.score;
    document.getElementById('timer').textContent = formatTime(player.timeLeft);

    // 🔥 nombre grande arriba del rosco
    const title = document.getElementById('playerTitle');
    if (title) title.textContent = player.name;
    
    updateRosco();
    updateMiniRoscos();
}

// ================== END ==================
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    const resultsScreen = document.getElementById('resultsScreen');
    const finalScores = document.getElementById('finalScores');
    
    finalScores.innerHTML = players
        .sort((a, b) => b.score - a.score)
        .map((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            return `<div class="score">${medal} ${player.name}: ${player.score} puntos</div>`;
        })
        .join('');
    
    document.getElementById('gameScreen').style.display = 'none';
    resultsScreen.style.display = 'block';
}

function restartGame() {
    location.reload();
}

// ================== SONIDO ==================
function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = type === 'correct' ? 800 : type === 'incorrect' ? 300 : 600;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {}
}

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Pasapalabra FULL PRO listo');
});