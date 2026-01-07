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

            // --- CASO 1: Links Manuais (data-fancybox) ---
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
            
            // --- CASO 2: Imagens Soltas (Proteção contra Links de Navegação) ---
            else if (el.tagName === 'IMG' && el.width > 100) {
                var linkPai = el.closest('a');
                if (linkPai) {
                    var linkDestino = linkPai.href;
                    var ehMidia = linkDestino.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || 
                                  linkDestino.includes('youtube') || 
                                  linkDestino.includes('wikipedia') || 
                                  linkDestino.includes('wiktionary') ||
                                  linkPai.hasAttribute('data-fancybox');
                    if (!ehMidia) { return; } 
                    url = linkDestino;
                } else { url = el.src; }
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
            // WIKIPÉDIA (Resumo API)
            else if (tipo === 'wiki') { 
                conteudoBox.className = 'modo-wiki';
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Consultando Enciclopédia...</div>';
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
            // WIKCIONÁRIO (Parser HTML Limpo)
            else if (tipo === 'dicio') { 
                conteudoBox.className = 'modo-wiki'; 
                conteudoBox.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Consultando Dicionário...</div>';
                var termo = decodeURIComponent(url.split('/').pop().split('#')[0]).replace(/_/g, ' ');
                fetch('https://pt.wiktionary.org/w/api.php?action=parse&format=json&prop=text&mobileformat=1&origin=*&page=' + termo)
                .then(res => res.json())
                .then(data => {
                    if (!data.parse || !data.parse.text) {
                         conteudoBox.innerHTML = '<h2>'+termo+'</h2><p>Definição não encontrada.</p><a href="'+url+'" target="_blank" class="btn-wiki">Ver no site &rarr;</a>';
                         return;
                    }
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.parse.text['*'];
                    var primeiraDefinicao = tempDiv.querySelector('ol');
                    
                    if (primeiraDefinicao) {
                        var links = primeiraDefinicao.querySelectorAll('a');
                        links.forEach(l => { l.style.textDecoration = 'none'; l.style.color = '#333'; l.style.pointerEvents = 'none'; });
                        conteudoBox.innerHTML = '<h2 style="color:#d32f2f; border-bottom:1px solid #eee; padding-bottom:10px;">'+termo+'</h2>' +
                                                '<div style="font-size:1.1rem; line-height:1.6; margin-top:15px;">' + primeiraDefinicao.outerHTML + '</div>' +
                                                '<br><a href="'+url+'" target="_blank" class="btn-wiki">Ver conjugação completa &rarr;</a>';
                    } else {
                        conteudoBox.innerHTML = '<h2>'+termo+'</h2><p>Verbete complexo. Clique abaixo.</p><a href="'+url+'" target="_blank" class="btn-wiki">Ver no Wikcionário &rarr;</a>';
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
