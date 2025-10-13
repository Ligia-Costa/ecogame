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
    questionBank: [], // Banco de perguntas total
    currentLevelQuestions: [], // Perguntas para o nível atual
    isQuestionActive: false,
    playing: false,
    score: 0,
    lives: 3,
    currentLevel: 1,
    totalLevels: 3,
    levelProgress: 0,
    seedsPerLevel: 5,
    
    // Armazena todas as perguntas carregadas, separadas por tipo/matéria
    allLoadedQuestions: {}, 

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
            alert("Erro ao iniciar o jogo. Verifique as permissões da câmera.");
        }
    },

    resizeCanvas() {
        this.overlay.width = this.gameContainer.clientWidth;
        this.overlay.height = this.gameContainer.clientHeight;
        if (!this.playing && this.player.loaded) { // Garante que o jogador esteja no centro na inicialização
            this.player.x = this.overlay.width / 2 - this.player.width / 2;
            this.player.y = this.overlay.height * 0.8 - this.player.height; // Mais para baixo
        }
    },

    async loadAllQuestions(avatarId) {
        const response = await fetch('questions.json');
        let allJsonQuestions = await response.json();

        // Adicionando novas perguntas diretamente para os novos níveis temáticos
        allJsonQuestions.poluicao = [
            { pergunta: "Qual tipo de poluição é causada pelo excesso de som em áreas urbanas?", alternativas: ["A) Poluição Sonora", "B) Poluição Visual", "C) Poluição do Ar", "D) Poluição da Água"], resposta_correta: "A) Poluição Sonora" },
            { pergunta: "O descarte incorreto de pilhas e baterias pode causar a contaminação do solo por:", alternativas: ["A) Plástico", "B) Vidro", "C) Metais Pesados", "D) Matéria Orgânica"], resposta_correta: "C) Metais Pesados" },
            { pergunta: "O que é a 'ilha de calor' nas grandes cidades?", alternativas: ["A) Uma área com muitos vulcões", "B) Um fenômeno de aquecimento localizado devido à urbanização", "C) Um parque aquático temático", "D) Uma praia artificial"], resposta_correta: "B) Um fenômeno de aquecimento localizado devido à urbanização" },
            { pergunta: "A chuva ácida é causada principalmente pela emissão de quais gases?", alternativas: ["A) Oxigênio e Nitrogênio", "B) Dióxido de carbono e Metano", "C) Óxidos de enxofre e nitrogênio", "D) Gás hélio e argônio"], resposta_correta: "C) Óxidos de enxofre e nitrogênio" },
            { pergunta: "Qual o principal risco do descarte de lixo plástico nos oceanos?", alternativas: ["A) Aumentar a temperatura da água", "B) Prejudicar a vida marinha, que confunde plástico com alimento", "C) Deixar a água mais salgada", "D) Criar novas ilhas artificiais"], resposta_correta: "B) Prejudicar a vida marinha, que confunde plástico com alimento" },
        ];
        allJsonQuestions.cidades_inteligentes = [
            { pergunta: "O que caracteriza um 'prédio verde' em uma cidade inteligente?", alternativas: ["A) A cor da pintura", "B) Uso de tecnologias para eficiência energética e hídrica", "C) Ter mais de 50 andares", "D) Ser construído apenas com vidro"], resposta_correta: "B) Uso de tecnologias para eficiência energética e hídrica" },
            { pergunta: "Qual o principal benefício de um sistema de transporte público integrado e inteligente?", alternativas: ["A) Aumentar o número de carros nas ruas", "B) Reduzir o trânsito e a emissão de poluentes", "C) Tornar as viagens mais caras", "D) Limitar o acesso ao centro da cidade"], resposta_correta: "B) Reduzir o trânsito e a emissão de poluentes" },
            { pergunta: "A 'Internet das Coisas' (IoT) em uma cidade inteligente pode ser usada para:", alternativas: ["A) Apenas para redes sociais", "B) Monitorar o tráfego e otimizar a iluminação pública", "C) Baixar filmes mais rápido", "D) Criar mais vírus de computador"], resposta_correta: "B) Monitorar o tráfego e otimizar a iluminação pública" },
            { pergunta: "O que é 'agricultura urbana' no contexto de cidades sustentáveis?", alternativas: ["A) Criar fazendas em outros planetas", "B) Cultivar alimentos em espaços urbanos como telhados e varandas", "C) Proibir a venda de vegetais na cidade", "D) Usar apenas tratores elétricos"], resposta_correta: "B) Cultivar alimentos em espaços urbanos como telhados e varandas" },
            { pergunta: "Por que a coleta seletiva e a reciclagem são cruciais em uma cidade inteligente?", alternativas: ["A) Para gerar mais lixo", "B) Porque embeleza os sacos de lixo", "C) Para reduzir o volume de resíduos em aterros e economizar recursos", "D) É uma exigência para usar smartphones"], resposta_correta: "C) Para reduzir o volume de resíduos em aterros e economizar recursos" },
        ];

        const normalizedAvatarId = avatarId.replace(/\d/g, '');
        
        // Armazena as perguntas já no formato do jogo
        this.allLoadedQuestions.materia = allJsonQuestions[normalizedAvatarId].map(q => this.formatQuestion(q, "Desafio da Matéria"));
        this.allLoadedQuestions.poluicao = allJsonQuestions.poluicao.map(q => this.formatQuestion(q, "Desafio da Poluição"));
        this.allLoadedQuestions.cidades_inteligentes = allJsonQuestions.cidades_inteligentes.map(q => this.formatQuestion(q, "Desafio Urbano"));
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
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        hands.onResults(results => this.onHandResults(results));

        const camera = new Camera(this.video, {
            onFrame: async () => {
                await hands.send({ image: this.video });
            },
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
        this.drawEnvironment();

        if (this.playing) {
            if (!this.isQuestionActive) {
                this.detectMovement(results);
                this.checkSeedCollision();
            }
            this.drawSeeds();
        }
        this.drawPlayer();
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
        
        this.setupLevel(); // Configura o primeiro nível
        this.updateHud();
        this.playTone(800, 0.2);
    },
    
    setupLevel() {
        this.levelProgress = 0;
        this.currentLevelQuestions = []; // Limpa perguntas do nível anterior
        
        // Define as perguntas para o nível atual
        if (this.currentLevel === 1) {
            this.currentLevelQuestions = [...this.allLoadedQuestions.materia]; // Copia para poder manipular
        } else if (this.currentLevel === 2) {
            this.currentLevelQuestions = [...this.allLoadedQuestions.poluicao];
        } else if (this.currentLevel === 3) {
            this.currentLevelQuestions = [...this.allLoadedQuestions.cidades_inteligentes];
        }

        this.createSeeds();
        this.updateHud();
        this.player.x = this.overlay.width / 2 - this.player.width / 2;
        this.player.y = this.overlay.height * 0.8 - this.player.height;
    },

    createSeeds() {
        this.seeds = [];
        // Garante que o número de sementes não exceda as perguntas disponíveis
        const seedsToCreate = Math.min(this.seedsPerLevel, this.currentLevelQuestions.length); 
        for (let i = 0; i < seedsToCreate; i++) {
            this.seeds.push({
                // ALTERADO: Aumentamos a área vertical para espalhar mais as sementes
                x: Math.random() * (this.overlay.width - 40) + 20,
                y: Math.random() * (this.overlay.height * 0.9 - 80) + 40, // Sementes podem aparecer um pouco mais para baixo
                size: 20, collected: false
            });
        }
    },

    updateHud() {
        this.scoreEl.textContent = this.score;
        this.livesEl.textContent = this.lives;
        this.levelEl.textContent = this.currentLevel;
        this.envStatusEl.querySelector('span').textContent = `${this.levelProgress} / ${this.seedsPerLevel}`;
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

        // Pega uma pergunta aleatória do banco de questões DO NÍVEL ATUAL
        const questionIndex = Math.floor(Math.random() * this.currentLevelQuestions.length);
        const question = this.currentLevelQuestions.splice(questionIndex, 1)[0]; // Remove a pergunta para não repetir
        
        questionManager.show(question, (isCorrect, explanation) => {
            if (isCorrect) {
                this.playTone(1200, 0.3);
                this.score += 100;
                this.levelProgress++;
                seed.collected = true; // Semente desaparece apenas com resposta correta
            } else {
                this.playTone(200, 0.4);
                this.lives--;
                // Ao errar, a semente *não* é coletada e permanece no lugar, ou uma nova é adicionada
                // Para garantir que sempre haja sementes, vamos adicionar uma nova se as perguntas não tiverem acabado
                 if (this.currentLevelQuestions.length > 0) {
                    this.seeds.push({
                        x: Math.random() * (this.overlay.width - 40) + 20,
                        y: Math.random() * (this.overlay.height * 0.8 - 60) + 20,
                        size: 20, collected: false
                    });
                }
            }
            this.updateHud();
            this.showFeedbackModal(isCorrect, explanation, () => {
                if (this.lives <= 0) {
                    this.showGameOver(false);
                } else if (this.levelProgress >= this.seedsPerLevel) {
                    if (this.currentLevel < this.totalLevels) {
                        this.currentLevel++;
                        this.setupLevel();
                        this.isQuestionActive = false;
                    } else {
                        this.showGameOver(true);
                    }
                } else {
                    this.isQuestionActive = false;
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
        
        // NOVO: Define um preenchimento para tornar o cenário "menor" (mais concentrado)
        const horizontalPadding = this.overlay.width * 0.1; // 10% de margem em cada lado
        const effectiveWidth = this.overlay.width - (2 * horizontalPadding);

        if (this.currentLevel === 1) { // Desmatamento
            this.ctx.fillStyle = '#8B4513'; // Cor de terra
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);
            // ALTERADO: Desenha tocos dentro da área efetiva
            for (let i = 0; i < this.seedsPerLevel; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (this.seedsPerLevel - 1) * i) - 20;
                this.ctx.fillStyle = '#5a2d0c';
                this.ctx.fillRect(xPos, this.overlay.height - 40, 40, 20); // Base do toco
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(xPos + 5, this.overlay.height - 50, 30, 10); // Parte de cima
            }
            // ALTERADO: Desenha árvores conforme o progresso na mesma área concentrada
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (this.seedsPerLevel - 1) * i);
                this.ctx.font = `60px Poppins`;
                this.ctx.fillText("🌳", xPos, this.overlay.height - 70);
            }
        }
        else if (this.currentLevel === 2) { // Poluição
            this.ctx.fillStyle = `rgb(60, 80, 100)`; 
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);

            // ALTERADO: Lixo flutuante concentrado no meio
            const remainingTrash = this.seedsPerLevel - this.levelProgress;
            for (let i = 0; i < remainingTrash; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (remainingTrash + 1)) * (i + 1);
                this.ctx.font = `30px Poppins`;
                this.ctx.fillText("🗑️", xPos, 150 + (i % 2 === 0 ? 0 : 50)); 
                this.ctx.fillText("🧴", xPos + 20, 200 + (i % 3 === 0 ? 0 : 30)); 
            }

            // ALTERADO: Peixes e água mais clara na área concentrada
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (this.seedsPerLevel + 1)) * (i + 1);
                this.ctx.font = `40px Poppins`;
                this.ctx.fillText("🐠", xPos + (i%2*30), 180 + (i % 2 === 0 ? 0 : 50));
                this.ctx.fillText("🐬", xPos - (i%2*20), 250 - (i % 2 === 0 ? 0 : 30));
            }
        }
        else if (this.currentLevel === 3) { // Cidades Inteligentes
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);

            // ALTERADO: Prédios desenhados na área concentrada
            const buildingPositions = [0.1, 0.3, 0.5, 0.7, 0.9];
            buildingPositions.forEach((pos, index) => {
                const x = horizontalPadding + (effectiveWidth * pos) - 50;
                const h = 150 + (index % 2 * 50);
                this.ctx.fillStyle = '#3a3a5e';
                this.ctx.fillRect(x, this.overlay.height - (h + 50), 90 + (index % 2 * 20), h);
            });

            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(0, this.overlay.height - 50, this.overlay.width, 50);

            // Carros
            const remainingCars = this.seedsPerLevel - this.levelProgress;
            for (let i = 0; i < remainingCars; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (remainingCars + 1)) * (i + 1);
                this.ctx.font = `30px Poppins`;
                this.ctx.fillText("🚗", xPos, this.overlay.height - 20);
            }

            // ALTERADO: Elementos sustentáveis sem sol e plantas
            for (let i = 0; i < this.levelProgress; i++) {
                const xPos = horizontalPadding + (effectiveWidth / (this.seedsPerLevel + 1)) * (i + 1);
                this.ctx.font = `40px Poppins`;
                if (i % 2 === 0) {
                     this.ctx.fillText("🚲", xPos + 10, this.overlay.height - 20); // Apenas a Bicicleta
                } else {
                    this.ctx.fillText("🚌", xPos - 10, this.overlay.height - 20); // Apenas o Ônibus
                }
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