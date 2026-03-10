// ===== CANVAS DE PARTÍCULAS =====
(function() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = Math.floor((canvas.width * canvas.height) / 18000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.3,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                a: Math.random() * 0.5 + 0.1
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 200, ${p.a})`;
            ctx.fill();
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        });
        requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
})();

// ===== ESTADO =====
let usuarioLogado = null;
let viewAtual = 'todos';
let termoBusca = '';

// ===== UTILITÁRIOS =====
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatarTamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function tipoIcone(nome) {
    if (!nome) return '📄';
    const ext = nome.split('.').pop().toLowerCase();
    const mapa = {
        pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
        ppt: '📙', pptx: '📙', jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
        gif: '🖼️', svg: '🖼️', webp: '🖼️', mp4: '🎬', mov: '🎬',
        avi: '🎬', mp3: '🎵', wav: '🎵', ogg: '🎵', zip: '📦',
        rar: '📦', '7z': '📦', js: '⚙️', ts: '⚙️', py: '🐍',
        html: '🌐', css: '🎨', txt: '📝', md: '📝',
    };
    return mapa[ext] || '📄';
}

function mostrarToast(msg, tipo = 'sucesso') {
    const toast = document.getElementById('toast');
    const icone = tipo === 'sucesso' ? '✓' : '✕';
    toast.textContent = `${icone}  ${msg}`;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function exibirErro(idElemento, msg) {
    const el = document.getElementById(idElemento);
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function esconderErro(idElemento) {
    document.getElementById(idElemento).style.display = 'none';
}

// ===== AUTENTICAÇÃO =====
function alternarAba(aba) {
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-registro');
    const painelLogin = document.getElementById('painel-login');
    const painelReg = document.getElementById('painel-registro');
    const indicador = document.querySelector('.tab-indicator');

    if (aba === 'login') {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        painelLogin.classList.add('active');
        painelReg.classList.remove('active');
        indicador.classList.remove('direita');
    } else {
        tabReg.classList.add('active');
        tabLogin.classList.remove('active');
        painelReg.classList.add('active');
        painelLogin.classList.remove('active');
        indicador.classList.add('direita');

        const senhaInput = document.getElementById('reg-senha');
        senhaInput.addEventListener('input', verificarForca);
    }
}

function verificarForca() {
    const senha = document.getElementById('reg-senha').value;
    const fill = document.getElementById('forca-fill');
    const texto = document.getElementById('forca-texto');

    let pontos = 0;
    if (senha.length >= 6) pontos++;
    if (senha.length >= 10) pontos++;
    if (/[A-Z]/.test(senha)) pontos++;
    if (/[0-9]/.test(senha)) pontos++;
    if (/[^A-Za-z0-9]/.test(senha)) pontos++;

    const niveis = [
        { pct: 0, cor: 'transparent', label: '' },
        { pct: 25, cor: '#ef4444', label: 'Fraca' },
        { pct: 50, cor: '#f59e0b', label: 'Média' },
        { pct: 75, cor: '#3b82f6', label: 'Boa' },
        { pct: 100, cor: '#22c55e', label: 'Forte' },
    ];

    const nivel = niveis[Math.min(pontos, 4)];
    fill.style.width = `${nivel.pct}%`;
    fill.style.backgroundColor = nivel.cor;
    texto.textContent = nivel.label;
    texto.style.color = nivel.cor;
}

function criarConta() {
    const user = document.getElementById('reg-usuario').value.trim();
    const pass = document.getElementById('reg-senha').value;

    esconderErro('erro-registro');

    if (!user || !pass) {
        exibirErro('erro-registro', 'Preencha todos os campos.');
        return;
    }
    if (user.length < 3) {
        exibirErro('erro-registro', 'Usuário deve ter ao menos 3 caracteres.');
        return;
    }
    if (pass.length < 6) {
        exibirErro('erro-registro', 'Senha deve ter ao menos 6 caracteres.');
        return;
    }
    if (localStorage.getItem(`vault_user_${user}`)) {
        exibirErro('erro-registro', 'Este usuário já existe.');
        return;
    }

    localStorage.setItem(`vault_user_${user}`, pass);

    const suc = document.getElementById('sucesso-registro');
    suc.textContent = '✓ Conta criada! Agora faça login.';
    suc.style.display = 'block';

    setTimeout(() => {
        suc.style.display = 'none';
        document.getElementById('reg-usuario').value = '';
        document.getElementById('reg-senha').value = '';
        alternarAba('login');
    }, 2000);
}

function fazerLogin() {
    const user = document.getElementById('login-usuario').value.trim();
    const pass = document.getElementById('login-senha').value;
    const senhaSalva = localStorage.getItem(`vault_user_${user}`);

    esconderErro('erro-login');

    if (!user || !pass) {
        exibirErro('erro-login', 'Preencha todos os campos.');
        return;
    }

    if (!senhaSalva || senhaSalva !== pass) {
        exibirErro('erro-login', 'Usuário ou senha incorretos.');
        return;
    }

    usuarioLogado = user;
    document.getElementById('tela-auth').style.display = 'none';
    const telaPrincipal = document.getElementById('tela-principal');
    telaPrincipal.style.display = 'flex';

    // Avatar e nome
    document.getElementById('user-nome-sidebar').textContent = user;
    document.getElementById('user-avatar').textContent = user[0].toUpperCase();

    carregarItens();
}

function logout() {
    usuarioLogado = null;
    location.reload();
}

function toggleSenha(inputId, btn) {
    const input = document.getElementById(inputId);
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    btn.style.opacity = mostrar ? '0.5' : '1';
}

// ===== MODAL =====
function abrirModal() {
    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('texto-nota').focus(), 100);
}

function fecharModalBtn() {
    fecharModalInterno();
}

function fecharModal(event) {
    if (event.target === document.getElementById('modal-overlay')) {
        fecharModalInterno();
    }
}

function fecharModalInterno() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('texto-nota').value = '';
    document.getElementById('upload-arquivo').value = '';
    document.getElementById('arquivo-preview').style.display = 'none';
    document.getElementById('upload-area').style.display = 'block';
}

// ESC fecha modal
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModalInterno();
});

// ===== DRAG & DROP =====
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('upload-area').classList.add('drag-over');
}

function handleDragLeave(e) {
    document.getElementById('upload-area').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    document.getElementById('upload-area').classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const input = document.getElementById('upload-arquivo');
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        input.files = dt.files;
        mostrarArquivoSelecionado(input);
    }
}

function mostrarArquivoSelecionado(input) {
    if (!input.files || !input.files[0]) return;
    const arquivo = input.files[0];
    document.getElementById('arquivo-nome').textContent = arquivo.name;
    document.getElementById('arquivo-tamanho').textContent = formatarTamanho(arquivo.size);
    document.getElementById('arquivo-tipo-icon').textContent = tipoIcone(arquivo.name);
    document.getElementById('arquivo-preview').style.display = 'flex';
    document.getElementById('upload-area').style.display = 'none';
}

function removerArquivo() {
    document.getElementById('upload-arquivo').value = '';
    document.getElementById('arquivo-preview').style.display = 'none';
    document.getElementById('upload-area').style.display = 'block';
}

// ===== SALVAR ITEM =====
function salvarItem() {
    const texto = document.getElementById('texto-nota').value.trim();
    const arquivoInput = document.getElementById('upload-arquivo');
    const arquivo = arquivoInput.files[0];

    if (!texto && !arquivo) {
        mostrarToast('Escreva uma nota ou escolha um arquivo.', 'erro');
        return;
    }

    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            finalizarSalvamento(texto, arquivo.name, e.target.result);
        };
        leitor.readAsDataURL(arquivo);
    } else {
        finalizarSalvamento(texto, null, null);
    }
}

function finalizarSalvamento(texto, nomeArq, dadosArq) {
    const novoItem = {
        id: Date.now(),
        texto: texto,
        nomeArquivo: nomeArq,
        conteudoArquivo: dadosArq,
        data: new Date().toLocaleString('pt-BR')
    };

    let itens = JSON.parse(localStorage.getItem(`vault_itens_${usuarioLogado}`)) || [];
    itens.unshift(novoItem); // mais recente primeiro

    try {
        localStorage.setItem(`vault_itens_${usuarioLogado}`, JSON.stringify(itens));
    } catch (e) {
        mostrarToast('Gaveta cheia! Remova itens antigos.', 'erro');
        return;
    }

    fecharModalInterno();
    mostrarToast('Item guardado com sucesso!');
    carregarItens();
}

// ===== CARREGAR E RENDERIZAR =====
function carregarItens() {
    const todos = JSON.parse(localStorage.getItem(`vault_itens_${usuarioLogado}`)) || [];

    // Atualizar badges e stats
    const comArquivo = todos.filter(i => i.nomeArquivo).length;
    const soNotas = todos.filter(i => i.texto && !i.nomeArquivo).length;
    const misto = todos.filter(i => i.texto && i.nomeArquivo).length;
    const totalNotas = soNotas + misto;

    document.getElementById('badge-todos').textContent = todos.length;
    document.getElementById('badge-notas').textContent = totalNotas;
    document.getElementById('badge-arquivos').textContent = comArquivo + misto;
    document.getElementById('stat-notas').textContent = totalNotas;
    document.getElementById('stat-arquivos').textContent = comArquivo + misto;
    document.getElementById('stat-total').textContent = todos.length;

    renderizarItens(todos);
}

function filtrarView(view) {
    viewAtual = view;
    termoBusca = '';
    document.getElementById('busca').value = '';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const titulos = {
        todos: ['Minha Gaveta', 'Todos os seus itens salvos'],
        notas: ['Notas', 'Suas anotações e textos'],
        arquivos: ['Arquivos', 'Seus arquivos guardados'],
    };

    document.getElementById('page-title').textContent = titulos[view][0];
    document.getElementById('page-subtitle').textContent = titulos[view][1];

    carregarItens();
}

function buscarItens(termo) {
    termoBusca = termo.toLowerCase();
    carregarItens();
}

function renderizarItens(todos) {
    const grid = document.getElementById('grid-itens');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = '';

    let itens = [...todos];

    // Filtrar por view
    if (viewAtual === 'notas') {
        itens = itens.filter(i => i.texto);
    } else if (viewAtual === 'arquivos') {
        itens = itens.filter(i => i.nomeArquivo);
    }

    // Filtrar por busca
    if (termoBusca) {
        itens = itens.filter(i =>
            (i.texto && i.texto.toLowerCase().includes(termoBusca)) ||
            (i.nomeArquivo && i.nomeArquivo.toLowerCase().includes(termoBusca))
        );
    }

    if (itens.length === 0) {
        empty.style.display = 'block';
        grid.style.display = 'none';
    } else {
        empty.style.display = 'none';
        grid.style.display = 'grid';
        itens.forEach(item => grid.appendChild(criarCard(item)));
    }
}

function criarCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const tipo = item.texto && item.nomeArquivo ? 'misto' : item.nomeArquivo ? 'arquivo' : 'nota';
    const tipoLabel = { misto: 'Nota + Arquivo', arquivo: 'Arquivo', nota: 'Nota' };

    let htmlTexto = item.texto
        ? `<div class="card-texto">${escapeHtml(item.texto)}</div>`
        : '';

    let htmlArquivo = '';
    if (item.nomeArquivo) {
        htmlArquivo = `
            <a href="${item.conteudoArquivo}" download="${escapeHtml(item.nomeArquivo)}" class="card-arquivo">
                <div class="card-arquivo-icone">${tipoIcone(item.nomeArquivo)}</div>
                <div class="card-arquivo-info">
                    <div class="card-arquivo-nome">${escapeHtml(item.nomeArquivo)}</div>
                    <div class="card-arquivo-baixar">↓ Baixar arquivo</div>
                </div>
            </a>`;
    }

    card.innerHTML = `
        <div class="card-top">
            <span class="card-tipo ${tipo}">${tipoLabel[tipo]}</span>
        </div>
        ${htmlTexto}
        ${htmlArquivo}
        <div class="card-bottom">
            <span class="card-data">${item.data}</span>
            <button class="btn-excluir" onclick="excluirItem(${item.id})" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
        </div>
    `;

    return card;
}

function excluirItem(id) {
    let itens = JSON.parse(localStorage.getItem(`vault_itens_${usuarioLogado}`)) || [];
    itens = itens.filter(item => item.id !== id);
    localStorage.setItem(`vault_itens_${usuarioLogado}`, JSON.stringify(itens));
    mostrarToast('Item removido.');
    carregarItens();
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
}
