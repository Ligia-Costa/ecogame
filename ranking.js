// Chaves para armazenar os scores no localStorage para cada modo
const RANKING_STORAGE_KEY_REAL = 'ecoGameRankingReal';
const RANKING_STORAGE_KEY_VIRTUAL = 'ecoGameRankingVirtual';
const MAX_RANKING_ENTRIES = 10; // Número máximo de entradas no ranking

/**
 * Retorna a chave do localStorage apropriada para o modo de jogo.
 * @param {string} gameMode - 'real' ou 'virtual'.
 * @returns {string} A chave do localStorage.
 */
function getStorageKey(gameMode) {
    return gameMode === 'real' ? RANKING_STORAGE_KEY_REAL : RANKING_STORAGE_KEY_VIRTUAL;
}

/**
 * Retorna os scores salvos no localStorage para um modo de jogo específico.
 * @param {string} gameMode - 'real' ou 'virtual'.
 * @returns {Array} Array de objetos { name: string, score: number, date: string }
 */
function getScores(gameMode) {
    const storageKey = getStorageKey(gameMode);
    const scoresJSON = localStorage.getItem(storageKey);
    try {
        const scores = scoresJSON ? JSON.parse(scoresJSON) : [];
        // Garante que os scores estão ordenados ao carregar
        scores.sort((a, b) => b.score - a.score);
        return scores;
    } catch (e) {
        console.error(`Erro ao ler scores [${gameMode}] do localStorage:`, e);
        return []; // Retorna vazio em caso de erro
    }
}

/**
 * Salva um novo score no ranking do modo de jogo especificado.
 * @param {string} name - Nome do jogador.
 * @param {number} score - Pontuação final do jogador.
 * @param {string} gameMode - 'real' ou 'virtual'.
 */
function addScore(name, score, gameMode) {
    if (!name || typeof score !== 'number' || !['real', 'virtual'].includes(gameMode)) {
        console.error("Nome, pontuação ou modo de jogo inválido para adicionar ao ranking.", { name, score, gameMode });
        return;
    }

    const storageKey = getStorageKey(gameMode);
    const scores = getScores(gameMode); // Carrega os scores existentes para este modo
    const currentDate = new Date().toLocaleDateString('pt-BR'); // Formato dd/mm/aaaa

    scores.push({ name, score, date: currentDate });

    // Ordena por pontuação (maior primeiro)
    scores.sort((a, b) => b.score - a.score); // Ordena por score descendente

    // Mantém apenas os top N scores
    const topScores = scores.slice(0, MAX_RANKING_ENTRIES);

    try {
        localStorage.setItem(storageKey, JSON.stringify(topScores));
        console.log(`Score salvo [${gameMode}]:`, { name, score, date: currentDate });
    } catch (e) {
        console.error(`Erro ao salvar scores [${gameMode}] no localStorage:`, e);
    }
}

/**
 * Exibe o ranking de um modo de jogo específico na tabela HTML.
 * @param {string} gameMode - 'real' ou 'virtual'.
 */
function displayRanking(gameMode) {
    const tableBody = document.getElementById('ranking-table-body');
    const rankingTitle = document.getElementById('ranking-title'); // Assumindo que o H1 tem este ID

    if (!tableBody || !rankingTitle) {
        console.error("Elementos tbody ou h1 do ranking não encontrados.");
        return;
    }

    // Atualiza o título
    rankingTitle.textContent = `Ranking EcoGame - Modo ${gameMode === 'real' ? 'Real' : 'Virtual'} 🏆`;

    const scores = getScores(gameMode);
    tableBody.innerHTML = ''; // Limpa a tabela

    if (scores.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">Nenhuma pontuação registrada para este modo. Jogue para aparecer aqui!</td></tr>`;
        return;
    }

    scores.forEach((entry, index) => {
        const rank = index + 1;
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-700', 'transition-colors');

        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1 font-bold';
        else if (rank === 2) rankClass = 'rank-2 font-semibold';
        else if (rank === 3) rankClass = 'rank-3 font-medium';

        // Garante que o nome não seja nulo ou indefinido
        const displayName = entry.name || 'Anônimo';

        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-sm text-center ${rankClass}">
                ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
            </td>
            <td class="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-200">${displayName}</td>
            <td class="px-6 py-3 whitespace-nowrap text-sm text-amber-400 font-semibold">${entry.score}</td>
            <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-400">${entry.date}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * (NOVA FUNÇÃO) Limpa os scores de um modo de jogo específico do localStorage.
 * @param {string} gameMode - 'real' ou 'virtual'.
 */
function clearRanking(gameMode) {
    const storageKey = getStorageKey(gameMode);
    try {
        localStorage.removeItem(storageKey);
        console.log(`Ranking [${gameMode}] limpo.`);
    } catch (e) {
        console.error(`Erro ao limpar ranking [${gameMode}]:`, e);
    }
}


// --- Funções para a página ranking.html ---

/**
 * (FUNÇÃO ATUALIZADA) Inicializa a página de ranking, adicionando listeners aos botões
 * e carregando o ranking inicial (padrão: real).
 */
function initializeRankingPage() {
    const btnReal = document.getElementById('btn-ranking-real');
    const btnVirtual = document.getElementById('btn-ranking-virtual');

    // Novos seletores para os botões de exclusão
    const btnDeleteReal = document.getElementById('btn-delete-real');
    const btnDeleteVirtual = document.getElementById('btn-delete-virtual');

    // Novos seletores para o modal
    const confirmModal = document.getElementById('confirm-delete-modal');
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');

    let modeToDelete = null; // Armazena o modo a ser excluído ('real' ou 'virtual')
    let currentActiveMode = 'real'; // Armazena o modo ativo para refresh

    if (btnReal && btnVirtual) {
        btnReal.addEventListener('click', () => {
            currentActiveMode = 'real';
            displayRanking('real');
            btnReal.classList.add('active');
            btnVirtual.classList.remove('active');
            
            // Atualiza classes Tailwind (se estiver usando o novo HTML)
            btnReal.classList.add('bg-amber-500', 'text-gray-900');
            btnReal.classList.remove('bg-gray-700', 'text-gray-300');
            btnVirtual.classList.add('bg-gray-700', 'text-gray-300');
            btnVirtual.classList.remove('bg-amber-500', 'text-gray-900');
        });

        btnVirtual.addEventListener('click', () => {
            currentActiveMode = 'virtual';
            displayRanking('virtual');
            btnVirtual.classList.add('active');
            btnReal.classList.remove('active');

            // Atualiza classes Tailwind (se estiver usando o novo HTML)
            btnVirtual.classList.add('bg-amber-500', 'text-gray-900');
            btnVirtual.classList.remove('bg-gray-700', 'text-gray-300');
            btnReal.classList.add('bg-gray-700', 'text-gray-300');
            btnReal.classList.remove('bg-amber-500', 'text-gray-900');
        });

        // Lógica do Modal de Exclusão
        if (confirmModal && confirmBtn && cancelBtn && btnDeleteReal && btnDeleteVirtual) {
            
            const showModal = (mode) => {
                modeToDelete = mode;
                confirmModal.style.display = 'flex';
            };

            const hideModal = () => {
                modeToDelete = null;
                confirmModal.style.display = 'none';
            };

            btnDeleteReal.addEventListener('click', () => showModal('real'));
            btnDeleteVirtual.addEventListener('click', () => showModal('virtual'));
            cancelBtn.addEventListener('click', hideModal);
            
            // Fecha o modal se clicar fora da caixa
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    hideModal();
                }
            });

            confirmBtn.addEventListener('click', () => {
                if (modeToDelete) {
                    clearRanking(modeToDelete);
                    // Atualiza a exibição apenas se o modo excluído for o ativo
                    if (modeToDelete === currentActiveMode) {
                        displayRanking(currentActiveMode);
                    }
                    hideModal();
                }
            });
        }

        // Carrega o ranking 'real' por padrão ao abrir a página
        displayRanking('real');
        btnReal.classList.add('active');
        // Atualiza classes Tailwind (se estiver usando o novo HTML)
        btnReal.classList.add('bg-amber-500', 'text-gray-900');
        btnVirtual.classList.add('bg-gray-700', 'text-gray-300');

    } else {
         // Se os botões não existirem (página antiga), carrega o ranking 'real'
        displayRanking('real');
    }
}

// Verifica se estamos na página ranking.html antes de adicionar listeners
// Isso evita erros se ranking.js for incluído em outras páginas
if (document.getElementById('ranking-table-body')) {
    document.addEventListener('DOMContentLoaded', initializeRankingPage);
}