document.addEventListener("DOMContentLoaded", function() {
    
    // FILTRO: Só pega links que tenham data-fancybox
    var links = document.querySelectorAll('a[data-fancybox]');

    links.forEach(function(el) {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            
            var url = el.href || el.getAttribute('data-src');
            var legenda = el.getAttribute('data-caption') || el.title || "";
            var tipo = "iframe"; // Padrão se não for nada específico

            // --- DETECÇÃO SIMPLES ---
            if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                tipo = 'imagem';
            }
            else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                tipo = 'video';
            }
            else if (url.includes('wikipedia.org')) {
                tipo = 'wiki';
            }

            abrirLightbox(tipo, url, legenda);
        });
    });
});

function abrirLightbox(tipo, url, legenda) {
    var overlay = document.getElementById('lightbox-overlay');
    var conteudo = document.getElementById('lightbox-conteudo');
    var boxLegenda = document.getElementById('lightbox-legenda');
    
    // Limpa tudo para garantir que não tenha "lixo" de classes antigas
    overlay.className = 'lightbox-visivel'; // Remove oculto e põe visível
    conteudo.className = ''; // Remove classes de modo (video/wiki)
    conteudo.innerHTML = '';
    boxLegenda.textContent = '';

    // --- MODO IMAGEM (O Básico que funciona) ---
    if (tipo === 'imagem') {
        // Não coloca div em volta, nem define largura. Só a imagem pura.
        var img = document.createElement('img');
        img.src = url;
        img.className = 'img-zoom'; // Classe para o CSS limitar o tamanho máximo
        conteudo.appendChild(img);
        
        if (legenda) boxLegenda.textContent = legenda;
    }
    
    // --- MODO VÍDEO ---
    else if (tipo === 'video') {
        conteudo.className = 'modo-video'; // Ativa o fundo preto e tamanho fixo
        var videoId = url.split('v=')[1] || url.split('/').pop();
        if(videoId.indexOf('&') > -1) videoId = videoId.split('&')[0];
        conteudo.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1" frameborder="0" allowfullscreen></iframe></div>';
    }
    
    // --- MODO WIKI ---
    else if (tipo === 'wiki') {
        conteudo.className = 'modo-wiki'; // Ativa o fundo branco e tamanho fixo
        conteudo.innerHTML = '<div style="text-align:center; padding:20px;">Carregando...</div>';
        
        var slug = url.split('/').pop().split('#')[0];
        fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
        .then(res => res.json())
        .then(data => {
            var imgHtml = (data.thumbnail) ? '<img src="'+data.thumbnail.source+'" style="max-height:200px; display:block; margin:0 auto 15px auto">' : '';
            var texto = data.extract_html || data.extract || "Sem resumo.";
            conteudo.innerHTML = imgHtml + '<h2>'+data.title+'</h2><div>'+texto+'</div><br><a href="'+url+'" target="_blank" style="font-weight:bold;">Ler na Wikipédia &rarr;</a>';
        });
    }
    // --- IFRAME GENÉRICO ---
    else {
        conteudo.className = 'modo-iframe';
        conteudo.innerHTML = '<iframe src="' + url + '" style="width:100%; height:100%" frameborder="0"></iframe>';
    }
}

// Fechar
window.fecharLightbox = function(e) {
    if (e.target.id === 'lightbox-overlay' || e.target.className === 'lightbox-fechar') {
        document.getElementById('lightbox-overlay').className = 'lightbox-oculto';
        setTimeout(function(){ document.getElementById('lightbox-conteudo').innerHTML = ""; }, 300);
    }
};
