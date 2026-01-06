document.addEventListener("DOMContentLoaded", function() {
    // 1. SELEÇÃO INTELIGENTE
    // Seleciona links manuais (data-fancybox)
    var linksManuais = document.querySelectorAll('a[data-fancybox]');
    
    // Seleciona links automáticos de imagens (Blogger padrão)
    // Procura qualquer <a> dentro do post que aponte para uma imagem
    var linksImagensBlogger = document.querySelectorAll('.post-body a[href$=".jpg"], .post-body a[href$=".jpeg"], .post-body a[href$=".png"], .post-body a[href$=".gif"], .post-body a[href$=".webp"], .post-body a[href$=".bmp"]');

    // Junta tudo numa lista só
    var elementos = [...linksManuais, ...linksImagensBlogger];

    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    var legendaBox = document.getElementById('lightbox-legenda');

    elementos.forEach(function(el) {
        
        // Adiciona cursor de lupa se for imagem
        // (Verifica se é um link de imagem ou se contém uma imagem dentro)
        if (el.href && el.href.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
             el.style.cursor = 'zoom-in';
        }

        el.addEventListener('click', function(e) {
            var url = el.href || el.getAttribute('data-src');
            
            // Se o link não tiver URL, para por aqui
            if (!url) return;

            var tipo = "";
            var legendaTexto = el.getAttribute('data-caption') || el.title || "";
            
            // Se não achou legenda no link, tenta achar na imagem dentro dele (padrão Blogger)
            if (!legendaTexto) {
                var imgFilha = el.querySelector('img');
                if (imgFilha) legendaTexto = imgFilha.alt;
            }

            // --- CLASSIFICAÇÃO DO CONTEÚDO ---
            
            // 1. YOUTUBE
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                e.preventDefault();
                tipo = 'video';
                var videoId = url.split('v=')[1] || url.split('/').pop();
                if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
            } 
            
            // 2. WIKIPÉDIA (API) - Sua nova funcionalidade
            else if (url.includes('wikipedia.org')) {
                e.preventDefault();
                tipo = 'wiki-api';
            }
            
            // 3. IMAGEM (Detecta pela extensão do arquivo no link)
            else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                e.preventDefault();
                tipo = 'imagem';
            }
            
            // 4. IFRAME GENÉRICO (Só abre se tiver data-fancybox explícito)
            else if (el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                tipo = 'iframe';
            }
            
            // Se for um link comum (ex: link para o Google) sem data-fancybox,
            // o script ignora e deixa abrir normal.

            if (tipo !== "") {
                // ABRIR LIGHTBOX
                overlay.classList.remove('lightbox-oculto');
                overlay.classList.add('lightbox-visivel');
                legendaBox.textContent = "";

                // --- RENDERIZAÇÃO ---
                
                if (tipo === 'video') {
                    conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                    conteudoBox.className = 'modo-video';
                    legendaBox.textContent = legendaTexto;
                } 
                
                else if (tipo === 'wiki-api') {
                    conteudoBox.innerHTML = '<div style="color:#333; padding:2rem; background:#fff; border-radius:8px;">Consultando a Enciclopédia...</div>';
                    conteudoBox.className = 'modo-wiki';
                    
                    var partes = url.split('/wiki/');
                    var slug = partes[1] || "";
                    if(slug.indexOf('#') > -1) slug = slug.split('#')[0];

                    fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
                    .then(response => response.json())
                    .then(data => {
                        var imagemHTML = "";
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
                        conteudoBox.innerHTML = '<div style="padding:2rem; background:#fff;">Não foi possível carregar o resumo.<br><br><a href="'+url+'" target="_blank" class="btn-ler-wiki">Abrir Página</a></div>';
                    });
                }
                
                else if (tipo === 'iframe') {
                    conteudoBox.innerHTML = '<iframe src="' + url + '" class="iframe-site" frameborder="0"></iframe>';
                    conteudoBox.className = 'modo-iframe';
                } 
                
                else { // IMAGEM
                    conteudoBox.innerHTML = '<img src="' + url + '" class="img-zoom">';
                    conteudoBox.className = 'modo-imagem';
                    legendaBox.textContent = legendaTexto;
                }
            }
        });
    });
});
