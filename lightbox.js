document.addEventListener("DOMContentLoaded", function() {
    
    // 1. SELEÇÃO ABRANGENTE (Imagens do Blogger + Links Manuais)
    // Procura qualquer link que termine em imagem OU tenha data-fancybox
    // O seletor foi simplificado para garantir que pegue tudo
    var seletores = [
        'a[data-fancybox]',
        '.post-body a[href$=".jpg"]', 
        '.post-body a[href$=".jpeg"]', 
        '.post-body a[href$=".png"]', 
        '.post-body a[href$=".gif"]', 
        '.post-body a[href$=".webp"]'
    ];
    
    var elementos = document.querySelectorAll(seletores.join(', '));
    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    var legendaBox = document.getElementById('lightbox-legenda');

    elementos.forEach(function(el) {
        
        // Adiciona cursor de lupa se for link de imagem
        if (el.href && el.href.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
             el.style.cursor = 'zoom-in';
        }

        // --- O SEGREDO ESTÁ AQUI: O "true" NO FINAL ---
        // Isso ativa o modo de Captura, garantindo que este script rode antes do antigo
        el.addEventListener('click', function(e) {
            
            var url = el.href || el.getAttribute('data-src');
            if (!url) return;

            // Variáveis de decisão
            var tipo = "";
            var legendaTexto = el.getAttribute('data-caption') || el.title || "";
            
            // Tenta pegar legenda da imagem interna (padrão do Blogger)
            if (!legendaTexto) {
                var imgFilha = el.querySelector('img');
                if (imgFilha) legendaTexto = imgFilha.alt;
            }

            // --- DETECÇÃO DO TIPO ---

            // 1. WIKIPÉDIA (Prioridade Alta)
            if (url.includes('wikipedia.org')) {
                tipo = 'wiki-api';
            }
            // 2. YOUTUBE
            else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                tipo = 'video';
                var videoId = url.split('v=')[1] || url.split('/').pop();
                if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
            }
            // 3. IMAGEM (Detecção automática pela extensão)
            else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                tipo = 'imagem';
            }
            // 4. IFRAME MANUAL (Só se tiver data-fancybox e não for os de cima)
            else if (el.hasAttribute('data-fancybox')) {
                tipo = 'iframe';
            }

            // Se encontrou um tipo válido, ABRE O LIGHTBOX e MATA O ANTIGO
            if (tipo !== "") {
                e.preventDefault();
                e.stopPropagation(); // Impede que o evento suba
                e.stopImmediatePropagation(); // MATA o script antigo do Fancybox na hora!

                overlay.classList.remove('lightbox-oculto');
                overlay.classList.add('lightbox-visivel');
                legendaBox.textContent = ""; // Limpa anterior

                // --- INJEÇÃO DE CONTEÚDO ---

                if (tipo === 'wiki-api') {
                    conteudoBox.innerHTML = '<div style="color:#333; padding:2rem; background:#fff; border-radius:8px; text-align:center;">Consultando a Enciclopédia...</div>';
                    conteudoBox.className = 'modo-wiki';
                    
                    // Limpeza da URL para pegar o slug correto
                    var slug = "";
                    try {
                        // Pega a última parte da URL (ex: John_Lennon)
                        var urlObj = new URL(url);
                        var pathParts = urlObj.pathname.split('/');
                        slug = pathParts[pathParts.length - 1]; 
                    } catch(err) {
                        slug = url.split('/').pop();
                    }
                    if(slug.indexOf('#') > -1) slug = slug.split('#')[0];

                    // Chama a API
                    fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
                    .then(response => {
                        if (!response.ok) throw new Error('Erro na API');
                        return response.json();
                    })
                    .then(data => {
                        var imagemHTML = "";
                        if (data.thumbnail && data.thumbnail.source) {
                            imagemHTML = '<img src="' + data.thumbnail.source + '" class="wiki-imagem-topo" style="display:block; margin: 0 auto 1rem auto; max-height:200px;">';
                        }
                        var extract = data.extract_html || data.extract || "Resumo indisponível.";
                        
                        var htmlFinal = `
                            ${imagemHTML}
                            <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px;">${data.title}</h2>
                            <div class="wiki-resumo" style="text-align:left; line-height:1.6; font-family:serif;">${extract}</div>
                            <div style="margin-top:20px; text-align:center;">
                                <a href="${url}" target="_blank" class="btn-ler-wiki" style="display:inline-block; background:#f0f0f0; color:#333; padding:10px 20px; text-decoration:none; border-radius:4px; font-weight:bold;">Ler artigo completo na Wikipédia &#8594;</a>
                            </div>
                        `;
                        conteudoBox.innerHTML = htmlFinal;
                    })
                    .catch(err => {
                        // Fallback elegante se a API falhar
                        conteudoBox.innerHTML = '<div style="padding:2rem; background:#fff; text-align:center;"><p>Não foi possível carregar o resumo automático.</p><a href="'+url+'" target="_blank" style="text-decoration:underline;">Clique aqui para abrir a página na Wikipédia</a></div>';
                    });
                }
                
                else if (tipo === 'video') {
                    conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                    conteudoBox.className = 'modo-video';
                    legendaBox.textContent = legendaTexto;
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

        }, true); // <--- O "true" aqui garante a prioridade sobre o script antigo
    });
});
