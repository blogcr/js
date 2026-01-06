/* LIGHTBOX UNIVERSAL - VERSÃO FINAL (DELEGAÇÃO GLOBAL) */
document.addEventListener("click", function(e) {
    
    // 1. ENCONTRA O LINK CLICADO
    // (Mesmo que clique na imagem dentro do link, o script sobe até achar o 'A')
    var target = e.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }

    // Se não for link ou não tiver URL, ignora e deixa o navegador seguir
    if (!target || !target.href) return;

    // 2. DETECÇÃO DO CONTEÚDO
    var url = target.href;
    var tipo = "";
    var legendaTexto = target.getAttribute('data-caption') || target.title || "";

    // Tenta achar legenda na imagem interna (se houver)
    if (!legendaTexto) {
        var imgFilha = target.querySelector('img');
        if (imgFilha) legendaTexto = imgFilha.alt;
    }

    // --- REGRAS DE DECISÃO (CASE INSENSITIVE) ---

    // A. WIKIPÉDIA (Prioridade Máxima)
    if (url.includes('wikipedia.org')) {
        tipo = 'wiki-api';
    }
    // B. YOUTUBE
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        tipo = 'video';
        var videoId = url.split('v=')[1] || url.split('/').pop();
        if(videoId.indexOf('&') != -1) { videoId = videoId.substring(0, videoId.indexOf('&')); }
        url = "https://www.youtube.com/embed/" + videoId + "?autoplay=1";
    }
    // C. IMAGEM AUTOMÁTICA (Verifica extensões comuns, maiúsculas ou minúsculas)
    else if (url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
        tipo = 'imagem';
    }
    // D. MANUAL (Só abre iframe genérico se tiver data-fancybox explícito)
    else if (target.hasAttribute('data-fancybox')) {
        tipo = 'iframe';
    }

    // --- AÇÃO ---
    if (tipo !== "") {
        // Bloqueia o comportamento padrão (abrir link/nova aba)
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Mata scripts antigos

        var overlay = document.getElementById('lightbox-overlay');
        var conteudoBox = document.getElementById('lightbox-conteudo');
        var legendaBox = document.getElementById('lightbox-legenda');

        overlay.classList.remove('lightbox-oculto');
        overlay.classList.add('lightbox-visivel');
        legendaBox.textContent = "";

        // Renderização
        if (tipo === 'wiki-api') {
            conteudoBox.innerHTML = '<div style="color:#333; padding:2rem; background:#fff; border-radius:8px; text-align:center;">Consultando a Enciclopédia...</div>';
            conteudoBox.className = 'modo-wiki';
            
            // Lógica de Slug da Wikipédia
            var slug = "";
            try {
                var urlObj = new URL(url);
                var pathParts = urlObj.pathname.split('/');
                slug = pathParts[pathParts.length - 1]; 
            } catch(err) { slug = url.split('/').pop(); }
            if(slug.indexOf('#') > -1) slug = slug.split('#')[0];

            fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + slug)
            .then(res => { if(!res.ok) throw new Error(); return res.json(); })
            .then(data => {
                var imgHTML = (data.thumbnail && data.thumbnail.source) ? 
                    '<img src="' + data.thumbnail.source + '" class="wiki-imagem-topo" style="display:block; margin: 0 auto 1rem auto; max-height:200px; border-radius:4px;">' : '';
                
                var extract = data.extract_html || data.extract || "Resumo indisponível.";
                
                conteudoBox.innerHTML = `
                    ${imgHTML}
                    <h2 style="margin-top:0; border-bottom:1px solid #eee; padding-bottom:10px; font-family:sans-serif;">${data.title}</h2>
                    <div class="wiki-resumo" style="text-align:left; line-height:1.6; font-family:serif; color:#444;">${extract}</div>
                    <div style="margin-top:20px; text-align:center;">
                        <a href="${url}" target="_blank" class="btn-ler-wiki" style="display:inline-block; background:#f1f1f1; color:#333; padding:10px 20px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:0.9rem;">Ler artigo completo &#8594;</a>
                    </div>
                `;
            })
            .catch(() => {
                conteudoBox.innerHTML = '<div style="padding:2rem; background:#fff; text-align:center;"><p>Não foi possível carregar o resumo.</p><a href="'+url+'" target="_blank" style="text-decoration:underline;">Clique aqui para abrir na Wikipédia</a></div>';
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
        else { // Imagem
            conteudoBox.innerHTML = '<img src="' + url + '" class="img-zoom">';
            conteudoBox.className = 'modo-imagem';
            legendaBox.textContent = legendaTexto;
        }
    }
}, true); // O 'true' garante que pegamos o clique antes de qualquer outro script
