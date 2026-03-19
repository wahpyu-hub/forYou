/* ── Typewriter Effect ───────────────────────────────── */
const title   = document.querySelector('.title');
const message = 'Kreator punya pesan yang ingin di sampaikan';

// Styling container
title.style.display        = 'flex';
title.style.flexWrap       = 'wrap';
title.style.justifyContent = 'center';
title.style.alignItems     = 'center';
title.style.gap            = '0';

// Cursor
const cursor = document.createElement('span');
cursor.classList.add('cursor');
cursor.textContent = '|';
title.appendChild(cursor);

let i = 0;

function typeWriter() {
    if (i < message.length) {
        const char = message[i];

        if (char === ' ') {
            const space = document.createElement('span');
            space.innerHTML = '&nbsp;';
            space.classList.add('typed-space');
            title.insertBefore(space, cursor);
        } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.classList.add('typed-char');
            title.insertBefore(span, cursor);
        }

        i++;
        // 120ms per karakter — lebih lambat, enak dibaca
        setTimeout(typeWriter, 120);
    } else {
        cursor.classList.add('blink');
    }
}

// Tunda 1 detik sebelum mulai mengetik
setTimeout(typeWriter, 1000);
