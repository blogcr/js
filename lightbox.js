/* LIGHTBOX BLINDADO: CORREÇÃO DE LINKS + GLOSSÁRIO + WIKI */

document.addEventListener("DOMContentLoaded", function() {
    // Seleciona links manuais e todas as imagens do corpo do post
    var elementos = document.querySelectorAll('a[data-fancybox], .post-body img');
    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    var legendaBox = document.getElementById('lightbox-legenda');

    elementos.forEach(function(el) {
        // Cursor de lupa apenas para imagens que vão abrir (tratado abaixo)
        if (el.tagName === 'IMG' && el.width > 100) { el.style.cursor = 'zoom-in'; }

        el.addEventListener('click', function(e) {
            var url = "";
            var tipo = "";
            var legendaTexto = "";

            // --- CASO 1: Links Manuais (Com data-fancybox) ---
            if (el.tagName === 'A' && el.hasAttribute('data-fancybox')) {
                e.preventDefault();
                url = el.getAttribute('data-src') || el.href;
                legendaTexto = el.getAttribute('data-caption') || el.title || el.innerText || "";
                var tipoForcado = el.getAttribute('data-type');

                if (url.includes('wikipedia.org')) { tipo = 'wiki'; }
                else if (url.includes('wiktionary.org')) { tipo = 'dicio'; } // NOVO
                else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    tipo = 'video';
                    var videoId = url.split('v=')[1] || url.split('/').pop();
                    if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
                    url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
                } 
                else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) { tipo = 'imagem'; }
                else { tipo = 'iframe'; }
            } 
            
            // --- CASO 2: Imagens Soltas (AQUI ESTÁ A CORREÇÃO) ---
            else if (el.tagName === 'IMG' && el.width > 100) {
                
                // VERIFICAÇÃO DE SEGURANÇA:
                // Se a imagem tem um link pai, verificamos para onde ele vai.
                var linkPai = el.closest('a');
                if (linkPai) {
                    var linkDestino = linkPai.href;
                    
                    // É link de mídia (foto, video, wiki)?
                    var ehMidia = linkDestino.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || 
                                  linkDestino.includes('youtube') || 
                                  linkDestino.includes('wikipedia') || 
                                  linkDestino.includes('wiktionary') ||
                                  linkPai.hasAttribute('data-fancybox');
                    
                    // Se NÃO for mídia (ex: é link para um post do blog), PARE TUDO.
                    if (!ehMidia) {
                        return; // Deixa o clique acontecer normalmente (navegar)
                    }
                    
                    // Se for mídia, pegamos a URL dela
                    url = linkDestino;
                } else {
                    // Se não tem link, é só a imagem mesmo
                    url = el.src;
                }

                e.preventDefault(); // Agora sim, bloqueamos e abrimos o lightbox
                tipo = 'imagem';
                legendaTexto = el.alt;
            } else { return; }

            // --- ABRIR LIGHTBOX ---
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
            else if (tipo === 'wiki') { // Enciclopédia
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
            else if (tipo === 'dicio') { // Dicionário (Wikcionário)
                conteudoBox.className = 'modo-wiki'; 
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px;">Consultando Dicionário...</div>';
                var termo = decodeURIComponent(url.split('/').pop().split('#')[0]).replace(/_/g, ' ');
                fetch('https://pt.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&origin=*&titles=' + termo)
                .then(res => res.json())
                .then(data => {
                    var pages = data.query.pages;
                    var pageId = Object.keys(pages)[0];
                    var extract = pages[pageId].extract;
                    if (pageId == -1 || !extract) {
                         conteudoBox.innerHTML = '<h2>'+termo+'</h2><p>Definição não encontrada no resumo.</p><a href="'+url+'" target="_blank" class="btn-wiki">Ver no Wikcionário &rarr;</a>';
                    } else {
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
            else { // Imagem
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
