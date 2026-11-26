# Jogo de Plataforma 2D — Autômato de Pilha (PDA)

Jogo de plataforma 2D desenvolvido em **JavaScript** com a biblioteca **KAPLAY**, projetado para demonstrar na prática o funcionamento de um **Autômato de Pilha (*Pushdown Automaton* — PDA)** com estrutura **LIFO** (*Last In, First Out*), acompanhado de HUD em tempo real e modelagem formal completa no **JFLAP**.

> **Jogar online (GitHub Pages):** `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/` *(substitua pelo seu link após publicar)*

---

## Sobre o Projeto

Em vez de controlar a progressão por contadores isolados, todas as regras de coleta, dano, abertura de portão e combate contra o Boss são governadas por uma **pilha** exibida ao vivo na interface:

* **Fase 1 (`q0` → `qf`) — O Comerciante e o Portão:**
  1. Colete pelo menos **3 moedas** (empilhadas em `q0`) e leve-as ao **Comerciante**.
  2. O Comerciante recolhe todas as moedas da pilha (`q0` → `q3`), para na pose estática e dropa um **Diamante**.
  3. Colete o **Diamante** (`q3` → `q4`) para liberar a coleta das chaves (o diamante fica protegido contra espinhos).
  4. Colete exatamente **2 Chaves** acima do diamante e vá ao **Portão**, que desempilha chave por chave e o diamante (`q4` → `qf`) para abrir a passagem para a Fase 2.

* **Fase 2 (`q7` → `qf2`) — Arena do Boss Final (Regra LIFO):**
  1. Colete **3 Espadas** e **1 Escudo** pelo mapa de parkour.
  2. A ordem na pilha é decisiva: o **Escudo precisa ficar no topo** (`[Base, Espada, Espada, Espada, Escudo]`).
  3. **Dano ou contato com o Boss sem o Escudo no topo:** ativa o reset (`q_reset`), esvaziando toda a pilha e devolvendo os itens ao mapa (no Boss, aplica *Hit-Kill* e reinicia a fase).
  4. **Com o Escudo no topo:** ele absorve o ataque inicial do Boss (`q7` → `q8`) e libera a sequência de **3 golpes de espada** (`q8` → `q11`) até confirmar a base `Z` e alcançar o estado final de vitória **`qf2`**.

---

## Controles

| Tecla | Ação |
| :---: | :--- |
| `A` / `D` ou `←` / `→` | Mover para esquerda / direita |
| `Espaço`, `W` ou `↑` | Pular |
| `R` | Reiniciar a fase atual |
| `1` | Ir direto para a Fase 1 |
| `2` | Ir direto para a Fase 2 |

---

## Definição Formal e Tabela de Símbolos do PDA

O autômato formal $M = (Q, \Sigma, \Gamma, \delta, q_0, Z, F)$ está modelado no arquivo **`jogo-pda-completo.jff`** (aceitação por estado final em $F = \{qf2\}$).

### Alfabeto de Entrada ($\Sigma$ — Eventos do Jogo)

| Símbolo | Ação no Jogo | Fase |
| :---: | :--- | :---: |
| `m` | Coletar **Moeda** | Fase 1 |
| `v` | Interagir com o **Comerciante** (vendedor) | Fase 1 |
| `g` | Coletar **Diamante** (gema dropada) | Fase 1 |
| `c` | Coletar **Chave** | Fase 1 |
| `p` | Interagir com o **Portão** | Fase 1 |
| `e` | Coletar **Espada** | Fase 2 |
| `s` | Coletar **Escudo** | Fase 2 |
| `b` | Enfrentar o **Boss Final** | Fase 2 |
| `d` | Sofrer **Dano** em espinho | Fases 1 e 2 |
| `λ` | Transição automática (vazia) | Fases 1 e 2 |

### Alfabeto da Pilha ($\Gamma$ — Memória LIFO)

| Símbolo | Elemento no HUD | Função na Pilha |
| :---: | :--- | :--- |
| `Z` | **Base** | Fundo da pilha (protegido contra dano) |
| `M` | **Moeda** | Pagamento exigido pelo Comerciante (mínimo 3) |
| `D` | **Diamante** | Requisito protegido que desbloqueia as Chaves |
| `C` | **Chave** | Destranca o Portão da Fase 1 (exatamente 2) |
| `E` | **Espada** | Golpes contra o Boss na Fase 2 (exatamente 3 abaixo do Escudo) |
| `S` | **Escudo** | Defesa obrigatória no topo da pilha contra o *Hit-Kill* |

### Resumo dos Estados ($Q$)

| Estado | Legenda no JFLAP | Descrição |
| :---: | :--- | :--- |
| `q0` | Coletar Moedas | Estado inicial; empilha moedas e trata dano nos espinhos |
| `q1` – `q2` | Comerciante (M1 / M2) | Desempilha as 3 moedas mínimas ao pagar o Comerciante |
| `q3` | Pegar Diamante | Recolhe eventuais moedas extras e aguarda a coleta do Diamante |
| `q4` | Coletar Chaves | Permite empilhar chaves sobre o Diamante protegido |
| `q5` – `q6` | Portão (Chave 1 / 2) | Desempilha exatamente 2 chaves e valida o Diamante |
| `qf` | Fim Fase 1 | Portão aberto; transita automaticamente para a Fase 2 (`λ, Z ; Z`) |
| `q7` | F2: Coletar Armas | Empilha Espadas e Escudo e trata defesas/danos na Fase 2 |
| `q_reset` | Limpar Pilha | Desempilha tudo até a Base (`Z`) ao sofrer dano/Hit-Kill sem Escudo |
| `q8` | Escudo Bloqueia | Escudo no topo absorve o golpe do Boss |
| `q9` – `q11` | Golpe Espada 1 / 2 / 3 | Desempilha as 3 espadas em sequência |
| `qf2` | Vitória (Boss) | **Estado final** — valida a Base `Z` e derrota o Boss |

---

## Validação no JFLAP

1. Abra o arquivo **`jogo-pda-completo.jff`** no JFLAP (`File → Open`).
2. Vá em **`Input → Multiple Run`** e selecione **Accept by Final State**.
3. Teste as cadeias abaixo:

| Cadeia | Resultado Esperado | Cenário Testado |
| :--- | :---: | :--- |
| `mmmvgccpeeesb` | **Aceita** | Caminho perfeito nas Fases 1 e 2 |
| `mmmmvgccpedeeesb` | **Aceita** | 4 moedas na Fase 1 + dano sem escudo (`q_reset`) e recuperação na Fase 2 |
| `mmmvgccpesbeesb` | **Aceita** | Escudo absorve golpe do Boss sem 3 espadas; jogador recupera e vence |
| `mmvgccpeeesb` | **Rejeitada** | Menos de 3 moedas entregues ao Comerciante |
| `mmmvccp` | **Rejeitada** | Tentativa de coletar chaves sem pegar o Diamante (`g`) |
| `mmmvgccpeeeb` | **Rejeitada** | Enfrentou o Boss sem Escudo no topo (*Hit-Kill*) |
| `mmmvgccpeseeeb` | **Rejeitada** | Escudo coletado antes das espadas (não ficou no topo da pilha) |
| `mmmvgccpeesb` | **Rejeitada** | Faltou 1 espada abaixo do Escudo |

---

## Estrutura do Projeto

```text
.
├── index.html                 # Estrutura da página e HUD do Autômato de Pilha
├── style.css                  # Estilos da tela do jogo e da pilha visual
├── game.js                    # Lógica completa (KAPLAY + Fases 1 e 2 + PDA)
├── jogo-pda-completo.jff      # Diagrama formal do PDA para abrir no JFLAP
├── README.md                  # Documentação do projeto
└── assets/                    # Sprites e fundos das fases
    ├── player1.png
    ├── comerciante1.png
    ├── comerciante.png
    ├── boss.png
    ├── moeda.png
    ├── diamante.png
    ├── chave.png
    ├── espada.png
    ├── escudo.png
    ├── espinho.png
    ├── portao-fechado.png
    ├── portao-aberto.png
    ├── plataforma.webp
    ├── fundo-fase1.png
    └── fundo-fase2.png