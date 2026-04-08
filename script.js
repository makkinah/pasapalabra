let players = [];
let currentPlayer = 0;
let timerInterval;
let gameActive = false;
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let initialTime = 300;

function parseTimeInput(timeStr) {
    const parts = timeStr.split(':');
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
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
    
    if (!timeInput.value) return alert('⚠️ Ingresa el tiempo');
    
    initialTime = parseTimeInput(timeInput.value);
    container.innerHTML = '';
    
    for (let i = 0; i < numPlayers; i++) {
        container.innerHTML += `
            <div class="input-group player-input">
                <label>Jugador ${i + 1}:</label>
                <input type="text" id="player${i}">
            </div>
        `;
    }
    
    document.getElementById('startBtn').style.display = 'inline-block';
}

function startGame() {
    const numPlayers = parseInt(document.getElementById('playersCount').value);
    
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        let playerLetters = {};
        letters.forEach(l => playerLetters[l] = 'default');

        players.push({
            name: document.getElementById(`player${i}`).value || `Jugador ${i+1}`,
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
    startTimer();
    updateDisplay();
}

function createRosco() {
    const rosco = document.getElementById('rosco');
    rosco.innerHTML = '';
    
    letters.forEach((letter, index) => {
        const angle = (index / letters.length) * 360;
        rosco.innerHTML += `
            <div class="letter" data-letter="${letter}" data-index="${index}"
            style="transform: rotate(${angle}deg) translateX(320px) rotate(-${angle}deg)">
            ${letter}
            </div>
        `;
    });

    document.querySelectorAll('.letter').forEach(el => {
        el.onclick = () => goToLetter(parseInt(el.dataset.index));
    });
}

function updateRosco() {
    document.querySelectorAll('.letter').forEach((el, index) => {
        const player = players[currentPlayer];
        const state = player.letters[el.dataset.letter];

        el.className = 'letter';

        if (state === 'correct') el.classList.add('correct');
        if (state === 'incorrect') el.classList.add('incorrect');
        if (state === 'pass') el.classList.add('pass');

        if (index === player.currentIndex) el.classList.add('current');
    });
}

function answer(type) {
    if (!gameActive) return;

    const player = players[currentPlayer];
    const letter = letters[player.currentIndex];

    player.letters[letter] = type;
    if (type === 'correct') player.score++;

    nextLetter();

    if (type !== 'correct') nextPlayer();

    updateDisplay();
    playSound(type);
}

function nextLetter() {
    const p = players[currentPlayer];

    let target = Object.values(p.letters).includes('default') ? 'default' : 'pass';

    for (let i = 0; i < letters.length; i++) {
        p.currentIndex = (p.currentIndex + 1) % letters.length;
        if (p.letters[letters[p.currentIndex]] === target) return;
    }

    endGame();
}

function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % players.length;
}

function goToLetter(index) {
    const p = players[currentPlayer];
    if (p.letters[letters[index]] !== 'correct' && p.letters[letters[index]] !== 'incorrect') {
        p.currentIndex = index;
        updateRosco();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const p = players[currentPlayer];
        p.timeLeft--;

        if (p.timeLeft <= 0) {
            p.timeLeft = 0;
            nextPlayer();
        }

        updateDisplay();
    }, 1000);
}

function updateDisplay() {
    const p = players[currentPlayer];

    document.getElementById('currentPlayer').textContent = p.name;
    document.getElementById('currentScore').textContent = p.score;
    document.getElementById('timer').textContent = formatTime(p.timeLeft);

    updateRosco();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);

    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('resultsScreen').style.display = 'block';

    document.getElementById('finalScores').innerHTML = players
        .sort((a,b)=>b.score-a.score)
        .map(p => `<div class="score">${p.name}: ${p.score}</div>`)
        .join('');
}

function restartGame() {
    location.reload();
}

function playSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'correct') {
            oscillator.frequency.value = 800; // agudo = bien
            oscillator.type = 'sine';
        } 
        else if (type === 'incorrect') {
            oscillator.frequency.value = 300; // grave = mal
            oscillator.type = 'sawtooth';
        } 
        else {
            oscillator.frequency.value = 600; // medio = pasa
            oscillator.type = 'triangle';
        }

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch(e) {
        console.log("Audio bloqueado por navegador");
    }
}
