let players = [];
let currentPlayer = 0;
let totalTimeLeft = 300;
let timerInterval;
let gameActive = false;
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

function generatePlayerInputs() {
    const numPlayers = parseInt(document.getElementById('playersCount').value);
    const container = document.getElementById('playersNames');
    const timeInput = document.getElementById('totalTimeInput');
    
    if (!timeInput.value) {
        alert('⚠️ Ingresa el tiempo total primero');
        return;
    }
    
    totalTimeLeft = parseTimeInput(timeInput.value);
    if (totalTimeLeft < 60) {
        alert('⚠️ El tiempo mínimo es 1 minuto');
        return;
    }
    
    container.innerHTML = '';
    
    for (let i = 0; i < numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'input-group player-input';
        playerDiv.innerHTML = `
            <label>Jugador ${i + 1}:</label>
            <input type="text" id="player${i}" placeholder="Nombre del Jugador ${i + 1}" maxlength="20">
        `;
        container.appendChild(playerDiv);
    }
    
    document.getElementById('startBtn').style.display = 'inline-block';
}

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
            currentIndex: 0
        });
    }
    
    currentPlayer = 0;
    gameActive = true;
    
    document.getElementById('configScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    
    createRosco();
    startTimer();
    updateDisplay();
}

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
        letterEl.style.transform = `rotate(${angle}deg) translateX(280px) rotate(-${angle}deg)`;
        
        letterEl.addEventListener('click', () => goToLetter(index));
        rosco.appendChild(letterEl);
    });
    
    updateRosco();
}

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

function answer(type) {
    if (!gameActive) return;
    
    const player = players[currentPlayer];
    const currentLetter = letters[player.currentIndex];
    
    player.letters[currentLetter] = type;
    
    if (type === 'correct') {
        player.score++;
    }
    
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
    
    // Si ya no quedan "default", empezar a recorrer las "pass"
    let targetState = hasDefault ? 'default' : 'pass';
    
    // Si no quedan ni default ni pass → termina
    if (!hasDefault && !hasPass) {
        endGame();
        return;
    }
    
    let found = false;
    
    for (let i = 0; i < letters.length; i++) {
        player.currentIndex = (player.currentIndex + 1) % letters.length;
        
        if (player.letters[letters[player.currentIndex]] === targetState) {
            found = true;
            break;
        }
    }
    
    if (!found) {
        endGame();
    }
}

function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % players.length;
    updateRosco();
}

function goToLetter(index) {
    const player = players[currentPlayer];
    
    if (
        player.letters[letters[index]] === 'correct' ||
        player.letters[letters[index]] === 'incorrect'
    ) return;
    
    player.currentIndex = index;
    updateRosco();
}

function startTimer() {
    timerInterval = setInterval(() => {
        totalTimeLeft--;
        updateDisplay();
        
        if (totalTimeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateDisplay() {
    document.getElementById('currentPlayer').textContent = players[currentPlayer].name;
    document.getElementById('currentScore').textContent = players[currentPlayer].score;
    document.getElementById('timer').textContent = formatTime(totalTimeLeft);
    
    updateRosco();
}

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
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('configScreen').style.display = 'flex';
    document.getElementById('playersNames').innerHTML = '';
    document.getElementById('startBtn').style.display = 'none';
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
}

function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'correct') oscillator.frequency.value = 800;
        else if (type === 'incorrect') oscillator.frequency.value = 300;
        else oscillator.frequency.value = 600;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Pasapalabra FULL PRO');
});