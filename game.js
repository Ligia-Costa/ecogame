document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('real-life-mode')) {
        realLifeGame.init();
    }
});

const avatarImages = {
    'lingua_portuguesa': 'Demetrius.png',
    'lingua_portuguesa2': 'Marieli.png',
    'quimica': 'Arline.png',
    'historia': 'julio.png',
    'biologia': 'mayara.png',
    'fisica': 'Romulo.png',
    'geografia': 'Jesiane.png',
    'matematica': 'Anderson.png',
    'matematica2': 'Márcia.png',
    'ingles': 'Flávia.png',
    'arte': 'Marcela.png',
    'educacao_fisica': 'Fabrício.png',
};

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

const realLifeGame = {
    // Elementos da UI
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

    // Estado do Jogo
    player: { x: 0, y: 0, width: 60, height: 90, image: new Image(), loaded: false },
    seeds: [],
    environmentLevel: 0,
    questionBank: [],
    isQuestionActive: false,
    playing: false,
    score: 0,
    lives: 3,

    // PoseNet
    detector: null,
    modelReady: false,
    streaming: false,

    async init() {
        if (!this.video || !this.overlay) return;
        this.ctx = this.overlay.getContext('2d');
        this.startGameBtn.addEventListener('click', () => this.startGame());

        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia';
        this.player.image.src = avatarImages[avatarId] || avatarImages['biologia'];
        this.player.image.onload = () => { 
            this.player.loaded = true; 
            this.resizeCanvas();
        };

        window.addEventListener('resize', () => this.resizeCanvas());

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

    resizeCanvas() {
        this.overlay.width = this.gameContainer.clientWidth;
        this.overlay.height = this.gameContainer.clientHeight;
        
        if (!this.playing) {
            this.player.x = this.overlay.width / 2 - this.player.width / 2;
            this.player.y = this.overlay.height / 2 - this.player.height / 2;
        }

        if (this.playing) {
            this.seeds.forEach(seed => {
                seed.x = Math.random() * (this.overlay.width - 40) + 20;
                seed.y = Math.random() * (this.overlay.height * 0.8) + 20;
            });
        }
    },

    async loadQuestions(avatarId) {
        const response = await fetch('questions.json');
        const allQuestions = await response.json();
        const normalizedAvatarId = avatarId.replace(/\d/g, ''); 
        const subjectQuestions = allQuestions[normalizedAvatarId] || allQuestions['biologia'];
        
        this.questionBank = subjectQuestions.map(q => {
            const correctIndex = q.resposta_correta.charCodeAt(0) - 65;
            const explanation = `A resposta correta é: ${q.alternativas[correctIndex]}`;
            return {
                name: normalizedAvatarId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                question: { text: q.pergunta, choices: q.alternativas.map(alt => alt.substring(3)), answer: correctIndex },
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
                    this.resizeCanvas();
                    this.streaming = true;
                    this.miniCam.play().catch(console.error);
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
    
    startGame() {
        this.startOverlay.style.opacity = '0';
        setTimeout(() => { this.startOverlay.style.display = 'none'; }, 500);
        this.gameHud.style.visibility = 'visible';

        this.playing = true;
        this.isQuestionActive = false;
        this.environmentLevel = 0;
        this.score = 0;
        this.lives = 3;
        
        const params = new URLSearchParams(window.location.search);
        const avatarId = params.get('avatar') || 'biologia';
        this.loadQuestions(avatarId);

        this.updateHud();
        this.createSeeds();
        this.playTone(800, 0.2);
    },

    createSeeds() {
        this.seeds = [];
        const totalSeeds = Math.min(10, this.questionBank.length);
        for (let i = 0; i < totalSeeds; i++) {
            this.seeds.push({
                x: Math.random() * (this.overlay.width - 40) + 20,
                y: Math.random() * (this.overlay.height * 0.8) + 20,
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

    getKey: (kp, name) => kp.find(p => p.part === name),

    detectMovement(pose) {
        if (!pose || !pose.keypoints) return;

        const leftWrist = this.getKey(pose.keypoints, 'leftWrist');
        const rightWrist = this.getKey(pose.keypoints, 'rightWrist');

        const lerpFactor = 0.25;

        if (leftWrist && leftWrist.score > 0.4) {
            const targetX = (1 - (leftWrist.position.x / this.video.videoWidth)) * this.overlay.width - (this.player.width / 2);
            this.player.x += (targetX - this.player.x) * lerpFactor;
        }

        if (rightWrist && rightWrist.score > 0.4) {
            const targetY = (rightWrist.position.y / this.video.videoHeight) * this.overlay.height - (this.player.height / 2);
            this.player.y += (targetY - this.player.y) * lerpFactor;
        }

        this.player.x = Math.max(0, Math.min(this.overlay.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.overlay.height - this.player.height, this.player.y));
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
        if (this.isQuestionActive) return;
        this.isQuestionActive = true;
        seed.collected = true;
        this.playTone(1000, 0.2);

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
                 setTimeout(() => { this.isQuestionActive = false; }, 1000);
            }
        });
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
        let overlayColor = "rgba(0,0,0,0.5)";
        if (this.environmentLevel >= 7) overlayColor = "rgba(135, 206, 235, 0.1)";
        else if (this.environmentLevel >= 3) overlayColor = "rgba(144, 238, 144, 0.1)";
        
        this.ctx.fillStyle = overlayColor;
        this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);

        if(this.environmentLevel > 1){
            this.ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
            this.ctx.font = `${20 + this.environmentLevel * 2}px Poppins`;
            this.ctx.fillText("☀️", this.overlay.width - 60, 60);
        }

        const elementCount = Math.floor(this.environmentLevel / 2);
        for(let i = 0; i < elementCount; i++){
            this.ctx.font = `${30 + this.environmentLevel * 2}px Poppins`;
            this.ctx.fillText("🌳", (this.overlay.width / (elementCount + 1)) * (i + 1), this.overlay.height - 40);
            this.ctx.font = `${20 + this.environmentLevel}px Poppins`;
            this.ctx.fillText("🌸", (this.overlay.width / (elementCount + 1)) * (i + 1) + 30, this.overlay.height - 15);
        }
        this.ctx.restore();
    },

    async loop() {
        if (this.streaming && this.modelReady) {
            let pose = null;
            try {
                pose = await this.detector.estimateSinglePose(this.video, { flipHorizontal: true });
            } catch {}

            this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
            this.drawEnvironment();
            
            // A lógica de movimento só é chamada se o jogo estiver ativo.
            if (this.playing) {
                if (!this.isQuestionActive) {
                    this.detectMovement(pose);
                    this.checkSeedCollision();
                }
                this.drawSeeds();
            }
            // O jogador é sempre desenhado, mas só se move se `playing` for true.
            this.drawPlayer();
        }
        requestAnimationFrame(() => this.loop());
    },

    showFeedbackModal(isCorrect, explanation) {
        this.feedbackOverlay.style.display = 'flex';
        this.feedbackIcon.textContent = isCorrect ? '🎉' : '😔';
        this.feedbackTitle.textContent = isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta';
        this.feedbackTitle.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
        this.feedbackMessage.textContent = isCorrect ? '+100 pontos! O ambiente está melhorando!' : 'Você perdeu uma vida!';
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
            // Recarrega a página para o estado inicial
            window.location.reload();
        }, 500);
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
        } catch (e) {
            console.log("Não foi possível reproduzir o som.", e);
        }
    }
};