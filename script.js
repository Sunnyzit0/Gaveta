// --- VARIÁVEIS DE ESTADO ---
let usuarioLogado = null;

// --- 1. LÓGICA DE AUTENTICAÇÃO (REGISTRO E LOGIN) ---

function irParaRegistro() {
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('senha').value.trim();

    if (user && pass) {
        // Verifica se o usuário já existe
        if (localStorage.getItem(`user_${user}`)) {
            exibirErro("Este usuário já existe!");
            return;
        }
        // Salva a senha associada ao usuário
        localStorage.setItem(`user_${user}`, pass);
        alert("Conta criada com sucesso! Agora clique em 'Entrar'.");
        document.getElementById('mensagem').innerText = ""; 
    } else {
        exibirErro("Preencha usuário e senha para registrar.");
    }
}

function fazerLogin() {
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('senha').value.trim();
    const senhaSalva = localStorage.getItem(`user_${user}`);

    if (senhaSalva && senhaSalva === pass) {
        usuarioLogado = user;
        // Troca de telas
        document.getElementById('tela-auth').style.display = 'none';
        document.getElementById('tela-principal').style.display = 'block';
        carregarItens();
    } else {
        exibirErro("Usuário ou senha incorretos.");
    }
}

// --- 2. LÓGICA DA GAVETA (SALVAR E PROCESSAR ARQUIVOS) ---

function salvarItem() {
    const texto = document.getElementById('texto-nota').value;
    const arquivoInput = document.getElementById('upload-arquivo');
    const arquivo = arquivoInput.files[0];

    if (!texto && !arquivo) {
        alert("Escreva uma nota ou escolha um arquivo!");
        return;
    }

    // Se houver arquivo, lemos como Base64 (string de dados)
    if (arquivo) {
        const leitor = new FileReader();
        leitor.onload = function(e) {
            const dadosBase64 = e.target.result;
            finalizarSalvamento(texto, arquivo.name, dadosBase64);
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
        conteudoArquivo: dadosArq, // O arquivo em si (Base64)
        data: new Date().toLocaleString('pt-BR')
    };

    let itens = JSON.parse(localStorage.getItem(`itens_${usuarioLogado}`)) || [];
    itens.push(novoItem);
    
    try {
        localStorage.setItem(`itens_${usuarioLogado}`, JSON.stringify(itens));
    } catch (e) {
        alert("Erro: A gaveta está cheia! Remova itens antigos.");
        return;
    }

    // Resetar campos
    document.getElementById('texto-nota').value = "";
    document.getElementById('upload-arquivo').value = "";
    carregarItens();
}

// --- 3. LÓGICA DE EXIBIÇÃO E EXCLUSÃO ---

function carregarItens() {
    const grid = document.getElementById('grid-itens');
    grid.innerHTML = "";
    let itens = JSON.parse(localStorage.getItem(`itens_${usuarioLogado}`)) || [];

    itens.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        let linkDownload = "";
        if (item.nomeArquivo) {
            linkDownload = `
                <div style="margin: 10px 0;">
                    <small>📎 ${item.nomeArquivo}</small><br>
                    <a href="${item.conteudoArquivo}" download="${item.nomeArquivo}" 
                       style="color: var(--accent); text-decoration: none; font-size: 12px; font-weight: bold;">
                       📥 BAIXAR ARQUIVO
                    </a>
                </div>`;
        }

        card.innerHTML = `
            <p>${item.texto}</p>
            ${linkDownload}
            <small style="color: #888; display: block; margin-top: 5px;">${item.data}</small>
            <button onclick="excluirItem(${item.id})" 
                    style="background: none; color: #cf6679; border: 1px solid #cf6679; padding: 4px 8px; font-size: 10px; margin-top: 10px; width: auto;">
                Excluir
            </button>
        `;
        grid.appendChild(card);
    });
}

function excluirItem(id) {
    let itens = JSON.parse(localStorage.getItem(`itens_${usuarioLogado}`)) || [];
    // Filtra a lista mantendo apenas os itens com ID diferente do que queremos apagar
    itens = itens.filter(item => item.id !== id);
    localStorage.setItem(`itens_${usuarioLogado}`, JSON.stringify(itens));
    carregarItens();
}

// --- UTILITÁRIOS ---

function exibirErro(msg) {
    const p = document.getElementById('mensagem');
    p.innerText = msg;
    p.style.display = 'block';
}

function logout() {
    location.reload(); // Reinicia o app
}