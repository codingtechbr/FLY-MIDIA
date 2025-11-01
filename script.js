// ==========================
// script.js - Fly Mídia (versão sem gráficos)
// ==========================

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    console.log("🔥 script.js carregado");
    checkAuthState();
});

// --------------------------
// Utilitários
// --------------------------
function formatarCPF(cpf) {
    cpf = String(cpf || '').replace(/\D/g, "");
    if (cpf.length === 11) return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return cpf;
}

function formatarData(data) {
    const d = new Date(data);
    if (isNaN(d)) return data;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatarValor(v) {
    const n = parseFloat(v) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

// --------------------------
// Auth / UI Admin
// --------------------------
async function loginAdmin(event) {
    event.preventDefault();
    const email = document.getElementById("emailLogin").value;
    const senha = document.getElementById("senhaLogin").value;
    const err = document.getElementById("loginError");
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        mostrarPainel();
    } catch (e) {
        console.error(e);
        if (err) {
            err.textContent = "Email ou senha incorretos.";
            err.style.display = "block";
        }
    }
}

function logoutAdmin() {
    auth.signOut();
    if (document.getElementById("loginSection")) document.getElementById("loginSection").style.display = "block";
    if (document.getElementById("adminSection")) document.getElementById("adminSection").style.display = "none";
    if (document.getElementById("navbar")) document.getElementById("navbar").style.display = "none";
}

function checkAuthState() {
    if (typeof auth === 'undefined') {
        console.warn("Auth não definido — verifique ordem dos scripts.");
        return;
    }
    auth.onAuthStateChanged(user => {
        if (user) mostrarPainel();
        else if (document.getElementById("loginSection")) document.getElementById("loginSection").style.display = "block";
    });
}

function mostrarPainel() {
    if (document.getElementById("loginSection")) document.getElementById("loginSection").style.display = "none";
    if (document.getElementById("adminSection")) document.getElementById("adminSection").style.display = "block";
    if (document.getElementById("navbar")) document.getElementById("navbar").style.display = "block";
    carregarTabela();
}

// --------------------------
// CRUD Contratos
// --------------------------
async function salvarContrato(event) {
    event.preventDefault();
    const id = document.getElementById("editId").value || "";

    // coletar itens
    const itens = [];
    const itensEls = document.querySelectorAll('#itensContainer .item');
    let total = 0;
    itensEls.forEach(it => {
        const select = it.querySelector('.tipoItem');
        const qtd = parseInt(it.querySelector('.quantidadeItem').value || 1);
        const nome = select.options[select.selectedIndex].text;
        const preco = parseFloat(select.selectedOptions[0]?.dataset.preco || 0);
        const subtotal = preco * qtd;
        total += subtotal;
        itens.push({ nome, quantidade: qtd, preco, subtotal });
    });

    const desconto = parseFloat(document.getElementById('desconto').value || 0);
    if (desconto > 0) total = total - (total * desconto / 100);

    const contrato = {
        nome_empresa: document.getElementById("nomeEmpresa").value,
        cpf_cliente: formatarCPF(document.getElementById("cpfCliente").value),
        telefone: (document.getElementById("telefoneCliente").value || "").replace(/\D/g, ''),
        itens_contrato: itens,
        valor_contrato: parseFloat(total.toFixed(2)),
        data_vencimento: document.getElementById("dataVencimento").value,
        cidade: document.getElementById("cidade").value,
        local_divulgacao: document.getElementById("localDivulgacao").value || "", // 👈 novo campo
        admin_responsavel: document.getElementById("adminResponsavel").value || '',
        status_pagamento: !!document.getElementById("statusPagamento").checked,
        observacoes: document.getElementById("observacoes").value || '',
        atualizado_em: new Date().toISOString()
    };

    try {
        if (id) {
            await db.collection("contratos").doc(id).update(contrato);
            alert("✅ Contrato atualizado.");
        } else {
            await db.collection("contratos").add(contrato);
            alert("✅ Contrato cadastrado.");
        }
        limparFormulario();
        carregarTabela();
    } catch (err) {
        console.error("Erro salvarContrato:", err);
        alert("Erro ao salvar (veja console).");
    }
}

function limparFormulario() {
    const f = document.getElementById("contractForm");
    if (f) f.reset();
    if (document.getElementById("editId")) document.getElementById("editId").value = "";
    const c = document.getElementById('itensContainer');
    if (c) {
        c.innerHTML = `<div class="item">
            <select class="tipoItem" onchange="calcularTotal()" required>
                <option value="">Selecione...</option>
                <option value="banner" data-preco="59.99">Banner (R$59,99)</option>
                <option value="videoGif" data-preco="79.99">Vídeo GIF (R$79,99)</option>
                <option value="videoEmpresarial" data-preco="99.99">Vídeo Empresarial (R$99,99)</option>
            </select>
            <input type="number" class="quantidadeItem" min="1" value="1" onchange="calcularTotal()" style="width:80px; margin-left:8px;">
            <button type="button" class="btn btn-secondary" onclick="removerItem(this)" style="margin-left:8px;">🗑️</button>
        </div>`;
    }
    calcularTotal();
}

async function carregarTabela() {
    const tbody = document.getElementById("contractsTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center">Carregando...</td></tr>`;

    try {
        const snapshot = await db.collection("contratos").orderBy("data_vencimento", "asc").get();
        tbody.innerHTML = "";
        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center">Nenhum contrato cadastrado.</td></tr>`;
        } else {
            snapshot.forEach(doc => {
                const c = doc.data();
                const produtos = (c.itens_contrato || []).map(i => `${i.nome} (x${i.quantidade})`).join(", ");
                const telefoneFmt = c.telefone ? c.telefone : '—';
                const statusHtml = c.status_pagamento ? `<span class="status-pago">Pago</span>` : `<span class="status-pendente">Pendente</span>`;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.nome_empresa}</td>
                    <td>${c.cpf_cliente || '—'}</td>
                    <td>${telefoneFmt}</td>
                    <td>${produtos || '—'}</td>
                    <td>${formatarValor(c.valor_contrato || 0)}</td>
                    <td>${formatarData(c.data_vencimento || '')}</td>
                    <td>${c.cidade || '—'}</td>
                    <td>${c.local_divulgacao || '—'}</td> <!-- 👈 mostra o local -->
                    <td>${statusHtml}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="editarContrato('${doc.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="excluirContrato('${doc.id}')">Excluir</button>
                        ${!c.status_pagamento ? `<button class="btn btn-success" onclick="marcarPago('${doc.id}')">💰 Pago</button>` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Erro carregarTabela:", err);
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red;">Erro ao carregar contratos.</td></tr>`;
    }
}

async function marcarPago(id) {
    try {
        await db.collection("contratos").doc(id).update({ status_pagamento: true });
        alert("✅ Contrato marcado como pago.");
        carregarTabela();
    } catch (err) {
        console.error("Erro marcarPago:", err);
        alert("Erro ao marcar como pago.");
    }
}

// --------------------------
// Itens dinâmicos e cálculo
// --------------------------
function adicionarItem() {
    const container = document.getElementById('itensContainer');
    const novo = document.createElement('div');
    novo.classList.add('item');
    novo.innerHTML = `
        <select class="tipoItem" onchange="calcularTotal()" required>
            <option value="">Selecione...</option>
            <option value="banner" data-preco="59.99">Banner (R$59,99)</option>
            <option value="videoGif" data-preco="79.99">Vídeo GIF (R$79,99)</option>
            <option value="videoEmpresarial" data-preco="99.99">Vídeo Empresarial (R$99,99)</option>
        </select>
        <input type="number" class="quantidadeItem" min="1" value="1" onchange="calcularTotal()" style="width:80px; margin-left:8px;">
        <button type="button" class="btn btn-secondary" onclick="removerItem(this)" style="margin-left:8px;">🗑️</button>
    `;
    container.appendChild(novo);
    calcularTotal();
}

function removerItem(btn) {
    btn.parentElement.remove();
    calcularTotal();
}

function calcularTotal() {
    let total = 0;
    document.querySelectorAll('#itensContainer .item').forEach(it => {
        const sel = it.querySelector('.tipoItem');
        const qtd = parseInt(it.querySelector('.quantidadeItem').value || 1);
        const preco = parseFloat(sel.selectedOptions[0]?.dataset.preco || 0);
        total += preco * qtd;
    });
    const desconto = parseFloat(document.getElementById('desconto').value || 0);
    if (!isNaN(desconto) && desconto > 0) total -= total * desconto / 100;
    if (document.getElementById('valorContrato')) document.getElementById('valorContrato').value = total.toFixed(2);
}

// --------------------------
// CLIENTE - Consultar CPF
// --------------------------
async function consultarCPF() {
    const cpf = formatarCPF(document.getElementById("cpfInput").value.trim());
    const err = document.getElementById("errorMessage");
    const loginCard = document.getElementById("loginCard");
    const clientArea = document.getElementById("clientArea");
    const contractsList = document.getElementById("contractsList");

    if (!cpf || cpf.replace(/\D/g, '').length < 11) {
        err.textContent = "CPF inválido."; err.style.display = 'block';
        contractsList.innerHTML = ''; return;
    }

    try {
        const snap = await db.collection("contratos").where("cpf_cliente", "==", cpf).get();
        if (snap.empty) {
            err.textContent = "Nenhum contrato encontrado."; err.style.display = 'block';
            contractsList.innerHTML = ''; return;
        }

        loginCard.style.display = 'none';
        clientArea.style.display = 'block';
        contractsList.innerHTML = '';

       snap.forEach(doc => {
  const c = doc.data();
  const status = c.status_pagamento ? 'Pago' : 'Pendente';
  const statusClass = c.status_pagamento ? 'status-pago' : 'status-pendente';
  const produtosText = (c.itens_contrato || []).map(i => `${i.nome} (x${i.quantidade})`).join(", ");
 const msgPix = `Olá, sou ${c.nome_empresa}, de ${c.cidade || '—'}, referente ao contrato exibido em ${c.local_divulgacao || '—'}. O contrato vence em ${formatarData(c.data_vencimento)} e o valor é ${formatarValor(c.valor_contrato)}. Gostaria de realizar o pagamento via PIX. Obrigado! 💸`;


  const card = document.createElement('div');
  card.classList.add('contract-card');
  card.innerHTML = `
    <div class="contract-top">
      <div class="contract-left">
        <div class="contract-location">${(c.local_divulgacao || '—').toUpperCase()}</div>
        <div style="margin-top:6px;">
          <div style="font-weight:800; color:var(--card)">${c.nome_empresa || 'Cliente'}</div>
          <div class="contract-meta">${produtosText} — <span style="font-weight:700">${formatarValor(c.valor_contrato)}</span></div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="badge ${statusClass}">${status}</div>
        <div class="contract-meta" style="margin-top:6px">Vencimento: ${formatarData(c.data_vencimento)}</div>
      </div>
    </div>

    <div class="contract-row">
      <div class="contract-meta">Cidade: ${c.cidade || '—'}</div>
    </div>

    <div class="contract-actions">
      ${!c.status_pagamento ? `
        <button class="btn px" onclick="abrirWhatsApp('5575998713085','${msgPix.replace(/'/g, "\\'")}')">
          💸 Fazer PIX via WhatsApp
        </button>
      ` : '<div class="status-pago" style="padding:6px 10px;border-radius:10px;">✅ Pago</div>'}
    </div>
  `;
  contractsList.appendChild(card);
});


    } catch (e) {
        console.error("Erro consultarCPF:", e);
        err.textContent = "Erro ao consultar."; err.style.display = 'block';
    }
}

// --------------------------
// WhatsApp
// --------------------------
function abrirWhatsApp(telefone, mensagem) {
    const num = telefone.replace(/\D/g, '');
    if (!num) return alert("Telefone inválido");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensagem)}`, '_blank');
}
