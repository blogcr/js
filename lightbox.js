document.addEventListener("DOMContentLoaded", function() {
    var elementos = document.querySelectorAll('a[data-fancybox], .post-body img');
    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    var legendaBox = document.getElementById('lightbox-legenda');

    elementos.forEach(function(el) {
        // Cursor de lupa para imagens
        if (el.tagName === 'IMG' && el.width > 100) { el.style.cursor = 'zoom-in'; }

        el.addEventListener('click', function(e) {
            var url = "";
            var tipo = "";
            var legendaTexto = "";

            // --- CASO 1: Links Manuais (data-fancybox) ---
            if (el.tagName === 'A' && el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                url = el.getAttribute('data-src') || el.href;
                legendaTexto = el.getAttribute('data-caption') || el.title || el.innerText || "";
                
                var tipoForcado = el.getAttribute('data-type');

                // 1.1 WIKIPÉDIA (MODO API - O NOVO RECURSO)
                if (url.includes('wikipedia.org')) {
                    tipo = 'wiki';
                }
                // 1.2 VÍDEO (YouTube)
                else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    tipo = 'video';
                    var videoId = url.split('v=')[1] || url.split('/').pop();
                    if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                    url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                } 
                // 1.3 IMAGEM (Detecção por extensão)
                else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                    tipo = 'imagem';
                }
                // 1.4 IFRAME COMUM (Para outros sites)
                else if (tipoForcado === 'iframe' || !tipo) {
                    tipo = 'iframe';
                }
            } 
            // --- CASO 2: Imagens Soltas (SEU CÓDIGO ORIGINAL MANTIDO) ---
            else if (el.tagName === 'IMG' && el.width > 100) {
                e.preventDefault();
                tipo = 'imagem';
                if (el.parentElement.tagName === 'A') { url = el.parentElement.href; } 
                else { url = el.src; }
                legendaTexto = el.alt;
            } else { return; }

            // --- EXIBIR LIGHTBOX ---
            overlay.classList.remove('lightbox-oculto');
            overlay.classList.add('lightbox-visivel');
            legendaBox.textContent = ""; 
            
            // Limpa classes anteriores
            conteudoBox.className = ''; 

            // RENDERIZAÇÃO
            if (tipo === 'video') {
                conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                conteudoBox.className = 'modo-video';
                legendaBox.textContent = legendaTexto;
            } 
            else if (tipo === 'wiki') {
                // Modo Inteligente da Wikipédia
                conteudoBox.className = 'modo-wiki';
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px;">Carregando Enciclopédia...</div>';
                
                // Extrai o nome do artigo da URL
                var slug = url.split('/').pop().split('#')[0];
                
                // Busca o resumo
                fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
                .then(res => res.json())
                .then(data => {
                    var imgHtml = (data.thumbnail) ? '<img src="'+data.thumbnail.source+'" style="max-height:200px; display:block; margin:0 auto 15px auto; border-radius:4px;">' : '';
                    var texto = data.extract_html || data.extract || "Resumo indisponível.";
                    conteudoBox.innerHTML = imgHtml + '<h2>'+data.title+'</h2><div>'+texto+'</div><a href="'+url+'" target="_blank" class="btn-wiki">Ler completo na Wikipédia &rarr;</a>';
                })
                .catch(err => {
                    conteudoBox.innerHTML = '<p>Erro ao carregar resumo.</p><a href="'+url+'" target="_blank" class="btn-wiki">Abrir página</a>';
                });
            } 
            else if (tipo === 'iframe') {
                conteudoBox.innerHTML = '<iframe src="' + url + '" class="iframe-site" frameborder="0"></iframe>';
                conteudoBox.className = 'modo-iframe';
                legendaBox.textContent = legendaTexto;
            } 
            else { 
                // Modo Imagem (Igual ao seu original)
                conteudoBox.innerHTML = '<img src="' + url + '" class="img-zoom">';
                conteudoBox.className = 'modo-imagem';
                legendaBox.textContent = legendaTexto;
            }
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
