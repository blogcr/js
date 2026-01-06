document.addEventListener("DOMContentLoaded", function() {
    
    // 1. SELECIONA OS ELEMENTOS
    // Pega links manuais (data-fancybox) E imagens dentro do post (.post-body)
    var linksManuais = document.querySelectorAll('a[data-fancybox]');
    var imagensBlogger = document.querySelectorAll('.post-body img'); // Pega a tag <img> direto
    
    // Junta tudo numa lista só para facilitar
    var todosElementos = [...linksManuais, ...imagensBlogger];

    // 2. ADICIONA O CLIQUE EM CADA UM
    todosElementos.forEach(function(el) {
        
        // Se for imagem, coloca cursor de lupa
        if (el.tagName === 'IMG') { el.style.cursor = 'zoom-in'; }

        el.addEventListener('click', function(e) {
            // Previne o clique padrão (não abrir nova aba)
            e.preventDefault(); 
            
            // Descobre a URL (se for link 'a', pega o href; se for img, pega o src)
            // Se a imagem estiver dentro de um link do Blogger, pega o link do pai
            var url = el.href || el.src;
            if (el.parentElement.tagName === 'A' && el.tagName === 'IMG') {
                url = el.parentElement.href;
                e.preventDefault(); // Previne o pai também
            }
            
            var legenda = el.getAttribute('data-caption') || el.title || el.alt || "";
            var tipo = "imagem"; // Padrão

            // --- DETECÇÃO DO TIPO ---

            // É YouTube?
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                tipo = 'video';
            } 
            // É Wikipédia?
            else if (url.includes('wikipedia.org')) {
                tipo = 'wiki';
            }
            // É Link Genérico (com data-fancybox)?
            else if (el.tagName === 'A' && !url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                 // Se não é imagem e tem data-fancybox, é iframe
                 tipo = 'iframe';
            }

            // --- ABRIR A JANELA ---
            abrirJanela(tipo, url, legenda);
        });
    });
});

// FUNÇÃO QUE MONTA O CONTEÚDO (Separada para ficar organizado)
function abrirJanela(tipo, url, legenda) {
    var overlay = document.getElementById('lightbox-overlay');
    var conteudo = document.getElementById('lightbox-conteudo');
    var boxLegenda = document.getElementById('lightbox-legenda');

    // Mostra a tela preta
    overlay.classList.remove('lightbox-oculto');
    overlay.classList.add('lightbox-visivel');
    boxLegenda.textContent = "";

    if (tipo === 'video') {
        // Trata ID do YouTube
        var videoId = url.split('v=')[1] || url.split('/').pop();
        if(videoId.indexOf('&') > -1) videoId = videoId.split('&')[0];
        
        conteudo.className = 'modo-video';
        conteudo.innerHTML = '<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
        boxLegenda.textContent = legenda;
    }
    else if (tipo === 'wiki') {
        conteudo.className = 'modo-wiki';
        conteudo.innerHTML = '<div style="padding:20px; text-align:center">Carregando Enciclopédia...</div>';
        
        // Pega o final da URL (slug) para buscar na API
        var slug = url.split('/').pop(); 
        
        fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
            .then(res => res.json())
            .then(data => {
                var img = (data.thumbnail) ? '<img src="'+data.thumbnail.source+'" style="max-height:200px; display:block; margin:0 auto 15px auto">' : '';
                conteudo.innerHTML = img + '<h2>'+data.title+'</h2><p>'+(data.extract || "Resumo não disponível.")+'</p><br><a href="'+url+'" target="_blank" style="background:#ddd; padding:10px; text-decoration:none; color:#000; display:inline-block;">Ler Completo &rarr;</a>';
            });
    }
    else if (tipo === 'iframe') {
        conteudo.className = 'modo-iframe';
        conteudo.innerHTML = '<iframe src="' + url + '" style="width:100%; height:100%" frameborder="0"></iframe>';
    }
    else {
        // Imagem normal
        conteudo.className = 'modo-imagem';
        conteudo.innerHTML = '<img src="' + url + '" class="img-zoom">';
        boxLegenda.textContent = legenda;
    }
}

// FUNÇÃO DE FECHAR (Global)
window.fecharLightbox = function(e) {
    // Só fecha se clicar no fundo ou no X
    if (!e || e.target.id === 'lightbox-overlay' || e.target.className === 'lightbox-fechar') {
        var overlay = document.getElementById('lightbox-overlay');
        var conteudo = document.getElementById('lightbox-conteudo');
        
        overlay.classList.remove('lightbox-visivel');
        overlay.classList.add('lightbox-oculto');
        
        // Limpa (para parar o som do vídeo)
        setTimeout(function(){ conteudo.innerHTML = ""; }, 300);
    }
};
