document.addEventListener("DOMContentLoaded", function() {
    var elementos = document.querySelectorAll('a[data-fancybox], .post-body img');
    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    var legendaBox = document.getElementById('lightbox-legenda');

    elementos.forEach(function(el) {
        if (el.tagName === 'IMG' && el.width > 100) { el.style.cursor = 'zoom-in'; }

        el.addEventListener('click', function(e) {
            var url = "";
            var tipo = "";
            var legendaTexto = "";

            if (el.tagName === 'A' && el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                url = el.getAttribute('data-src') || el.href;
                legendaTexto = el.getAttribute('data-caption') || el.title || el.innerText || "";
                
                var tipoForcado = el.getAttribute('data-type');

                if (tipoForcado === 'iframe' || (!url.includes('youtube') && !url.match(/\.(jpeg|jpg|gif|png|webp)$/i))) {
                    tipo = 'iframe';
                    if (url.includes('wikipedia.org') && !url.includes('.m.wikipedia.org')) {
                        url = url.replace('wikipedia.org', 'm.wikipedia.org');
                    }
                } 
                else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    tipo = 'video';
                    var videoId = url.split('v=')[1] || url.split('/').pop();
                    var ampersandPosition = videoId.indexOf('&');
                    if(ampersandPosition != -1) { videoId = videoId.substring(0, ampersandPosition); }
                    url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                } 
                else {
                    tipo = 'imagem';
                }
            } 
            else if (el.tagName === 'IMG' && el.width > 100) {
                e.preventDefault();
                tipo = 'imagem';
                if (el.parentElement.tagName === 'A') { url = el.parentElement.href; } 
                else { url = el.src; }
                legendaTexto = el.alt;
            } else { return; }

            overlay.classList.remove('lightbox-oculto');
            overlay.classList.add('lightbox-visivel');
            
            if (tipo === 'video') {
                conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                conteudoBox.className = 'modo-video';
            } else if (tipo === 'iframe') {
                conteudoBox.innerHTML = '<iframe src="' + url + '" class="iframe-site" frameborder="0"></iframe>';
                conteudoBox.className = 'modo-iframe';
            } else {
                conteudoBox.innerHTML = '<img src="' + url + '" class="img-zoom">';
                conteudoBox.className = 'modo-imagem';
            }
            legendaBox.textContent = legendaTexto;
        });
    });
});

function fecharLightbox(e) {
    if (e.target.id === 'lightbox-overlay' || e.target.classList.contains('lightbox-fechar')) {
        var overlay = document.getElementById('lightbox-overlay');
        var conteudoBox = document.getElementById('lightbox-conteudo');
        overlay.classList.remove('lightbox-visivel');
        overlay.classList.add('lightbox-oculto');
        setTimeout(function(){ conteudoBox.innerHTML = ''; }, 300);
    }
}
