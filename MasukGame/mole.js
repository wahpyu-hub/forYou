document.addEventListener('DOMContentLoaded', () => {
    /* ── DOM refs ───────────────────────────────────────────── */
    const boardEl          = document.getElementById('moleBoard');
    const scoreEl          = document.getElementById('score');
    const timerEl          = document.getElementById('timer');
    const levelEl          = document.getElementById('levelDisplay');
    const startBtn         = document.getElementById('startBtn');
    const gameStatus       = document.getElementById('gameStatus');
    const countdownOverlay = document.getElementById('countdownOverlay');
    const countdownNum     = document.getElementById('countdownNum');
    const gameTitle        = document.getElementById('gameTitle');
    const gameSubtitle     = document.getElementById('gameSubtitle');

    /* ── State ─────────────────────────────────────────────── */
    let score        = 0;
    let timeLeft     = 30;
    let level        = 1;
    let combo        = 0;
    let gameActive   = false;
    let timerInterval   = null;
    let moleInterval    = null;
    let activeMoles     = new Set();
    const HOLES         = 9;

    /* ── Level config ───────────────────────────────────────── */
    const LEVELS = [
        { interval: 900,  visible: 1000 },
        { interval: 750,  visible: 850  },
        { interval: 600,  visible: 700  },
        { interval: 480,  visible: 580  },
        { interval: 380,  visible: 480  },
    ];

    function getLevelConfig() {
        return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    }

    /* ── Board creation ─────────────────────────────────────── */
    function createBoard() {
        boardEl.innerHTML = '';
        activeMoles.clear();
        for (let i = 0; i < HOLES; i++) {
            const wrap = document.createElement('div');
            wrap.classList.add('hole-wrap');

            const hole = document.createElement('div');
            hole.classList.add('hole');
            hole.dataset.index = i;
            hole.addEventListener('click',      handleHoleClick);
            hole.addEventListener('touchstart', handleHoleClick, { passive: true });

            const grass = document.createElement('div');
            grass.classList.add('hole-grass');

            wrap.appendChild(hole);
            wrap.appendChild(grass);
            boardEl.appendChild(wrap);
        }
    }

    /* ── Show mole ──────────────────────────────────────────── */
    function showMole() {
        if (!gameActive) return;

        const holes = Array.from(document.querySelectorAll('.hole'));
        const empty = holes.filter(h => !h.querySelector('.mole'));
        if (empty.length === 0) return;

        const hole = empty[Math.floor(Math.random() * empty.length)];
        const idx  = parseInt(hole.dataset.index);

        const mole = document.createElement('img');
        mole.src   = 'quby.jpg';
        mole.alt   = 'Quby';
        mole.classList.add('mole');
        hole.appendChild(mole);
        activeMoles.add(idx);

        const cfg = getLevelConfig();
        mole._hideTimer = setTimeout(() => {
            if (mole.parentNode && !mole.classList.contains('whacked')) {
                mole.classList.add('hiding');
                mole.addEventListener('animationend', () => {
                    mole.remove();
                    activeMoles.delete(idx);
                }, { once: true });
            }
        }, cfg.visible);
    }

    /* ── Handle click/tap ───────────────────────────────────── */
    function handleHoleClick(e) {
        if (!gameActive) return;
        if (e.type === 'touchstart') e.preventDefault?.();

        const hole = e.currentTarget;
        const mole = hole.querySelector('.mole:not(.whacked)');

        if (mole) whackMole(mole, hole);
        else      showMissText(hole);
    }

    function whackMole(mole, hole) {
        clearTimeout(mole._hideTimer);
        mole.classList.add('whacked');
        const idx = parseInt(hole.dataset.index);

        combo++;
        score++;
        if (combo >= 3) {
            score++;
            showCombo(combo);
        }

        bumpStat(scoreEl, score);

        const newLevel = Math.min(Math.floor(score / 5) + 1, 3);
        if (newLevel > level) {
            level = newLevel;
            bumpStat(levelEl, level);
            restartMoleInterval();
        }

        const burst = document.createElement('div');
        burst.classList.add('hit-burst');
        burst.textContent = combo >= 3
            ? `×${combo} COMBO! 🔥`
            : ['Pukul! 👊','Kena! ✨','Ow! 💥','Yay! 🎉'][Math.floor(Math.random()*4)];
        hole.appendChild(burst);
        burst.addEventListener('animationend', () => burst.remove(), { once: true });

        mole.addEventListener('animationend', () => {
            mole.remove();
            activeMoles.delete(idx);
        }, { once: true });
    }

    function showMissText(hole) {
        combo = 0;
        const miss = document.createElement('div');
        miss.classList.add('miss-text');
        miss.textContent = 'Miss!';
        hole.appendChild(miss);
        miss.addEventListener('animationend', () => miss.remove(), { once: true });
    }

    /* ── Combo badge ────────────────────────────────────────── */
    let comboEl = null;
    let comboOutTimer = null;
    function showCombo(n) {
        if (comboEl) { clearTimeout(comboOutTimer); comboEl.remove(); comboEl = null; }
        comboEl = document.createElement('div');
        comboEl.classList.add('combo-flash');
        comboEl.textContent = `🔥 ${n}x Combo!`;
        document.body.appendChild(comboEl);
        comboOutTimer = setTimeout(() => {
            if (comboEl) {
                comboEl.classList.add('out');
                comboEl.addEventListener('animationend', () => { comboEl?.remove(); comboEl = null; }, { once: true });
            }
        }, 900);
    }

    /* ── Stat bump ──────────────────────────────────────────── */
    function bumpStat(el, val) {
        el.textContent = val;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
        el.addEventListener('transitionend', () => el.classList.remove('bump'), { once: true });
    }

    /* ── Restart mole interval ──────────────────────────────── */
    function restartMoleInterval() {
        clearInterval(moleInterval);
        moleInterval = setInterval(showMole, getLevelConfig().interval);
    }

    /* ── Countdown ──────────────────────────────────────────── */
    function showCountdown(cb) {
        countdownOverlay.style.display = 'flex';
        gameStatus.style.display = 'none';

        let n = 3;
        countdownNum.textContent = n;

        const tick = setInterval(() => {
            n--;
            if (n <= 0) {
                clearInterval(tick);
                countdownNum.textContent = 'GO! ';
                countdownNum.style.color = '#5CB85C';
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    cb();
                }, 600);
            } else {
                countdownNum.textContent = n;
                countdownNum.style.animation = 'none';
                void countdownNum.offsetWidth;
                countdownNum.style.animation = 'cdPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both';
            }
        }, 700);
    }

    /* ── Start game ─────────────────────────────────────────── */
    function startGame() {
        score    = 0;
        timeLeft = 30;
        level    = 1;
        combo    = 0;
        gameActive = false;

        scoreEl.textContent = score;
        timerEl.textContent = timeLeft;
        levelEl.textContent = level;
        timerEl.classList.remove('timer-urgent');

        startBtn.style.display   = 'none';
        gameStatus.style.display = 'none';

        gameTitle.textContent    = 'Whack a Quby!';
        gameSubtitle.textContent = 'Bersiap…';

        createBoard();
        showCountdown(() => {
            gameStatus.style.display = 'block';
            gameTitle.textContent    = 'Ayo pukul';
            gameSubtitle.textContent = 'Wlee!';
            gameActive = true;

            moleInterval  = setInterval(showMole, getLevelConfig().interval);
            timerInterval = setInterval(tickTimer, 1000);
        });
    }

    /* ── Timer tick ─────────────────────────────────────────── */
    function tickTimer() {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 10) timerEl.classList.add('timer-urgent');
        if (timeLeft <= 0)  endGame();
    }

    /* ── End game → langsung ke result.html ─────────────────── */
    function endGame() {
        gameActive = false;
        clearInterval(timerInterval);
        clearInterval(moleInterval);

        document.querySelectorAll('.mole').forEach(m => m.remove());
        activeMoles.clear();

        localStorage.setItem('lastScore', score);
        window.location.href = 'result.html';
    }

    /* ── Init ───────────────────────────────────────────────── */
    startBtn.addEventListener('click', startGame);
    createBoard();
});
