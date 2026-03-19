function navigate(url) {
    document.body.classList.add('fade-out');
    setTimeout(function() {
        window.location.href = url;
    }, 300);
}

window.addEventListener('pageshow', function() {
    document.body.classList.remove('fade-out');
});

