# Game Design Document: Jogo de Movimento e Sustentabilidade

## 1. Visão Geral (Game Concept)

*   **Título Provisório:** (Ainda a definir, ex: "Eco-Kinnect", "Movimento Verde")
*   **Gênero:** Educacional / Ação / Simulação
*   **Plataforma Alvo:** (PC com Webcam/Kinect, Web, etc.)
*   **Resumo (Elevator Pitch):** Um jogo interativo que usa o movimento do corpo do jogador para navegar por fases, resolver desafios ambientais e responder a perguntas sobre ciência e sustentabilidade, com o objetivo de restaurar ambientes degradados.

## 2. Mecânicas Principais (Core Mechanics)

*   **Controle por Movimento:**
    *   Descrever como os movimentos do jogador serão traduzidos em ações no jogo (ex: andar no lugar para mover o personagem, levantar os braços para coletar itens, agachar para desviar de obstáculos).
*   **Sistema de Progressão:**
    *   O jogador avança pelas fases ao completar ações sustentáveis.
    *   Ações desbloqueiam perguntas.
    *   Respostas corretas podem gerar "pontos de sustentabilidade" ou recursos para melhorar o ambiente.
*   **Sistema de Perguntas e Respostas:**
    *   **Gatilho:** Como as perguntas são acionadas? (ex: ao alcançar um ponto específico do mapa, ao "limpar" uma área de lixo).
    *   **Formato:** Múltipla escolha, verdadeiro ou falso.
    *   **Feedback:** O que acontece ao acertar ou errar? (ex: acertar melhora a cena visualmente, errar pode gerar um mini-desafio).
*   **"Salvação" das Cenas:**
    *   Representação visual da progressão. O cenário começa poluído/degradado e vai se tornando mais limpo e sustentável conforme o jogador avança.

## 3. Estrutura das Fases (Level Design)

*   **Fase 1: Reciclagem e Poluição Urbana**
    *   **Cenário:** Uma rua de cidade suja com lixo espalhado.
    *   **Objetivo:** Coletar o lixo e separá-lo nas lixeiras corretas (orgânico, papel, plástico, metal).
    *   **Movimentos:** Andar para se mover, agachar para pegar lixo, movimento de arremesso para jogar na lixeira.
    *   **Perguntas:** Sobre tempo de decomposição dos materiais, importância da reciclagem, etc.
*   **Fase 2: Consumo Consciente de Água e Energia**
    *   **Cenário:** Interior de uma casa.
    *   **Objetivo:** "Fechar" torneiras virtuais que estão pingando, "apagar" luzes acesas em cômodos vazios.
    *   **Movimentos:** Movimento de torcer a mão para fechar torneiras, movimento de interruptor para apagar luzes.
    *   **Perguntas:** Fatos sobre consumo de água, fontes de energia renováveis, etc.
*   **(Ideias para outras fases):**
    *   Reflorestamento
    *   Proteção da vida marinha
    *   Agricultura sustentável

## 4. Conteúdo Educacional

*   **Áreas da Ciência:** Biologia, Química, Física, Ecologia.
*   **Fatos do Cotidiano:** Dicas práticas sobre como ser mais sustentável no dia a dia.
*   **Fonte das Informações:** (Importante ter uma base de dados confiável para as perguntas).

## 5. Pilha Tecnológica (Technology Stack)

*   **Game Engine:** (A definir: Godot, Unity, Unreal Engine, ou uma biblioteca web como Three.js).
*   **Sensor de Movimento:** (A definir: Câmera de Webcam com TensorFlow.js PoseNet, Kinect SDK).
*   **Linguagem de Programação:** (Dependerá da engine: GDScript, C#, C++, JavaScript).

## 6. Próximos Passos

1.  Decidir a plataforma e a tecnologia de sensor de movimento.
2.  Desenvolver um protótipo mínimo: capturar o movimento da webcam e fazer um objeto simples se mover na tela.

---
