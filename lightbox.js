/* LIGHTBOX UNIVERSAL - VERSÃO CORRIGIDA E BLINDADA */

// 1. Função de Fechar (GLOBAL) - Agora o botão acha ela!
window.fecharLightbox = function(e) {
    var overlay = document.getElementById('lightbox-overlay');
    var conteudoBox = document.getElementById('lightbox-conteudo');
    
    // Só fecha se clicar no fundo escuro ou no botão X
    if (e.target.id === 'lightbox-overlay' || e.target.classList.contains('lightbox-fechar')) {
        if(overlay) {
            overlay.classList.remove('lightbox-visivel');
            overlay.classList.add('lightbox-oculto');
        }
        // Limpa o conteúdo para parar vídeos
        setTimeout(function(){ 
            if(conteudoBox) conteudoBox.innerHTML = ''; 
        }, 300);
    }
};

// 2. O Monitor de Cliques (Automático)
document.addEventListener("click", function(e) {
    
    // Sobe a árvore DOM até achar um Link (<a>)
    var target = e.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }

    // Se não clicou em link ou o link não tem href, ignora
    if (!target || !target.href) return;

    var url = target.href;
    var tipo = "";
    var legendaTexto = target.getAttribute('data-caption') || target.title || "";

    // Tenta pegar legenda da imagem interna
    if (!legendaTexto) {
        var imgFilha = target.querySelector('img');
        if (imgFilha) legendaTexto = imgFilha.alt;
    }

    // --- REGRAS DE DETECÇÃO ---

    // A. WIKIPÉDIA
    if (url.includes('wikipedia.org')) {
        tipo = 'wiki-api';
    }
    // B. YOUTUBE
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        tipo = 'video';
        // Extração do ID do vídeo
        var videoId = url.split('v=')[1] || url.split('/').pop();
        if(videoId && videoId.indexOf('&') != -1) { 
            videoId = videoId.substring(0, videoId.indexOf('&')); 
        }
        url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
    }
    // C. IMAGEM AUTOMÁTICA (Extensões)
    else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
        tipo = 'imagem';
    }
    // D. MANUAL (data-fancybox)
    else if (target.hasAttribute('data-fancybox')) {
        tipo = 'iframe';
    }

    // --- EXECUÇÃO ---
    if (tipo !== "") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Prioridade total

        var overlay = document.getElementById('lightbox-overlay');
        var conteudoBox = document.getElementById('lightbox-conteudo');
        var legendaBox = document.getElementById('lightbox-legenda');

        if(overlay && conteudoBox) {
            overlay.classList.remove('lightbox-oculto');
            overlay.classList.add('lightbox-visivel');
            if(legendaBox) legendaBox.textContent = "";

            // Renderiza o conteúdo
            if (tipo === 'wiki-api') {
                conteudoBox.innerHTML = '<div style="color:#333; padding:2rem; background:#fff; border-radius:8px; text-align:center;">Consultando a Enciclopédia...</div>';
                conteudoBox.className = 'modo-wiki';
                
                // Tratamento do Slug
                var slug = "";
                try {
                    var urlObj = new URL(url);
                    var parts = urlObj.pathname.split('/');
                    slug = parts[parts.length - 1];
                } catch(err) { slug = url.split('/').pop(); }
                if(slug.indexOf('#') > -1) slug = slug.split('#')[0];

                // Chamada API
                fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
                .then(function(res){ if(!res.ok) throw new Error(); return res.json(); })
                .then(function(data){
                    var imgHTML = (data.thumbnail && data.thumbnail.source) ? 
                        '<img src="' + data.thumbnail.source + '" class="wiki-imagem-topo" style="display:block; margin: 0 auto 1rem auto; max-height:200px; border-radius:4px;">' : '';
                    
                    var extract = data.extract_html || data.extract || "Resumo indisponível.";
                    
                    conteudoBox.innerHTML = 
                        imgHTML +
                        '<h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px; font-family:sans-serif;">' + data.title + '</h2>' +
                        '<div class="wiki-resumo" style="text-align:left; line-height:1.6; font-family:serif; color:#444;">' + extract + '</div>' +
                        '<div style="margin-top:20px; text-align:center;">' +
                            '<a href="' + url + '" target="_blank" class="btn-ler-wiki" style="display:inline-block; background:#f1f1f1; color:#333; padding:10px 20px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:0.9rem;">Ler artigo completo &#8594;</a>' +
                        '</div>';
                })
                .catch(function(){
                    conteudoBox.innerHTML = '<div style="padding:2rem; background:#fff; text-align:center;"><p>Não foi possível carregar o resumo.</p><a href="'+url+'" target="_blank" style="text-decoration:underline;">Clique aqui para abrir na Wikipédia</a></div>';
                });
            }
            else if (tipo === 'video') {
                conteudoBox.innerHTML = '<div class="video-wrapper"><iframe src="' + url + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>';
                conteudoBox.className = 'modo-video';
                if(legendaBox) legendaBox.textContent = legendaTexto;
            }
            else if (tipo === 'iframe') {
                conteudoBox.innerHTML = '<iframe src="' + url + '" class="iframe-site" frameborder="0"></iframe>';
                conteudoBox.className = 'modo-iframe';
            }
            else { // Imagem
                conteudoBox.innerHTML = '<img src="' + url + '" class="img-zoom">';
                conteudoBox.className = 'modo-imagem';
                if(legendaBox) legendaBox.textContent = legendaTexto;
            }
        }
    }
}, true); // Modo de Captura Ativado
