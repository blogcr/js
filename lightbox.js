/* LIGHTBOX HÍBRIDO: IMAGENS + WIKIPÉDIA + GLOSSÁRIO (WIKCIONÁRIO) */

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

            // --- CASO 1: Links Manuais ---
            if (el.tagName === 'A' && el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                url = el.getAttribute('data-src') || el.href;
                legendaTexto = el.getAttribute('data-caption') || el.title || el.innerText || "";
                
                var tipoForcado = el.getAttribute('data-type');

                // 1.1 WIKIPÉDIA (Enciclopédia)
                if (url.includes('wikipedia.org')) {
                    tipo = 'wiki';
                }
                // 1.2 WIKCIONÁRIO (Dicionário - NOVO!)
                else if (url.includes('wiktionary.org')) {
                    tipo = 'dicio';
                }
                // 1.3 YOUTUBE
                else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    tipo = 'video';
                    var videoId = url.split('v=')[1] || url.split('/').pop();
                    if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                    url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                } 
                // 1.4 IMAGEM
                else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                    tipo = 'imagem';
                }
                // 1.5 OUTROS
                else if (tipoForcado === 'iframe' || !tipo) {
                    tipo = 'iframe';
                }
            } 
            // --- CASO 2: Imagens Soltas ---
            else if (el.tagName === 'IMG' && el.width > 100) {
                e.preventDefault();
                tipo = 'imagem';
                if (el.parentElement.tagName === 'A') { url = el.parentElement.href; } 
                else { url = el.src; }
                legendaTexto = el.alt;
            } else { return; }

            // --- ABRIR ---
            overlay.classList.remove('lightbox-oculto');
            overlay.classList.add('lightbox-visivel');
            legendaBox.textContent = ""; 
            conteudoBox.className = ''; 

            // --- RENDERIZAÇÃO ---

            if (tipo === 'video') {
                conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                conteudoBox.className = 'modo-video';
                legendaBox.textContent = legendaTexto;
            }
            
            // MODO ENCICLOPÉDIA (WIKIPÉDIA)
            else if (tipo === 'wiki') {
                conteudoBox.className = 'modo-wiki';
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px;">Consultando Enciclopédia...</div>';
                
                var slug = url.split('/').pop().split('#')[0];
                fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
                .then(res => res.json())
                .then(data => {
                    var imgHtml = (data.thumbnail) ? '<img src="'+data.thumbnail.source+'" style="max-height:200px; display:block; margin:0 auto 15px auto; border-radius:4px;">' : '';
                    var texto = data.extract_html || data.extract || "Resumo indisponível.";
                    conteudoBox.innerHTML = imgHtml + '<h2>'+data.title+'</h2><div>'+texto+'</div><a href="'+url+'" target="_blank" class="btn-wiki">Ler completo na Wikipédia &rarr;</a>';
                })
                .catch(err => { conteudoBox.innerHTML = '<p>Erro ao carregar resumo.</p><a href="'+url+'" target="_blank" class="btn-wiki">Abrir página</a>'; });
            }

            // MODO DICIONÁRIO (WIKCIONÁRIO) - A NOVIDADE
            else if (tipo === 'dicio') {
                conteudoBox.className = 'modo-wiki'; // Usa o mesmo estilo elegante da Wiki
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px;">Consultando Dicionário...</div>';
                
                // Extrai a palavra correta
                var termo = decodeURIComponent(url.split('/').pop().split('#')[0]).replace(/_/g, ' ');

                // Busca usando a API nativa do MediaWiki (mais robusta para dicionários)
                fetch('https://pt.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&origin=*&titles=' + termo)
                .then(res => res.json())
                .then(data => {
                    var pages = data.query.pages;
                    var pageId = Object.keys(pages)[0];
                    var extract = pages[pageId].extract;

                    if (pageId == -1 || !extract) {
                         conteudoBox.innerHTML = '<h2>'+termo+'</h2><p>Definição não encontrada no resumo.</p><a href="'+url+'" target="_blank" class="btn-wiki">Ver no Wikcionário &rarr;</a>';
                    } else {
                        // Formata o texto para ficar bonito (quebras de linha)
                        var definicaoFormatada = extract.replace(/\n/g, '<br><br>');
                        conteudoBox.innerHTML = '<h2 style="color:#d32f2f;">'+termo+'</h2><div style="font-style:italic; color:#555;">Definição:</div><div style="margin-top:10px;">'+definicaoFormatada+'</div><a href="'+url+'" target="_blank" class="btn-wiki">Ver conjugação/detalhes &rarr;</a>';
                    }
                })
                .catch(err => { conteudoBox.innerHTML = '<p>Erro ao consultar o dicionário.</p><a href="'+url+'" target="_blank" class="btn-wiki">Abrir página</a>'; });
            }

            else if (tipo === 'iframe') {
                conteudoBox.innerHTML = '<iframe src="' + url + '" class="iframe-site" frameborder="0"></iframe>';
                conteudoBox.className = 'modo-iframe';
                legendaBox.textContent = legendaTexto;
            } 
            else { 
                // Imagem
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
