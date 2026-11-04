// Blog de juliaroberta.com (copiado do blog do ohtopico.com.br): tema, relógio, botões de seção
(function () {
    const raiz = document.documentElement;
    const emoldurado = raiz.classList.contains('emoldurado');

    // Voltar: usa o histórico quando houver; senão segue o link
    const voltar = document.querySelector('[data-voltar]');
    if (voltar && history.length > 1) {
        voltar.addEventListener('click', e => { e.preventDefault(); history.back(); });
    }

    // Dentro da janela Busca do site, acompanha o tema escolhido lá
    if (emoldurado) {
        window.addEventListener('message', e => {
            if (e.origin === location.origin && e.data && e.data.tipo === 'tema') raiz.dataset.theme = e.data.tema;
        });
    }

    // Tema claro/escuro (o mesmo do site e do IA pra Prof)
    const temaBtn = document.getElementById('tema-btn');
    if (temaBtn) temaBtn.addEventListener('click', () => {
        const escuro = raiz.dataset.theme === 'dark' ||
            (!raiz.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
        const proximo = escuro ? 'light' : 'dark';
        raiz.dataset.theme = proximo;
        try { localStorage.setItem('iapraprof:theme', JSON.stringify(proximo)); } catch (e) {}
    });

    // Menu Iniciar
    const menu = document.getElementById('start-menu');
    const iniciar = document.querySelector('.start-btn');
    function abrirMenu(aberto, focar = true) {
        if (!menu || !iniciar) return;
        menu.hidden = !aberto;
        iniciar.setAttribute('aria-expanded', String(aberto));
        if (aberto && focar) menu.querySelector('.menu-item').focus();
    }
    if (iniciar) iniciar.addEventListener('click', () => abrirMenu(menu.hidden));
    document.addEventListener('click', e => {
        if (menu && !menu.hidden && !menu.contains(e.target) && !e.target.closest('.start-btn')) abrirMenu(false, false);
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menu && !menu.hidden) { abrirMenu(false); iniciar.focus(); }
    });

    // Relógio da barra de tarefas
    const relogio = document.getElementById('relogio');
    function hora() {
        if (relogio) relogio.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    hora();
    setInterval(hora, 30000);

    // Contador de visitas (GoatCounter: sem cookies e sem dados pessoais)
    const codigo = document.body.dataset.contador;
    const numero = document.querySelector('[data-numero]');
    function mostrar(n) {
        if (!numero) return;
        const txt = String(n).padStart(6, '0');
        numero.innerHTML = [...txt].map(d => `<span class="digito">${d}</span>`).join('');
    }
    if (codigo && numero) {
        fetch(`https://${codigo}.goatcounter.com/counter/TOTAL.json`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(d => mostrar(String(d.count).replace(/\D/g, '') || '0'))
            .catch(() => {});
    }

    // Botões de seção: categoria no índice do blog, disciplina na biblioteca de prompts.
    // Sem JavaScript são só links para as seções e tudo aparece; aqui mostram uma seção por vez.
    const seletor = document.querySelector('[data-seletor]');
    const filtros = document.getElementById('filtros');
    if (seletor) {
        const param = filtros ? 'disciplina' : 'categoria';
        const padrao = seletor.dataset.padrao;
        const botoes = [...seletor.querySelectorAll('[data-secao]')];
        const valores = botoes.map(b => b.dataset.secao);
        const secoes = valores.map(v => document.getElementById(v)).filter(s => s && s.tagName === 'SECTION');
        const q = new URLSearchParams(location.search);
        let atual = padrao;
        let alvo = null;
        if (valores.includes(q.get(param))) {
            atual = q.get(param);
        } else if (location.hash.length > 1) {
            // Link direto para uma seção ou para um prompt: abre a seção dele
            alvo = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            const sec = alvo && alvo.closest('section[id]');
            if (sec && valores.includes(sec.id)) atual = sec.id;
            else alvo = null;
        }

        const normalizar = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let campos, itens, status, vazio;
        if (filtros) {
            campos = {
                etapa: document.getElementById('f-etapa'),
                tipo: document.getElementById('f-tipo'),
                busca: document.getElementById('f-busca'),
            };
            itens = [...document.querySelectorAll('.prompt-item')];
            status = document.getElementById('f-status');
            vazio = document.getElementById('f-vazio');
            itens.forEach(it => { it.dataset.texto = normalizar(it.textContent); });
            ['etapa', 'tipo'].forEach(k => {
                const v = q.get(k);
                if (v && [...campos[k].options].some(o => o.value === v)) campos[k].value = v;
            });
        }

        function atualizarEndereco(extra) {
            const nova = new URLSearchParams(extra);
            if (atual !== padrao) nova.set(param, atual);
            const hash = alvo ? location.hash : '';
            history.replaceState(null, '', (nova.toString() ? '?' + nova : location.pathname) + hash);
        }

        function mostrar() {
            botoes.forEach(b => {
                if (b.dataset.secao === atual) b.setAttribute('aria-current', 'true');
                else b.removeAttribute('aria-current');
            });
            if (!filtros) {
                secoes.forEach(s => { s.hidden = atual !== 'todos' && s.id !== atual; });
                atualizarEndereco({});
                return;
            }
            // Biblioteca: a palavra procura em todas as disciplinas; etapa e tipo filtram a disciplina escolhida
            const e = campos.etapa.value, t = campos.tipo.value;
            const palavras = normalizar(campos.busca.value).split(/\s+/).filter(Boolean);
            const todas = palavras.length > 0;
            seletor.classList.toggle('em-busca', todas);
            let total = 0;
            itens.forEach(it => {
                const ok = (todas || it.closest('.grupo-prompts').id === atual) &&
                    (!e || it.dataset.etapas.split(' ').includes(e)) &&
                    (!t || it.dataset.tipo === t) &&
                    palavras.every(p => it.dataset.texto.includes(p));
                it.hidden = !ok;
                if (ok) total++;
            });
            secoes.forEach(g => { g.hidden = !g.querySelector('.prompt-item:not([hidden])'); });
            const n = total === 1 ? '1 prompt encontrado' : `${total} prompts encontrados`;
            status.textContent = todas ? `${n} em todas as disciplinas` : n;
            vazio.hidden = total > 0;
            const extra = {};
            if (e) extra.etapa = e;
            if (t) extra.tipo = t;
            atualizarEndereco(extra);
        }

        botoes.forEach(b => b.addEventListener('click', ev => {
            ev.preventDefault();
            atual = b.dataset.secao;
            alvo = null;
            if (filtros && campos.busca.value) campos.busca.value = '';
            mostrar();
        }));
        if (filtros) {
            Object.values(campos).forEach(c => c.addEventListener(c.tagName === 'INPUT' ? 'input' : 'change', () => { alvo = null; mostrar(); }));
            document.getElementById('f-limpar').addEventListener('click', () => {
                Object.values(campos).forEach(c => { c.value = ''; });
                mostrar();
            });
            filtros.hidden = false;
        }
        // Links da caixa Temas (/blog/#categoria) na própria página
        window.addEventListener('hashchange', () => {
            const v = decodeURIComponent(location.hash.slice(1));
            if (valores.includes(v)) { atual = v; alvo = null; mostrar(); document.getElementById(v)?.scrollIntoView(); }
        });
        seletor.classList.add('ativo');
        mostrar();
        if (alvo) alvo.scrollIntoView();
    }

    // Botão de copiar embaixo de cada prompt
    document.querySelectorAll('.artigo pre').forEach(pre => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn98 copiar';
        b.setAttribute('aria-live', 'polite');
        b.textContent = 'Copiar prompt';
        b.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(pre.textContent);
                b.textContent = 'Copiado!';
            } catch (err) {
                b.textContent = 'Selecione e copie (Ctrl+C)';
            }
            setTimeout(() => { b.textContent = 'Copiar prompt'; }, 2500);
        });
        pre.after(b);
    });
})();
