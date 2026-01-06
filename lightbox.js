document.addEventListener("DOMContentLoaded", function() {
    
    // Seleciona APENAS links que tenham data-fancybox
    var links = document.querySelectorAll('a[data-fancybox]');

    links.forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            
            var url = el.href || el.getAttribute('data-src');
            var legenda = el.getAttribute('data-caption') || el.title || "";
            var tipo = "iframe"; // Padrão

            // --- DETECÇÃO ---

            // A. É IMAGEM? (Verifica extensão)
            if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                tipo = 'imagem';
            }
            // B. É YOUTUBE?
            else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                tipo = 'video';
            }
            // C. É WIKIPÉDIA?
            else if (url.includes('wikipedia.org')) {
                tipo = 'wiki';
            }

            // --- ABRIR LIGHTBOX ---
            abrirLightbox(tipo, url, legenda);
        });
    });
});

function abrirLightbox(tipo, url, legenda) {
    var overlay = document.getElementById('lightbox-overlay');
    var conteudo = document.getElementById('lightbox-conteudo');
    var boxLegenda = document.getElementById('lightbox-legenda');
    
    if (!overlay) return;

    overlay.classList.remove('lightbox-oculto');
    overlay.classList.add('lightbox-visivel');
    boxLegenda.textContent = "";
    
    // Limpa classes antigas para não herdar tamanho errado
    conteudo.className = ''; 

    if (tipo === 'imagem') {
        conteudo.classList.add('modo-imagem');
        // A imagem é inserida sem div em volta para não travar o tamanho
        conteudo.innerHTML = '<img src="' + url + '" class="img-zoom">';
        if(legenda) boxLegenda.textContent = legenda;
    }
    else if (tipo === 'video') {
        conteudo.classList.add('modo-video');
        var videoId = url.split('v=')[1] || url.split('/').pop();
        if(videoId.indexOf('&') > -1) videoId = videoId.split('&')[0];
        conteudo.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1" frameborder="0" allowfullscreen></iframe></div>';
    }
    else if (tipo === 'wiki') {
        conteudo.classList.add('modo-wiki');
        conteudo.innerHTML = '<div style="padding:20px; text-align:center">Carregando...</div>';
        
        var slug = url.split('/').pop();
        if(slug.includes('#')) slug = slug.split('#')[0];

        fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
        .then(res => res.json())
        .then(data => {
            var img = (data.thumbnail) ? '<img src="'+data.thumbnail.source+'" class="wiki-img">' : '';
            var txt = data.extract_html || data.extract || "Sem resumo.";
            conteudo.innerHTML = img + '<h2>'+data.title+'</h2><div>'+txt+'</div><br><a href="'+url+'" target="_blank" class="btn-wiki">Ler Mais &rarr;</a>';
        });
    }
    else {
        conteudo.classList.add('modo-iframe');
        conteudo.innerHTML = '<iframe src="' + url + '" style="width:100%; height:100%" frameborder="0"></iframe>';
    }
}

window.fecharLightbox = function(e) {
    if (e.target.id === 'lightbox-overlay' || e.target.className === 'lightbox-fechar') {
        var overlay = document.getElementById('lightbox-overlay');
        var conteudo = document.getElementById('lightbox-conteudo');
        overlay.classList.remove('lightbox-visivel');
        overlay.classList.add('lightbox-oculto');
        setTimeout(function(){ conteudo.innerHTML = ""; }, 300);
    }
};
