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

// --- GERENCIADOR DE PERGUNTAS ---
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
                // Desativa cliques após a primeira escolha
                this.choices.querySelectorAll('.choice').forEach(c => c.onclick = null);
                btn.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (!isCorrect) {
                    this.choices.children[questionObj.question.answer].classList.add('correct');
                }
                setTimeout(() => {
                    this.modal.classList.remove('active');
                    onAnswer(isCorrect, questionObj.explanation);
                }, 2500);
            };
            this.choices.appendChild(btn);
        });
    }
};

// --- JOGO VIDA REAL ---
const realLifeGame = {
    // Elementos HTML
    video: document.getElementById('video'),
    miniCam: document.getElementById('miniCam'),
    overlay: document.getElementById('overlay'),
    ctx: null,
    startBtn: document.getElementById('startBtn'),
    scoreEl: document.getElementById('score'),
    livesEl: document.getElementById('lives'),
    envStatusEl: document.getElementById('env-status'),
    feedbackOverlay: document.getElementById('feedback-overlay'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackExplanation: document.getElementById('feedback-explanation'),

    // Estado do Jogo
    player: { x: 300, y: 350, width: 60, height: 90, image: new Image(), loaded: false },
    seeds: [],
    environmentLevel: 0,
    questionBank: [],
    allQuestions: {},
    isQuestionActive: false,
    playing: false,
    score: 0,
    lives: 3,

    // PoseNet & Câmera
    detector: null,
    modelReady: false,
    streaming: false,

    async init() {
        if (!this.video || !this.overlay) return;
        this.ctx = this.overlay.getContext('2d');
        this.startBtn.addEventListener('click', () => this.startGame());

        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia';
        this.player.image.src = avatarImages[avatarId] || avatarImages['biologia'];
        this.player.image.onload = () => { this.player.loaded = true; };

        try {
            await this.loadQuestions(avatarId);
            await this.initCamera();
            await this.loadModel();
            this.loop();
        } catch (e) {
            console.error(e);
            alert("Erro ao iniciar o jogo. Verifique as permissões da câmera.");
        }
    },

    async loadQuestions(avatarId) {
        const response = await fetch('questions.json');
        this.allQuestions = await response.json();
        const subjectQuestions = this.allQuestions[avatarId] || this.allQuestions['biologia'];
        this.questionBank = subjectQuestions.map(q => {
            const correctIndex = q.resposta_correta.charCodeAt(0) - 65;
            const explanation = `A resposta correta é: ${q.alternativas[correctIndex]}`;
            return {
                name: avatarId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                question: {
                    text: q.pergunta,
                    choices: q.alternativas.map(alt => alt.substring(3)),
                    answer: correctIndex
                },
                explanation
            };
        });
    },

    async initCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.video.srcObject = stream;
        this.miniCam.srcObject = stream;
        return new Promise(resolve => {
            this.video.onloadedmetadata = () => {
                this.video.play().then(() => {
                    this.overlay.width = this.video.videoWidth;
                    this.overlay.height = this.video.videoHeight;
                    this.player.x = this.overlay.width / 2;
                    this.player.y = this.overlay.height - this.player.height - 10;
                    this.streaming = true;
                    this.miniCam.play().catch(console.error);
                    resolve();
                });
            };
        });
    },

    async loadModel() {
        this.detector = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 640, height: 480 },
            multiplier: 0.75
        });
        this.modelReady = true;
    },
    
    startGame() {
        this.playing = true;
        this.isQuestionActive = false;
        this.environmentLevel = 0;
        this.score = 0;
        this.lives = 3;
        // Recarregar o banco de perguntas caso seja um reinício
        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia';
        this.loadQuestions(avatarId);

        this.updateHud();
        this.createSeeds();
        this.startBtn.textContent = '♻️ Reiniciar';
        this.playTone(800, 0.2); // Beep
    },

    createSeeds() {
        this.seeds = [];
        const totalSeeds = Math.min(10, this.questionBank.length); // Criar até 10 sementes
        for (let i = 0; i < totalSeeds; i++) {
            this.seeds.push({
                x: Math.random() * (this.overlay.width - 40) + 20,
                y: Math.random() * (this.overlay.height * 0.6) + 20, // Aparecem na parte superior
                size: 20,
                collected: false,
                question: this.questionBank[i]
            });
        }
    },

    updateHud() {
        this.scoreEl.textContent = this.score;
        this.livesEl.textContent = this.lives;
        let status = "Devastado";
        if (this.environmentLevel >= 7) status = "Restaurado!";
        else if (this.environmentLevel >= 3) status = "Em Recuperação";
        this.envStatusEl.querySelector('span').textContent = status;
    },

    // --- LÓGICA DE DETECÇÃO E MOVIMENTO ---
    getKey: (kp, name) => kp.find(p => p.part === name),

    detectMovement(pose) {
        if (!pose || !pose.keypoints) return null;
        const nose = this.getKey(pose.keypoints, 'nose');
        const leftShoulder = this.getKey(pose.keypoints, 'leftShoulder');
        const rightShoulder = this.getKey(pose.keypoints, 'rightShoulder');
        if (!nose || !leftShoulder || !rightShoulder) return;

        const shoulderCenterY = (leftShoulder.position.y + rightShoulder.position.y) / 2;
        const shoulderCenterX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
        const shoulderWidth = Math.abs(leftShoulder.position.x - rightShoulder.position.x);

        // Mover para baixo (Agachar)
        if (nose.position.y > shoulderCenterY + 20) {
            this.player.y += 5;
        } else { // Movimento normal para cima e para os lados
            this.player.y -= 2; // Sobe lentamente
            if (nose.position.x < shoulderCenterX - (shoulderWidth * 0.2)) {
                this.player.x -= 5; // Mover para Esquerda (do jogador)
            }
            if (nose.position.x > shoulderCenterX + (shoulderWidth * 0.2)) {
                this.player.x += 5; // Mover para Direita (do jogador)
            }
        }
        
        // Manter o jogador dentro da tela
        this.player.x = Math.max(0, Math.min(this.overlay.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.overlay.height - this.player.height, this.player.y));
    },

    checkSeedCollision() {
        for (const seed of this.seeds) {
            if (!seed.collected) {
                const dx = this.player.x - seed.x;
                const dy = this.player.y - seed.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.player.width / 2 + seed.size) {
                    this.triggerQuestion(seed);
                }
            }
        }
    },

    triggerQuestion(seed) {
        if (this.isQuestionActive) return;
        this.isQuestionActive = true;
        seed.collected = true;
        this.playTone(1000, 0.2); // Som de coleta

        questionManager.show(seed.question, (isCorrect, explanation) => {
            this.showFeedbackModal(isCorrect, explanation);
            if (isCorrect) {
                this.playTone(1200, 0.3);
                this.score += 100;
                this.environmentLevel++;
            } else {
                this.playTone(200, 0.4);
                this.lives--;
            }
            this.updateHud();
            
            if (this.lives <= 0 || this.seeds.every(s => s.collected)) {
                this.showGameOver();
            } else {
                 setTimeout(() => {
                    this.isQuestionActive = false;
                }, 1000);
            }
        });
    },

    // --- DESENHO E RENDERIZAÇÃO ---
    drawPlayer() {
        if (this.player.loaded) {
            this.ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        }
    },

    drawSeeds() {
        this.ctx.font = "32px Poppins";
        this.ctx.textAlign = "center";
        for (const seed of this.seeds) {
            if (!seed.collected) {
                this.ctx.save();
                this.ctx.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))';
                this.ctx.fillText("🌱", seed.x, seed.y);
                this.ctx.restore();
            }
        }
    },
    
    drawBackground() {
        // O fundo é o vídeo da câmera, mas podemos adicionar efeitos baseados no environmentLevel
        this.ctx.save();
        let overlayColor = "rgba(0,0,0,0.5)"; // Cenário devastado
        if (this.environmentLevel >= 7) overlayColor = "rgba(135, 206, 235, 0.1)"; // Restaurado (leve brilho azul)
        else if (this.environmentLevel >= 3) overlayColor = "rgba(144, 238, 144, 0.1)"; // Recuperação (leve brilho verde)
        
        this.ctx.fillStyle = overlayColor;
        this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
        this.ctx.restore();
    },

    // --- LOOP PRINCIPAL DO JOGO ---
    async loop() {
        if (this.streaming && this.modelReady) {
            let pose = null;
            try {
                pose = await this.detector.estimateSinglePose(this.video, { flipHorizontal: true });
            } catch {}

            this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            this.drawBackground();

            if (this.playing && !this.isQuestionActive) {
                 this.detectMovement(pose);
                 this.checkSeedCollision();
            }
            
            this.drawSeeds();
            this.drawPlayer();
        }
        requestAnimationFrame(() => this.loop());
    },

    // --- MODAIS E FIM DE JOGO ---
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
            this.feedbackMessage.textContent = 'Você perdeu uma vida!';
        }
        this.feedbackExplanation.textContent = explanation;
        setTimeout(() => { this.feedbackOverlay.style.display = 'none'; }, 2500);
    },

    showGameOver() {
        this.playing = false;
        setTimeout(() => {
            let message = `Fim de Jogo!\n\nSua Pontuação Final: ${this.score}.`;
            if (this.lives <= 0) {
                message += "\nNão desista! Tente novamente para salvar o planeta.";
            } else if (this.environmentLevel >= 7) {
                message += "\nParabéns! Você restaurou completamente o cenário com seu conhecimento!";
            } else {
                message += "\nBom trabalho! Continue aprendendo para um futuro mais verde.";
            }
            alert(message);
        }, 500);
    },

    // --- UTILITÁRIOS ---
    playTone(freq, duration) {
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
    }
};