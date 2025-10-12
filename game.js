document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('real-life-mode')) {
        realLifeGame.init();
    }
});

const avatarImages = {
    'lingua_portuguesa': 'Demetrius.png',
    'quimica': 'Arline.png',
    'historia': 'julio.png',
    'biologia': 'mayara.png',
    'fisica': 'Romulo.png',
    'geografia': 'Jesiane.png',
};


// --- GERENCIADOR DE PERGUNTAS (MODAL) ---
const questionManager = {
    modal: document.getElementById('questionModal'),
    title: document.getElementById('qTitle'),
    text: document.getElementById('qText'),
    choices: document.getElementById('choices'),

    show(questionObj, onAnswer) {
        this.modal.classList.add('active');
        this.title.textContent = `Desafio: ${questionObj.name}`;
        this.text.textContent = questionObj.question.text;
        this.choices.innerHTML = '';

        questionObj.question.choices.forEach((choice, index) => {
            const btn = document.createElement('div');
            btn.className = 'choice';
            btn.textContent = choice;
            btn.onclick = () => {
                const isCorrect = (index === questionObj.question.answer);
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (!isCorrect) {
                    this.choices.children[questionObj.question.answer].classList.add('correct');
                }
                setTimeout(() => {
                    this.modal.classList.remove('active');
                    onAnswer(isCorrect, questionObj.explanation);
                }, 1800); 
            };
            this.choices.appendChild(btn);
        });
    }
};


// --- JOGO VIDA REAL (VERSÃO KINECT ADVENTURES) ---
const realLifeGame = {
    // Referências da UI
    video: document.getElementById('video'),
    miniCam: document.getElementById('miniCam'),
    overlay: document.getElementById('overlay'),
    ctx: null,
    startBtn: document.getElementById('startBtn'),
    scoreEl: document.getElementById('score'),
    envStatusEl: document.getElementById('env-status'),

    // NOVO: Referências para o Modal de Feedback
    feedbackOverlay: document.getElementById('feedback-overlay'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackExplanation: document.getElementById('feedback-explanation'),

    // Estado do jogo
    player: { x: 300, y: 350, width: 60, height: 90, velocityY: 0, onGround: true, image: new Image(), loaded: false },
    gravity: 0.8,
    jumpForce: -18,
    environmentLevel: 0,
    seeds: [],
    questionBank: [], 
    allQuestions: {}, 
    isQuestionActive: false,

    // Estado do detector
    detector: null,
    modelReady: false,
    streaming: false,
    playing: false,
    score: 0,

    async init() {
        if (!this.video || !this.overlay) return;
        this.ctx = this.overlay.getContext('2d');
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startGame());

        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia'; 
        this.player.image.src = avatarImages[avatarId] || avatarImages['biologia'];
        this.player.image.onload = () => { this.player.loaded = true; };
        this.player.image.onerror = () => { this.player.loaded = true; }; // Garante que o jogo continue mesmo com erro

        try {
            await this.loadQuestions(avatarId);
            await this.initCamera();
            await this.loadModel();
            this.initializeLevel(); // Inicializa o nível DEPOIS da câmera ter as dimensões
            this.loop();
        } catch (e) {
            console.error('Erro ao iniciar o jogo:', e);
            alert("Não foi possível iniciar o jogo. Verifique as permissões da câmera e recarregue a página.");
        }
    },
    
    async loadQuestions(avatarId) {
        try {
            const response = await fetch('questions.json');
            this.allQuestions = await response.json();
            const subjectQuestions = this.allQuestions[avatarId] || this.allQuestions['biologia']; // Fallback
            
            this.questionBank = subjectQuestions.map(q => {
                const correctAnswerLetter = q.resposta_correta.charAt(0);
                const correctAnswerIndex = correctAnswerLetter.charCodeAt(0) - 65;
                // A explicação agora vem do próprio JSON (se existir) ou é um texto padrão.
                const explanation = q.explanation || `A resposta correta é: ${q.alternativas[correctAnswerIndex]}`;
                return {
                    name: avatarId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    question: { text: q.pergunta, choices: q.alternativas.map(alt => alt.substring(3)), answer: correctAnswerIndex },
                    explanation: explanation
                };
            });
        } catch (error) {
            console.error('Erro ao carregar o arquivo de perguntas (questions.json):', error);
        }
    },

    async initCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        this.video.srcObject = stream;
        this.miniCam.srcObject = stream;
        return new Promise(resolve => {
            this.video.onloadedmetadata = () => {
                this.video.play().then(() => {
                    this.overlay.width = this.video.videoWidth;
                    this.overlay.height = this.video.videoHeight;
                    this.streaming = true;
                    this.miniCam.play().catch(e => console.warn("MiniCam could not play:", e));
                    resolve();
                });
            };
        });
    },

    async loadModel() {
        this.detector = await posenet.load({
            architecture: 'MobileNetV1', outputStride: 16,
            inputResolution: { width: 640, height: 480 }, multiplier: 0.75
        });
        this.modelReady = true;
    },

    initializeLevel() {
        this.seeds = [];
        this.environmentLevel = 0;
        this.score = 0;
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        this.updateEnvStatus();
        
        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia';
        this.loadQuestions(avatarId); // Recarrega as perguntas

        for (let i = 0; i < 15; i++) {
            this.seeds.push({
                x: 50 + Math.random() * (this.overlay.width - 100),
                y: 150 + Math.random() * 200,
                width: 30, height: 30, collected: false
            });
        }
    },
    
    getKey: (kp, name) => kp.find(p => p.part === name),

    drawBackground() {
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        const groundY = this.overlay.height - 60;
        let skyColor1 = '#4a423a', skyColor2 = '#2d211a';

        if (this.environmentLevel >= 9) { skyColor1 = '#00BFFF'; skyColor2 = '#87CEEB'; } 
        else if (this.environmentLevel >= 3) { skyColor1 = '#87CEEB'; skyColor2 = '#B0E0E6'; }
        
        const sky = this.ctx.createLinearGradient(0, 0, 0, groundY);
        sky.addColorStop(0, skyColor1);
        sky.addColorStop(1, skyColor2);
        this.ctx.fillStyle = sky;
        this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
        
        this.ctx.fillStyle = this.environmentLevel < 3 ? '#2d211a' : (this.environmentLevel < 9 ? '#228B22' : '#006400');
        this.ctx.fillRect(0, groundY, this.overlay.width, 60);

        for (let i = 0; i < this.environmentLevel && i < 15; i++) {
             if (i >= 9) { 
                const treeX = (i - 8) * 90;
                this.ctx.fillStyle = '#8B4513'; this.ctx.fillRect(treeX, groundY - 70, 20, 70);
                this.ctx.fillStyle = 'green'; this.ctx.beginPath(); this.ctx.arc(treeX + 10, groundY - 70, 40, 0, Math.PI * 2); this.ctx.fill();
            } else if (i >= 3) {
                this.ctx.fillStyle = '#32cd32'; this.ctx.fillRect(i * 60, groundY - 20, 5, 20);
            }
        }
    },

    drawGameElements() {
        this.ctx.font = '30px Arial';
        this.seeds.forEach(seed => {
            if (!seed.collected) { this.ctx.fillText('🌱', seed.x, seed.y); }
        });

        if (this.player.loaded && this.player.image.complete && this.player.image.naturalHeight !== 0) {
            this.ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'; // Azul semi-transparente
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    },

    async loop() {
        if (!this.streaming || !this.modelReady) {
            requestAnimationFrame(() => this.loop());
            return;
        }

        this.drawBackground();
        let pose = null;
        try {
            pose = await this.detector.estimateSinglePose(this.video, { flipHorizontal: true });
        } catch (e) { /* Ignora erros de detecção para não travar o jogo */ }

        if (this.playing && !this.isQuestionActive && pose && pose.keypoints) {
            const leftShoulder = this.getKey(pose.keypoints, 'leftShoulder');
            const rightShoulder = this.getKey(pose.keypoints, 'rightShoulder');
            const leftWrist = this.getKey(pose.keypoints, 'leftWrist');
            const rightWrist = this.getKey(pose.keypoints, 'rightWrist');

            if (leftShoulder && rightShoulder && leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
                const shoulderMidpoint = (leftShoulder.position.x + rightShoulder.position.x) / 2;
                this.player.x = shoulderMidpoint - (this.player.width / 2);
                this.player.x = Math.max(0, Math.min(this.overlay.width - this.player.width, this.player.x));
            }
            
            if (this.player.onGround && leftWrist && rightWrist && leftShoulder && rightShoulder &&
                leftWrist.score > 0.5 && rightWrist.score > 0.5 &&
                leftWrist.position.y < leftShoulder.position.y && rightWrist.position.y < rightShoulder.position.y) {
                this.player.velocityY = this.jumpForce;
                this.player.onGround = false;
            }

            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;

            const groundLevel = this.overlay.height - 60 - this.player.height;
            if (this.player.y >= groundLevel) {
                this.player.y = groundLevel;
                this.player.velocityY = 0;
                this.player.onGround = true;
            }

            this.seeds.forEach(seed => {
                if (!seed.collected && this.isColliding(this.player, seed)) {
                    seed.collected = true;
                    this.triggerQuestion();
                }
            });
        }

        this.drawGameElements();

        if (!this.playing) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 24px Poppins";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Posicione-se e clique em 'Iniciar Jogo'", this.overlay.width / 2, this.overlay.height / 2);
            this.ctx.textAlign = "left";
        }
        
        requestAnimationFrame(() => this.loop());
    },

    isColliding: (rect1, rect2) =>
        rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y,

    triggerQuestion() {
        if (this.questionBank.length > 0 && !this.isQuestionActive) {
            this.isQuestionActive = true;
            const questionIndex = Math.floor(Math.random() * this.questionBank.length);
            const questionObj = this.questionBank.splice(questionIndex, 1)[0];

            questionManager.show(questionObj, (isCorrect, explanation) => {
                this.showFeedbackModal(isCorrect, explanation); // Chama o novo modal

                if (isCorrect) {
                    this.score += 100;
                    this.environmentLevel++;
                    if (this.scoreEl) this.scoreEl.textContent = this.score;
                    this.updateEnvStatus();
                }

                // A continuação do jogo acontece depois que o modal de feedback some
                setTimeout(() => {
                    const remainingSeeds = this.seeds.some(s => !s.collected);
                    if (!remainingSeeds || this.questionBank.length === 0) {
                        this.showGameOver();
                    } else {
                        this.isQuestionActive = false;
                    }
                }, 3000); // Tempo para o jogador ler o feedback
            });
        } else {
             this.showGameOver();
        }
    },
    
    // NOVO: Função para controlar o modal de feedback
    showFeedbackModal(isCorrect, explanation) {
        this.feedbackOverlay.style.display = 'flex';
        if (isCorrect) {
            this.feedbackIcon.textContent = '🎉';
            this.feedbackTitle.textContent = 'Resposta Correta!';
            this.feedbackTitle.style.color = 'var(--success)';
            this.feedbackMessage.textContent = '+100 pontos! O ambiente está melhorando!';
        } else {
            this.feedbackIcon.textContent = '😔';
            this.feedbackTitle.textContent = 'Resposta Incorreta';
            this.feedbackTitle.style.color = 'var(--danger)';
            this.feedbackMessage.textContent = 'Não desanime, o conhecimento é uma jornada!';
        }
        this.feedbackExplanation.textContent = explanation;

        setTimeout(() => {
            this.feedbackOverlay.style.display = 'none';
        }, 3000); // O modal some automaticamente após 3 segundos
    },

    updateEnvStatus() {
        if (!this.envStatusEl) return;
        let status = "Devastado";
        if (this.environmentLevel >= 9) status = "Restaurado!";
        else if (this.environmentLevel >= 3) status = "Em Recuperação";
        this.envStatusEl.innerHTML = `Cenário: <span>${status}</span>`;
    },

    startGame() {
        this.playing = true;
        this.isQuestionActive = false;
        this.initializeLevel();
        if (this.startBtn) this.startBtn.textContent = '♻️ Reiniciar';
    },

    showGameOver() {
        this.playing = false;
        setTimeout(() => {
            let message = `Fim de Jogo! Pontuação Final: ${this.score}.`;
            if (this.environmentLevel >= 9) {
                message += "\nParabéns! Você restaurou completamente o cenário!";
            } else {
                message += "\nContinue aprendendo para salvar nosso planeta!";
            }
            alert(message);
        }, 500);
    }
};