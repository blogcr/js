document.addEventListener("DOMContentLoaded", function() {
    var elementos = document.querySelectorAll('a[data-fancybox], .post-body img');
    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    var legendaBox = document.getElementById('lightbox-legenda');

    elementos.forEach(function(el) {
        // Cursor de lupa em imagens soltas
        if (el.tagName === 'IMG' && el.width > 100) { el.style.cursor = 'zoom-in'; }

        el.addEventListener('click', function(e) {
            var url = "";
            var tipo = "";
            var legendaTexto = "";

            // --- LINKS (VÍDEO OU WIKI) ---
            if (el.tagName === 'A' && el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                url = el.getAttribute('data-src') || el.href;
                legendaTexto = el.getAttribute('data-caption') || el.title || el.innerText || "";
                
                // DETECÇÃO: YOUTUBE
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    tipo = 'video';
                    var videoId = url.split('v=')[1] || url.split('/').pop();
                    if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                    url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                } 
                // DETECÇÃO: WIKIPÉDIA (NOVA LÓGICA API)
                else if (url.includes('wikipedia.org')) {
                    tipo = 'wiki-api';
                }
                // DETECÇÃO: IMAGEM DIRETA
                else if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null) {
                    tipo = 'imagem';
                }
                // RESTO (IFRAME GERAL)
                else {
                    tipo = 'iframe';
                }
            } 
            // --- IMAGENS SOLTAS ---
            else if (el.tagName === 'IMG' && el.width > 100) {
                e.preventDefault();
                tipo = 'imagem';
                if (el.parentElement.tagName === 'A') { url = el.parentElement.href; } 
                else { url = el.src; }
                legendaTexto = el.alt;
            } else { return; }

            // ABRIR LIGHTBOX
            overlay.classList.remove('lightbox-oculto');
            overlay.classList.add('lightbox-visivel');
            legendaBox.textContent = ""; // Limpa legenda padrão

            // --- INJEÇÃO DE CONTEÚDO ---
            
            if (tipo === 'video') {
                conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                conteudoBox.className = 'modo-video';
                legendaBox.textContent = legendaTexto;
            } 
            
            else if (tipo === 'wiki-api') {
                // Efeito de "Carregando..."
                conteudoBox.innerHTML = '<div style="color:#fff; padding:20px;">Consultando a Enciclopédia...</div>';
                conteudoBox.className = 'modo-wiki'; // Usa o CSS novo
                
                // 1. Extrai o "Slug" (ex: John_Lennon)
                var partes = url.split('/wiki/');
                var slug = partes[1] || "";
                // Remove âncoras (#Historia) se houver
                if(slug.indexOf('#') > -1) slug = slug.split('#')[0];

                // 2. Consulta a API da Wikipédia
                fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
                .then(response => response.json())
                .then(data => {
                    var imagemHTML = "";
                    // Se tiver foto, mostra
                    if (data.thumbnail && data.thumbnail.source) {
                        imagemHTML = '<img src="' + data.thumbnail.source + '" class="wiki-imagem-topo" style="display:block;">';
                    }
                    
                    var htmlFinal = `
                        ${imagemHTML}
                        <h2>${data.title}</h2>
                        <div class="wiki-resumo">${data.extract_html || data.extract}</div>
                        <a href="${url}" target="_blank" class="btn-ler-wiki">Ler artigo completo na Wikipédia &#8594;</a>
                    `;
                    conteudoBox.innerHTML = htmlFinal;
                })
                .catch(err => {
                    conteudoBox.innerHTML = '<p>Não foi possível carregar o resumo.</p><a href="'+url+'" target="_blank" class="btn-ler-wiki">Abrir Página</a>';
                });
            }

            else if (tipo === 'iframe') {
                conteudoBox.innerHTML = '<iframe src="' + url + '" class="iframe-site" frameborder="0"></iframe>';
                conteudoBox.className = 'modo-iframe';
                legendaBox.textContent = legendaTexto;
            } 
            
            else { // Imagem
                conteudoBox.innerHTML = '<img src="' + url + '" class="img-zoom">';
                conteudoBox.className = 'modo-imagem';
                legendaBox.textContent = legendaTexto;
            }
        });
    });
});
