document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const towa = document.getElementById('towa');
    const setsuna = document.getElementById('setsuna');
    const playerArea = document.getElementById('player-area');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const comboArea = document.getElementById('combo-area');
    const feverDisplay = document.getElementById('fever-time');
    const penaltyBox = document.getElementById('penalty-box');
    const restartButton = document.getElementById('restart-button');
    const gameOverDisplay = document.getElementById('game-over');

    const bgm = document.getElementById('bgm');
    const feverBgm = document.getElementById('fever-bgm');
    const shootSound = document.getElementById('shoot-sound');
    const hitSound = document.getElementById('hit-sound');
    const penaltySound = document.getElementById('penalty-sound');
    const feverStartSound = document.getElementById('fever-start-sound');

    let score = 0;
    let combo = 0;
    let canShoot = false; // Start as false
    let isFever = false;
    let penaltyTimer, gameTimer, feverTimer;
    let timeLeft = 60;
    let isBgmPlaying = false;
    const FEVER_THRESHOLD = 10;
    const FEVER_DURATION = 10;

    const gameRect = gameContainer.getBoundingClientRect();

    // --- Sound Control ---
    function playSound(sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play failed: " + e));
    }

    function startBgm() {
        if (isBgmPlaying) return;
        bgm.play().then(() => {
            isBgmPlaying = true;
        }).catch(e => console.log("BGM play failed: " + e));
    }

    function stopAllBgm() {
        bgm.pause();
        bgm.currentTime = 0;
        feverBgm.pause();
        feverBgm.currentTime = 0;
        isBgmPlaying = false;
    }

    // --- Game State ---
    function startGame() {
        startScreen.classList.add('hidden');
        resetGame();
    }

    function resetGame() {
        score = 0;
        combo = 0;
        timeLeft = 60;
        canShoot = true;
        isFever = false;

        stopAllBgm();
        startBgm();
        updateScore();
        updateTimer();
        updateComboDisplay();

        gameContainer.classList.remove('fever');
        feverDisplay.classList.add('hidden');
        gameOverDisplay.classList.add('hidden');

        clearTimeout(penaltyTimer);
        clearInterval(gameTimer);
        clearTimeout(feverTimer);

        gameTimer = setInterval(tick, 1000);

        feedCat(towa, true);
        feedCat(setsuna, true);
    }

    function updateScore(points = 1) {
        score += isFever ? points * 2 : points;
        scoreDisplay.textContent = `Score: ${score}`;
    }

    function updateTimer() {
        timerDisplay.textContent = `Time: ${timeLeft}`;
    }

    function updateComboDisplay() {
        if (combo > 1) {
            comboArea.textContent = `COMBO: ${combo}`;
            comboArea.classList.remove('hidden');
        } else {
            comboArea.classList.add('hidden');
        }
    }

    function tick() {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            endGame();
        }
    }

    function endGame() {
        clearInterval(gameTimer);
        clearTimeout(feverTimer);
        stopAllBgm();
        canShoot = false;
        isFever = false;
        gameContainer.classList.remove('fever');
        feverDisplay.classList.add('hidden');
        gameOverDisplay.querySelector('p').textContent = `終了！スコア: ${score}`;
        gameOverDisplay.classList.remove('hidden');
        towa.classList.remove('hungry');
        setsuna.classList.remove('hungry');
    }

    function showPenalty() {
        if (isFever) return;
        playSound(penaltySound);
        combo = 0;
        updateComboDisplay();
        canShoot = false;
        penaltyBox.classList.remove('hidden');
        clearTimeout(penaltyTimer);
        penaltyTimer = setTimeout(() => {
            penaltyBox.classList.add('hidden');
            if (timeLeft > 0) {
                canShoot = true;
            }
        }, 2000);
    }

    function startFever() {
        isFever = true;
        playSound(feverStartSound);
        bgm.pause();
        feverBgm.play();

        feverDisplay.classList.remove('hidden');
        gameContainer.classList.add('fever');

        feedCat(towa, true);
        feedCat(setsuna, true);

        feverTimer = setTimeout(endFever, FEVER_DURATION * 1000);
    }

    function endFever() {
        isFever = false;
        feverBgm.pause();
        feverBgm.currentTime = 0;
        if(timeLeft > 0) bgm.play();

        feverDisplay.classList.add('hidden');
        gameContainer.classList.remove('fever');
    }
    
    function makeCatHungry(cat) {
        if (timeLeft <= 0 || cat.classList.contains('hungry')) return;
        cat.classList.remove('hit');
        const catSize = 80;
        const maxX = gameRect.width - catSize;
        const maxY = gameRect.height - catSize - 100;
        const randomX = Math.random() * maxX;
        const randomY = Math.random() * maxY;
        cat.style.left = `${randomX}px`;
        cat.style.top = `${randomY}px`;
        cat.classList.add('hungry');
    }

    function feedCat(cat, isInitialReset = false) {
        if (!isInitialReset) {
            playSound(hitSound);
            cat.classList.add('hit');
        }
        cat.classList.remove('hungry');
        if (timeLeft > 0) {
            const delay = isFever ? (Math.random() * 1000 + 500) : (Math.random() * 3000 + 1500);
            setTimeout(() => makeCatHungry(cat), delay);
        }
    }

    let startX, startY;

    function handleInteractionStart(e) {
        if (!canShoot) return;
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
    }

    function handleInteractionEnd(e) {
        if (!canShoot || !startX || !startY) return;
        const touch = e.type === 'touchend' ? e.changedTouches[0] : e;
        const endX = touch.clientX;
        const endY = touch.clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        if (deltaY < -10) {
            shootOnigiri(deltaX, deltaY);
        }
        startX = null;
        startY = null;
    }

    function shootOnigiri(velX, velY) {
        playSound(shootSound);
        const onigiri = document.createElement('div');
        onigiri.textContent = '🍙';
        onigiri.className = 'onigiri';
        const playerRect = playerArea.getBoundingClientRect();
        const startLeft = playerRect.left + playerRect.width / 2 - gameRect.left;
        const startBottom = gameContainer.clientHeight - playerRect.bottom + gameRect.top;
        onigiri.style.left = `${startLeft - 15}px`;
        onigiri.style.bottom = `${startBottom}px`;
        gameContainer.appendChild(onigiri);

        const magnitude = Math.sqrt(velX * velX + velY * velY);
        const normalizedVelX = (velX / magnitude) * 10;
        const normalizedVelY = (velY / magnitude) * 10;

        let onigiriMissed = true;

        const moveOnigiri = setInterval(() => {
            const currentLeft = parseFloat(onigiri.style.left);
            const currentBottom = parseFloat(onigiri.style.bottom);
            onigiri.style.left = `${currentLeft + normalizedVelX}px`;
            onigiri.style.bottom = `${currentBottom - normalizedVelY}px`;

            [towa, setsuna].forEach(cat => {
                if (cat.classList.contains('hungry') && isColliding(onigiri, cat)) {
                    updateScore(1);
                    combo++;
                    updateComboDisplay();
                    if (combo === FEVER_THRESHOLD && !isFever) {
                        startFever();
                    }
                    feedCat(cat);
                    onigiri.remove();
                    clearInterval(moveOnigiri);
                    onigiriMissed = false;
                }
            });

            if (currentBottom > gameRect.height || currentLeft < 0 || currentLeft > gameRect.width) {
                onigiri.remove();
                clearInterval(moveOnigiri);
                if (onigiriMissed) {
                    showPenalty();
                }
            }
        }, 16);
    }

    function isColliding(a, b) {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return !(
            aRect.top > bRect.bottom ||
            aRect.bottom < bRect.top ||
            aRect.left > bRect.right ||
            aRect.right < bRect.left
        );
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    playerArea.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('mouseup', handleInteractionEnd);
    playerArea.addEventListener('touchstart', handleInteractionStart, { passive: true });
    document.addEventListener('touchend', handleInteractionEnd);
    restartButton.addEventListener('click', resetGame);

    // --- Initial Setup ---
    // Don't start the game automatically anymore
    // resetGame();
});