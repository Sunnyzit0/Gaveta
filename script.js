// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPr-R2F0pOgm2BYzL4eIb7wg6ZZdhY3EI",
  authDomain: "vault-app-66412.firebaseapp.com",
  projectId: "vault-app-66412",
  storageBucket: "vault-app-66412.firebasestorage.app",
  messagingSenderId: "527886754171",
  appId: "1:527886754171:web:d3d25f6fbceb94e13f9dde",
  measurementId: "G-MH3F1ZBEKG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
let viewAtual = 'todos';
let termoBusca = '';
let todosItens = [];

// ===== OBSERVER DE AUTH =====
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('tela-auth').style.display = 'none';
        document.getElementById('tela-principal').style.display = 'flex';
        const nome = user.displayName || user.email.split('@')[0];
        document.getElementById('user-nome-sidebar').textContent = nome;
        document.getElementById('user-avatar').textContent = nome[0].toUpperCase();
        carregarItens();
    } else {
        document.getElementById('tela-auth').style.display = 'flex';
        document.getElementById('tela-principal').style.display = 'none';
    }
});

// ===== UTILITÁRIOS =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatarTamanho(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function tipoIcone(nome) {
    if (!nome) return '📄';
    const ext = nome.split('.').pop().toLowerCase();
    const mapa = { pdf:'📕', doc:'📘', docx:'📘', xls:'📗', xlsx:'📗', ppt:'📙', pptx:'📙', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', svg:'🖼️', webp:'🖼️', mp4:'🎬', mov:'🎬', mp3:'🎵', wav:'🎵', zip:'📦', rar:'📦', js:'⚙️', py:'🐍', html:'🌐', css:'🎨', txt:'📝', md:'📝' };
    return mapa[ext] || '📄';
}

function mostrarToast(msg, tipo = 'sucesso') {
    const toast = document.getElementById('toast');
    toast.textContent = (tipo === 'sucesso' ? '✓  ' : '✕  ') + msg;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function exibirErro(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function setBtnLoading(id, loading) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.6' : '1';
}

// ===== AUTENTICAÇÃO =====
window.alternarAba = function(aba) {
    const indicador = document.querySelector('.tab-indicator');
    ['login', 'registro'].forEach(a => {
        document.getElementById(`tab-${a}`).classList.toggle('active', a === aba);
        document.getElementById(`painel-${a}`).classList.toggle('active', a === aba);
    });
    indicador.classList.toggle('direita', aba === 'registro');
};

window.verificarForca = function() {
    const senha = document.getElementById('reg-senha').value;
    const fill = document.getElementById('forca-fill');
    const texto = document.getElementById('forca-texto');
    let p = 0;
    if (senha.length >= 6) p++;
    if (senha.length >= 10) p++;
    if (/[A-Z]/.test(senha)) p++;
    if (/[0-9]/.test(senha)) p++;
    if (/[^A-Za-z0-9]/.test(senha)) p++;
    const niveis = [
        { pct:0, cor:'transparent', label:'' },
        { pct:25, cor:'#ef4444', label:'Fraca' },
        { pct:50, cor:'#f59e0b', label:'Média' },
        { pct:75, cor:'#3b82f6', label:'Boa' },
        { pct:100, cor:'#22c55e', label:'Forte' },
    ];
    const n = niveis[Math.min(p, 4)];
    fill.style.width = `${n.pct}%`;
    fill.style.backgroundColor = n.cor;
    texto.textContent = n.label;
    texto.style.color = n.cor;
};

window.criarConta = async function() {
    const nome = document.getElementById('reg-nome').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const senha = document.getElementById('reg-senha').value;

    if (!nome || !email || !senha) { exibirErro('erro-registro', 'Preencha todos os campos.'); return; }
    if (senha.length < 6) { exibirErro('erro-registro', 'Senha deve ter ao menos 6 caracteres.'); return; }

    setBtnLoading('btn-registro', true);
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        await updateProfile(cred.user, { displayName: nome });
        mostrarToast('Conta criada com sucesso!');
    } catch (e) {
        const msgs = {
            'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/weak-password': 'Senha muito fraca.',
        };
        exibirErro('erro-registro', msgs[e.code] || 'Erro ao criar conta.');
    } finally {
        setBtnLoading('btn-registro', false);
    }
};

window.fazerLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) { exibirErro('erro-login', 'Preencha todos os campos.'); return; }

    setBtnLoading('btn-login', true);
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) {
        const msgs = {
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
        };
        exibirErro('erro-login', msgs[e.code] || 'Erro ao fazer login.');
    } finally {
        setBtnLoading('btn-login', false);
    }
};

window.logout = async function() {
    await signOut(auth);
};

window.toggleSenha = function(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.style.opacity = input.type === 'text' ? '0.5' : '1';
};

// ===== MODAL =====
window.abrirModal = function() {
    document.getElementById('modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('texto-nota').focus(), 100);
};

window.fecharModalBtn = function() { fecharModalInterno(); };

window.fecharModal = function(e) {
    if (e.target === document.getElementById('modal-overlay')) fecharModalInterno();
};

function fecharModalInterno() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('texto-nota').value = '';
    document.getElementById('upload-arquivo').value = '';
    document.getElementById('arquivo-preview').style.display = 'none';
    document.getElementById('upload-area').style.display = 'block';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalInterno(); });

// ===== DRAG & DROP =====
window.handleDragOver = function(e) {
    e.preventDefault();
    document.getElementById('upload-area').classList.add('drag-over');
};

window.handleDragLeave = function() {
    document.getElementById('upload-area').classList.remove('drag-over');
};

window.handleDrop = function(e) {
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
};

window.mostrarArquivoSelecionado = function(input) {
    if (!input.files || !input.files[0]) return;
    const arquivo = input.files[0];
    if (arquivo.size > 1024 * 1024) {
        mostrarToast('Arquivo muito grande. Máx. 1MB.', 'erro');
        input.value = '';
        return;
    }
    document.getElementById('arquivo-nome').textContent = arquivo.name;
    document.getElementById('arquivo-tamanho').textContent = formatarTamanho(arquivo.size);
    document.getElementById('arquivo-tipo-icon').textContent = tipoIcone(arquivo.name);
    document.getElementById('arquivo-preview').style.display = 'flex';
    document.getElementById('upload-area').style.display = 'none';
};

window.removerArquivo = function() {
    document.getElementById('upload-arquivo').value = '';
    document.getElementById('arquivo-preview').style.display = 'none';
    document.getElementById('upload-area').style.display = 'block';
};

// ===== SALVAR ITEM =====
window.salvarItem = async function() {
    const texto = document.getElementById('texto-nota').value.trim();
    const arquivoInput = document.getElementById('upload-arquivo');
    const arquivo = arquivoInput.files[0];

    if (!texto && !arquivo) { mostrarToast('Escreva uma nota ou escolha um arquivo.', 'erro'); return; }

    setBtnLoading('btn-salvar', true);

    try {
        let nomeArquivo = null;
        let conteudoArquivo = null;

        if (arquivo) {
            conteudoArquivo = await new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = e => res(e.target.result);
                r.onerror = rej;
                r.readAsDataURL(arquivo);
            });
            nomeArquivo = arquivo.name;
        }

        const user = auth.currentUser;
        await addDoc(collection(db, 'itens'), {
            uid: user.uid,
            texto: texto || null,
            nomeArquivo: nomeArquivo,
            conteudoArquivo: conteudoArquivo,
            data: new Date().toLocaleString('pt-BR'),
            criadoEm: Date.now()
        });

        fecharModalInterno();
        mostrarToast('Item guardado com sucesso!');
        carregarItens();
    } catch (e) {
        mostrarToast('Erro ao salvar. Tente novamente.', 'erro');
        console.error(e);
    } finally {
        setBtnLoading('btn-salvar', false);
    }
};

// ===== CARREGAR ITENS =====
async function carregarItens() {
    const loading = document.getElementById('loading-state');
    const grid = document.getElementById('grid-itens');
    const empty = document.getElementById('empty-state');

    loading.style.display = 'flex';
    grid.style.display = 'none';
    empty.style.display = 'none';

    try {
        const user = auth.currentUser;
        const q = query(collection(db, 'itens'), where('uid', '==', user.uid), orderBy('criadoEm', 'desc'));
        const snap = await getDocs(q);

        todosItens = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        atualizarStats();
        renderizarItens();
    } catch (e) {
        console.error('Erro ao carregar:', e);
        mostrarToast('Erro ao carregar itens.', 'erro');
    } finally {
        loading.style.display = 'none';
    }
}

function atualizarStats() {
    const comArquivo = todosItens.filter(i => i.nomeArquivo).length;
    const comNota = todosItens.filter(i => i.texto).length;

    document.getElementById('badge-todos').textContent = todosItens.length;
    document.getElementById('badge-notas').textContent = comNota;
    document.getElementById('badge-arquivos').textContent = comArquivo;
    document.getElementById('stat-notas').textContent = comNota;
    document.getElementById('stat-arquivos').textContent = comArquivo;
    document.getElementById('stat-total').textContent = todosItens.length;
}

function renderizarItens() {
    const grid = document.getElementById('grid-itens');
    const empty = document.getElementById('empty-state');
    grid.innerHTML = '';

    let itens = [...todosItens];

    if (viewAtual === 'notas') itens = itens.filter(i => i.texto);
    else if (viewAtual === 'arquivos') itens = itens.filter(i => i.nomeArquivo);

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

    const htmlTexto = item.texto ? `<div class="card-texto">${escapeHtml(item.texto)}</div>` : '';
    const htmlArquivo = item.nomeArquivo ? `
        <a href="${item.conteudoArquivo}" download="${escapeHtml(item.nomeArquivo)}" class="card-arquivo">
            <div class="card-arquivo-icone">${tipoIcone(item.nomeArquivo)}</div>
            <div class="card-arquivo-info">
                <div class="card-arquivo-nome">${escapeHtml(item.nomeArquivo)}</div>
                <div class="card-arquivo-baixar">↓ Baixar arquivo</div>
            </div>
        </a>` : '';

    card.innerHTML = `
        <div class="card-top"><span class="card-tipo ${tipo}">${tipoLabel[tipo]}</span></div>
        ${htmlTexto}
        ${htmlArquivo}
        <div class="card-bottom">
            <span class="card-data">${item.data}</span>
            <button class="btn-excluir" onclick="excluirItem('${item.id}')" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
        </div>`;
    return card;
}

window.excluirItem = async function(id) {
    try {
        await deleteDoc(doc(db, 'itens', id));
        mostrarToast('Item removido.');
        carregarItens();
    } catch (e) {
        mostrarToast('Erro ao excluir.', 'erro');
    }
};

// ===== FILTROS E BUSCA =====
window.filtrarView = function(view, btn) {
    viewAtual = view;
    termoBusca = '';
    document.getElementById('busca').value = '';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const titulos = {
        todos: ['Minha Gaveta', 'Todos os seus itens salvos'],
        notas: ['Notas', 'Suas anotações e textos'],
        arquivos: ['Arquivos', 'Seus arquivos guardados'],
    };
    document.getElementById('page-title').textContent = titulos[view][0];
    document.getElementById('page-subtitle').textContent = titulos[view][1];
    renderizarItens();
};

window.buscarItens = function(termo) {
    termoBusca = termo.toLowerCase();
    renderizarItens();
};

// ===== SIDEBAR =====
window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('main-content').classList.toggle('expanded');
};
