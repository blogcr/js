document.addEventListener('click', function(e) {
    // 1. Procura se o clique foi num link (ou imagem dentro de link)
    var link = e.target.closest('a');
    
    // Se não for link, ou se o link não tiver href, ignora
    if (!link || !link.href) return;

    var url = link.href;
    var tipo = "";
    var legenda = link.getAttribute('data-caption') || link.title || "";
    
    // Tenta achar legenda na imagem interna se não tiver no link
    if (!legenda) {
        var img = link.querySelector('img');
        if (img) legenda = img.alt;
    }

    // --- DETECÇÃO ---

    // A. É IMAGEM? (Verifica extensão do link)
    // Isso resolve o problema das fotos automáticas do Blogger
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
    // D. É GENÉRICO? (Só se tiver data-fancybox)
    else if (link.hasAttribute('data-fancybox')) {
        tipo = 'iframe';
    }

    // --- AÇÃO ---
    if (tipo !== "") {
        e.preventDefault(); // Impede abrir nova aba
        abrirLightbox(tipo, url, legenda);
    }
});

function abrirLightbox(tipo, url, legenda) {
    var overlay = document.getElementById('lightbox-overlay');
    var conteudo = document.getElementById('lightbox-conteudo');
    var boxLegenda = document.getElementById('lightbox-legenda');
    
    if (!overlay) return; // Segurança

    overlay.classList.remove('lightbox-oculto');
    overlay.classList.add('lightbox-visivel');
    boxLegenda.textContent = "";

    if (tipo === 'imagem') {
        conteudo.className = 'modo-imagem';
        // Remove limitação de tamanho fixo para a imagem crescer
        conteudo.innerHTML = '<img src="' + url + '" class="img-zoom">';
        boxLegenda.textContent = legenda;
    }
    else if (tipo === 'video') {
        conteudo.className = 'modo-video';
        var videoId = url.split('v=')[1] || url.split('/').pop();
        if(videoId.indexOf('&') > -1) videoId = videoId.split('&')[0];
        conteudo.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1" frameborder="0" allowfullscreen></iframe></div>';
    }
    else if (tipo === 'wiki') {
        conteudo.className = 'modo-wiki';
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
        conteudo.className = 'modo-iframe';
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
