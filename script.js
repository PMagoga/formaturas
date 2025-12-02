// Variáveis globais para rastrear a célula que está sendo arrastada
let draggedCell = null;
let draggedContent = null;
// NOVA FLAG: Rastreia se o drop foi bem-sucedido.
let isMoveSuccessful = false;
// Variável para armazenar as classes originais (incluindo 'cell-selected')
let draggedCellOriginalClasses = "";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tenta carregar o estado salvo ao iniciar
  loadState();

  // 2. Configura os listeners para as células (Drag/Drop, DblClick e o novo Click)
  setupDragDropListeners();

  // 3. Adiciona listener ao botão de reset (necessário aqui, pois o botão está no HTML)
  document
    .getElementById("resetButton")
    .addEventListener("click", handleResetClick);
});

function setupDragDropListeners() {
  // Seleciona todas as células (td) que são potenciais fontes ou alvos de drop
  const cells = document.querySelectorAll("td");

  cells.forEach((cell) => {
    // --- Limpeza de Listeners Antigos ---
    cell.removeEventListener("dragstart", handleDragStart);
    cell.removeEventListener("dragover", handleDragOver);
    cell.removeEventListener("dragleave", handleDragLeave);
    cell.removeEventListener("drop", handleDrop);
    cell.removeEventListener("dragend", handleDragEnd);
    // REMOVE LISTENERS DE CLICK
    cell.removeEventListener("dblclick", handleDblClick);
    cell.removeEventListener("click", handleCellClick);

    // --- Configuração de Arrastabilidade (Drag/Drop) ---
    const content = cell.innerHTML.trim();
    if (content !== "") {
      // Garante que o conteúdo está dentro do span para padronizar
      if (!cell.querySelector(".draggable-content")) {
        cell.innerHTML = `<span class="draggable-content">${content}</span>`;
      }
      cell.setAttribute("draggable", "true");
    } else {
      cell.removeAttribute("draggable");
      cell.innerHTML = ""; // Garante que células logicamente vazias estejam visualmente limpas
    }

    // --- Adição de Listeners (Drag/Drop) ---
    cell.addEventListener("dragstart", handleDragStart);
    cell.addEventListener("dragover", handleDragOver);
    cell.addEventListener("dragleave", handleDragLeave);
    cell.addEventListener("drop", handleDrop);
    cell.addEventListener("dragend", handleDragEnd);

    // --- NOVO LISTENER: Edição ao Duplo Clique ---
    cell.addEventListener("dblclick", handleDblClick);

    // --- NOVO LISTENER: Seleção ao Clique Simples ---
    cell.addEventListener("click", handleCellClick);
  });
}

// --- FUNÇÃO DE SELEÇÃO/PINTURA DE CÉLULA (COM SELEÇÃO MÚLTIPLA) ---

function handleCellClick() {
  const cell = this;

  // Se a célula estiver em modo de edição, ignora o clique de seleção.
  if (cell.querySelector("input[type='text']")) {
    return;
  }

  // 1. Apenas alterna a classe 'cell-selected' na célula clicada.
  // O loop de desseleção de outras células foi removido.
  cell.classList.toggle("cell-selected");

  // 2. Salva o novo estado.
  saveState();
}

// --- BLOCO: FUNÇÕES DE EDIÇÃO DE CÉLULA ---

function handleDblClick() {
  // `this` refere-se à célula (td) clicada
  const cell = this;
  const contentSpan = cell.querySelector(".draggable-content");

  // Deseleciona a célula antes de entrar no modo de edição (opcional, para clareza visual)
  // cell.classList.remove("cell-selected");

  // Se a célula já estiver em modo de edição, ignora.
  if (cell.querySelector("input[type='text']")) {
    return;
  }

  // 1. Obtém o conteúdo atual
  const currentContent = contentSpan ? contentSpan.innerHTML.trim() : "";

  // 2. Cria o campo de input
  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.value = currentContent;
  inputField.style.width = "100%";
  inputField.style.boxSizing = "border-box";
  inputField.style.textAlign = "center";
  inputField.style.textTransform = "uppercase";
  inputField.style.fontWeight = "bold";
  inputField.style.fontSize = "1em";
  inputField.style.border = "none";
  inputField.style.outline = "none";
  inputField.style.padding = "0";

  // 3. Substitui o conteúdo da célula pelo campo de input
  cell.innerHTML = "";
  cell.appendChild(inputField);

  // 4. Foca no campo de input
  inputField.focus();

  // Seleciona todo o texto para facilitar a digitação imediata
  inputField.select();

  // 5. Adiciona listeners para salvar (Enter ou Perda de Foco)
  inputField.addEventListener("blur", () => saveEdit(cell, inputField));
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveEdit(cell, inputField);
    }
  });
}

function saveEdit(cell, inputField) {
  const newContent = inputField.value.trim();

  // Captura as classes atuais que DEVEM ser mantidas (como cell-selected ou empty-placeholder)
  const classesToKeep = Array.from(cell.classList)
    .filter((c) => c === "cell-selected" || c === "empty-placeholder")
    .join(" ");

  // 1. Atualiza o HTML da célula
  if (newContent !== "") {
    // Adiciona o novo conteúdo formatado dentro do span
    cell.innerHTML = `<span class="draggable-content">${newContent}</span>`;
    cell.setAttribute("draggable", "true");
    cell.className = classesToKeep; // Re-aplica as classes
  } else {
    // Se o conteúdo estiver vazio, limpa a célula e remove o atributo draggable
    cell.innerHTML = "";
    cell.removeAttribute("draggable");
    cell.className = classesToKeep; // Re-aplica as classes
  }

  // 2. Salva o novo estado no LocalStorage
  saveState();

  // 3. Reconfigura os listeners na célula atualizada
  setupDragDropListeners();
}

// --- FUNÇÕES DE PERSISTÊNCIA (localStorage) ---

function saveState() {
  // Salva o HTML de toda a área de conteúdo (dentro do div.blocos)
  const blocksContainer = document.querySelector(".blocos");
  if (blocksContainer) {
    // Certifique-se de que nenhum campo de input de edição esteja aberto antes de salvar
    const openInput = blocksContainer.querySelector("input[type='text']");
    if (openInput) {
      // Se houver um input aberto, força o salvamento primeiro (melhoria)
      saveEdit(openInput.closest("td"), openInput);
      return; // Sai após forçar o salvamento, que irá chamar saveState novamente
    }

    localStorage.setItem("graduationLayout", blocksContainer.innerHTML);
    console.log("Estado salvo com sucesso!");
  }
}

function loadState() {
  const savedLayout = localStorage.getItem("graduationLayout");
  if (savedLayout) {
    const blocksContainer = document.querySelector(".blocos");
    if (blocksContainer) {
      // Restaura o HTML salvo
      blocksContainer.innerHTML = savedLayout;
      console.log("Estado carregado do salvamento anterior!");

      // setupDragDropListeners será chamado novamente após loadState (via DOMContentLoaded).
    }
  }
}

// 3. Função de Reset/Limpeza do LocalStorage
function handleResetClick() {
  if (
    confirm(
      "Tem certeza que deseja limpar o LocalStorage? Isso forçará a tabela a recarregar o layout do código HTML."
    )
  ) {
    // CHAVE CORRIGIDA: usa "graduationLayout"
    localStorage.removeItem("graduationLayout");
    window.location.reload(); // Recarrega a página para aplicar a versão limpa
  }
}

// --- FUNÇÕES DRAG AND DROP ---

function handleDragStart(e) {
  draggedCell = this;
  isMoveSuccessful = false; // Reseta a flag para cada novo arrasto

  // Salva as classes para re-aplicar em dragEnd, caso o drop seja inválido
  draggedCellOriginalClasses = this.className;

  const contentSpan = this.querySelector(".draggable-content");
  if (!contentSpan) {
    e.preventDefault(); // Impede o arraste se não houver conteúdo arrastável
    return;
  }

  // Armazena o conteúdo da célula
  draggedContent = contentSpan.innerHTML;
  e.dataTransfer.setData("text/plain", draggedContent);
  e.dataTransfer.effectAllowed = "move";

  // ATENÇÃO: Imediatamente torna a célula original VAGA e aplica o placeholder visual.
  // Usamos setTimeout para que a célula original ainda esteja visível ao iniciar o arrasto
  setTimeout(() => {
    // Adiciona a classe placeholder E remove outras, mas mantém 'cell-selected'
    const classesToKeep = Array.from(draggedCell.classList).filter(
      (c) => c === "cell-selected"
    );
    draggedCell.className = classesToKeep.join(" "); // Limpa classes irrelevantes, mantendo 'cell-selected'

    draggedCell.innerHTML = "";
    draggedCell.classList.add("empty-placeholder");
    draggedCell.removeAttribute("draggable"); // A célula vazia não deve ser arrastável
  }, 0);
}

function handleDragOver(e) {
  e.preventDefault(); // Necessário para permitir o drop

  // Uma célula é considerada vazia se NÃO tiver o elemento .draggable-content dentro
  const isTargetEmpty =
    !this.querySelector(".draggable-content") && this.innerHTML.trim() === "";

  // Não pode soltar na própria célula que está arrastando (agora vazia)
  const isTargetSource = this === draggedCell;

  this.classList.remove("drag-over-valid");

  // Permite o drop APENAS se o alvo estiver vazio E não for o ponto de partida original
  if (isTargetEmpty && !isTargetSource) {
    e.dataTransfer.dropEffect = "move";
    this.classList.add("drag-over-valid");
  } else {
    e.dataTransfer.dropEffect = "none";
  }
}

function handleDragLeave() {
  this.classList.remove("drag-over-valid");
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove("drag-over-valid");

  // Verifica se o alvo é uma célula vazia válida (a mesma lógica do dragOver)
  const isTargetEmpty =
    !this.querySelector(".draggable-content") && this.innerHTML.trim() === "";

  if (draggedCell && isTargetEmpty && this !== draggedCell) {
    const data = e.dataTransfer.getData("text/plain");

    // Captura a classe de cor da origem
    const isSourceSelected = draggedCell.classList.contains("cell-selected");

    // 1. Adiciona o conteúdo no alvo
    this.innerHTML = `<span class="draggable-content">${data}</span>`;
    this.setAttribute("draggable", "true");

    // 2. Transfere o estado de seleção (cor) para o destino
    if (isSourceSelected) {
      this.classList.add("cell-selected");
    }
    draggedCell.classList.remove("cell-selected"); // Remove a cor da origem

    // 3. Marca o movimento como bem-sucedido
    isMoveSuccessful = true;

    // 4. Salva o novo estado
    saveState();

    // A célula original (draggedCell) já está limpa e marcada como placeholder
  } else {
    // Drop inválido. O handleDragEnd vai restaurar o conteúdo na célula original.
  }
}

function handleDragEnd(e) {
  if (draggedCell) {
    // 1. Se o movimento NÃO foi bem-sucedido (drop inválido ou cancelado), restaura o conteúdo e classes.
    if (!isMoveSuccessful) {
      draggedCell.innerHTML = `<span class="draggable-content">${draggedContent}</span>`;
      draggedCell.setAttribute("draggable", "true");
      // Re-aplica a cor original caso o drop tenha sido inválido
      if (draggedCellOriginalClasses.includes("cell-selected")) {
        draggedCell.classList.add("cell-selected");
      }
    }

    // 2. Limpa o visual do placeholder
    draggedCell.classList.remove("empty-placeholder");
  }

  // 3. Limpa as variáveis de estado
  draggedCell = null;
  draggedContent = null;
  isMoveSuccessful = false;
  draggedCellOriginalClasses = "";

  // Remove a classe de drag-over
  document
    .querySelectorAll(".drag-over-valid")
    .forEach((el) => el.classList.remove("drag-over-valid"));

  // Reconfigura os listeners.
  setupDragDropListeners();
}
