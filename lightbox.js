/* LIGHTBOX V4: BLINDADO + WIKI + GLOSSÁRIO (CORRIGIDO) */

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

            // --- CASO 1: Links Manuais ---
            if (el.tagName === 'A' && el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                url = el.getAttribute('data-src') || el.href;
                legendaTexto = el.getAttribute('data-caption') || el.title || el.innerText || "";
                
                var tipoForcado = el.getAttribute('data-type');

                if (url.includes('wikipedia.org')) { tipo = 'wiki'; }
                else if (url.includes('wiktionary.org')) { tipo = 'dicio'; }
                else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    tipo = 'video';
                    var videoId = url.split('v=')[1] || url.split('/').pop();
                    if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                    url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                } 
                else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) { tipo = 'imagem'; }
                else { tipo = 'iframe'; }
            } 
            
            // --- CASO 2: Imagens Soltas (Proteção de Link) ---
            else if (el.tagName === 'IMG' && el.width > 100) {
                var linkPai = el.closest('a');
                if (linkPai) {
                    var linkDestino = linkPai.href;
                    // Verifica se o link é mídia ou navegação
                    var ehMidia = linkDestino.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || 
                                  linkDestino.includes('youtube') || 
                                  linkDestino.includes('wikipedia') || 
                                  linkDestino.includes('wiktionary') ||
                                  linkPai.hasAttribute('data-fancybox');
                    
                    if (!ehMidia) { return; } // É navegação, deixa passar
                    url = linkDestino;
                } else {
                    url = el.src;
                }
                e.preventDefault();
                tipo = 'imagem';
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
            
            // WIKIPÉDIA
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

            // WIKCIONÁRIO (CORRIGIDO: Busca mais texto)
            else if (tipo === 'dicio') { 
                conteudoBox.className = 'modo-wiki'; 
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px;">Consultando Dicionário...</div>';
                var termo = decodeURIComponent(url.split('/').pop().split('#')[0]).replace(/_/g, ' ');
                
                // MUDANÇA AQUI: exchars=1000 em vez de exintro
                fetch('https://pt.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&explaintext&exchars=1000&origin=*&titles=' + termo)
                .then(res => res.json())
                .then(data => {
                    var pages = data.query.pages;
                    var pageId = Object.keys(pages)[0];
                    var extract = pages[pageId].extract;

                    if (pageId == -1 || !extract) {
                         conteudoBox.innerHTML = '<h2>'+termo+'</h2><p>Definição complexa. Clique abaixo.</p><a href="'+url+'" target="_blank" class="btn-wiki">Ver no Wikcionário &rarr;</a>';
                    } else {
                        // Limpa um pouco o texto cru
                        var definicaoFormatada = extract.replace(/\n/g, '<br><br>');
                        conteudoBox.innerHTML = '<h2 style="color:#d32f2f;">'+termo+'</h2><div style="font-style:italic; color:#555; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:10px;">Definição Rápida:</div><div style="font-size:0.95rem; line-height:1.5;">'+definicaoFormatada+'</div><a href="'+url+'" target="_blank" class="btn-wiki">Ver conjugação/detalhes &rarr;</a>';
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
