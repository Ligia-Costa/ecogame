document.addEventListener('DOMContentLoaded', () => {
    // Inicia o jogo em modo "vida real" se o elemento correspondente existir na página.
    if (document.getElementById('real-life-mode')) {
        realLifeGame.init();
    }
});

// Mapeia os IDs dos avatares para os nomes dos arquivos de imagem correspondentes.
const avatarImages = {
    'lingua_portuguesa': 'demetrius.png', 'lingua_portuguesa2': 'marieli.png', 'lingua_portuguesa3': 'lucilene.png',
    'quimica': 'arline.png', 'historia': 'julio.png', 'biologia': 'mayara.png',
    'fisica': 'romulo.png', 'geografia': 'jesiane.png', 'matematica': 'anderson.png',
    'matematica2': 'marcia.png', 'ingles': 'flavia.png', 'arte': 'marcela.png',
    'educacao_fisica': 'fabricio.png',
};

// Dados dos avatares que fornecem dicas no jogo.
const hintAvatarData = {
    joao: { name: 'Tio João', img: 'joao.png' },
    rafa: { name: 'Tio Rafa', img: 'rafael.png' },
    isabeli: { name: 'Tia Isa', img: 'isabeli.png' }
};

// Objeto para gerenciar os sons do jogo.
const audioManager = {
    backgroundMusic: document.getElementById('background-music'),
    correctSound: document.getElementById('correct-sound'),
    wrongSound: document.getElementById('wrong-sound'),
    gameoverSound: document.getElementById('gameover-sound'),

    playMusic() {
        this.backgroundMusic.volume = 0.3;
        this.backgroundMusic.play().catch(e => console.log("A reprodução de música foi bloqueada pelo navegador."));
    },
    stopMusic() {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
    },
    playSound(sound) {
        if(sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }
};

// Objeto para gerenciar a exibição e interação com o modal de perguntas.
const questionManager = {
    modal: document.getElementById('questionModal'),
    title: document.getElementById('qTitle'),
    text: document.getElementById('qText'),
    choices: document.getElementById('choices'),
    choiceElements: [],
    hintBtn: document.getElementById('q-hint-btn'),

    // Exibe o modal de pergunta com base nos dados fornecidos.
    show(questionObj, onAnswer, hintStatus) {
        this.choiceElements = [];
        this.modal.classList.add('active');
        this.title.textContent = `Desafio: ${questionObj.name}`;
        this.text.textContent = questionObj.question.text;
        this.choices.innerHTML = '';

        // Configura o botão de dica.
        if (hintStatus.show) {
            this.hintBtn.style.display = 'inline-flex';
            this.hintBtn.querySelector('span').textContent = hintStatus.remaining;
            this.hintBtn.classList.toggle('disabled', hintStatus.remaining <= 0);
        } else {
            this.hintBtn.style.display = 'none';
        }

        // Cria os botões de alternativa de resposta.
        questionObj.question.choices.forEach((choice, index) => {
            const btn = document.createElement('div');
            btn.className = 'choice gesture-selectable'; // Adiciona a classe para seleção por gesto.
            btn.innerHTML = `${choice}<div class="selection-progress"></div>`;
            btn.onclick = () => {
                if (this.isAnswerLocked) return;
                this.isAnswerLocked = true;

                const isCorrect = (index === questionObj.question.answer);
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (!isCorrect) {
                    // Mostra qual era a correta se errou
                    this.choices.children[questionObj.question.answer].classList.add('correct');
                }
                setTimeout(() => {
                    this.modal.classList.remove('active');
                    this.isAnswerLocked = false;
                    onAnswer(isCorrect, questionObj.explanation); // Chama o callback com a correção e explicação
                }, 2500); // Tempo para o jogador ver a resposta
            };
            this.choices.appendChild(btn);
            this.choiceElements.push(btn);
        });
        realLifeGame.updateSelectableElements(); // Atualiza elementos selecionáveis por gesto
        this.isAnswerLocked = false;
    }
};

// Objeto principal que controla toda a lógica do "Jogo Real".
const realLifeGame = {
    // --- Elementos do DOM ---
    videoInGame: document.getElementById('video-ingame'),
    videoGesture: document.getElementById('video-gesture'),
    handCursor: document.getElementById('hand-cursor'),
    miniCam: document.getElementById('miniCam'),
    overlay: document.getElementById('overlay'),
    gameContainer: document.getElementById('real-life-mode'),
    ctx: null, // Contexto do canvas
    startOverlay: document.getElementById('start-overlay'),
    startGameBtn: document.getElementById('start-game-btn'),
    gameHud: document.querySelector('.game-hud'),
    scoreEl: document.getElementById('score'),
    livesEl: document.getElementById('lives'),
    envStatusEl: document.getElementById('env-status'),
    feedbackOverlay: document.getElementById('feedback-overlay'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackExplanation: document.getElementById('feedback-explanation'),
    gameoverOverlay: document.getElementById('gameover-overlay'),
    levelEl: document.getElementById('level'),
    restartButton: null, // Definido no init
    changeAvatarButton: null, // Definido no init
    backButton: null, // Definido no init

    // --- Elementos do Timer ---
    timerEl: document.getElementById('timer'), // Span para exibir o tempo
    gameTimer: null, // ID do setInterval do timer
    remainingTime: 210, // Tempo inicial em segundos (3 minutos e 30 segundos)
    initialTime: 210, // Tempo inicial para reset

    // --- Elementos de Dica ---
    hintModal: document.getElementById('hintModal'),
    hintAvatarsContainer: document.getElementById('hint-avatars'),
    hintResultModal: document.getElementById('hintResultModal'),
    hintsRemaining: 3, // Dicas restantes
    usedHints: [], // IDs dos avatares de dica já usados
    currentQuestionForHint: null, // Pergunta atual quando a dica é pedida

    // --- Estado do Jogo ---
    player: { x: 0, y: 0, width: 60, height: 90, image: new Image(), loaded: false },
    seeds: [], // Sementes na tela
    collectibleSeed: null, // Semente próxima o suficiente para coletar
    gameQuestionBank: [], // Todas as perguntas carregadas para a matéria
    currentLevelQuestions: [], // Perguntas para o nível atual

    isQuestionActive: false, // Modal de pergunta está visível?
    isHintActive: false, // Modal de dica está visível?
    isGameOver: false, // O jogo acabou?
    playing: false, // O jogo está em andamento (não na tela inicial ou game over)?

    score: 0, // Pontuação
    lives: 3, // Vidas
    currentLevel: 1, // Nível atual
    totalLevels: 3, // Total de níveis (pode ajustar conforme necessário)
    levelProgress: 0, // Quantas perguntas/sementes foram respondidas/coletadas no nível
    seedsPerLevel: 5, // Sementes por nível (pode ajustar)

    // --- Controle por Gestos ---
    selectableElements: [], // Elementos da UI que podem ser selecionados por gestos
    hoveredElement: null, // Elemento atualmente sob o cursor de mão
    hoverStartTime: null, // Momento em que o cursor começou a pairar sobre o elemento
    SELECTION_TIME_MS: 1800, // Tempo necessário para selecionar um item com o gesto
    isSelectionLocked: false, // Trava para evitar múltiplas seleções rápidas


    // --- Funções ---

    // Função de inicialização
    async init() {
        this.ctx = this.overlay.getContext('2d');
        // Seleciona os botões da tela de Game Over
        this.restartButton = document.getElementById('restart-button');
        this.changeAvatarButton = document.getElementById('change-avatar-button');
        this.backButton = document.getElementById('backBtn');
        this.timerEl = document.getElementById('timer'); // Seleciona o elemento do timer

        // Define a função shuffleArray dentro do objeto para poder usar 'this' se necessário (embora não use neste caso)
        this.shuffleArray = function(array) {
             for (let i = array.length - 1; i > 0; i--) {
                 const j = Math.floor(Math.random() * (i + 1));
                 [array[i], array[j]] = [array[j], array[i]];
             }
        };

        // Adiciona listeners de clique como fallback (caso os gestos falhem)
        this.restartButton.addEventListener('click', () => this.resetGame());
        this.changeAvatarButton.addEventListener('click', () => { window.location.href = 'avatar.html'; });
        this.startGameBtn.addEventListener('click', () => this.startGame());

        // Carrega o avatar selecionado na tela anterior
        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia'; // Avatar padrão
        this.player.image.src = avatarImages[avatarId] || avatarImages['biologia'];
        this.player.image.onload = () => {
            this.player.loaded = true;
            this.resizeCanvas(); // Redimensiona o canvas após carregar a imagem
        };

        // Redimensiona o canvas quando a janela muda de tamanho
        window.addEventListener('resize', () => this.resizeCanvas());

        // Adiciona listener para o botão de dica no modal de pergunta
        questionManager.hintBtn.addEventListener('click', () => this.showHintModal());
        // Adiciona listeners para os avatares de dica
        this.hintAvatarsContainer.querySelectorAll('.hint-avatar').forEach(avatar => {
            avatar.addEventListener('click', () => this.useHint(avatar.dataset.avatar));
        });

        // Atualiza a lista de elementos selecionáveis por gesto
        this.updateSelectableElements();

        try {
            // Carrega as perguntas e configura o rastreamento de mãos
            await this.loadAllQuestions(avatarId);
            this.setupHandTracking();
        } catch (e) {
            console.error("Erro ao iniciar o jogo:", e);
            alert("Erro ao iniciar o jogo. Verifique o console para mais detalhes.");
        }
    },

    // Atualiza a lista de elementos que podem ser selecionados com gestos
    updateSelectableElements() {
        this.selectableElements = Array.from(document.querySelectorAll('.gesture-selectable'));
    },

    // Redimensiona o canvas para preencher o container e recria as sementes se o jogo estiver rodando
    resizeCanvas() {
        if (!this.overlay || !this.gameContainer) return; // Checagem de segurança
        this.overlay.width = this.gameContainer.clientWidth;
        this.overlay.height = this.gameContainer.clientHeight;
        // CORREÇÃO APLICADA AQUI: Remove '&& this.seeds.length > 0'
        if (this.playing) {
             this.createSeeds(); // Cria/Recria as sementes sempre que o jogo está rodando
        } else if (this.player.loaded) { // Posiciona o jogador se não estiver jogando
            this.player.x = this.overlay.width / 2 - this.player.width / 2;
            this.player.y = this.overlay.height * 0.8 - this.player.height;
        }
    },

    // Carrega todas as perguntas do arquivo JSON para a matéria selecionada
    async loadAllQuestions(avatarId) {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allJsonQuestions = await response.json();
            // Remove números do ID do avatar para encontrar a matéria correspondente no JSON
            const normalizedAvatarId = avatarId.replace(/\d/g, '');
            if (allJsonQuestions[normalizedAvatarId]) {
                // Formata as perguntas e as armazena no banco de perguntas do jogo
                this.gameQuestionBank = allJsonQuestions[normalizedAvatarId].map(q => this.formatQuestion(q, "Desafio do Saber"));
                this.shuffleArray(this.gameQuestionBank); // Embaralha o banco de perguntas AQUI
                console.log(`Carregadas ${this.gameQuestionBank.length} perguntas para ${normalizedAvatarId}`); // Log
            } else {
                console.error(`Matéria "${normalizedAvatarId}" não encontrada em questions.json. IDs disponíveis:`, Object.keys(allJsonQuestions));
                throw new Error(`Matéria "${normalizedAvatarId}" não encontrada em questions.json`);
            }
        } catch (error) {
             console.error("Erro detalhado ao carregar perguntas:", error);
             alert("Não foi possível carregar as perguntas. O jogo usará perguntas padrão.");
             // Fallback com perguntas genéricas se o carregamento falhar
             this.gameQuestionBank = Array.from({ length: this.seedsPerLevel * this.totalLevels }, (_, i) => ({
                 name: "Desafio Genérico",
                 question: { text: `Pergunta de fallback ${i + 1}?`, choices: ["A) Sim", "B) Não", "C) Talvez", "D) Com certeza"], answer: 0, hint: "Pense bem." },
                 explanation: "Esta é uma pergunta de fallback."
             }));
             this.shuffleArray(this.gameQuestionBank);
        }
    },

    // Formata a estrutura da pergunta do JSON para o formato usado no jogo
    formatQuestion(q, name) {
        if (!q || !q.resposta_correta || !q.alternativas || !Array.isArray(q.alternativas) || q.alternativas.length === 0) {
            console.error("Pergunta mal formatada encontrada:", q);
            // Retorna uma pergunta padrão para evitar erros
             return {
                 name: "Erro",
                 question: { text: `Erro ao carregar pergunta`, choices: ["Ok"], answer: 0, hint: "Erro" },
                 explanation: "Houve um erro."
             };
        }
        // Encontra o índice da resposta correta (A=0, B=1, C=2, D=3)
        const correctLetter = q.resposta_correta.trim().charAt(0).toUpperCase();
        let correctIndex = q.alternativas.findIndex(alt => alt.trim().charAt(0).toUpperCase() === correctLetter);

         // Fallback se a letra não for encontrada (ex: resposta escrita por extenso)
         if (correctIndex === -1) {
             console.warn("Não foi possível encontrar o índice da resposta correta pela letra, tentando buscar pelo texto:", q.resposta_correta);
             correctIndex = q.alternativas.findIndex(alt => alt.trim() === q.resposta_correta.trim());
             if (correctIndex === -1) {
                 console.error("Não foi possível determinar o índice correto para:", q);
                 correctIndex = 0; // Assume a primeira como correta para evitar erro fatal
             }
         }


        // Cria a explicação que será mostrada após a resposta
        const explanation = `A resposta correta é: ${q.alternativas[correctIndex]}`;
        return {
            name: name,
            question: {
                text: q.pergunta,
                choices: q.alternativas.map(alt => alt.substring(alt.indexOf(')') + 1).trim()), // Remove "A) ", "B) " etc. com mais segurança
                answer: correctIndex, // Índice da resposta correta
                hint: q.dica || "Pense com cuidado." // Usa a dica do JSON ou uma padrão
            },
            explanation: explanation
        };
    },

    // Configura a biblioteca MediaPipe Hands para rastreamento de mãos
    setupHandTracking() {
        const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        hands.setOptions({
            maxNumHands: 1, // Rastrear apenas uma mão
            modelComplexity: 1, // Modelo mais preciso
            minDetectionConfidence: 0.6, // Confiança mínima para detecção inicial
            minTrackingConfidence: 0.6 // Confiança mínima para rastreamento contínuo
        });
        // Define a função a ser chamada quando resultados de rastreamento estiverem disponíveis
        hands.onResults(results => this.onHandResults(results));

        // Configura a câmera para enviar frames para o MediaPipe Hands
        const camera = new Camera(this.videoGesture, {
            onFrame: async () => await hands.send({ image: this.videoGesture }),
            width: 640, height: 480 // Resolução da câmera (pode ajustar)
        });
        camera.start().catch(err => {
             console.error("Erro ao iniciar a câmera:", err);
             alert("Não foi possível acessar a câmera. Verifique as permissões.");
        });
    },

    // Processa os resultados do rastreamento de mãos
    onHandResults(results) {
        if (!this.ctx) return; // Segurança extra
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height); // Limpa o canvas
        let handLandmarks = null;
        // Pega os pontos da primeira mão detectada, se houver
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
            handLandmarks = results.multiHandLandmarks[0];
        }

        if (this.playing) { // Se o jogo está em andamento
            this.drawEnvironment(); // Desenha o cenário
            // Se um modal está ativo ou o jogo acabou, usa gestos para seleção de UI
            if (this.isGameOver || this.isHintActive || this.isQuestionActive) {
                this.handCursor.style.display = 'block'; // Mostra o cursor de mão
                this.handleGestureSelection(handLandmarks);
            } else { // Senão, usa gestos para movimento e coleta
                this.handCursor.style.display = 'none'; // Esconde o cursor de mão
                this.detectMovement(handLandmarks); // Move o jogador
                this.checkSeedCollision(handLandmarks); // Verifica colisão e coleta de sementes
            }
            this.drawSeeds(); // Desenha as sementes
            this.drawPlayer(); // Desenha o jogador
        } else { // Se na tela inicial ou game over, usa gestos para seleção de UI
            this.handCursor.style.display = 'block';
            this.handleGestureSelection(handLandmarks);
        }
    },

    // Lida com a seleção de elementos da UI usando gestos
    handleGestureSelection(landmarks) {
        // Filtra apenas os elementos selecionáveis que estão visíveis
        const activeElements = this.selectableElements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none'; // Verifica se o elemento tem dimensões e está visível
        });

        if (!landmarks) { // Se nenhuma mão foi detectada
            this.handCursor.style.opacity = '0'; // Esconde o cursor
            this.resetHoverState(activeElements); // Reseta o estado de hover
            return;
        }

        this.handCursor.style.opacity = '1'; // Mostra o cursor
        const controlPoint = landmarks[8]; // Ponto de controle: ponta do dedo indicador
        // Converte as coordenadas normalizadas (0 a 1) para coordenadas da tela
        const fingerX = (1 - controlPoint.x) * window.innerWidth; // Inverte X para espelhar
        const fingerY = controlPoint.y * window.innerHeight;
        // Posiciona o cursor de mão
        this.handCursor.style.left = `${fingerX}px`;
        this.handCursor.style.top = `${fingerY}px`;

        let foundElement = null;
        // Verifica se o dedo está sobre algum elemento selecionável ativo
        activeElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (fingerX > rect.left && fingerX < rect.right && fingerY > rect.top && fingerY < rect.bottom) {
                foundElement = element;
            }
        });

        if (foundElement) { // Se o dedo está sobre um elemento
            if (this.hoveredElement !== foundElement) { // Se é um novo elemento
                this.resetHoverState(activeElements); // Reseta o hover anterior
                this.hoveredElement = foundElement; // Define o novo elemento hover
                this.hoverStartTime = Date.now(); // Marca o início do hover
                this.isSelectionLocked = false; // Libera a trava de seleção
                this.hoveredElement.classList.add('hovered'); // Adiciona classe hover visualmente
            } else if (!this.isSelectionLocked) { // Se continua no mesmo elemento e não está travado
                const elapsedTime = Date.now() - this.hoverStartTime; // Calcula tempo de hover
                const progressBar = this.hoveredElement.querySelector('.selection-progress');

                if (progressBar) { // Atualiza a barra de progresso
                     const progress = (elapsedTime / this.SELECTION_TIME_MS) * 100;
                     progressBar.style.width = `${Math.min(progress, 100)}%`;
                }

                if (elapsedTime > this.SELECTION_TIME_MS) { // Se o tempo de hover foi atingido
                    this.isSelectionLocked = true; // Trava a seleção
                    this.hoveredElement.classList.add('selected'); // Feedback visual (opcional)
                    const actionType = foundElement.dataset.actionType;
                    const actionValue = foundElement.dataset.actionValue;

                    console.log("Selecionado:", actionType, actionValue); // Log para debug

                    // Executa a ação correspondente
                    switch (actionType) {
                        case 'start': this.startGame(); break;
                        case 'restart': this.resetGame(); break; // startGame já chama resetGame e startTimer
                        case 'navigate': if (actionValue) window.location.href = actionValue; break;
                        default:
                             console.log("Tentando click em:", foundElement); // Log para debug
                             if (foundElement.onclick) {
                                  foundElement.onclick(); // Chama a função onclick se existir
                             } else {
                                  foundElement.click(); // Fallback: simula um clique normal
                             }
                             break;
                    }
                     // Reseta após um tempo para permitir nova seleção
                     setTimeout(() => {
                         this.resetHoverState(activeElements);
                     }, 500);
                }
            }
        } else { // Se o dedo não está sobre nenhum elemento selecionável
            this.resetHoverState(activeElements);
        }
    },


    // Reseta o estado de hover e a barra de progresso
    resetHoverState(elements) {
        if (this.hoveredElement) {
             this.hoveredElement.classList.remove('hovered', 'selected');
             const progressBar = this.hoveredElement.querySelector('.selection-progress');
             if (progressBar) progressBar.style.width = '0%';
        }
        this.hoveredElement = null;
        this.hoverStartTime = null;
        this.isSelectionLocked = false; // Garante que a trava seja liberada
        // Garante que todos os outros elementos também sejam resetados
        elements.forEach(el => {
             // Não precisa verificar se é o hoveredElement aqui, pois ele já foi tratado ou é null
             el.classList.remove('hovered', 'selected');
             const progressBar = el.querySelector('.selection-progress');
             if (progressBar) progressBar.style.width = '0%';
         });
    },

    // Inicia o jogo
    startGame() {
        if(this.playing) return; // Não inicia se já estiver jogando
        console.log("Iniciando Jogo..."); // Log
        this.playing = true;
        audioManager.playMusic(); // Toca a música de fundo

        // Configura a câmera do jogo (overlay) se ainda não estiver ativa
        if(!this.videoInGame.srcObject) {
            console.log("Configurando câmera in-game..."); // Log
            const handsInGame = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
            handsInGame.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
            handsInGame.onResults(results => this.onHandResults(results)); // Reutiliza a mesma função de callback
            const cameraInGame = new Camera(this.videoInGame, {
                onFrame: async () => {
                    if (this.videoInGame) { // Verifica se videoInGame existe
                        await handsInGame.send({ image: this.videoInGame });
                    }
                 },
                width: 640, height: 480
            });
            cameraInGame.start().catch(err => console.error("Erro cameraInGame:", err)); // Log erro
        }

        // Ativa a mini câmera no canto da tela
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => {
                 if (this.miniCam) { // Verifica se miniCam existe
                     this.miniCam.srcObject = stream;
                     console.log("Mini Câmera ativada."); // Log
                 }
            })
            .catch(err => console.error("Erro na mini-câmera:", err));

        // Esconde a tela inicial e mostra o HUD
        if(this.startOverlay) this.startOverlay.style.opacity = '0';
        setTimeout(() => { if(this.startOverlay) this.startOverlay.style.display = 'none'; }, 500); // Esconde após a transição
        if(this.gameHud) this.gameHud.style.visibility = 'visible';

        this.resetGame(); // Reseta o estado do jogo (pontos, vidas, nível)
        this.startTimer(); // Inicia o timer do jogo
        this.updateSelectableElements(); // Garante que os elementos corretos são selecionáveis
    },


    // Reseta o estado do jogo para começar novamente
    resetGame() {
        console.log("Resetando Jogo..."); // Log
        this.stopTimer(); // Para o timer se estiver rodando
        this.remainingTime = this.initialTime; // Reseta a variável de tempo
        this.updateTimerDisplay(); // Atualiza a exibição do timer
        audioManager.stopMusic(); // Para a música
        audioManager.playMusic(); // Toca a música novamente
        // Reseta as variáveis de estado
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.hintsRemaining = 3;
        this.usedHints = [];
        this.isQuestionActive = false;
        this.isHintActive = false;
        this.isGameOver = false;
        this.playing = true; // Define o jogo como ativo

        // Esconde a tela de Game Over
        if(this.gameoverOverlay) this.gameoverOverlay.classList.remove('active');
        // Configura o primeiro nível
        this.setupLevel();
        // Atualiza o HUD
        this.updateHud();
        this.updateSelectableElements(); // Garante que os elementos corretos são selecionáveis
    },

    // --- Funções do Timer ---
    startTimer() {
        this.stopTimer(); // Garante que não haja timers duplicados
        this.remainingTime = this.initialTime; // Define o tempo inicial
        this.updateTimerDisplay(); // Mostra o tempo inicial
        console.log("Timer iniciado:", this.initialTime); // Log
        this.gameTimer = setInterval(() => { // Inicia o intervalo de 1 segundo
            if (!this.playing || this.isGameOver) { // Para o timer se o jogo não estiver ativo
                this.stopTimer();
                return;
            }
            this.remainingTime--; // Decrementa o tempo
            this.updateTimerDisplay(); // Atualiza a exibição
            if (this.remainingTime <= 0) { // Se o tempo acabou
                console.log("Tempo esgotado!"); // Log
                this.stopTimer(); // Para o timer
                this.showGameOver(false); // Fim de jogo
            }
        }, 1000);
    },

    stopTimer() {
        if (this.gameTimer) {
             clearInterval(this.gameTimer); // Limpa o intervalo do timer
             this.gameTimer = null;
             console.log("Timer parado."); // Log
        }
    },


    updateTimerDisplay() {
        if (!this.timerEl) return; // Verifica se o elemento existe
        const minutes = Math.floor(this.remainingTime / 60); // Calcula minutos
        const seconds = this.remainingTime % 60; // Calcula segundos
        // Formata para MM:SS e atualiza o elemento HTML
        this.timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    addTime(seconds) {
        if (!this.playing || this.isGameOver) return; // Não adiciona tempo se o jogo acabou
        this.remainingTime += seconds;
        console.log(`Adicionado ${seconds}s. Novo tempo: ${this.remainingTime}`); // Log
        this.updateTimerDisplay(); // Atualiza a exibição
    },

    subtractTime(seconds) {
        if (!this.playing || this.isGameOver) return; // Não subtrai tempo se o jogo acabou
        this.remainingTime -= seconds;
        this.remainingTime = Math.max(0, this.remainingTime); // Garante que não fique negativo
        console.log(`Subtraído ${seconds}s. Novo tempo: ${this.remainingTime}`); // Log
        this.updateTimerDisplay(); // Atualiza a exibição
        if (this.remainingTime <= 0) { // Verifica se o tempo acabou após subtrair
            console.log("Tempo esgotado após erro!"); // Log
            this.stopTimer();
            this.showGameOver(false);
        }
    },
    // --- Fim das Funções do Timer ---

    // Move o jogador com base nos pontos da mão (dedo indicador)
    detectMovement(landmarks) {
        if (landmarks) {
            const controlPoint = landmarks[8]; // Ponta do dedo indicador
            // Calcula a posição X e Y alvo na tela com base na posição do dedo
            const targetX = (1 - controlPoint.x) * this.overlay.width - (this.player.width / 2); // Inverte X
            const targetY = controlPoint.y * this.overlay.height - (this.player.height / 2);
            // Suaviza o movimento (Linear Interpolation)
            const lerpFactor = 0.4; // Quão rápido o jogador segue a mão (0 a 1)
            this.player.x += (targetX - this.player.x) * lerpFactor;
            this.player.y += (targetY - this.player.y) * lerpFactor;
        }
        // Impede que o jogador saia dos limites da tela
        this.player.x = Math.max(0, Math.min(this.overlay.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.overlay.height - this.player.height, this.player.y));
    },

    // Configura o nível atual do jogo
    setupLevel() {
        console.log(`Configurando Nível ${this.currentLevel}`); // Log
        this.levelProgress = 0; // Reseta o progresso do nível
        this.seeds = []; // Limpa sementes do nível anterior
        // Seleciona as perguntas para este nível do banco geral
        const startIndex = (this.currentLevel - 1) * this.seedsPerLevel;
        const endIndex = Math.min(startIndex + this.seedsPerLevel, this.gameQuestionBank.length);
        this.currentLevelQuestions = this.gameQuestionBank.slice(startIndex, endIndex);

        console.log(`Perguntas para o nível ${this.currentLevel}: ${this.currentLevelQuestions.length}`); // Log

        if (this.currentLevelQuestions.length === 0 && this.gameQuestionBank.length > 0 && this.currentLevel > 1) { // Verifica se é > 1 para não terminar no início
             console.warn("Não há mais perguntas únicas para este nível. Fim de jogo (vitória).");
             this.showGameOver(true); // Considera vitória se acabou as perguntas
             return;
        } else if (this.gameQuestionBank.length === 0) {
             console.error("Banco de perguntas está vazio!");
             this.showGameOver(false); // Termina se não há perguntas
             return;
        } else if (this.currentLevelQuestions.length < this.seedsPerLevel && this.currentLevel <= this.totalLevels) {
             console.warn(`Nível ${this.currentLevel} terá apenas ${this.currentLevelQuestions.length} sementes (menos que o esperado).`);
        }

        // É crucial chamar createSeeds DEPOIS de definir currentLevelQuestions
        this.createSeeds(); // Cria as sementes para o nível
        this.resizeCanvas(); // Ajusta o canvas (não vai recriar sementes pois elas já existem)
        this.updateHud(); // Atualiza informações na tela
        // Posiciona o jogador no início do nível
        this.player.x = this.overlay.width / 2 - this.player.width / 2;
        this.player.y = this.overlay.height * 0.8 - this.player.height;
        this.updateSelectableElements(); // Atualiza elementos selecionáveis
    },


    // Cria as sementes na tela em posições aleatórias
    createSeeds() {
        console.log(`Criando ${this.currentLevelQuestions.length} sementes...`); // Log
        this.seeds = []; // Limpa array antes de criar
        const seedsToCreate = this.currentLevelQuestions.length; // Cria o número de sementes baseado nas perguntas do nível
        if (seedsToCreate === 0) {
            console.warn("Nenhuma pergunta para o nível, Nenhuma semente será criada.");
            return; // Sai se não há perguntas
        }
        for (let i = 0; i < seedsToCreate; i++) {
            this.seeds.push({
                x: Math.random() * (this.overlay.width - 40) + 20, // Posição X aleatória com margem
                y: Math.random() * (this.overlay.height * 0.8 - 60) + 30, // Posição Y aleatória acima do chão (evita ficar muito baixo ou alto)
                size: 20, // Tamanho da semente
                collected: false, // Se já foi coletada
                questionIndexInLevel: i // Associa a semente ao índice da pergunta no array do nível atual
            });
        }
        console.log("Sementes criadas:", this.seeds); // Log
    },

    // Atualiza os elementos do HUD (pontos, vidas, nível, progresso)
    updateHud() {
        if (!this.scoreEl || !this.livesEl || !this.levelEl || !this.envStatusEl) return; // Verificação
        this.scoreEl.textContent = this.score;
        this.livesEl.textContent = this.lives;
        this.levelEl.textContent = this.currentLevel;
        // Mostra o progresso como "sementes coletadas / total de sementes no nível"
        const totalSeedsInLevel = this.currentLevelQuestions.length > 0 ? this.currentLevelQuestions.length : this.seedsPerLevel;
        this.envStatusEl.querySelector('span').textContent = `${this.levelProgress} / ${totalSeedsInLevel}`;
        this.updateTimerDisplay(); // Atualiza o timer também
    },

    // Verifica colisão do jogador com sementes e se o gesto de pinça está sendo feito
    checkSeedCollision(landmarks) {
        this.collectibleSeed = null; // Reseta a semente coletável
        let isPinching = false; // Flag para o gesto de pinça

        if (landmarks) { // Se a mão foi detectada
            const thumbTip = landmarks[4]; // Ponta do dedão
            const indexTip = landmarks[8]; // Ponta do indicador
            // Calcula a distância entre as pontas dos dedos (normalizada)
            const distance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2)
            );
            // Se a distância for pequena, considera como pinça
            const pinchThreshold = 0.05; // Ajuste este valor se necessário
            if (distance < pinchThreshold) {
                isPinching = true;
            }
        }

        // Itera sobre as sementes
        for (const seed of this.seeds) {
            if (!seed.collected) { // Se a semente ainda não foi coletada
                // Calcula a distância entre o centro do jogador e o centro da semente
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const seedCenterX = seed.x + seed.size / 2; // Usa o 'x' da semente
                const seedCenterY = seed.y + seed.size / 2; // Usa o 'y' da semente
                const distance = Math.sqrt(Math.pow(playerCenterX - seedCenterX, 2) + Math.pow(playerCenterY - seedCenterY, 2));

                // Se a distância for menor que a soma dos raios (aproximados), há colisão
                 const collisionThreshold = this.player.width / 2 + seed.size * 1.5; // Aumenta um pouco a área de colisão da semente
                if (distance < collisionThreshold) {
                    this.collectibleSeed = seed; // Marca esta semente como coletável
                     // console.log("Próximo da semente:", seed.questionIndexInLevel, "Pinching:", isPinching); // Log para debug
                    if (isPinching) { // Se está fazendo pinça E colidindo
                         console.log("Tentando coletar semente:", seed.questionIndexInLevel); // Log
                        this.triggerQuestion(seed); // Ativa a pergunta
                    }
                    break; // Para o loop pois só pode coletar uma semente por vez
                }
            }
        }
    },

     // Ativa o modal de pergunta associado à semente coletada
    triggerQuestion(seed) {
         // Não faz nada se um modal já está ativo, o jogo acabou, ou se esta semente específica já foi coletada
         if (this.isQuestionActive || this.isGameOver || seed.collected || this.levelProgress >= this.currentLevelQuestions.length) {
              // console.log("Trigger bloqueado:", this.isQuestionActive, this.isGameOver, seed.collected, this.levelProgress, this.currentLevelQuestions.length); // Log
              return;
         }

         // Verifica se o índice da pergunta é válido
         if (seed.questionIndexInLevel < 0 || seed.questionIndexInLevel >= this.currentLevelQuestions.length) {
              console.error("Índice de pergunta inválido na semente:", seed.questionIndexInLevel, "Total de perguntas no nível:", this.currentLevelQuestions.length);
              return;
         }


         console.log("Ativando pergunta para semente:", seed.questionIndexInLevel); // Log
         this.isQuestionActive = true; // Marca que um modal está ativo
         const question = this.currentLevelQuestions[seed.questionIndexInLevel]; // Pega a pergunta correta
         this.currentQuestionForHint = question; // Armazena para a função de dica

         // Status da dica para passar ao questionManager
         const hintStatus = {
             show: true, // Mostra sempre o botão (AJUSTADO - antes era >= 2)
             remaining: this.hintsRemaining
         };

         // Mostra o modal de pergunta
         questionManager.show(question, (isCorrect, explanation) => {
             // --- Callback chamado após a resposta ser dada e o modal fechado ---
             console.log("Resposta recebida:", isCorrect); // Log
             this.currentQuestionForHint = null; // Limpa a pergunta atual para dica
             if (isCorrect) {
                 audioManager.playSound(audioManager.correctSound); // Som de acerto
                 this.score += 100; // Aumenta a pontuação
                 this.levelProgress++; // Incrementa o progresso do nível
                 seed.collected = true; // Marca a semente como coletada permanentemente
                 this.addTime(20); // Adiciona 20 segundos ao timer (NOVO)
                 // Mostra feedback de acerto
                 this.showFeedbackModal(true, explanation, "+100 Pontos, +20 Segundos!", () => {
                     this.checkLevelCompletion(); // Verifica se o nível ou jogo acabou
                 });
             } else {
                 audioManager.playSound(audioManager.wrongSound); // Som de erro
                 this.lives--; // Decrementa vidas
                 this.subtractTime(15); // Subtrai 15 segundos do timer (NOVO)
                 seed.collected = false; // Permite tentar coletar novamente
                 this.updateHud(); // Atualiza o HUD (vidas e tempo)
                 // Mostra feedback de erro
                 this.showFeedbackModal(false, explanation, "-1 Vida, -15 Segundos!", () => {
                      this.isQuestionActive = false; // Libera modal APÓS feedback
                      if (this.lives <= 0 || this.remainingTime <= 0) { // Verifica se perdeu
                          this.showGameOver(false);
                      }
                 });
             }
             // Não atualiza HUD ou chama checkLevelCompletion aqui para acerto, pois fazemos isso no callback do feedback
         }, hintStatus); // Passa o status da dica
     },

     // Verifica se o nível ou o jogo foi concluído (chamado após feedback de acerto)
     checkLevelCompletion() {
         this.updateHud(); // Atualiza o HUD (pontos, progresso, tempo)
         this.isQuestionActive = false; // Libera a flag do modal
         console.log(`Progresso: ${this.levelProgress} / ${this.currentLevelQuestions.length}`); // Log

         if (this.levelProgress >= this.currentLevelQuestions.length) { // Se completou o nível
             console.log(`Nível ${this.currentLevel} completo!`); // Log
             if (this.currentLevel < this.totalLevels) { // Se não for o último nível
                 this.currentLevel++; // Avança para o próximo nível
                 this.setupLevel(); // Configura o novo nível
             } else { // Se completou o último nível
                 console.log("Último nível completo! Vitória!"); // Log
                 this.showGameOver(true); // Fim de jogo com vitória
             }
         }
         // Se não completou o nível, o jogo continua normalmente
     },


    // Mostra o modal para escolher um avatar de dica
    showHintModal() {
        // Não mostra se não há dicas restantes ou se não há pergunta ativa
        if (this.hintsRemaining <= 0 || !this.isQuestionActive || this.isHintActive) return;
        console.log("Mostrando modal de dica..."); // Log
        // Marca os avatares já usados como desabilitados visualmente
        this.hintAvatarsContainer.querySelectorAll('.hint-avatar').forEach(avatar => {
            avatar.classList.toggle('used', this.usedHints.includes(avatar.dataset.avatar));
        });
        this.isHintActive = true; // Marca que o modal de dica está ativo
        this.hintModal.classList.add('active'); // Mostra o modal
        this.updateSelectableElements(); // Atualiza elementos para seleção por gesto
    },

    // Usa a dica de um avatar específico
    useHint(avatarId) {
        // Não usa se o avatar já foi usado, não há dicas restantes, ou se o modal não está ativo
        if (this.usedHints.includes(avatarId) || this.hintsRemaining <= 0 || !this.isHintActive) return;
        console.log(`Usando dica do ${avatarId}`); // Log
        this.hintsRemaining--; // Decrementa dicas restantes
        this.usedHints.push(avatarId); // Adiciona o avatar à lista de usados
        this.isHintActive = false; // Marca que o modal de dica não está mais ativo
        this.hintModal.classList.remove('active'); // Esconde o modal de seleção de dica

        // Pega a resposta correta da pergunta atual
        if (!this.currentQuestionForHint || this.currentQuestionForHint.question.answer === undefined) {
             console.error("Erro: Tentando usar dica sem uma pergunta válida.");
             return;
        }
        const correctAnswerIndex = this.currentQuestionForHint.question.answer;
        const correctAnswerText = this.currentQuestionForHint.question.choices[correctAnswerIndex];
        const avatarData = hintAvatarData[avatarId]; // Pega dados do avatar (nome, imagem)

        // Prepara e mostra o modal de resultado da dica
        const resultIcon = document.getElementById('hint-result-icon');
        const resultText = document.getElementById('hint-result-text');
        if (resultIcon) resultIcon.src = avatarData.img; // Imagem do avatar que deu a dica
        if (resultText) resultText.innerHTML = `${avatarData.name} diz: <br><span>"${correctAnswerText}"</span>`; // Texto da dica

        this.hintResultModal.classList.add('active'); // Mostra o modal de resultado
        // Esconde o modal de resultado após 3 segundos e destaca a resposta correta no modal de pergunta
        setTimeout(() => {
            this.hintResultModal.classList.remove('active');
            // Encontra o botão da alternativa correta e o marca
            if (questionManager.choiceElements && questionManager.choiceElements[correctAnswerIndex]) {
                 const correctChoiceEl = questionManager.choiceElements[correctAnswerIndex];
                 correctChoiceEl.classList.add('correct'); // Adiciona classe para destaque visual
            }
             // Reativa a possibilidade de selecionar alternativas por gesto
             this.isSelectionLocked = false; // Libera trava
             this.updateSelectableElements();
        }, 3000);

         // Atualiza o botão de dica no modal de pergunta para refletir dicas restantes
         if (questionManager.hintBtn) {
             questionManager.hintBtn.querySelector('span').textContent = this.hintsRemaining;
             questionManager.hintBtn.classList.toggle('disabled', this.hintsRemaining <= 0);
         }
         this.updateSelectableElements(); // Atualiza para o botão de dica refletir o estado 'disabled'
    },


    // Mostra um modal rápido de feedback (acerto/erro)
    showFeedbackModal(isCorrect, explanation, message, onEndCallback) { // Adicionado 'message' como parâmetro
        if (!this.feedbackOverlay) return; // Verificação
        this.feedbackOverlay.style.display = 'flex'; // Mostra o overlay
        this.feedbackIcon.textContent = isCorrect ? '🎉' : '😔'; // Ícone de acerto ou erro
        this.feedbackTitle.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta';
        this.feedbackTitle.style.color = isCorrect ? 'var(--success)' : 'var(--danger)'; // Cor do título
        this.feedbackMessage.textContent = message; // Mensagem (pontos ganhos/vida perdida + tempo)
        this.feedbackExplanation.textContent = explanation; // Mostra explicação (resposta correta)
        // Esconde o feedback após 2.5 segundos
        setTimeout(() => {
            if (this.feedbackOverlay) this.feedbackOverlay.style.display = 'none';
            if (onEndCallback) onEndCallback(); // Chama o callback (se existir) para continuar o fluxo do jogo
        }, 2500); // Duração do feedback
    },

    // Desenha o jogador na tela
    drawPlayer() {
        if (!this.ctx) return;
        if (this.player.loaded && this.player.image.complete && this.player.image.naturalHeight !== 0) { // Se a imagem do avatar carregou corretamente
            this.ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        } else { // Fallback: desenha um retângulo se a imagem não carregou
            this.ctx.fillStyle = '#0077cc'; // Cor azul
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    },

    // Desenha as sementes na tela
    drawSeeds() {
        if (!this.ctx) return;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        // console.log("Desenhando sementes:", this.seeds.length); // Log para debug
        for (const seed of this.seeds) {
            if (!seed.collected) { // Se não foi coletada
                this.ctx.save(); // Salva o estado atual do canvas
                // Adiciona uma sombra para destaque
                this.ctx.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))';
                this.ctx.font = `${seed.size * 1.6}px Poppins`; // Ajusta tamanho do emoji baseado no size
                this.ctx.fillText("🌱", seed.x + seed.size / 2, seed.y + seed.size / 2); // Desenha o emoji da semente no centro
                this.ctx.restore(); // Restaura o estado do canvas
            }
        }
        // Se há uma semente coletável E não há modal ativo, mostra o ícone de pinça acima do jogador
        if (this.collectibleSeed && !this.isQuestionActive && !this.isHintActive && !this.isGameOver) {
            this.ctx.font = "24px Poppins";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("🤏", this.player.x + this.player.width / 2, this.player.y - 20); // Ícone de pinça
        }
    },


    // Desenha o ambiente/cenário de fundo com base no nível atual
    drawEnvironment() {
        if (!this.ctx) return;
        this.ctx.save(); // Salva o estado do canvas
        const horizontalPadding = this.overlay.width * 0.1; // Margem nas laterais
        const effectiveWidth = this.overlay.width - (2 * horizontalPadding); // Largura útil
        const elementsInLevel = this.currentLevelQuestions.length > 0 ? this.currentLevelQuestions.length : this.seedsPerLevel; // Número de "elementos" no cenário
        const elementSpacing = elementsInLevel > 1 ? effectiveWidth / (elementsInLevel - 1) : effectiveWidth / 2; // Espaçamento entre elementos

        // Define a cor de fundo padrão
        let backgroundColor = '#0a192f'; // Cor padrão escura

        // Nível 1: Cenário árido -> Crescem árvores
        if (this.currentLevel === 1) {
            backgroundColor = '#8B4513'; // Cor de terra seca
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height); // Preenche o fundo
            // Desenha "tocos" ou espaços para as árvores
            for (let i = 0; i < elementsInLevel; i++) {
                const xPos = horizontalPadding + (elementSpacing * i) - 20; // Ajuste para centralizar
                this.ctx.fillStyle = '#5a2d0c'; // Cor mais escura
                this.ctx.fillRect(xPos, this.overlay.height - 40, 40, 20); // Base
                this.ctx.fillStyle = '#654321'; // Cor intermediária
                this.ctx.fillRect(xPos + 5, this.overlay.height - 50, 30, 10); // Topo
            }
            // Desenha as árvores que já cresceram (baseado no levelProgress)
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (elementSpacing * i);
                this.ctx.font = `60px Poppins`;
                this.ctx.fillText("🌳", xPos, this.overlay.height - 70); // Emoji de árvore
            }
        // Nível 2: Ambiente aquático poluído -> Peixes aparecem
        } else if (this.currentLevel === 2) {
            backgroundColor = `rgb(60, 80, 100)`; // Cor de água escura/poluída
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            // Desenha o lixo restante
            const remainingTrash = elementsInLevel - this.levelProgress;
            const trashSpacing = effectiveWidth / (remainingTrash + 1);
            for (let i = 0; i < remainingTrash; i++) {
                const xPos = horizontalPadding + trashSpacing * (i + 1);
                this.ctx.font = `30px Poppins`;
                this.ctx.fillText("🗑️", xPos, 150 + (i % 2 * 50)); // Lixeira
                this.ctx.fillText("🧴", xPos + 20, 200 + (i % 3 * 30)); // Garrafa
            }
            // Desenha os peixes que apareceram
            const fishSpacing = effectiveWidth / (elementsInLevel + 1);
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + fishSpacing * (i + 1);
                this.ctx.font = `40px Poppins`;
                this.ctx.fillText("🐠", xPos + (i % 2 * 30), 180 + (i % 2 * 50)); // Peixe
                this.ctx.fillText("🐬", xPos - (i % 2 * 20), 250 - (i % 2 * 30)); // Golfinho
            }
        // Nível 3: Cidade poluída -> Carros são substituídos por bicicletas/ônibus
        } else if (this.currentLevel === 3) {
            backgroundColor = '#1a1a2e'; // Fundo noturno/escuro
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            // Desenha prédios simples
            const buildingPositions = [0.1, 0.3, 0.5, 0.7, 0.9];
            buildingPositions.forEach((pos, index) => {
                const x = horizontalPadding + (effectiveWidth * pos) - 50;
                const h = 150 + (index % 2 * 50); // Alturas variadas
                this.ctx.fillStyle = '#3a3a5e'; // Cor dos prédios
                this.ctx.fillRect(x, this.overlay.height - (h + 50), 90 + (index % 2 * 20), h); // Desenha o prédio
            });
            // Desenha a rua
            this.ctx.fillStyle = '#555'; // Cor do asfalto
            this.ctx.fillRect(0, this.overlay.height - 50, this.overlay.width, 50);
            // Desenha os carros restantes
            const remainingCars = elementsInLevel - this.levelProgress;
            const carSpacing = effectiveWidth / (remainingCars + 1);
            for (let i = 0; i < remainingCars; i++) {
                const xPos = horizontalPadding + carSpacing * (i + 1);
                this.ctx.font = `30px Poppins`;
                this.ctx.fillText("🚗", xPos, this.overlay.height - 20); // Emoji de carro
            }
            // Desenha as bicicletas/ônibus
             const transportSpacing = effectiveWidth / (elementsInLevel + 1);
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + transportSpacing * (i + 1);
                this.ctx.font = `40px Poppins`;
                // Alterna entre bicicleta e ônibus
                this.ctx.fillText(i % 2 === 0 ? "🚲" : "🚌", xPos, this.overlay.height - 20);
            }
        } else { // Fallback para níveis não definidos
             this.ctx.fillStyle = backgroundColor;
             this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
             this.ctx.fillStyle = "white";
             this.ctx.font = "20px Poppins";
             this.ctx.fillText(`Nível ${this.currentLevel} - Cenário Padrão`, this.overlay.width / 2, 50);
        }
        this.ctx.restore(); // Restaura o estado do canvas
    },

    // Mostra a tela de Game Over
    showGameOver(isWinner) {
        console.log("Fim de Jogo. Vitória:", isWinner); // Log
        this.stopTimer(); // Para o timer
        audioManager.stopMusic(); // Para a música
        audioManager.playSound(audioManager.gameoverSound); // Toca som de game over
        this.isGameOver = true; // Marca o estado como game over
        this.playing = false; // Marca que o jogo não está mais ativo

        if (!this.gameoverOverlay) return; // Verificação de segurança

        // Seleciona os elementos do modal de game over
        const icon = document.getElementById('gameover-icon');
        const title = document.getElementById('gameover-title');
        const message = document.getElementById('gameover-message');
        const scoreSpan = document.getElementById('gameover-score').querySelector('span');
        if (scoreSpan) scoreSpan.textContent = this.score; // Mostra a pontuação final

        // Define a mensagem e ícone com base na vitória ou derrota
        if (isWinner) {
            if (icon) icon.textContent = '🎉';
            if (title) {
                title.textContent = 'Parabéns!';
                title.style.color = 'var(--success)';
            }
            if (message) message.textContent = 'Você restaurou o equilíbrio e provou seu conhecimento! O futuro é mais verde graças a você.';
        } else {
            if (icon) icon.textContent = '💔';
            if (title) {
                title.textContent = 'Fim de Jogo';
                title.style.color = 'var(--danger)';
            }
            // Adiciona motivo do game over (tempo ou vidas)
             const reason = this.remainingTime <= 0 ? 'O tempo acabou!' : 'Você ficou sem vidas.';
             if (message) message.textContent = `${reason} Não desista! Cada tentativa é um passo a mais para um planeta sustentável. Tente novamente!`;
        }
        this.gameoverOverlay.classList.add('active'); // Mostra o modal de game over
        this.updateSelectableElements(); // Atualiza elementos para seleção por gesto (botões de reiniciar/trocar avatar)
    }
};
