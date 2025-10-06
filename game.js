// game.js - Código principal do jogo
document.addEventListener('DOMContentLoaded', function() {
    AppManager.init();
});

// Carregar perguntas do arquivo JSON
let questionsBySubject = {};

// Função para extrair o índice da resposta
function getAnswerIndex(resposta) {
    if (!resposta) return 0;
    const letra = resposta.trim().charAt(0).toUpperCase();
    return letra.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
}

// Função para carregar as perguntas
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('Dados brutos do JSON:', data);
        
        // Converter o formato das perguntas
        questionsBySubject = {};
        
        for (const [subjectKey, questions] of Object.entries(data)) {
            // Mapear as chaves do JSON para os nomes dos avatares
            const subjectMap = {
                'lingua_portuguesa': 'Língua Portuguesa',
                'quimica': 'Química',
                'matematica': 'Matemática',
                'ingles': 'Inglês',
                'biologia': 'Biologia',
                'fisica': 'Física',
                'historia': 'História',
                'geografia': 'Geografia',
                'arte': 'Arte',
                'educacao_fisica': 'Educação Física',
                'sociologia': 'Sociologia',
                'filosofia': 'Filosofia'
            };
            
            const subjectName = subjectMap[subjectKey] || subjectKey;
            
            if (questions && Array.isArray(questions)) {
                questionsBySubject[subjectName] = questions.map((q, index) => ({
                    name: subjectName,
                    question: {
                        text: q.pergunta || 'Pergunta não disponível',
                        choices: q.alternativas || ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
                        answer: getAnswerIndex(q.resposta_correta)
                    }
                }));
                
                console.log(`Matéria: ${subjectName}, Perguntas:`, questionsBySubject[subjectName]);
            }
        }
        
        console.log('Perguntas carregadas com sucesso!', questionsBySubject);
        return questionsBySubject;
        
    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        
        // Fallback com perguntas básicas para todas as matérias
        const fallbackQuestions = {
            'Língua Portuguesa': [createFallbackQuestion('Língua Portuguesa')],
            'Química': [createFallbackQuestion('Química')],
            'Matemática': [createFallbackQuestion('Matemática')],
            'Inglês': [createFallbackQuestion('Inglês')],
            'Biologia': [createFallbackQuestion('Biologia')],
            'Física': [createFallbackQuestion('Física')],
            'História': [createFallbackQuestion('História')],
            'Geografia': [createFallbackQuestion('Geografia')],
            'Arte': [createFallbackQuestion('Arte')],
            'Educação Física': [createFallbackQuestion('Educação Física')],
            'Sociologia': [createFallbackQuestion('Sociologia')],
            'Filosofia': [createFallbackQuestion('Filosofia')]
        };
        
        questionsBySubject = fallbackQuestions;
        return fallbackQuestions;
    }
}

// Função auxiliar para criar perguntas de fallback
function createFallbackQuestion(subject) {
    return {
        name: subject,
        question: {
            text: `Qual é o principal conceito de sustentabilidade em ${subject}?`,
            choices: [
                'A) Uso responsável dos recursos',
                'B) Exploração máxima',
                'C) Ignorar impactos ambientais',
                'D) Foco apenas no lucro'
            ],
            answer: 0
        }
    };
}

// Dados dos avatares
const avatars = [
    { subject: 'Língua Portuguesa', icon: '📖' },
    { subject: 'Química', icon: '🧪' },
    { subject: 'Matemática', icon: '📊' },
    { subject: 'Inglês', icon: '🌐' },
    { subject: 'Biologia', icon: '🌿' },
    { subject: 'Física', icon: '💡' },
    { subject: 'História', icon: '📜' },
    { subject: 'Geografia', icon: '🗺️' },
    { subject: 'Arte', icon: '🎨' },
    { subject: 'Educação Física', icon: '🏃' },
    { subject: 'Sociologia', icon: '👥' },
    { subject: 'Filosofia', icon: '🤔' },
];

// Fases do modo Vida Real
const REAL_LIFE_PHASES = [
    { id: 'levantar_braços', name: 'Energias Renováveis', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'Qual destas é uma fonte de energia renovável?', choices:['Energia Solar','Carvão Mineral','Petróleo','Gás Natural'], answer:0}},
    { id: 'agachar', name: 'Agricultura Sustentável', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que é agricultura orgânica?', choices:['Uso intensivo de agrotóxicos','Cultivo sem produtos químicos sintéticos','Plantio em estufas','Cultivo apenas de transgênicos'], answer:1}},
    { id: 'passo_lado', name: 'Biodiversidade', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'Por que a biodiversidade é importante?', choices:['Mantém o equilíbrio dos ecossistemas','Aumenta a poluição','Reduz a qualidade do ar','Diminui a produção de alimentos'], answer:0}},
    { id: 'pular', name: 'Economia Circular', action: 'jump', desc: 'Dê dois pulos no mesmo lugar.', question: {text:'O que é economia circular?', choices:['Sistema de reutilização de recursos','Produção de mais lixo','Uso único de produtos','Extrair mais recursos naturais'], answer:0}},
    { id: 'levantar_braços2', name: 'Recursos Hídricos', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'Qual prática ajuda a conservar água?', choices:['Captação de água da chuva','Banhos longos','Lavar calçada com mangueira','Deixar torneira aberta'], answer:0}},
    { id: 'agachar2', name: 'Tecnologias Verdes', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que são tecnologias verdes?', choices:['Tecnologias que reduzem impacto ambiental','Tecnologias que aumentam poluição','Dispositivos eletrônicos descartáveis','Ferramentas de mineração'], answer:0}},
    { id: 'passo_lado2', name: 'Poluição e Resíduos', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'Qual é a melhor forma de reduzir resíduos?', choices:['Reciclagem e compostagem','Queimar lixo a céu aberto','Jogar no lixo comum','Enterrar em aterros'], answer:0}},
    { id: 'pular2', name: 'Mudanças Climáticas', action: 'jump', desc: 'Dê dois pulos no mesmo lugar.', question: {text:'Qual é a principal causa do aquecimento global?', choices:['Emissão de gases de efeito estufa','Rotação da Terra','Atividade solar','Variações orbitais'], answer:0}},
    { id: 'levantar_braços3', name: 'Sustentabilidade Urbana', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'O que caracteriza uma cidade sustentável?', choices:['Transporte público eficiente','Trânsito intenso de carros','Grandes aterros sanitários','Alto consumo de energia'], answer:0}},
    { id: 'agachar3', name: 'Bioenergia', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que é bioenergia?', choices:['Energia de biomassa renovável','Energia de combustíveis fósseis','Energia nuclear','Energia de minérios'], answer:0}},
    { id: 'passo_lado3', name: 'Conservação do Solo', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'Qual prática ajuda na conservação do solo?', choices:['Plantio direto','Desmatamento','Queimadas','Uso excessivo de agrotóxicos'], answer:0}},
    { id: 'pular3', name: 'Consumo Consciente', action: 'jump', desc: 'Dê dois pulos no mesmo lugar.', question: {text:'O que é consumo consciente?', choices:['Escolher produtos sustentáveis','Comprar sem necessidade','Desperdiçar recursos','Ignorar a origem dos produtos'], answer:0}},
    { id: 'extra1', name: 'Energia Eólica', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'Qual vantagem da energia eólica?', choices:['Fonte limpa e renovável','Produz resíduos radioativos','Depende de combustíveis','Causa desmatamento'], answer:0}},
    { id: 'extra2', name: 'Compostagem', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que é compostagem?', choices:['Processo de reciclagem de orgânicos','Queima de resíduos','Aterro de lixo','Incineração'], answer:0}},
    { id: 'extra3', name: 'Desenvolvimento Sustentável', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'O que é desenvolvimento sustentável?', choices:['Atender necessidades atuais sem comprometer futuras','Explorar todos os recursos agora','Priorizar apenas crescimento econômico','Ignorar questões ambientais'], answer:0}}
];

// Elementos da UI
const modeSelection = document.getElementById('mode-selection');
const realLifeMode = document.getElementById('real-life-mode');
const virtualLifeMode = document.getElementById('virtual-life-mode');
const avatarSelection = document.getElementById('avatar-selection');
const avatarGrid = document.getElementById('avatar-grid');
const finalScreen = document.getElementById('final-screen');

// Gerenciador de Perguntas
const questionManager = {
    questionModal: document.getElementById('questionModal'),
    qText: document.getElementById('qText'),
    choicesEl: document.getElementById('choices'),
    
    show(phaseObj, success, points, onAnswer) {
        console.log('Mostrando pergunta:', phaseObj);
        
        // Validar se phaseObj e question existem
        if (!phaseObj || !phaseObj.question) {
            console.error('Objeto de pergunta inválido:', phaseObj);
            phaseObj = {
                name: 'Pergunta',
                question: {
                    text: 'Pergunta não disponível',
                    choices: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
                    answer: 0
                }
            };
        }
        
        this.questionModal.classList.add('active');
        this.qText.textContent = phaseObj.question.text;
        this.choicesEl.innerHTML = '';
        document.getElementById('qTitle').textContent = `Pergunta — ${phaseObj.name}`;
        
        if (points !== undefined) {
            document.getElementById('questionPoints').textContent = points;
        }
        
        // Atualizar progresso
        let progress, total;
        if (virtualLifeGame.currentQuestionIndex !== undefined) {
            progress = virtualLifeGame.currentQuestionIndex + 1;
            total = 15;
        } else {
            progress = realLifeGame.currentPhaseIndex + 1;
            total = 15;
        }
        
        document.getElementById('questionProgress').textContent = `${progress}/${total}`;
        document.getElementById('questionProgressFill').style.width = `${(progress / total) * 100}%`;

        phaseObj.question.choices.forEach((c, i) => {
            const btn = document.createElement('div');
            btn.className = 'choice';
            btn.textContent = c;
            btn.addEventListener('click', () => {
                const isCorrect = (i === phaseObj.question.answer);
                
                // Feedback visual
                if (isCorrect) {
                    btn.classList.add('correct');
                } else {
                    btn.classList.add('incorrect');
                    // Mostrar resposta correta
                    const correctBtn = this.choicesEl.children[phaseObj.question.answer];
                    if (correctBtn) correctBtn.classList.add('correct');
                }
                
                setTimeout(() => {
                    this.questionModal.classList.remove('active');
                    onAnswer(isCorrect, isCorrect ? (points || 20) : 0);
                }, 1500);
            }, { once: true });
            this.choicesEl.appendChild(btn);
        });
    }
};

// Jogo Vida Real
const realLifeGame = {
    PHASES: REAL_LIFE_PHASES,

    // Referências da UI
    video: document.getElementById('video'),
    overlay: document.getElementById('overlay'),
    ctx: null,
    startBtn: document.getElementById('startBtn'),
    calibrateBtn: document.getElementById('calibrateBtn'),
    phaseNameEl: document.getElementById('phaseName'),
    phaseIdxEl: document.getElementById('phaseIdx'),
    phaseTotalEl: document.getElementById('phaseTotal'),
    scoreEl: document.getElementById('score'),
    phaseTimeDisplay: document.getElementById('phaseTime'),

    // Estado do jogo
    detector: null,
    modelReady: false,
    streaming: false,
    calibrated: false,
    baseline: {centerX:0, centerY:0},
    playing: false,
    currentPhaseIndex: 0,
    score: 0,
    phaseTimer: null,
    phaseStartTime: 0,
    lastNose: null,
    lastTimestamp: 0,
    raiseCount: 0,
    jumpDetectedRecently: false,
    stepDetectedRecently: false,

    init() {
        if (!this.video || !this.overlay) {
            console.error('Elementos de vídeo não encontrados!');
            return;
        }

        this.ctx = this.overlay.getContext('2d');
        
        // Configurar event listeners
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startGame());
        if (this.calibrateBtn) this.calibrateBtn.addEventListener('click', () => this.calibrate());
        
        this.renderPhaseList();

        // Inicializar câmera e modelo
        (async () => {
            try {
                await this.initCamera();
                await this.loadModel();
                this.loop();
            } catch(e) {
                console.warn('Erro ao iniciar câmera/modelo', e);
            }
        })();
    },

    renderPhaseList() {
        if (this.phaseTotalEl) {
            this.phaseTotalEl.textContent = this.PHASES.length;
        }
    },

    async initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }, 
                audio: false
            });
            this.video.srcObject = stream;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play().then(resolve);
                };
            });
            
            this.overlay.width = this.video.videoWidth;
            this.overlay.height = this.video.videoHeight;
            this.streaming = true;
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
        }
    },

    async loadModel() {
        try {
            this.detector = await posenet.load({
                architecture: 'MobileNetV1', 
                outputStride: 16, 
                inputResolution: { width: 640, height: 480 }, 
                multiplier: 0.75
            });
            this.modelReady = true;
            console.log('PoseNet carregado');
        } catch (error) {
            console.error('Erro ao carregar modelo:', error);
        }
    },

    calibrate() {
        if(!this.streaming) {
            alert('Ative a câmera primeiro (permita o acesso)');
            return;
        }
        this.baseline.centerX = this.video.videoWidth/2;
        this.baseline.centerY = this.video.videoHeight/2;
        this.calibrated = true;
        if (this.calibrateBtn) {
            this.calibrateBtn.textContent = 'Posição calibrada ✓';
            setTimeout(() => {this.calibrateBtn.textContent='Calibrar Posição';}, 2000);
        }
    },

    getKey(kp, name) {
        return kp.find(p => p.part === name);
    },

    detectRaiseHands(keypoints) {
        const leftW = this.getKey(keypoints,'leftWrist');
        const rightW = this.getKey(keypoints,'rightWrist');
        const nose = this.getKey(keypoints,'nose');
        if(!leftW || !rightW || !nose) return false;
        return (leftW.position.y < nose.position.y - 20) && (rightW.position.y < nose.position.y - 20);
    },

    detectSquat(keypoints) {
        const leftHip = this.getKey(keypoints,'leftHip');
        const rightHip = this.getKey(keypoints,'rightHip');
        const leftKnee = this.getKey(keypoints,'leftKnee');
        const rightKnee = this.getKey(keypoints,'rightKnee');
        if(!leftHip || !rightHip || !leftKnee || !rightKnee) return false;
        const hipY = (leftHip.position.y + rightHip.position.y)/2;
        const kneeY = (leftKnee.position.y + rightKnee.position.y)/2;
        return (hipY - kneeY) > -10;
    },

    detectJump(prevY, currentY) {
        return (prevY - currentY) > 20;
    },

    detectStepSide(prevX, currentX) {
        return Math.abs(currentX - prevX) > 40;
    },

    drawKeypoints(keypoints) {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        keypoints.forEach(k => {
            const {x,y} = k.position;
            this.ctx.beginPath();
            this.ctx.arc(x,y,4,0,Math.PI*2);
            this.ctx.fillStyle = '#ffd54a'; 
            this.ctx.fill();
        });
    },

    updateActionIndicator() {
        const currentPhase = this.PHASES[this.currentPhaseIndex];
        const actionIcon = document.getElementById('actionIcon');
        const actionText = document.getElementById('actionText');
        
        if (actionIcon && actionText) {
            switch(currentPhase.action) {
                case 'raise_hands':
                    actionIcon.textContent = '🙌';
                    actionText.textContent = 'Levante os braços';
                    break;
                case 'squat':
                    actionIcon.textContent = '🦵';
                    actionText.textContent = 'Agache';
                    break;
                case 'jump':
                    actionIcon.textContent = '🦘';
                    actionText.textContent = 'Pule';
                    break;
                case 'step_side':
                    actionIcon.textContent = '👣';
                    actionText.textContent = 'Mova-se para os lados';
                    break;
            }
            
            actionIcon.classList.add('pulse');
            setTimeout(() => actionIcon.classList.remove('pulse'), 500);
        }
    },

    async loop() {
        if(!this.streaming || !this.modelReady) {
            requestAnimationFrame(() => this.loop());
            return;
        }

        try {
            const pose = await this.detector.estimateSinglePose(this.video, {flipHorizontal:true});
            this.drawKeypoints(pose.keypoints);

            const nose = this.getKey(pose.keypoints,'nose');
            if(nose){
                const nx = nose.position.x; 
                const ny = nose.position.y;
                if(!this.lastNose) this.lastNose = {x:nx,y:ny};

                if(this.playing){
                    const currentPhase = this.PHASES[this.currentPhaseIndex];
                    const action = currentPhase.action;
                    const now = performance.now();

                    if(action==='raise_hands'){
                        if(this.detectRaiseHands(pose.keypoints)){
                            if(now - this.lastTimestamp > 600){
                                this.raiseCount++;
                                this.lastTimestamp = now;
                            }
                        }
                        if(this.raiseCount>=2){ 
                            this.finishPhase(true); 
                        }
                    }

                    if(action==='squat'){
                        if(this.detectSquat(pose.keypoints)){ 
                            this.finishPhase(true); 
                        }
                    }

                    if(action==='jump'){
                        const prevY = this.lastNose.y; 
                        const currY = ny;
                        if(this.detectJump(prevY,currY) && !this.jumpDetectedRecently){
                            this.jumpDetectedRecently = true;
                            setTimeout(() => {this.jumpDetectedRecently=false;}, 800);
                            if(!window.__jumpCount) window.__jumpCount=1; 
                            else window.__jumpCount++;
                            if(window.__jumpCount>=2){ 
                                this.finishPhase(true); 
                                window.__jumpCount=0; 
                            }
                        }
                    }

                    if(action==='step_side'){
                        const prevX = this.lastNose.x; 
                        const currX = nx;
                        if(this.detectStepSide(prevX,currX) && !this.stepDetectedRecently){
                            this.stepDetectedRecently = true;
                            setTimeout(() => {this.stepDetectedRecently=false;}, 700);
                            if(!window.__stepCount) window.__stepCount=1; 
                            else window.__stepCount++;
                            if(window.__stepCount>=2){ 
                                this.finishPhase(true); 
                                window.__stepCount=0; 
                            }
                        }
                    }

                    const elapsed = (performance.now() - this.phaseStartTime)/1000;
                    
                    // Atualizar barra de tempo
                    const timerProgress = document.getElementById('timerProgress');
                    const timerText = document.getElementById('timerText');
                    if (timerProgress && timerText) {
                        const timeLeft = 30 - elapsed;
                        const progressPercent = (timeLeft / 30) * 100;
                        
                        timerProgress.style.width = `${progressPercent}%`;
                        timerText.textContent = `${Math.max(0, Math.ceil(timeLeft))}s`;
                    }
                    
                    // Atualizar barra de progresso geral
                    const progressFill = document.getElementById('progressFill');
                    if (progressFill) {
                        const overallProgress = (this.currentPhaseIndex / this.PHASES.length) * 100;
                        progressFill.style.width = `${overallProgress}%`;
                    }
                    
                    if(elapsed > 30){ 
                        this.finishPhase(false); 
                    }
                }
                this.lastNose.x = nx; 
                this.lastNose.y = ny;
            }
        } catch (error) {
            console.error('Erro no loop de detecção:', error);
        }

        requestAnimationFrame(() => this.loop());
    },

    async startGame() {
        if(!this.streaming) {
            try {
                await this.initCamera();
            } catch (error) {
                alert('Não foi possível acessar a câmera. Verifique as permissões.');
                return;
            }
        }
        
        if(!this.modelReady) {
            try {
                await this.loadModel();
            } catch (error) {
                alert('Erro ao carregar o modelo de detecção.');
                return;
            }
        }

        if(!this.calibrated) {
            this.calibrate();
        }

        this.playing = true;
        this.currentPhaseIndex = 0;
        this.score = 0;
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.phaseIdxEl) this.phaseIdxEl.textContent = this.currentPhaseIndex+1;
        if (this.phaseNameEl) this.phaseNameEl.textContent = this.PHASES[this.currentPhaseIndex].name;
        this.phaseStartTime = performance.now();
        this.raiseCount=0; 
        window.__jumpCount=0; 
        window.__stepCount=0;
        
        this.updateActionIndicator();
        
        if (this.startBtn) {
            this.startBtn.textContent = 'Reiniciar Jogo';
            this.startBtn.style.background = '#4caf50';
        }
    },

    finishPhase(success) {
        this.playing = false;
        clearTimeout(this.phaseTimer);
        const phaseObj = this.PHASES[this.currentPhaseIndex];

        questionManager.show(phaseObj, success, success ? 20 : 10, (isCorrect, points) => {
            if (isCorrect) {
                this.score += points;
                if (this.scoreEl) this.scoreEl.textContent = this.score;
            }
            
            this.currentPhaseIndex++;
            if (this.currentPhaseIndex >= this.PHASES.length) {
                this.showGameOver();
            } else {
                this.playing = true;
                if (this.phaseIdxEl) this.phaseIdxEl.textContent = this.currentPhaseIndex + 1;
                if (this.phaseNameEl) this.phaseNameEl.textContent = this.PHASES[this.currentPhaseIndex].name;
                this.phaseStartTime = performance.now();
                this.raiseCount = 0; 
                window.__jumpCount = 0; 
                window.__stepCount = 0;
                this.updateActionIndicator();
            }
        });
    },

    showGameOver() {
        setTimeout(() => AppManager.showFinalScreen('real'), 500);
    }
};

// Jogo Vida Virtual
const virtualLifeGame = {
    canvas: null,
    ctx: null,
    player: {
        x: 100,
        y: 350,
        width: 32,
        height: 48,
        speed: 3,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        direction: 'right'
    },
    gravity: 0.5,
    keys: {},
    
    // Mundo do jogo
    platforms: [
        { x: 0, y: 430, width: 1600, height: 50, color: '#334155' },
        { x: 100, y: 350, width: 100, height: 20, color: '#475569' },
        { x: 300, y: 280, width: 100, height: 20, color: '#475569' },
        { x: 500, y: 210, width: 100, height: 20, color: '#475569' },
        { x: 700, y: 350, width: 100, height: 20, color: '#475569' },
        { x: 900, y: 280, width: 100, height: 20, color: '#475569' },
        { x: 1100, y: 210, width: 100, height: 20, color: '#475569' },
        { x: 1300, y: 350, width: 100, height: 20, color: '#475569' },
        { x: 1500, y: 280, width: 100, height: 20, color: '#475569' }
    ],
    
    // Sementes para coletar
    seeds: [
        { x: 50, y: 400, width: 20, height: 20, collected: false, questionIndex: 0 },
        { x: 150, y: 320, width: 20, height: 20, collected: false, questionIndex: 1 },
        { x: 250, y: 250, width: 20, height: 20, collected: false, questionIndex: 2 },
        { x: 350, y: 180, width: 20, height: 20, collected: false, questionIndex: 3 },
        { x: 450, y: 320, width: 20, height: 20, collected: false, questionIndex: 4 },
        { x: 550, y: 250, width: 20, height: 20, collected: false, questionIndex: 5 },
        { x: 650, y: 180, width: 20, height: 20, collected: false, questionIndex: 6 },
        { x: 750, y: 320, width: 20, height: 20, collected: false, questionIndex: 7 },
        { x: 850, y: 250, width: 20, height: 20, collected: false, questionIndex: 8 },
        { x: 950, y: 180, width: 20, height: 20, collected: false, questionIndex: 9 },
        { x: 1050, y: 320, width: 20, height: 20, collected: false, questionIndex: 10 },
        { x: 1150, y: 250, width: 20, height: 20, collected: false, questionIndex: 11 },
        { x: 1250, y: 180, width: 20, height: 20, collected: false, questionIndex: 12 },
        { x: 1350, y: 320, width: 20, height: 20, collected: false, questionIndex: 13 },
        { x: 1450, y: 250, width: 20, height: 20, collected: false, questionIndex: 14 }
    ],
    
    stumps: [
        { x: 50, y: 410, width: 20, height: 20 },
        { x: 200, y: 410, width: 20, height: 20 },
        { x: 400, y: 410, width: 20, height: 20 },
        { x: 600, y: 410, width: 20, height: 20 },
        { x: 800, y: 410, width: 20, height: 20 },
        { x: 1000, y: 410, width: 20, height: 20 },
        { x: 1200, y: 410, width: 20, height: 20 },
        { x: 1400, y: 410, width: 20, height: 20 }
    ],
    
    flowers: [],
    animals: [],
    trees: [],
    environmentState: 'deforested',
    seedsCollected: 0,
    totalSeeds: 15,
    levelComplete: false,
    questions: [],
    
    // Sistema de câmera
    camera: {
        x: 0,
        y: 0,
        width: 800,
        height: 480
    },
    
    // Propriedades do jogo
    gameStartTime: 0,
    gameTimer: null,
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    currentQuestionIndex: 0,
    playerImage: null,
    playerImageLoaded: false,

    init(questions) {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas não encontrado!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Configurar canvas
        this.canvas.width = 1600;
        this.canvas.height = 480;
        
        // Validar e usar as perguntas
        this.questions = Array.isArray(questions) ? questions.slice(0, 15) : [];
        this.totalQuestions = this.questions.length;
        
        console.log('Perguntas carregadas para o jogo:', this.questions);

        // Carregar imagem do jogador
        this.playerImage = new Image();
        this.playerImage.src = 'Anderson.png';
        this.playerImage.onload = () => {
            this.playerImageLoaded = true;
        };
        this.playerImage.onerror = () => {
            console.log('Imagem não carregada, usando placeholder');
            this.playerImageLoaded = false;
        };
        
        // Elementos da UI
        this.scoreEl = document.getElementById('virtualScore');
        this.seedCountEl = document.getElementById('seedCount');
        this.gameTimerEl = document.getElementById('gameTimer');
        
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.seedCountEl) this.seedCountEl.textContent = `${this.seedsCollected}/${this.totalSeeds}`;
        
        // Controles
        window.addEventListener('keydown', (e) => { 
            this.keys[e.code] = true; 
            
            if (e.code === 'Space' && !this.levelComplete) {
                this.checkForInteraction();
            }
        });
        
        window.addEventListener('keyup', (e) => { 
            this.keys[e.code] = false; 
        });

        // Iniciar jogo
        this.startGameTimer();
        this.gameLoop();
    },
    
    startGameTimer() {
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            if (this.gameTimerEl) {
                this.gameTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    },
    
    checkForInteraction() {
        this.seeds.forEach(seed => {
            if (!seed.collected) {
                const distance = Math.sqrt(
                    Math.pow(this.player.x + this.player.width/2 - (seed.x + seed.width/2), 2) +
                    Math.pow(this.player.y + this.player.height/2 - (seed.y + seed.height/2), 2)
                );
                
                if (distance < 50) {
                    this.handleSeedCollection(seed);
                }
            }
        });
    },

    update() {
        if (this.levelComplete) return;

        // Movimento horizontal
        if (this.keys['ArrowLeft']) {
            this.player.velocityX = -this.player.speed;
            this.player.direction = 'left';
        } else if (this.keys['ArrowRight']) {
            this.player.velocityX = this.player.speed;
            this.player.direction = 'right';
        } else {
            this.player.velocityX = 0;
        }

        // Pulo
        if (this.keys['ArrowUp'] && !this.player.isJumping) {
            this.player.velocityY = -12;
            this.player.isJumping = true;
        }

        // Aplicar gravidade
        this.player.velocityY += this.gravity;
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;

        // Colisão com plataformas
        this.player.isJumping = true;
        this.platforms.forEach(platform => {
            if (
                this.player.x < platform.x + platform.width &&
                this.player.x + this.player.width > platform.x &&
                this.player.y + this.player.height > platform.y &&
                this.player.y + this.player.height < platform.y + platform.height + this.player.velocityY
            ) {
                this.player.y = platform.y - this.player.height;
                this.player.velocityY = 0;
                this.player.isJumping = false;
            }
        });

        // Colisão com sementes
        this.seeds.forEach(seed => {
            if (!seed.collected &&
                this.player.x < seed.x + seed.width &&
                this.player.x + this.player.width > seed.x &&
                this.player.y < seed.y + seed.height &&
                this.player.y + this.player.height > seed.y) {
                this.handleSeedCollection(seed);
            }
        });

        // Limites do mundo
        if (this.player.x < 50) {
            this.player.x = 50;
        }
        if (this.player.x + this.player.width > this.canvas.width - 50) {
            this.player.x = this.canvas.width - this.player.width - 50;
        }
        
        // Atualizar câmera
        this.updateCamera();
    },
    
    updateCamera() {
        this.camera.x = this.player.x - this.camera.width / 2;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.canvas.width - this.camera.width));
    },

    handleSeedCollection(seed) {
        seed.collected = true;
        this.seedsCollected++;
        if (this.seedCountEl) {
            this.seedCountEl.textContent = `${this.seedsCollected}/${this.totalSeeds}`;
        }
        
        // Verificar se há perguntas disponíveis
        if (this.currentQuestionIndex >= this.questions.length) {
            console.warn('Não há mais perguntas disponíveis');
            return;
        }
        
        const questionPhase = this.questions[this.currentQuestionIndex];
        console.log('Coletando semente. Pergunta:', questionPhase);
        
        if (!questionPhase || !questionPhase.question) {
            console.error('Pergunta inválida:', questionPhase);
            return;
        }
        
        const basePoints = 10 + (this.currentQuestionIndex * 2);
        
        questionManager.show(questionPhase, true, basePoints, (isCorrect, points) => {
            if (isCorrect) {
                this.score += points;
                this.correctAnswers++;
                if (this.scoreEl) this.scoreEl.textContent = this.score;
                this.updateEnvironment();
                
                this.currentQuestionIndex++;
                
                if (this.currentQuestionIndex >= this.totalQuestions) {
                    this.levelComplete = true;
                    clearInterval(this.gameTimer);
                    setTimeout(() => AppManager.showFinalScreen('virtual'), 1000);
                }
            } else {
                alert("Resposta incorreta! Tente novamente.");
                seed.collected = false;
                this.seedsCollected--;
                if (this.seedCountEl) {
                    this.seedCountEl.textContent = `${this.seedsCollected}/${this.totalSeeds}`;
                }
            }
        });
    },

    updateEnvironment() {
        if (this.seedsCollected >= 3 && this.seedsCollected < 6) {
            this.environmentState = 'recovering_1';
        } else if (this.seedsCollected >= 6 && this.seedsCollected < 9) {
            this.environmentState = 'recovering_2';
            this.flowers = [
                { x: 200, y: 410, width: 10, height: 15, color: '#ff6b6b' },
                { x: 600, y: 410, width: 10, height: 15, color: '#4ecdc4' },
                { x: 1000, y: 410, width: 10, height: 15, color: '#ffd93d' }
            ];
        } else if (this.seedsCollected >= 9 && this.seedsCollected < 12) {
            this.environmentState = 'recovering_3';
            this.animals = [
                { x: 180, y: 400, width: 20, height: 15, type: 'bird' },
                { x: 580, y: 400, width: 25, height: 15, type: 'rabbit' },
                { x: 980, y: 400, width: 20, height: 15, type: 'butterfly' }
            ];
        } else if (this.seedsCollected >= 12) {
            this.environmentState = 'recovered';
            this.trees = this.stumps.map(stump => ({
                x: stump.x,
                y: stump.y - 60,
                width: 20,
                height: 60
            }));
        }
    },
    
    resetLevel() {
        this.player.x = 100;
        this.player.y = 350;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.levelComplete = false;
        this.seedsCollected = 0;
        this.environmentState = 'deforested';
        this.flowers = [];
        this.animals = [];
        this.trees = [];
        this.score = 0;
        this.correctAnswers = 0;
        this.currentQuestionIndex = 0;
        this.camera.x = 0;
        
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.seedCountEl) this.seedCountEl.textContent = `${this.seedsCollected}/${this.totalSeeds}`;
        
        this.seeds.forEach(seed => {
            seed.collected = false;
        });
        
        clearInterval(this.gameTimer);
        this.startGameTimer();
    },

    drawPlayer() {
        if (!this.playerImageLoaded) {
            // Placeholder
            const p = this.player;
            this.ctx.fillStyle = 'purple';
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
            return;
        }

        const p = this.player;
        const ctx = this.ctx;
        
        ctx.save();
        if (p.direction === 'left') {
            ctx.scale(-1, 1);
            ctx.drawImage(this.playerImage, -p.x - p.width, p.y, p.width, p.height);
        } else {
            ctx.drawImage(this.playerImage, p.x, p.y, p.width, p.height);
        }
        ctx.restore();
    },

    draw() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Aplicar transformação da câmera
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Desenhar cenário
        if (this.environmentState === 'deforested') {
            this.ctx.fillStyle = '#8d6e63';
            this.ctx.fillRect(this.platforms[0].x, this.platforms[0].y, this.platforms[0].width, this.platforms[0].height);
            this.ctx.fillStyle = '#78909c';
            this.ctx.fillRect(0, 0, this.canvas.width, this.platforms[0].y);
        } else {
            this.ctx.fillStyle = '#7cb342';
            this.ctx.fillRect(this.platforms[0].x, this.platforms[0].y, this.platforms[0].width, this.platforms[0].height);
            this.ctx.fillStyle = '#87ceeb';
            this.ctx.fillRect(0, 0, this.canvas.width, this.platforms[0].y);
        }

        // Desenhar plataformas
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // Desenhar tocos
        this.stumps.forEach(stump => {
            this.ctx.fillStyle = '#5d4037';
            this.ctx.fillRect(stump.x, stump.y, stump.width, stump.height);
        });

        // Desenhar árvores
        if (this.environmentState === 'recovered') {
            this.trees.forEach(tree => {
                this.ctx.fillStyle = '#5d4037';
                this.ctx.fillRect(tree.x, tree.y, tree.width, tree.height);
                this.ctx.fillStyle = '#2e7d32';
                this.ctx.beginPath();
                this.ctx.arc(tree.x + tree.width/2, tree.y, 25, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // Desenhar flores
        this.flowers.forEach(flower => {
            this.ctx.fillStyle = flower.color;
            this.ctx.beginPath();
            this.ctx.arc(flower.x + flower.width/2, flower.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Desenhar animais
        this.animals.forEach(animal => {
            if (animal.type === 'bird') {
                this.ctx.fillStyle = '#ff5722';
                this.ctx.beginPath();
                this.ctx.arc(animal.x, animal.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (animal.type === 'rabbit') {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(animal.x, animal.y, animal.width, animal.height);
            } else if (animal.type === 'butterfly') {
                this.ctx.fillStyle = '#e91e63';
                this.ctx.beginPath();
                this.ctx.arc(animal.x, animal.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Desenhar sementes
        this.seeds.forEach(seed => {
            if (!seed.collected) {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(seed.x + seed.width/2, seed.y + seed.height/2, seed.width/2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.drawPlayer();
        
        // Restaurar transformação
        this.ctx.restore();
        
        // UI sobreposta
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Sementes: ${this.seedsCollected}/${this.totalSeeds}`, 10, 30);
        this.ctx.fillText(`Pontuação: ${this.score}`, 10, 50);
        
        // Progresso da câmera
        const progressPercent = (this.camera.x / (this.canvas.width - this.camera.width)) * 100;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(300, 20, 200, 10);
        this.ctx.fillStyle = '#ffd54a';
        this.ctx.fillRect(300, 20, progressPercent * 2, 10);
    },

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
};

// Gerenciador Principal do App
const AppManager = {
    currentScreen: null,
    selectedAvatar: null,
    lastGameMode: null,

    async init() {
        console.log('Iniciando aplicação...');
        
        // Carregar perguntas primeiro
        await loadQuestions();
        
        this.populateAvatarGrid();
        
        // Configurar event listeners
        document.getElementById('play-again-btn').addEventListener('click', () => this.playAgain());
        document.getElementById('change-mode-btn').addEventListener('click', () => this.showMainMenu());

        // Inicializar jogos
        realLifeGame.init();
        
        console.log('Aplicação carregada com sucesso!');
        this.showMainMenu();
    },

    populateAvatarGrid() {
        if (!avatarGrid) {
            console.error('Elemento avatar-grid não encontrado');
            return;
        }
        
        avatarGrid.innerHTML = '';
        avatars.forEach(avatar => {
            const avatarEl = document.createElement('div');
            avatarEl.className = 'avatar-card';
            avatarEl.innerHTML = `
                <div class="avatar-icon">${avatar.icon}</div>
                <div class="avatar-subject">${avatar.subject}</div>
            `;
            avatarEl.addEventListener('click', () => this.selectAvatar(avatar));
            avatarGrid.appendChild(avatarEl);
        });
    },

    selectAvatar(avatar) {
        this.selectedAvatar = avatar;
        const questions = questionsBySubject[avatar.subject] || [];
        console.log('Matéria selecionada:', avatar.subject, 'Perguntas:', questions);
        
        if (questions.length === 0) {
            console.warn('Nenhuma pergunta encontrada para:', avatar.subject);
            alert(`Nenhuma pergunta encontrada para ${avatar.subject}. Usando perguntas padrão.`);
        }
        
        this.startVirtualLifeGame(questions);
    },

    showScreen(screen) {
        if (this.currentScreen) {
            this.currentScreen.classList.remove('active');
        }
        
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screen;
            
            // Rolar para o topo quando mudar de tela
            window.scrollTo(0, 0);
        }
    },

    showMainMenu() {
        this.showScreen(modeSelection);
    },

    showAvatarSelection() {
        this.showScreen(avatarSelection);
    },

    startRealLifeGame() {
        this.showScreen(realLifeMode);
    },

    startVirtualLifeGame(questions) {
        this.showScreen(virtualLifeMode);
        
        // Dar um pequeno delay para garantir que o canvas esteja visível
        setTimeout(() => {
            const selectedQuestions = Array.isArray(questions) ? questions.slice(0, 15) : [];
            console.log('Iniciando jogo virtual com perguntas:', selectedQuestions);
            virtualLifeGame.init(selectedQuestions);
        }, 100);
    },

    showFinalScreen(mode) {
        this.lastGameMode = mode;
        const finalMessage = document.getElementById('final-message');
        const finalScore = document.getElementById('final-score');
        const finalTime = document.getElementById('final-time');
        const finalCorrect = document.getElementById('final-correct');
        
        if (mode === 'virtual') {
            finalMessage.textContent = "Parabéns! Você completou todas as 15 perguntas e ajudou a restaurar o ecossistema!";
            finalScore.textContent = virtualLifeGame.score;
            finalTime.textContent = document.getElementById('gameTimer').textContent;
            finalCorrect.textContent = `${virtualLifeGame.correctAnswers}/15`;
        } else {
            finalMessage.textContent = `Você completou o desafio! Sua dedicação à sustentabilidade é inspiradora.`;
            finalScore.textContent = realLifeGame.score;
            finalTime.textContent = "—";
            finalCorrect.textContent = "—";
        }
        
        this.showScreen(finalScreen);
    },

    playAgain() {
        if (this.lastGameMode === 'virtual') {
            virtualLifeGame.resetLevel();
            this.startVirtualLifeGame(virtualLifeGame.questions);
        } else {
            realLifeGame.startGame();
            this.showScreen(realLifeMode);
        }
    }
};

// Inicializar o jogo quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AppManager.init();
    });
} else {
    AppManager.init();
}
