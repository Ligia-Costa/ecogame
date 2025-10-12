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

const questionBankReal = [
    { name: 'Energias Renováveis', question: {text:'Qual destas é uma fonte de energia renovável?', choices:['Energia Solar','Carvão Mineral','Petróleo','Gás Natural'], answer:0}},
    { name: 'Agricultura Sustentável', question: {text:'O que é agricultura orgânica?', choices:['Uso intensivo de agrotóxicos','Cultivo sem produtos químicos sintéticos','Plantio em estufas','Cultivo apenas de transgênicos'], answer:1}},
    { name: 'Biodiversidade', question: {text:'Por que a biodiversidade é importante?', choices:['Mantém o equilíbrio dos ecossistemas','Aumenta a poluição','Reduz a qualidade do ar','Diminui a produção de alimentos'], answer:0}},
    { name: 'Economia Circular', question: {text:'O que é economia circular?', choices:['Sistema de reutilização de recursos','Produção de mais lixo','Uso único de produtos','Extrair mais recursos naturais'], answer:0}},
    { name: 'Recursos Hídricos', question: {text:'Qual prática ajuda a conservar água?', choices:['Captação de água da chuva','Banhos longos','Lavar calçada com mangueira','Deixar torneira aberta'], answer:0}},
    { name: 'Tecnologias Verdes', question: {text:'O que são tecnologias verdes?', choices:['Tecnologias que reduzem impacto ambiental','Tecnologias que aumentam poluição','Dispositivos eletrônicos descartáveis','Ferramentas de mineração'], answer:0}},
    { name: 'Poluição e Resíduos', question: {text:'Qual é a melhor forma de reduzir resíduos?', choices:['Reciclagem e compostagem','Queimar lixo a céu aberto','Jogar no lixo comum','Enterrar em aterros'], answer:0}},
    { name: 'Mudanças Climáticas', question: {text:'Qual é a principal causa do aquecimento global?', choices:['Emissão de gases de efeito estufa','Rotação da Terra','Atividade solar','Variações orbitais'], answer:0}},
    { name: 'Sustentabilidade Urbana', question: {text:'O que caracteriza uma cidade sustentável?', choices:['Transporte público eficiente','Trânsito intenso de carros','Grandes aterros sanitários','Alto consumo de energia'], answer:0}},
    { name: 'Consumo Consciente', question: {text:'O que é consumo consciente?', choices:['Escolher produtos sustentáveis','Comprar sem necessidade','Desperdiçar recursos','Ignorar a origem dos produtos'], answer:0}},
    { name: 'Bioenergia', question: {text:'O que é bioenergia?', choices:['Energia de biomassa renovável','Energia de combustíveis fósseis','Energia nuclear','Energia de minérios'], answer:0}},
    { name: 'Conservação do Solo', question: {text:'Qual prática ajuda na conservação do solo?', choices:['Plantio direto','Desmatamento','Queimadas','Uso excessivo de agrotóxicos'], answer:0}},
    { name: 'Energia Eólica', question: {text:'Qual vantagem da energia eólica?', choices:['Fonte limpa e renovável','Produz resíduos radioativos','Depende de combustíveis','Causa desmatamento'], answer:0}},
    { name: 'Compostagem', question: {text:'O que é compostagem?', choices:['Processo de reciclagem de orgânicos','Queima de resíduos','Aterro de lixo','Incineração'], answer:0}},
    { name: 'Desenvolvimento Sustentável', question: {text:'O que é desenvolvimento sustentável?', choices:['Atender necessidades atuais sem comprometer futuras','Explorar todos os recursos agora','Priorizar apenas crescimento econômico','Ignorar questões ambientais'], answer:0}}
];

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
                    onAnswer(isCorrect);
                }, 1800);
            };
            this.choices.appendChild(btn);
        });
    }
};


// --- JOGO VIDA REAL (VERSÃO CORRIGIDA E FINALIZADA) ---
const realLifeGame = {
    // Referências da UI
    video: document.getElementById('video'),
    overlay: document.getElementById('overlay'),
    ctx: null,
    startBtn: document.getElementById('startBtn'),
    scoreEl: document.getElementById('score'),
    envStatusEl: document.getElementById('env-status'),

    // Estado do jogo
    player: { x: 300, y: 350, width: 60, height: 90, velocityY: 0, onGround: true, image: new Image(), loaded: false },
    gravity: 0.8,
    jumpForce: -18,
    environmentLevel: 0,
    seeds: [],
    questionBank: [],
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
        this.player.image.onload = () => { this.player.loaded = true; }; // Confirma que a imagem foi carregada

        try {
            await this.initCamera();
            await this.loadModel();
            this.initializeLevel(); // Inicializa o cenário e as sementes
            this.loop(); // Inicia o loop de renderização
        } catch (e) {
            console.error('Erro ao iniciar câmera/modelo', e);
        }
    },

    async initCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        this.video.srcObject = stream;
        await new Promise(resolve => this.video.onloadedmetadata = () => this.video.play().then(resolve));
        this.overlay.width = this.video.videoWidth;
        this.overlay.height = this.video.videoHeight;
        this.streaming = true;
    },

    async loadModel() {
        this.detector = await posenet.load({ architecture: 'MobileNetV1', outputStride: 16, inputResolution: { width: 640, height: 480 }, multiplier: 0.75 });
        this.modelReady = true;
    },

    initializeLevel() {
        this.seeds = [];
        this.environmentLevel = 0;
        this.score = 0;
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        this.updateEnvStatus();
        this.questionBank = [...questionBankReal];

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

        if (this.environmentLevel < 3) {
            // Cenário Queimada
            this.ctx.fillStyle = '#4a423a'; // Céu de fumaça
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            this.ctx.fillStyle = '#2d211a'; // Chão queimado
            this.ctx.fillRect(0, groundY, this.overlay.width, 60);
        } else if (this.environmentLevel < 9) {
            // Cenário Recuperação
            this.ctx.fillStyle = '#87ceeb';
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            this.ctx.fillStyle = '#228B22';
            this.ctx.fillRect(0, groundY, this.overlay.width, 60);
            for (let i = 3; i < this.environmentLevel; i++) {
                this.ctx.fillStyle = '#32cd32';
                this.ctx.fillRect(i * 60, groundY - 20, 5, 20);
            }
        } else {
            // Cenário Restaurado
            this.ctx.fillStyle = '#00BFFF';
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            this.ctx.fillStyle = '#006400';
            this.ctx.fillRect(0, groundY, this.overlay.width, 60);
            for (let i = 9; i < this.environmentLevel && i < 15; i++) {
                const treeX = (i - 8) * 90;
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(treeX, groundY - 70, 20, 70);
                this.ctx.fillStyle = 'green';
                this.ctx.beginPath();
                this.ctx.arc(treeX + 10, groundY - 70, 40, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    },

    drawGameElements() {
        // Desenha sementes
        this.ctx.font = '30px Arial';
        this.seeds.forEach(seed => {
            if (!seed.collected) this.ctx.fillText('🌱', seed.x, seed.y);
        });

        // Desenha o avatar apenas se a imagem estiver carregada
        if (this.player.loaded) {
            this.ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        }
    },

    async loop() {
        if (!this.streaming || !this.modelReady) {
            requestAnimationFrame(() => this.loop());
            return;
        }

        this.drawBackground();
        const pose = await this.detector.estimateSinglePose(this.video, { flipHorizontal: true });

        if (this.playing && !this.isQuestionActive) {
            const nose = this.getKey(pose.keypoints, 'nose');
            const leftWrist = this.getKey(pose.keypoints, 'leftWrist');
            const rightWrist = this.getKey(pose.keypoints, 'rightWrist');

            if (nose) this.player.x = nose.position.x - (this.player.width / 2);

            if (this.player.onGround && leftWrist && rightWrist && nose &&
                leftWrist.position.y < nose.position.y && rightWrist.position.y < nose.position.y) {
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
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
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

            questionManager.show(questionObj, (isCorrect) => {
                if (isCorrect) {
                    this.score += 20;
                    this.environmentLevel++;
                    if (this.scoreEl) this.scoreEl.textContent = this.score;
                    this.updateEnvStatus();
                }

                const remainingSeeds = this.seeds.some(s => !s.collected);
                if (!remainingSeeds) {
                    this.showGameOver();
                } else {
                    this.isQuestionActive = false;
                }
            });
        }
    },
    
    updateEnvStatus() {
        if (!this.envStatusEl) return;
        let status = "Queimada";
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
            alert(`Fim de Jogo! Pontuação Final: ${this.score}. O cenário foi completamente restaurado!`);
        }, 500);
    }
};