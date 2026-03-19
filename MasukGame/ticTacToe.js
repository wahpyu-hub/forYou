document.addEventListener('DOMContentLoaded', () => {
    const boardElement   = document.getElementById('board');
    const statusElement  = document.getElementById('status');
    const resetBtn       = document.getElementById('resetBtn');
    const nextBtn        = document.getElementById('nextBtn');

    // Overlay elements
    const resultOverlay  = document.getElementById('resultOverlay');
    const resultIcon     = document.getElementById('resultIcon');
    const resultTitle    = document.getElementById('resultTitle');
    const resultSubtitle = document.getElementById('resultSubtitle');
    const resultCloseBtn = document.getElementById('resultCloseBtn');

    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    let confettiAnim = null;

    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    // ─── Confetti ────────────────────────────────────────────────────────────
    function launchConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors  = ['#FFD700','#FF6B6B','#4ECDC4','#A78BFA','#F9A825','#fff'];
        const pieces  = Array.from({ length: 140 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            w: Math.random() * 10 + 6,
            h: Math.random() * 5  + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 4 + 2,
            vr: (Math.random() - 0.5) * 6,
        }));

        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, 1 - frame / 160);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                p.x  += p.vx;
                p.y  += p.vy;
                p.rot += p.vr;
                if (p.y > canvas.height) {
                    p.y = -20;
                    p.x = Math.random() * canvas.width;
                }
            });
            frame++;
            if (frame < 180) {
                confettiAnim = requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        draw();
    }

    function stopConfetti() {
        if (confettiAnim) {
            cancelAnimationFrame(confettiAnim);
            confettiAnim = null;
        }
        const canvas = document.getElementById('confetti-canvas');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    // ─── Result Overlay ──────────────────────────────────────────────────────
    function showResult(type) {
        // type: 'win' | 'lose' | 'draw'
        resultOverlay.className = 'result-overlay ' + type;
        if (type === 'win') {
            resultIcon.textContent    = '👏';
            resultTitle.textContent   = 'Kamu Menang!';
            resultSubtitle.textContent = 'Wih pinter 😎 ';
            launchConfetti();
        } else if (type === 'lose') {
            resultIcon.textContent    = '😏';
            resultTitle.textContent   = 'Kamu Kalah!';
            resultSubtitle.textContent = 'Masa kalah ? Coba lagi dong ! ';
        } else {
            resultIcon.textContent    = '🤝';
            resultTitle.textContent   = 'Seri!';
            resultSubtitle.textContent = 'Hmmm lumayan 😁';
        }
        // Trigger show after tiny delay so CSS transition fires
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resultOverlay.classList.add('show'));
        });
    }

    function hideResult() {
        resultOverlay.classList.remove('show');
        stopConfetti();
        setTimeout(() => {
            resultOverlay.className = 'result-overlay';
        }, 350);
    }

    resultCloseBtn.addEventListener('click', hideResult);

    // ─── Board Animations ────────────────────────────────────────────────────
    function highlightWinningCells(winCombo) {
        const cells = boardElement.querySelectorAll('.cell');
        winCombo.forEach((idx, i) => {
            setTimeout(() => {
                cells[idx].classList.add('winning');
            }, i * 120);
        });
    }

    function shakeBoard() {
        boardElement.classList.remove('shake');
        void boardElement.offsetWidth; // reflow
        boardElement.classList.add('shake');
        boardElement.addEventListener('animationend', () => {
            boardElement.classList.remove('shake');
        }, { once: true });
    }

    function drawPulseBoard() {
        boardElement.classList.remove('draw-pulse');
        void boardElement.offsetWidth;
        boardElement.classList.add('draw-pulse');
        boardElement.addEventListener('animationend', () => {
            boardElement.classList.remove('draw-pulse');
        }, { once: true });
    }

    // ─── Core Logic ──────────────────────────────────────────────────────────
    function checkWinner(boardToCheck, player) {
        for (let condition of winningConditions) {
            const [a, b, c] = condition;
            if (boardToCheck[a] === player && boardToCheck[b] === player && boardToCheck[c] === player) {
                return true;
            }
        }
        return false;
    }

    function getWinningCombo() {
        for (let condition of winningConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return condition;
            }
        }
        return null;
    }

    function getBestComputerMove() {
        const emptyIndices = board.reduce((acc, cell, idx) => cell === '' ? [...acc, idx] : acc, []);
        if (emptyIndices.length === 0) return null;

        for (let idx of emptyIndices) {
            const newBoard = [...board];
            newBoard[idx] = 'O';
            if (checkWinner(newBoard, 'O')) return idx;
        }

        for (let idx of emptyIndices) {
            const newBoard = [...board];
            newBoard[idx] = 'X';
            if (checkWinner(newBoard, 'X')) return idx;
        }

        const center = 4;
        if (emptyIndices.includes(center)) return center;

        const corners = [0, 2, 6, 8].filter(i => emptyIndices.includes(i));
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

        const edges = [1, 3, 5, 7].filter(i => emptyIndices.includes(i));
        return edges[Math.floor(Math.random() * edges.length)];
    }

    function createBoard() {
        boardElement.innerHTML = '';
        board.forEach((value, index) => {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (value === 'X') cell.classList.add('X');
            if (value === 'O') cell.classList.add('O');
            if (!gameActive || value !== '' || currentPlayer !== 'X') cell.classList.add('disabled');
            cell.dataset.index = index;
            cell.textContent = value;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        });
    }

    function checkResult() {
        const winCombo = getWinningCombo();

        if (winCombo) {
            const winner = board[winCombo[0]];
            gameActive = false;
            createBoard();

            if (winner === 'X') {
                statusElement.textContent = 'Next Game ?';
                resetBtn.style.display = 'none';
                nextBtn.style.display  = 'inline-block';
                setTimeout(() => {
                    highlightWinningCells(winCombo);
                    setTimeout(() => showResult('win'), 500);
                }, 100);
            } else {
                statusElement.textContent = 'Masa kalah ? 😏';
                resetBtn.style.display = 'inline-block';
                nextBtn.style.display  = 'none';
                setTimeout(() => {
                    highlightWinningCells(winCombo);
                    shakeBoard();
                    setTimeout(() => showResult('lose'), 700);
                }, 100);
            }
            return true;
        }

        if (!board.includes('')) {
            statusElement.textContent = 'Hasil seri 😁';
            gameActive = false;
            resetBtn.style.display = 'inline-block';
            nextBtn.style.display  = 'none';
            createBoard();
            setTimeout(() => {
                drawPulseBoard();
                setTimeout(() => showResult('draw'), 600);
            }, 100);
            return true;
        }

        resetBtn.style.display = 'inline-block';
        nextBtn.style.display  = 'none';
        return false;
    }

    function handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);
        if (board[index] !== '' || !gameActive || currentPlayer !== 'X') return;

        board[index] = currentPlayer;
        const ended = checkResult();

        if (!ended) {
            currentPlayer = 'O';
            statusElement.textContent = 'Giliran: Aku';
            createBoard();
            setTimeout(computerMove, 1000);
        }
    }

    function computerMove() {
        if (!gameActive || currentPlayer !== 'O') return;
        const bestMove = getBestComputerMove();
        if (bestMove !== null) board[bestMove] = 'O';

        const ended = checkResult();
        if (!ended) {
            currentPlayer = 'X';
            statusElement.textContent = 'Giliran: Kamu';
            createBoard();
        }
    }

    function resetGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        statusElement.textContent = 'Giliran: Kamu';
        resetBtn.style.display = 'inline-block';
        nextBtn.style.display  = 'none';
        hideResult();
        stopConfetti();
        createBoard();
    }

    nextBtn.addEventListener('click', () => {
        navigate('mole.html');
    });

    resetBtn.addEventListener('click', resetGame);
    createBoard();
});