// Variáveis globais para rastrear a célula que está sendo arrastada
let draggedCell = null;
let draggedContent = null;
// NOVA FLAG: Rastreia se o drop foi bem-sucedido.
let isMoveSuccessful = false;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tenta carregar o estado salvo ao iniciar
  loadState();

  // 2. Configura os listeners para as células
  setupDragDropListeners();
});

function setupDragDropListeners() {
  // Seleciona todas as células (td) que são potenciais fontes ou alvos de drop
  const cells = document.querySelectorAll("td");

  cells.forEach((cell) => {
    // Garante que a célula tem o conteúdo dentro do span para padronizar
    const content = cell.innerHTML.trim();
    if (content !== "") {
      // Se não tiver a classe .draggable-content, adiciona-a
      if (!cell.querySelector(".draggable-content")) {
        cell.innerHTML = `<span class="draggable-content">${content}</span>`;
      }
      cell.setAttribute("draggable", "true");
    } else {
      cell.removeAttribute("draggable");
      cell.innerHTML = ""; // Garante que células logicamente vazias estejam visualmente limpas
    }

    cell.addEventListener("dragstart", handleDragStart);
    cell.addEventListener("dragover", handleDragOver);
    cell.addEventListener("dragleave", handleDragLeave);
    cell.addEventListener("drop", handleDrop);
    cell.addEventListener("dragend", handleDragEnd);
  });
}

// --- FUNÇÕES DE PERSISTÊNCIA (localStorage) ---

function saveState() {
  // Salva o HTML de toda a área de conteúdo (dentro do div.blocos)
  const blocksContainer = document.querySelector(".blocos");
  if (blocksContainer) {
    // Nota: Apenas salva o innerHTML do container que tem as tabelas
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

      // É crucial reconfigurar os listeners após carregar um novo HTML!
      setupDragDropListeners();

      // Recarrega o estado visual de células vazias
      document.querySelectorAll("td").forEach((cell) => {
        if (cell.innerHTML.trim() === "") {
          cell.removeAttribute("draggable");
        }
      });
    }
  }
}

// --- FUNÇÕES DRAG AND DROP ---

function handleDragStart(e) {
  draggedCell = this;
  isMoveSuccessful = false; // Reseta a flag para cada novo arrasto

  // Armazena o conteúdo da célula
  draggedContent = this.querySelector(".draggable-content").innerHTML;
  e.dataTransfer.setData("text/plain", draggedContent);
  e.dataTransfer.effectAllowed = "move";

  // ATENÇÃO: Imediatamente torna a célula original VAGA e aplica o placeholder visual.
  // Usamos setTimeout para que a célula original ainda esteja visível ao iniciar o arrasto
  setTimeout(() => {
    draggedCell.innerHTML = "";
    draggedCell.classList.add("empty-placeholder");
    draggedCell.removeAttribute("draggable"); // A célula vazia não deve ser arrastável
    draggedCell.removeEventListener("dragstart", handleDragStart); // Remove o listener da célula original que agora está vazia
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

    // 1. Adiciona o conteúdo no alvo
    this.innerHTML = `<span class="draggable-content">${data}</span>`;
    this.setAttribute("draggable", "true");

    // 2. Marca o movimento como bem-sucedido
    isMoveSuccessful = true;

    // 3. Atualiza os listeners do novo elemento (necessário para arrastar de novo)
    // O setupDragDropListeners já adiciona todos, mas vamos ser específicos aqui.
    this.addEventListener("dragstart", handleDragStart);

    // 4. Salva o novo estado
    saveState();

    // A célula original (draggedCell) já está limpa e marcada como placeholder
  } else {
    // Drop inválido. O handleDragEnd vai restaurar o conteúdo na célula original.
  }
}

function handleDragEnd(e) {
  if (draggedCell) {
    // 1. Se o movimento NÃO foi bem-sucedido (drop inválido ou cancelado), restaura o conteúdo.
    if (!isMoveSuccessful) {
      draggedCell.innerHTML = `<span class="draggable-content">${draggedContent}</span>`;
      draggedCell.setAttribute("draggable", "true");
      // Adiciona o listener de volta à célula restaurada
      draggedCell.addEventListener("dragstart", handleDragStart);
    } else {
      // Se foi bem-sucedido, a célula original permanece vazia (move behavior)
      // Já removemos o atributo draggable e limpamos o innerHTML no handleDragStart(setTimeout)
    }

    // 2. Limpa o visual do placeholder
    draggedCell.classList.remove("empty-placeholder");
  }

  // 3. Limpa as variáveis de estado
  draggedCell = null;
  draggedContent = null;
  isMoveSuccessful = false;

  // Remove a classe de drag-over
  document
    .querySelectorAll(".drag-over-valid")
    .forEach((el) => el.classList.remove("drag-over-valid"));
}
