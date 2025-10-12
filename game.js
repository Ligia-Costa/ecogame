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

// --- JOGO VIDA REAL ---
const realLifeGame = {
    video: document.getElementById('video'),
    miniCam: document.getElementById('miniCam'),
    overlay: document.getElementById('overlay'),
    ctx: null,
    startBtn: document.getElementById('startBtn'),
    scoreEl: document.getElementById('score'),
    envStatusEl: document.getElementById('env-status'),
    feedbackOverlay: document.getElementById('feedback-overlay'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMessage: document.getElementById('feedback-message'),
    feedbackExplanation: document.getElementById('feedback-explanation'),

    player: { x: 300, y: 350, width: 60, height: 90, image: new Image(), loaded: false },
    environmentLevel: 0,
    questionBank: [],
    allQuestions: {},
    isQuestionActive: false,
    detector: null,
    modelReady: false,
    streaming: false,
    playing: false,
    score: 0,

    // estados de movimento
    movementTarget: "armsUp",
    detectionProgress: 0,
    detectionStartTime: null,
    movementConfirmed: false,

    async init() {
        if (!this.video || !this.overlay) return;
        this.ctx = this.overlay.getContext('2d');
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startGame());

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
            alert("Erro ao iniciar o jogo. Verifique as permissões da câmera.");
        }
    },

    async loadQuestions(avatarId) {
        try {
            const response = await fetch('questions.json');
            this.allQuestions = await response.json();
            const subjectQuestions = this.allQuestions[avatarId] || this.allQuestions['biologia'];
            this.questionBank = subjectQuestions.map(q => {
                const correctIndex = q.resposta_correta.charCodeAt(0) - 65;
                const explanation = q.explanation || `A resposta correta é: ${q.alternativas[correctIndex]}`;
                return {
                    name: avatarId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    question: {
                        text: q.pergunta,
                        choices: q.alternativas.map(alt => alt.substring(3)),
                        answer: correctIndex
                    },
                    explanation
                };
            });
        } catch {
            this.questionBank = [{
                name: 'Sustentabilidade',
                question: {
                    text: 'Qual dessas ações ajuda o meio ambiente?',
                    choices: ['Jogar lixo no chão', 'Plantar uma árvore', 'Desperdiçar água'],
                    answer: 1
                },
                explanation: 'Plantar árvores melhora o ar e ajuda na recuperação ambiental!'
            }];
        }
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
                    this.streaming = true;
                    this.miniCam.play().catch(() => {});
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

    getKey: (kp, name) => kp.find(p => p.part === name),

    detectMovement(pose) {
        if (!pose || !pose.keypoints) return null;
        const ls = this.getKey(pose.keypoints, 'leftShoulder');
        const rs = this.getKey(pose.keypoints, 'rightShoulder');
        const lw = this.getKey(pose.keypoints, 'leftWrist');
        const rw = this.getKey(pose.keypoints, 'rightWrist');
        const lh = this.getKey(pose.keypoints, 'leftHip');
        const rh = this.getKey(pose.keypoints, 'rightHip');

        if (!ls || !rs || !lw || !rw || !lh || !rh) return null;

        const armsUp = lw.position.y < ls.position.y && rw.position.y < rs.position.y;
        const squat = lh.position.y > ls.position.y + 80 && rh.position.y > rs.position.y + 80;
        const tiltLeft = ls.position.x < rs.position.x - 80;
        const tiltRight = rs.position.x < ls.position.x - 80;

        if (armsUp) return "armsUp";
        if (squat) return "squat";
        if (tiltLeft) return "tiltLeft";
        if (tiltRight) return "tiltRight";
        return null;
    },

    drawProgressBar() {
        if (!this.detectionProgress) return;
        const width = this.overlay.width * 0.6;
        const x = (this.overlay.width - width) / 2;
        const y = this.overlay.height - 30;
        this.ctx.fillStyle = "rgba(255,255,255,0.2)";
        this.ctx.fillRect(x, y, width, 10);
        this.ctx.fillStyle = "lime";
        this.ctx.fillRect(x, y, width * this.detectionProgress, 10);
    },

    // --- Sons ---
    playBeep() {
        this.playTone(800, 0.2);
    },
    playClap() {
        this.playTone(1000, 0.4);
    },
    playBuzzer() {
        this.playTone(200, 0.6);
    },
    playTone(freq, duration) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
    },

    async loop() {
        if (!this.streaming || !this.modelReady) {
            requestAnimationFrame(() => this.loop());
            return;
        }

        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        let pose = null;
        try {
            pose = await this.detector.estimateSinglePose(this.video, { flipHorizontal: true });
        } catch {}

        const movement = this.detectMovement(pose);

        // instrução visual
        if (!this.playing && !this.isQuestionActive) {
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 26px Poppins";
            this.ctx.textAlign = "center";
            const emoji = { armsUp: "🖐", squat: "🧍‍♂️", tiltLeft: "↙️", tiltRight: "↘️" }[this.movementTarget];
            const label = { armsUp: "Levante os braços!", squat: "Agache!", tiltLeft: "Incline à esquerda!", tiltRight: "Incline à direita!" }[this.movementTarget];
            this.ctx.fillText(`${emoji} ${label}`, this.overlay.width / 2, this.overlay.height / 2 - 20);
        }

        // progresso de detecção
        if (!this.movementConfirmed) {
            if (movement === this.movementTarget) {
                if (!this.detectionStartTime) this.detectionStartTime = performance.now();
                const elapsed = (performance.now() - this.detectionStartTime) / 1000;
                this.detectionProgress = Math.min(elapsed / 1, 1);
                if (elapsed >= 1) {
                    this.movementConfirmed = true;
                    this.playBeep();
                    this.triggerQuestion();
                }
            } else {
                this.detectionStartTime = null;
                this.detectionProgress = 0;
            }
        }

        this.drawProgressBar();
        requestAnimationFrame(() => this.loop());
    },

    triggerQuestion() {
        if (this.isQuestionActive) return;
        this.isQuestionActive = true;
        this.detectionProgress = 0;
        this.detectionStartTime = null;

        if (this.questionBank.length > 0) {
            const questionIndex = Math.floor(Math.random() * this.questionBank.length);
            const questionObj = this.questionBank.splice(questionIndex, 1)[0];

            questionManager.show(questionObj, (isCorrect, explanation) => {
                this.showFeedbackModal(isCorrect, explanation);
                if (isCorrect) {
                    this.playClap();
                    this.score += 100;
                    this.environmentLevel++;
                    if (this.scoreEl) this.scoreEl.textContent = this.score;
                    this.updateEnvStatus();
                } else {
                    this.playBuzzer();
                }

                setTimeout(() => {
                    if (this.questionBank.length === 0) {
                        this.showGameOver();
                    } else {
                        this.isQuestionActive = false;
                        this.movementConfirmed = false;
                        const moves = ["armsUp", "squat", "tiltLeft", "tiltRight"];
                        this.movementTarget = moves[Math.floor(Math.random() * moves.length)];
                    }
                }, 3000);
            });
        } else {
            this.showGameOver();
        }
    },

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
        setTimeout(() => { this.feedbackOverlay.style.display = 'none'; }, 3000);
    },

    updateEnvStatus() {
        if (!this.envStatusEl) return;
        let status = "Devastado";
        if (this.environmentLevel >= 9) status = "Restaurado!";
        else if (this.environmentLevel >= 3) status = "Em Recuperação";
        this.envStatusEl.innerHTML = `Cenário: <span>${status}</span>`;
    },

    startGame() {
        this.playing = false;
        this.isQuestionActive = false;
        this.movementTarget = "armsUp";
        this.movementConfirmed = false;
        this.detectionProgress = 0;
        this.detectionStartTime = null;
        this.environmentLevel = 0;
        this.score = 0;
        this.updateEnvStatus();
        if (this.startBtn) this.startBtn.textContent = '♻️ Reiniciar';
        this.playBeep();
        alert("Jogo pronto! Levante os braços para começar.");
    },

    showGameOver() {
        this.playing = false;
        setTimeout(() => {
            let message = `Fim de Jogo! Pontuação Final: ${this.score}.`;
            if (this.environmentLevel >= 9)
                message += "\nParabéns! Você restaurou completamente o cenário!";
            else message += "\nContinue aprendendo para salvar nosso planeta!";
            alert(message);
        }, 500);
    }
};