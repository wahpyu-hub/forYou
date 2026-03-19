/* ═══════════════════════════════════════════
   FALLING QUBY — falling.js
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── Config ────────────────────────────────────────── */
    const QUBY_IMAGES   = ['Quby1.jpg','Quby2.jpg','Quby3.jpg','Quby4.jpg','Quby5.jpg'];
    const GAME_DURATION = 30;
    const MAX_ITEMS     = 10;   // lebih sedikit biar tidak penuh
    const ITEM_SIZE     = 68;

    // Hanya 2 level — tidak lebih intens dari level 2
    const LEVELS = [
        { spawn: 1100, speedBase: 1.4, speedVar: 0.8 },  // level 1 — santai
        { spawn: 850,  speedBase: 1.9, speedVar: 1.0 },  // level 2 — sedikit lebih cepat (maks)
    ];
    const MAX_LEVEL = 2;

    const PARTICLE_COLORS = ['#5BB8F5','#AEE4FF','#FFE066','#7DCFFF','#B6DAFF','#A8E6A8'];

    /* ── DOM ────────────────────────────────────────────── */
    const gameArea    = document.getElementById('game-area');
    const scoreEl     = document.getElementById('score');
    const timerEl     = document.getElementById('timer');
    const levelEl     = document.getElementById('level-display');
    const startBtn    = document.getElementById('start-btn');
    const startOverlay = document.getElementById('start-overlay');
    const cdOverlay   = document.getElementById('countdown-overlay');
    const cdNumEl     = document.getElementById('countdown-num');
    const comboBadge  = document.getElementById('combo-badge');
    const scoreBumpEl = document.getElementById('score-bump');

    /* ── State ──────────────────────────────────────────── */
    let score       = 0;
    let timeLeft    = GAME_DURATION;
    let level       = 1;
    let combo       = 0;
    let gameRunning = false;
    let items       = [];
    let rafId       = null;
    let timerIntId  = null;
    let spawnIntId  = null;
    let cdIntId     = null;
    let comboTimeout = null;

    /* ── Helpers ────────────────────────────────────────── */
    function getLevelCfg() {
        return LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    }

    function calcLevel(s) {
        // Naik ke level 2 setelah skor 8, tidak lebih dari MAX_LEVEL
        return Math.min(Math.floor(s / 8) + 1, MAX_LEVEL);
    }

    /* ── Stat bump ──────────────────────────────────────── */
    function bumpEl(el, val) {
        el.textContent = val;
        el.classList.remove('bump');
        void el.offsetWidth;
        el.classList.add('bump');
        el.addEventListener('transitionend', () => el.classList.remove('bump'), { once: true });
    }

    /* ── Particles ──────────────────────────────────────── */
    function spawnParticles(x, y) {
        for (let i = 0; i < 7; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            const angle = (i / 7) * Math.PI * 2;
            const dist  = 26 + Math.random() * 26;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist - 18;
            p.style.setProperty('--tx', `translate(${tx}px, ${ty}px)`);
            p.style.left       = x + 'px';
            p.style.top        = y + 'px';
            p.style.background = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
            p.style.animationDelay = (Math.random() * 60) + 'ms';
            gameArea.appendChild(p);
            p.addEventListener('animationend', () => p.remove(), { once: true });
        }
    }

    /* ── Hit text ───────────────────────────────────────── */
    function spawnHitText(x, y, text) {
        const t = document.createElement('div');
        t.classList.add('hit-text');
        t.textContent = text;
        t.style.left  = x + 'px';
        t.style.top   = y + 'px';
        gameArea.appendChild(t);
        t.addEventListener('animationend', () => t.remove(), { once: true });
    }

    /* ── Miss ripple ────────────────────────────────────── */
    function spawnRipple(x, y) {
        const r = document.createElement('div');
        r.classList.add('miss-ripple');
        r.style.left = x + 'px';
        r.style.top  = y + 'px';
        gameArea.appendChild(r);
        r.addEventListener('animationend', () => r.remove(), { once: true });
    }

    /* ── Score bump ─────────────────────────────────────── */
    function showScoreBump(text) {
        scoreBumpEl.textContent = text;
        scoreBumpEl.classList.remove('hidden');
        scoreBumpEl.style.animation = 'none';
        void scoreBumpEl.offsetWidth;
        scoreBumpEl.style.animation = '';
        setTimeout(() => scoreBumpEl.classList.add('hidden'), 700);
    }

    /* ── Combo badge ─────────────────────────────────────── */
    function showComboBadge(n) {
        clearTimeout(comboTimeout);
        comboBadge.textContent = `🔥 ${n}x Combo!`;
        comboBadge.classList.remove('hidden', 'fade-out');
        void comboBadge.offsetWidth;
        comboTimeout = setTimeout(() => {
            comboBadge.classList.add('fade-out');
            comboBadge.addEventListener('animationend', () => {
                comboBadge.classList.add('hidden');
                comboBadge.classList.remove('fade-out');
            }, { once: true });
        }, 900);
    }

    /* ── Spawn item ─────────────────────────────────────── */
    function spawnItem() {
        if (!gameRunning) return;
        if (items.length >= MAX_ITEMS) return;

        const areaW = gameArea.clientWidth;
        if (areaW < ITEM_SIZE) return;

        const cfg   = getLevelCfg();
        const left  = Math.random() * (areaW - ITEM_SIZE);
        const speed = cfg.speedBase + Math.random() * cfg.speedVar;
        const img   = QUBY_IMAGES[Math.floor(Math.random() * QUBY_IMAGES.length)];

        const el = document.createElement('div');
        el.className = 'item';
        el.innerHTML = `<img src="${img}" alt="Quby" draggable="false">`;
        el.style.left   = left + 'px';
        el.style.top    = '-' + ITEM_SIZE + 'px';
        el.style.width  = ITEM_SIZE + 'px';
        el.style.height = ITEM_SIZE + 'px';
        el.style.animationDelay = (Math.random() * 0.8) + 's';

        gameArea.appendChild(el);
        items.push({ el, y: -ITEM_SIZE, speed });
    }

    /* ── Remove item ────────────────────────────────────── */
    function removeItem(index, withHit = false) {
        const item = items[index];
        if (!item) return;
        if (withHit) {
            item.el.classList.add('hit');
            item.el.addEventListener('animationend', () => item.el.remove(), { once: true });
        } else {
            item.el.remove();
        }
        items.splice(index, 1);
    }

    function clearAllItems() {
        items.forEach(it => it.el.remove());
        items = [];
    }

    /* ── Game loop ──────────────────────────────────────── */
    function loop() {
        if (!gameRunning) return;
        const areaH = gameArea.clientHeight;
        const limit = areaH - 14;

        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.y += item.speed;
            item.el.style.top = item.y + 'px';
            if (item.y > limit) {
                removeItem(i, false);
                combo = 0; // reset combo saat item lolos
            }
        }
        rafId = requestAnimationFrame(loop);
    }

    /* ── Hit handler ─────────────────────────────────────── */
    function handleHit(itemEl) {
        const index = items.findIndex(it => it.el === itemEl);
        if (index === -1) return;

        const rect     = itemEl.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        const px = rect.left - areaRect.left + rect.width / 2;
        const py = rect.top  - areaRect.top  + rect.height / 2;

        combo++;
        let gained = 1;
        if (combo >= 5) gained = 3;
        else if (combo >= 3) gained = 2;

        score += gained;

        // Level up (maks level 2)
        const newLevel = calcLevel(score);
        if (newLevel > level) {
            level = newLevel;
            bumpEl(levelEl, level);
            restartSpawn();
        }

        bumpEl(scoreEl, score);

        const texts = ['Nice! 👊','Kena! ✨','Pukul! 💥','Yay! 🎉','Ow! 😵'];
        const hitMsg = combo >= 3 ? `×${combo} COMBO +${gained}` : texts[Math.floor(Math.random() * texts.length)];
        spawnHitText(px - 20, py - 10, hitMsg);
        spawnParticles(px, py);
        showScoreBump(gained > 1 ? `+${gained} 🔥` : '+1');
        if (combo >= 3) showComboBadge(combo);

        removeItem(index, true);
    }

    /* ── Miss handler ───────────────────────────────────── */
    function handleMiss(x, y) {
        combo = 0;
        spawnRipple(x, y);
    }

    /* ── Events ─────────────────────────────────────────── */
    gameArea.addEventListener('click', function (e) {
        if (!gameRunning) return;
        const itemEl = e.target.closest('.item');
        if (itemEl && !itemEl.classList.contains('hit')) {
            handleHit(itemEl);
        } else if (!itemEl) {
            const r = gameArea.getBoundingClientRect();
            handleMiss(e.clientX - r.left, e.clientY - r.top);
        }
    });

    gameArea.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (!gameRunning) return;
        const touch  = e.touches[0];
        const el     = document.elementFromPoint(touch.clientX, touch.clientY);
        const itemEl = el?.closest('.item');
        const r      = gameArea.getBoundingClientRect();
        if (itemEl && !itemEl.classList.contains('hit')) {
            handleHit(itemEl);
        } else {
            handleMiss(touch.clientX - r.left, touch.clientY - r.top);
        }
    }, { passive: false });

    gameArea.addEventListener('contextmenu', e => e.preventDefault());

    /* ── Restart spawn ──────────────────────────────────── */
    function restartSpawn() {
        clearInterval(spawnIntId);
        spawnIntId = setInterval(spawnItem, getLevelCfg().spawn);
    }

    /* ── Start game ─────────────────────────────────────── */
    function startGameNow() {
        gameRunning = true;
        cdOverlay.classList.add('hidden');
        rafId      = requestAnimationFrame(loop);
        spawnIntId = setInterval(spawnItem, getLevelCfg().spawn);
        timerIntId = setInterval(() => {
            timeLeft--;
            bumpEl(timerEl, timeLeft);
            if (timeLeft <= 10) timerEl.classList.add('urgent');
            if (timeLeft <= 0)  endGame();
        }, 1000);
    }

    /* ── Countdown ──────────────────────────────────────── */
    function runCountdown() {
        let n = 3;
        cdNumEl.textContent = n;
        cdNumEl.style.color = '';
        cdOverlay.classList.remove('hidden');

        cdIntId = setInterval(() => {
            n--;
            if (n > 0) {
                cdNumEl.textContent = n;
                cdNumEl.style.animation = 'none';
                void cdNumEl.offsetWidth;
                cdNumEl.style.animation = 'cdPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both';
            } else if (n === 0) {
                cdNumEl.textContent = 'GO! ';
                cdNumEl.style.color = '#2E9DE4';
            } else {
                clearInterval(cdIntId);
                startGameNow();
            }
        }, 750);
    }

    /* ── End game → result.html ─────────────────────────── */
    function endGame() {
        gameRunning = false;
        clearInterval(timerIntId);
        clearInterval(spawnIntId);
        cancelAnimationFrame(rafId);
        clearAllItems();

        localStorage.setItem('lastFallingScore', score);
        window.location.href = 'result-falling.html';
    }

    /* ── Start button ────────────────────────────────────── */
    startBtn.addEventListener('click', () => {
        if (gameRunning) return;

        // Sembunyikan overlay mulai
        startOverlay.style.display = 'none';

        score    = 0;
        timeLeft = GAME_DURATION;
        level    = 1;
        combo    = 0;

        scoreEl.textContent = 0;
        timerEl.textContent = GAME_DURATION;
        levelEl.textContent = 1;
        timerEl.classList.remove('urgent');

        clearAllItems();
        runCountdown();
    });

})();
