// Shared Data - 15 perguntas sobre bioeconomia e futuro sustentável
const PHASES = [
  // Matéria 1: Energias Renováveis
  { id: 'levantar_braços', name: 'Energias Renováveis', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'Qual destas é uma fonte de energia renovável?', choices:['Energia Solar','Carvão Mineral','Petróleo','Gás Natural'], answer:0}},
  
  // Matéria 2: Agricultura Sustentável
  { id: 'agachar', name: 'Agricultura Sustentável', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que é agricultura orgânica?', choices:['Uso intensivo de agrotóxicos','Cultivo sem produtos químicos sintéticos','Plantio em estufas','Cultivo apenas de transgênicos'], answer:1}},
  
  // Matéria 3: Biodiversidade
  { id: 'passo_lado', name: 'Biodiversidade', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'Por que a biodiversidade é importante?', choices:['Mantém o equilíbrio dos ecossistemas','Aumenta a poluição','Reduz a qualidade do ar','Diminui a produção de alimentos'], answer:0}},
  
  // Matéria 4: Economia Circular
  { id: 'pular', name: 'Economia Circular', action: 'jump', desc: 'Dê dois pulos no mesmo lugar.', question: {text:'O que é economia circular?', choices:['Sistema de reutilização de recursos','Produção de mais lixo','Uso único de produtos','Extrair mais recursos naturais'], answer:0}},
  
  // Matéria 5: Recursos Hídricos
  { id: 'levantar_braços2', name: 'Recursos Hídricos', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'Qual prática ajuda a conservar água?', choices:['Captação de água da chuva','Banhos longos','Lavar calçada com mangueira','Deixar torneira aberta'], answer:0}},
  
  // Matéria 6: Tecnologias Verdes
  { id: 'agachar2', name: 'Tecnologias Verdes', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que são tecnologias verdes?', choices:['Tecnologias que reduzem impacto ambiental','Tecnologias que aumentam poluição','Dispositivos eletrônicos descartáveis','Ferramentas de mineração'], answer:0}},
  
  // Matéria 7: Poluição e Resíduos
  { id: 'passo_lado2', name: 'Poluição e Resíduos', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'Qual é a melhor forma de reduzir resíduos?', choices:['Reciclagem e compostagem','Queimar lixo a céu aberto','Jogar no lixo comum','Enterrar em aterros'], answer:0}},
  
  // Matéria 8: Mudanças Climáticas
  { id: 'pular2', name: 'Mudanças Climáticas', action: 'jump', desc: 'Dê dois pulos no mesmo lugar.', question: {text:'Qual é a principal causa do aquecimento global?', choices:['Emissão de gases de efeito estufa','Rotação da Terra','Atividade solar','Variações orbitais'], answer:0}},
  
  // Matéria 9: Sustentabilidade Urbana
  { id: 'levantar_braços3', name: 'Sustentabilidade Urbana', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'O que caracteriza uma cidade sustentável?', choices:['Transporte público eficiente','Trânsito intenso de carros','Grandes aterros sanitários','Alto consumo de energia'], answer:0}},
  
  // Matéria 10: Bioenergia
  { id: 'agachar3', name: 'Bioenergia', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que é bioenergia?', choices:['Energia de biomassa renovável','Energia de combustíveis fósseis','Energia nuclear','Energia de minérios'], answer:0}},
  
  // Matéria 11: Conservação do Solo
  { id: 'passo_lado3', name: 'Conservação do Solo', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'Qual prática ajuda na conservação do solo?', choices:['Plantio direto','Desmatamento','Queimadas','Uso excessivo de agrotóxicos'], answer:0}},
  
  // Matéria 12: Consumo Consciente
  { id: 'pular3', name: 'Consumo Consciente', action: 'jump', desc: 'Dê dois pulos no mesmo lugar.', question: {text:'O que é consumo consciente?', choices:['Escolher produtos sustentáveis','Comprar sem necessidade','Desperdiçar recursos','Ignorar a origem dos produtos'], answer:0}},
  
  // Fases extras para completar 15
  { id: 'extra1', name: 'Energia Eólica', action: 'raise_hands', desc: 'Levante ambos os braços acima da cabeça duas vezes.', question: {text:'Qual vantagem da energia eólica?', choices:['Fonte limpa e renovável','Produz resíduos radioativos','Depende de combustíveis','Causa desmatamento'], answer:0}},
  { id: 'extra2', name: 'Compostagem', action: 'squat', desc: 'Faça um agachamento completo.', question: {text:'O que é compostagem?', choices:['Processo de reciclagem de orgânicos','Queima de resíduos','Aterro de lixo','Incineração'], answer:0}},
  { id: 'extra3', name: 'Desenvolvimento Sustentável', action: 'step_side', desc: 'Dê um passo largo para a esquerda e outro para a direita.', question: {text:'O que é desenvolvimento sustentável?', choices:['Atender necessidades atuais sem comprometer futuras','Explorar todos os recursos agora','Priorizar apenas crescimento econômico','Ignorar questões ambientais'], answer:0}}
];

// Mode selection
const modeSelection = document.getElementById('mode-selection');
const realLifeBtn = document.getElementById('real-life-btn');
const virtualLifeBtn = document.getElementById('virtual-life-btn');
const realLifeMode = document.getElementById('real-life-mode');
const virtualLifeMode = document.getElementById('virtual-life-mode');

// Question Manager (shared logic)
const questionManager = {
    questionModal: document.getElementById('questionModal'),
    qText: document.getElementById('qText'),
    choicesEl: document.getElementById('choices'),
    modalPhaseIdx: document.getElementById('modalPhaseIdx'),
    
    show(phaseObj, success, onAnswer) {
        this.questionModal.style.display = 'flex';
        this.qText.textContent = phaseObj.question.text;
        this.choicesEl.innerHTML = '';
        document.getElementById('qTitle').textContent = `Pergunta — ${phaseObj.name}`;

        phaseObj.question.choices.forEach((c, i) => {
            const btn = document.createElement('div');
            btn.className = 'choice';
            btn.textContent = c;
            btn.addEventListener('click', () => {
                const isCorrect = (i === phaseObj.question.answer);
                this.questionModal.style.display = 'none';
                onAnswer(isCorrect, success);
            }, { once: true }); // prevent multiple clicks
            this.choicesEl.appendChild(btn);
        });
    }
};

const realLifeGame = {
  PHASES: PHASES,

  // UI refs
  video: document.getElementById('video'),
  overlay: document.getElementById('overlay'),
  ctx: null, // will be set in init
  startBtn: document.getElementById('startBtn'),
  calibrateBtn: document.getElementById('calibrateBtn'),
  phaseNameEl: document.getElementById('phaseName'),
  phaseIdxEl: document.getElementById('phaseIdx'),
  phaseTotalEl: document.getElementById('phaseTotal'),
  phasesList: document.getElementById('phasesList'),
  scoreEl: document.getElementById('score'),
  phaseTimeInput: document.getElementById('phaseTimeInput'),
  phaseTimeDisplay: document.getElementById('phaseTime'),

  // Game state
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
    this.ctx = this.overlay.getContext('2d');
    this.phaseTimeInput.addEventListener('input', () => {
      this.phaseTimeDisplay.textContent = this.phaseTimeInput.value;
    });
    this.startBtn.addEventListener('click', () => this.startGame());
    this.calibrateBtn.addEventListener('click', () => this.calibrate());
    this.renderPhaseList();

    (async () => {
      try {
        await this.initCamera();
        await this.loadModel();
        // Iniciar o loop principal
        this.loop();
      } catch(e) {
        console.warn('Erro ao iniciar câmera/modelo', e);
        alert('Erro ao acessar a câmera. Verifique as permissões e recarregue a página.');
      }
    })();
  },

  renderPhaseList() {
    this.phaseTotalEl.textContent = this.PHASES.length;
    this.phasesList.innerHTML = this.PHASES.map((p,i) => `<div style="padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.02);margin-bottom:6px"><strong>${i+1}. ${p.name}</strong><div class='small' style='margin-top:4px'>${p.desc}</div></div>`).join('');
  },

  async initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }, 
        audio: false
      });
      this.video.srcObject = stream;
      
      // Esperar o vídeo estar pronto
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
      throw error;
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
      console.log('PoseNet ready');
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      throw error;
    }
  },

  calibrate() {
    if(!this.streaming) return alert('Ative a câmera primeiro (permita o acesso)');
    this.baseline.centerX = this.video.videoWidth/2;
    this.baseline.centerY = this.video.videoHeight/2;
    this.calibrated = true;
    this.calibrateBtn.textContent = 'Posição calibrada ✓';
    setTimeout(() => {this.calibrateBtn.textContent='Calibrar Posição';}, 2000);
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
    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    keypoints.forEach(k => {
      const {x,y} = k.position;
      this.ctx.beginPath();
      this.ctx.arc(x,y,4,0,Math.PI*2);
      this.ctx.fillStyle = '#ffd54a'; 
      this.ctx.fill();
    });
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
          if(elapsed > Number(this.phaseTimeInput.value)){ 
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
    this.scoreEl.textContent = this.score;
    this.phaseIdxEl.textContent = this.currentPhaseIndex+1;
    this.phaseNameEl.textContent = this.PHASES[this.currentPhaseIndex].name;
    this.phaseStartTime = performance.now();
    this.raiseCount=0; 
    window.__jumpCount=0; 
    window.__stepCount=0;
    
    this.startBtn.textContent = 'Reiniciar Jogo';
    this.startBtn.style.background = '#4caf50';
  },

  finishPhase(success) {
    this.playing = false;
    clearTimeout(this.phaseTimer);
    const phaseObj = this.PHASES[this.currentPhaseIndex];

    questionManager.show(phaseObj, success, (isCorrect, wasSuccess) => {
      if (isCorrect) {
        this.score += wasSuccess ? 20 : 10;
        this.scoreEl.textContent = this.score;
      }
      
      this.currentPhaseIndex++;
      if (this.currentPhaseIndex >= this.PHASES.length) {
        this.showGameOver();
      } else {
        this.playing = true;
        this.phaseIdxEl.textContent = this.currentPhaseIndex + 1;
        this.phaseNameEl.textContent = this.PHASES[this.currentPhaseIndex].name;
        this.phaseStartTime = performance.now();
        this.raiseCount = 0; 
        window.__jumpCount = 0; 
        window.__stepCount = 0;
      }
    });
  },

  showGameOver() {
    setTimeout(() => {
      const final = confirm(`Fim do jogo! Sua pontuação: ${this.score}\nDeseja jogar novamente?`);
      if(final){ 
        this.startGame(); 
      } else { 
        this.phaseNameEl.textContent='—'; 
        this.phaseIdxEl.textContent='0';
        this.startBtn.textContent = 'Iniciar Jogo';
        this.startBtn.style.background = '';
      }
    }, 500);
  }
};

const virtualLifeGame = {
  canvas: null,
  ctx: null,
  player: {
    x: 100,
    y: 350,
    width: 32,
    height: 48,
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    isJumping: false
  },
  gravity: 0.5,
  keys: {},
  platforms: [
    { x: 0, y: 430, width: 800, height: 50, color: '#334155' },
    { x: 200, y: 320, width: 150, height: 20, color: '#475569' },
    { x: 450, y: 250, width: 150, height: 20, color: '#475569' },
    { x: 600, y: 150, width: 100, height: 20, color: '#475569' }
  ],
  seeds: [
    { x: 635, y: 120, width: 20, height: 20, collected: false, questionIndex: 0 },
    { x: 400, y: 220, width: 20, height: 20, collected: false, questionIndex: 1 },
    { x: 250, y: 300, width: 20, height: 20, collected: false, questionIndex: 2 },
    { x: 100, y: 400, width: 20, height: 20, collected: false, questionIndex: 3 }
  ],
  stumps: [
    { x: 150, y: 410, width: 20, height: 20 },
    { x: 500, y: 410, width: 20, height: 20 },
    { x: 300, y: 410, width: 20, height: 20 },
    { x: 650, y: 410, width: 20, height: 20 }
  ],
  flowers: [],
  animals: [],
  trees: [],
  environmentState: 'deforested',
  seedsCollected: 0,
  totalSeeds: 4,
  levelComplete: false,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    window.addEventListener('keydown', (e) => { 
      this.keys[e.code] = true; 
    });
    
    window.addEventListener('keyup', (e) => { 
      this.keys[e.code] = false; 
    });

    this.gameLoop();
  },

  update() {
    if (this.levelComplete) return;

    // Movimento horizontal
    if (this.keys['ArrowLeft']) {
      this.player.velocityX = -this.player.speed;
    } else if (this.keys['ArrowRight']) {
      this.player.velocityX = this.player.speed;
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

    // Colisão com as plataformas
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

    // Colisão com as sementes - CORREÇÃO APLICADA AQUI
    this.seeds.forEach(seed => {
      if (!seed.collected &&
          this.player.x < seed.x + seed.width &&
          this.player.x + this.player.width > seed.x &&
          this.player.y < seed.y + seed.height && // CORRIGIDO: era this.seed.height
          this.player.y + this.player.height > seed.y) {
        this.handleSeedCollection(seed);
      }
    });

    // Limites do canvas
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.width > this.canvas.width) {
      this.player.x = this.canvas.width - this.player.width;
    }
  },

  handleSeedCollection(seed) {
    seed.collected = true;
    this.seedsCollected++;
    
    const questionPhase = PHASES[seed.questionIndex];
    
    questionManager.show(questionPhase, true, (isCorrect) => {
      if (isCorrect) {
        this.updateEnvironment();
        
        if (this.seedsCollected >= this.totalSeeds) {
          this.levelComplete = true;
          setTimeout(() => {
            const playAgain = confirm("Parabéns! Você recuperou completamente o ambiente! Deseja jogar novamente?");
            if (playAgain) {
              this.resetLevel();
            }
          }, 1000);
        }
      } else {
        alert("Resposta incorreta! Tente novamente.");
        seed.collected = false;
        this.seedsCollected--;
      }
    });
  },

  updateEnvironment() {
    // Recuperação gradual baseada no número de sementes coletadas
    if (this.seedsCollected === 1) {
      // Primeira semente: grama verde aparece
      this.environmentState = 'recovering_1';
    } else if (this.seedsCollected === 2) {
      // Segunda semente: flores aparecem
      this.environmentState = 'recovering_2';
      this.flowers = [
        { x: 200, y: 410, width: 10, height: 15, color: '#ff6b6b' },
        { x: 550, y: 410, width: 10, height: 15, color: '#4ecdc4' },
        { x: 350, y: 410, width: 10, height: 15, color: '#ffd93d' }
      ];
    } else if (this.seedsCollected === 3) {
      // Terceira semente: animais aparecem
      this.environmentState = 'recovering_3';
      this.animals = [
        { x: 180, y: 400, width: 20, height: 15, type: 'bird' },
        { x: 530, y: 400, width: 25, height: 15, type: 'rabbit' },
        { x: 330, y: 400, width: 20, height: 15, type: 'butterfly' }
      ];
    } else if (this.seedsCollected >= 4) {
      // Quarta semente: árvores crescem
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
    
    // Reset todas as sementes
    this.seeds.forEach(seed => {
      seed.collected = false;
    });
  },

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Desenhar jogador (estilo Mario pixel)
    const p = this.player;
    const x = p.x;
    const y = p.y;
    const w = p.width;
    const h = p.height;

    // Calças (azul)
    this.ctx.fillStyle = '#1e88e5';
    this.ctx.fillRect(x, y + h * 0.6, w, h * 0.4);
    // Camisa (vermelho)
    this.ctx.fillStyle = '#e53935';
    this.ctx.fillRect(x, y + h * 0.25, w, h * 0.4);
    // Rosto (pele)
    this.ctx.fillStyle = '#ffcc80';
    this.ctx.fillRect(x + w * 0.2, y + h * 0.1, w * 0.6, h * 0.25);
    // Chapéu (vermelho)
    this.ctx.fillStyle = '#e53935';
    this.ctx.fillRect(x, y, w, h * 0.2);
    // Botões (amarelo)
    this.ctx.fillStyle = '#ffd54a';
    this.ctx.fillRect(x + w * 0.2, y + h * 0.6, w * 0.2, h * 0.1);
    this.ctx.fillRect(x + w * 0.6, y + h * 0.6, w * 0.2, h * 0.1);

    // Desenhar cenário com base no estado
    if (this.environmentState === 'deforested') {
      // Terra árida
      this.ctx.fillStyle = '#8d6e63';
      this.ctx.fillRect(this.platforms[0].x, this.platforms[0].y, this.platforms[0].width, this.platforms[0].height);
      
      // Céu poluído
      this.ctx.fillStyle = '#78909c';
      this.ctx.fillRect(0, 0, this.canvas.width, this.platforms[0].y);
    } else {
      // Grama verde (gradual)
      const greenIntensity = Math.min(100 + (this.seedsCollected * 40), 255);
      this.ctx.fillStyle = `rgb(70, ${greenIntensity}, 70)`;
      this.ctx.fillRect(this.platforms[0].x, this.platforms[0].y, this.platforms[0].width, this.platforms[0].height);
      
      // Céu azul (gradual)
      const blueIntensity = Math.min(150 + (this.seedsCollected * 25), 255);
      this.ctx.fillStyle = `rgb(135, 206, ${blueIntensity})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.platforms[0].y);
    }

    // Desenhar flores se existirem
    this.flowers.forEach(flower => {
      this.ctx.fillStyle = flower.color;
      this.ctx.fillRect(flower.x, flower.y, flower.width, flower.height);
      // Pétalas
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(flower.x + flower.width/2, flower.y - 3, 5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Desenhar animais se existirem
    this.animals.forEach(animal => {
      if (animal.type === 'bird') {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(animal.x, animal.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (animal.type === 'rabbit') {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(animal.x, animal.y, animal.width, animal.height);
        // Orelhas
        this.ctx.fillRect(animal.x - 3, animal.y - 8, 5, 10);
        this.ctx.fillRect(animal.x + animal.width - 2, animal.y - 8, 5, 10);
      } else if (animal.type === 'butterfly') {
        this.ctx.fillStyle = '#ffd93d';
        this.ctx.beginPath();
        this.ctx.arc(animal.x, animal.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Desenhar árvores se existirem
    this.trees.forEach(tree => {
      // Tronco
      this.ctx.fillStyle = '#5d4037';
      this.ctx.fillRect(tree.x, tree.y, tree.width, tree.height);
      // Copa
      this.ctx.fillStyle = '#2e7d32';
      this.ctx.beginPath();
      this.ctx.arc(tree.x + tree.width / 2, tree.y, tree.width * 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Desenhar plataformas
    for (let i = 1; i < this.platforms.length; i++) {
      const platform = this.platforms[i];
      this.ctx.fillStyle = platform.color;
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Desenhar sementes não coletadas
    this.seeds.forEach(seed => {
      if (!seed.collected) {
        this.ctx.fillStyle = '#4caf50';
        this.ctx.fillRect(seed.x, seed.y, seed.width, seed.height);
        this.ctx.fillStyle = '#2e7d32';
        this.ctx.fillRect(seed.x + 5, seed.y + 5, seed.width - 10, seed.height - 10);
      }
    });

    // Desenhar contador de sementes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Sementes: ${this.seedsCollected}/${this.totalSeeds}`, 10, 30);
  },

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
};

realLifeBtn.addEventListener('click', () => {
  modeSelection.style.display = 'none';
  realLifeMode.style.display = 'block';
  realLifeGame.init();
});

virtualLifeBtn.addEventListener('click', () => {
  modeSelection.style.display = 'none';
  virtualLifeMode.style.display = 'block';
  virtualLifeGame.init();
});

// Expor para o script de teste
window.virtualLifeGame = virtualLifeGame;
