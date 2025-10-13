document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('real-life-mode')) {
        realLifeGame.init();
    }
});

const avatarImages = {
    'lingua_portuguesa': 'Demetrius.png', 'lingua_portuguesa2': 'Marieli.png', 'lingua_portuguesa3': 'Lucilene.png',
    'quimica': 'Arline.png', 'historia': 'julio.png', 'biologia': 'mayara.png',
    'fisica': 'Romulo.png', 'geografia': 'Jesiane.png', 'matematica': 'Anderson.png',
    'matematica2': 'Márcia.png', 'ingles': 'Flávia.png', 'arte': 'Marcela.png',
    'educacao_fisica': 'Fabrício.png',
};

const questionManager = {
    modal: document.getElementById('questionModal'),
    title: document.getElementById('qTitle'),
    text: document.getElementById('qText'),
    choices: document.getElementById('choices'),
    choiceElements: [], // NOVO: Armazena os elementos das alternativas para detecção de gestos
    show(questionObj, onAnswer) {
        this.choiceElements = []; // Limpa as alternativas anteriores
        this.modal.classList.add('active');
        this.title.textContent = `Desafio: ${questionObj.name}`;
        this.text.textContent = questionObj.question.text;
        this.choices.innerHTML = '';
        questionObj.question.choices.forEach((choice, index) => {
            const btn = document.createElement('div');
            btn.className = 'choice';
            btn.textContent = choice;
            btn.onclick = () => {
                // Desativa todos os eventos de clique após uma resposta
                this.choiceElements.forEach(c => c.onclick = null);
                
                const isCorrect = (index === questionObj.question.answer);
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (!isCorrect) {
                    this.choices.children[questionObj.question.answer].classList.add('correct');
                }
                setTimeout(() => {
                    this.modal.classList.remove('active');
                    this.choiceElements = []; // Limpa as referências aos elementos
                    onAnswer(isCorrect, questionObj.explanation);
                }, 2500);
            };
            this.choices.appendChild(btn);
            this.choiceElements.push(btn); // Adiciona o elemento à lista
        });
    }
};

const realLifeGame = {
    video: document.getElementById('video'),
    miniCam: document.getElementById('miniCam'),
    overlay: document.getElementById('overlay'),
    gameContainer: document.getElementById('real-life-mode'),
    ctx: null,
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
    restartButton: null,

    player: { x: 0, y: 0, width: 60, height: 90, image: new Image(), loaded: false },
    seeds: [],
    gameQuestionBank: [], // Banco de perguntas para todo o jogo
    currentLevelQuestions: [], // Perguntas para o nível atual
    isQuestionActive: false,
    playing: false,
    score: 0,
    lives: 3,
    currentLevel: 1,
    totalLevels: 3,
    levelProgress: 0,
    seedsPerLevel: 5,
    
    // NOVO: Variáveis para controle da resposta por gesto
    hoveredChoiceIndex: -1,
    hoverStartTime: null,
    SELECTION_TIME_MS: 1500, // 1.5 segundos para selecionar

    async init() {
        if (!this.video || !this.overlay) return;
        this.ctx = this.overlay.getContext('2d');
        this.startGameBtn.addEventListener('click', () => this.startGame());

        this.restartButton = document.getElementById('restart-button');
        this.restartButton.addEventListener('click', () => window.location.reload());

        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia';
        this.player.image.src = avatarImages[avatarId] || avatarImages['biologia'];
        this.player.image.onload = () => { this.player.loaded = true; };

        window.addEventListener('resize', () => this.resizeCanvas());

        try {
            await this.loadAllQuestions(avatarId);
            this.setupHandTracking();
        } catch (e) {
            console.error(e);
            alert("Erro ao iniciar o jogo. Verifique as permissões da câmera ou o arquivo de perguntas.");
        }
    },

    resizeCanvas() {
        this.overlay.width = this.gameContainer.clientWidth;
        this.overlay.height = this.gameContainer.clientHeight;
        if (!this.playing && this.player.loaded) {
            this.player.x = this.overlay.width / 2 - this.player.width / 2;
            this.player.y = this.overlay.height * 0.8 - this.player.height;
        }
    },

    async loadAllQuestions(avatarId) {
        const response = await fetch('questions.json');
        const allJsonQuestions = await response.json();
        const normalizedAvatarId = avatarId.replace(/\d/g, '');

        if (allJsonQuestions[normalizedAvatarId]) {
            // ALTERADO: Carrega todas as perguntas da matéria para o banco principal do jogo
            this.gameQuestionBank = allJsonQuestions[normalizedAvatarId].map(q => this.formatQuestion(q, "Desafio do Saber"));
        } else {
            throw new Error(`Matéria "${normalizedAvatarId}" não encontrada em questions.json`);
        }
    },

    formatQuestion(q, name) {
        const correctLetter = q.resposta_correta.charAt(0);
        const correctIndex = correctLetter.charCodeAt(0) - 'A'.charCodeAt(0);
        const explanation = `A resposta correta é: ${q.alternativas[correctIndex]}`;
        return {
            name: name,
            question: { text: q.pergunta, choices: q.alternativas.map(alt => alt.substring(3)), answer: correctIndex },
            explanation
        };
    },

    setupHandTracking() {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        hands.onResults(results => this.onHandResults(results));

        const camera = new Camera(this.video, {
            onFrame: async () => await hands.send({ image: this.video }),
            width: 640,
            height: 480
        });
        camera.start();

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => { this.miniCam.srcObject = stream; })
            .catch(err => console.error("Erro na mini-câmera:", err));
    },

    onHandResults(results) {
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        
        if (this.playing) {
            this.drawEnvironment();
            if (this.isQuestionActive) {
                // NOVO: Lógica para resposta por gesto
                this.handleGestureAnswer(results);
            } else {
                this.detectMovement(results);
                this.checkSeedCollision();
            }
            this.drawSeeds();
            this.drawPlayer();
        } else if (this.player.loaded) { // Tela inicial
             this.drawEnvironment();
             this.drawPlayer();
        }
    },

    handleGestureAnswer(results) {
        let handDetected = false;
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
            const landmarks = results.multiHandLandmarks[0];
            const controlPoint = landmarks[8]; // Ponta do dedo indicador
            const fingerX = (1 - controlPoint.x) * this.overlay.width;
            const fingerY = controlPoint.y * this.overlay.height;

            handDetected = true;
            let choiceFound = -1;

            questionManager.choiceElements.forEach((choiceEl, index) => {
                const rect = choiceEl.getBoundingClientRect();
                // Ajusta as coordenadas do BoundingClientRect para o canvas
                const canvasRect = this.overlay.getBoundingClientRect();
                if (fingerX > rect.left - canvasRect.left && fingerX < rect.right - canvasRect.left &&
                    fingerY > rect.top - canvasRect.top && fingerY < rect.bottom - canvasRect.top) {
                    choiceFound = index;
                }
            });
            
            if (choiceFound !== -1) {
                if (this.hoveredChoiceIndex !== choiceFound) {
                    // Começa a contagem para uma nova alternativa
                    this.hoveredChoiceIndex = choiceFound;
                    this.hoverStartTime = Date.now();
                } else {
                    // Verifica se o tempo de seleção foi atingido
                    if (Date.now() - this.hoverStartTime > this.SELECTION_TIME_MS) {
                        if (questionManager.choiceElements[choiceFound].onclick) {
                             questionManager.choiceElements[choiceFound].onclick();
                             this.hoverStartTime = null; // Reseta para não selecionar de novo
                        }
                    }
                }
            } else {
                this.hoveredChoiceIndex = -1;
                this.hoverStartTime = null;
            }
        }

        if (!handDetected) {
            this.hoveredChoiceIndex = -1;
            this.hoverStartTime = null;
        }

        // Desenha o feedback visual do hover
        questionManager.choiceElements.forEach((el, index) => {
            if (index === this.hoveredChoiceIndex) {
                el.style.border = '2px solid var(--accent)';
                 el.style.transform = 'scale(1.03)';
            } else {
                el.style.border = '1px solid rgba(255,255,255,0.1)';
                 el.style.transform = 'scale(1)';
            }
        });
    },
    
    detectMovement(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
            const landmarks = results.multiHandLandmarks[0];
            const controlPoint = landmarks[8];
            const targetX = (1 - controlPoint.x) * this.overlay.width - (this.player.width / 2);
            const targetY = controlPoint.y * this.overlay.height - (this.player.height / 2);
            const lerpFactor = 0.4;
            this.player.x += (targetX - this.player.x) * lerpFactor;
            this.player.y += (targetY - this.player.y) * lerpFactor;
        }
        this.player.x = Math.max(0, Math.min(this.overlay.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.overlay.height - this.player.height, this.player.y));
    },

    startGame() {
        this.startOverlay.style.opacity = '0';
        setTimeout(() => { this.startOverlay.style.display = 'none'; }, 500);
        this.gameHud.style.visibility = 'visible';
        this.playing = true;
        this.isQuestionActive = false;
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.levelProgress = 0;
        
        this.setupLevel();
        this.updateHud();
        this.playTone(800, 0.2);
    },
    
    setupLevel() {
        this.levelProgress = 0;
        
        // ALTERADO: Pega 5 perguntas aleatórias do banco principal para o nível atual
        this.currentLevelQuestions = [];
        for (let i = 0; i < this.seedsPerLevel; i++) {
            if (this.gameQuestionBank.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.gameQuestionBank.length);
                this.currentLevelQuestions.push(this.gameQuestionBank.splice(randomIndex, 1)[0]);
            }
        }
        
        if (this.currentLevelQuestions.length === 0) {
             // Se não há mais perguntas, o jogador venceu
            this.showGameOver(true);
            return;
        }

        this.createSeeds();
        this.updateHud();
        this.player.x = this.overlay.width / 2 - this.player.width / 2;
        this.player.y = this.overlay.height * 0.8 - this.player.height;
    },

    createSeeds() {
        this.seeds = [];
        const seedsToCreate = this.currentLevelQuestions.length;
        for (let i = 0; i < seedsToCreate; i++) {
            this.seeds.push({
                x: Math.random() * (this.overlay.width - 40) + 20,
                y: Math.random() * (this.overlay.height * 0.9 - 80) + 40,
                size: 20, collected: false
            });
        }
    },

    updateHud() {
        this.scoreEl.textContent = this.score;
        this.livesEl.textContent = this.lives;
        this.levelEl.textContent = this.currentLevel;
        this.envStatusEl.querySelector('span').textContent = `${this.levelProgress} / ${this.currentLevelQuestions.length}`;
    },

    checkSeedCollision() {
        for (const seed of this.seeds) {
            if (!seed.collected) {
                const playerCenterX = this.player.x + this.player.width / 2;
                const playerCenterY = this.player.y + this.player.height / 2;
                const distance = Math.sqrt(Math.pow(playerCenterX - seed.x, 2) + Math.pow(playerCenterY - seed.y, 2));
                if (distance < this.player.width / 2 + seed.size) this.triggerQuestion(seed);
            }
        }
    },
    
    triggerQuestion(seed) {
        if (this.isQuestionActive || this.currentLevelQuestions.length === 0) return;
        this.isQuestionActive = true;
        this.playTone(1000, 0.2);

        // Pega a primeira pergunta disponível para o nível e a remove.
        const question = this.currentLevelQuestions[this.levelProgress];
        
        questionManager.show(question, (isCorrect, explanation) => {
            if (isCorrect) {
                this.playTone(1200, 0.3);
                this.score += 100;
                this.levelProgress++;
                seed.collected = true;
            } else {
                this.playTone(200, 0.4);
                this.lives--;
            }

            this.updateHud();
            this.showFeedbackModal(isCorrect, explanation, () => {
                this.isQuestionActive = false; // Permite o movimento novamente
                if (this.lives <= 0) {
                    this.showGameOver(false);
                } else if (this.levelProgress >= this.currentLevelQuestions.length) {
                    if (this.currentLevel < this.totalLevels) {
                        this.currentLevel++;
                        this.setupLevel();
                    } else {
                        this.showGameOver(true);
                    }
                }
            });
        });
    },

    showFeedbackModal(isCorrect, explanation, onEndCallback) {
        this.feedbackOverlay.style.display = 'flex';
        this.feedbackIcon.textContent = isCorrect ? '🎉' : '😔';
        this.feedbackTitle.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta';
        this.feedbackTitle.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
        this.feedbackMessage.textContent = isCorrect ? '+100 pontos!' : 'Você perdeu uma vida!';
        this.feedbackExplanation.textContent = explanation;
        setTimeout(() => {
            this.feedbackOverlay.style.display = 'none';
            if (onEndCallback) onEndCallback();
        }, 2500);
    },
    
    drawPlayer() {
        if (this.player.loaded) {
            this.ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        }
    },

    drawSeeds() {
        this.ctx.font = "32px Poppins";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        for (const seed of this.seeds) {
            if (!seed.collected) {
                this.ctx.save();
                this.ctx.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))';
                this.ctx.fillText("🌱", seed.x, seed.y);
                this.ctx.restore();
            }
        }
    },

    drawEnvironment() {
        this.ctx.save();
        const horizontalPadding = this.overlay.width * 0.1;
        const effectiveWidth = this.overlay.width - (2 * horizontalPadding);
        const elementsInLevel = this.currentLevelQuestions.length > 0 ? this.currentLevelQuestions.length : this.seedsPerLevel;

        if (this.currentLevel === 1) { // Desmatamento
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            for (let i = 0; i < elementsInLevel; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (elementsInLevel - 1 || 1) * i) - 20;
                this.ctx.fillStyle = '#5a2d0c';
                this.ctx.fillRect(xPos, this.overlay.height - 40, 40, 20);
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(xPos + 5, this.overlay.height - 50, 30, 10);
            }
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (elementsInLevel - 1 || 1) * i);
                this.ctx.font = `60px Poppins`;
                this.ctx.fillText("🌳", xPos, this.overlay.height - 70);
            }
        }
        else if (this.currentLevel === 2) { // Poluição
            this.ctx.fillStyle = `rgb(60, 80, 100)`; 
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            const remainingTrash = elementsInLevel - this.levelProgress;
            for (let i = 0; i < remainingTrash; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (remainingTrash + 1)) * (i + 1);
                this.ctx.font = `30px Poppins`;
                this.ctx.fillText("🗑️", xPos, 150 + (i % 2 * 50)); 
                this.ctx.fillText("🧴", xPos + 20, 200 + (i % 3 * 30)); 
            }
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (elementsInLevel + 1)) * (i + 1);
                this.ctx.font = `40px Poppins`;
                this.ctx.fillText("🐠", xPos + (i % 2 * 30), 180 + (i % 2 * 50));
                this.ctx.fillText("🐬", xPos - (i % 2 * 20), 250 - (i % 2 * 30));
            }
        }
        else if (this.currentLevel === 3) { // Cidades Inteligentes
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            const buildingPositions = [0.1, 0.3, 0.5, 0.7, 0.9];
            buildingPositions.forEach((pos, index) => {
                const x = horizontalPadding + (effectiveWidth * pos) - 50;
                const h = 150 + (index % 2 * 50);
                this.ctx.fillStyle = '#3a3a5e';
                this.ctx.fillRect(x, this.overlay.height - (h + 50), 90 + (index % 2 * 20), h);
            });
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(0, this.overlay.height - 50, this.overlay.width, 50);
            const remainingCars = elementsInLevel - this.levelProgress;
            for (let i = 0; i < remainingCars; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (remainingCars + 1)) * (i + 1);
                this.ctx.font = `30px Poppins`;
                this.ctx.fillText("🚗", xPos, this.overlay.height - 20);
            }
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (elementsInLevel + 1)) * (i + 1);
                this.ctx.font = `40px Poppins`;
                this.ctx.fillText(i % 2 === 0 ? "🚲" : "🚌", xPos, this.overlay.height - 20);
            }
        }
        this.ctx.restore();
    },

    showGameOver(isWinner) {
        this.playing = false;
        const icon = document.getElementById('gameover-icon');
        const title = document.getElementById('gameover-title');
        const message = document.getElementById('gameover-message');
        const scoreSpan = document.getElementById('gameover-score').querySelector('span');

        scoreSpan.textContent = this.score;

        if (isWinner) {
            icon.textContent = '🎉';
            title.textContent = 'Parabéns!';
            title.style.color = 'var(--success)';
            message.textContent = 'Você restaurou o equilíbrio e provou seu conhecimento! O futuro é mais verde graças a você.';
        } else {
            icon.textContent = '💔';
            title.textContent = 'Fim de Jogo';
            title.style.color = 'var(--danger)';
            message.textContent = 'Não desista! Cada tentativa é um passo a mais para um planeta sustentável. Tente novamente!';
        }

        this.gameoverOverlay.classList.add('active');
    },

    playTone(freq, duration) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (e) { console.log("Não foi possível reproduzir o som.", e); }
    }
};