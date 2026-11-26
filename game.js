import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

const k = kaplay({
  width: 1090,
  height: 500,
  background: [125, 195, 240],
  pixelDensity: Math.min(window.devicePixelRatio || 1, 2),
  root: document.getElementById("game-container"),
});

k.setGravity(1600);

// Sprites
k.loadSprite("player", "assets/player1.png", {
  sliceX: 4,
  anims: {
    parado: 0,
    andando: { from: 0, to: 3, loop: true, speed: 8 },
  },
});
k.loadSprite("moeda", "assets/moeda.png");
k.loadSprite("chave", "assets/chave.png");
k.loadSprite("diamante", "assets/diamante.png");
k.loadSprite("espinho", "assets/espinho.png");
k.loadSprite("portao-fechado", "assets/portao-fechado.png");
k.loadSprite("portao-aberto", "assets/portao-aberto.png");
k.loadSprite("plataforma", "assets/plataforma.webp");
k.loadSprite("comerciante-andando", "assets/comerciante1.png", {
  sliceX: 4,
  anims: {
    parado: 0,
    andando: { from: 0, to: 3, loop: true, speed: 6 },
  },
});
k.loadSprite("comerciante-parado", "assets/comerciante.png");

// Sprites da Fase 2 (salve as imagens na pasta assets/ com estes nomes)
k.loadSprite("boss", "assets/boss.png", {
  sliceX: 4,
  anims: {
    parado: 0,
    atacando: { from: 0, to: 3, loop: true, speed: 6 },
  },
});
k.loadSprite("espada", "assets/espada.png");
k.loadSprite("escudo", "assets/escudo.png");

// Fundos das fases (salve as imagens em assets/ ou altere o caminho/extensão abaixo)
const FUNDO_FASE1 = "assets/fundo-fase1.png";
const FUNDO_FASE2 = "assets/fundo-fase2.png";

// Tratamento visual dos fundos (desfoque leve + menos saturação/brilho para destacar o jogo)
const FILTRO_FUNDO_FASE1 = "blur(2.2px) saturate(0.62) brightness(0.76) contrast(0.92)";
const FILTRO_FUNDO_FASE2 = "blur(2.2px) saturate(0.65) brightness(0.72) contrast(0.94)";

const fundosProntos = {};

function carregarFundoTratado(nome, url, filtro) {
  const promessa = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 1090;
      canvas.height = img.naturalHeight || 500;
      const ctx = canvas.getContext("2d");

      // Margem extra para o blur não deixar bordas vazias nas extremidades
      const margem = 14;
      ctx.filter = filtro;
      ctx.drawImage(
        img,
        -margem,
        -margem,
        canvas.width + margem * 2,
        canvas.height + margem * 2
      );

      k.loadSprite(nome, canvas.toDataURL("image/png"))
        .then(() => resolve(true))
        .catch(() => resolve(false));
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });

  fundosProntos[nome] = promessa;
  k.load(promessa);
}

function adicionarFundo(nomeSprite, corVeu = [18, 28, 48], opacidadeVeu = 0.16) {
  let ativo = true;
  const veu = k.add([
    k.rect(k.width(), k.height()),
    k.pos(0, 0),
    k.color(...corVeu),
    k.opacity(opacidadeVeu),
    k.fixed(),
    k.z(-99),
  ]);
  veu.onDestroy(() => {
    ativo = false;
  });

  const desenharFundo = () => {
    if (!ativo || !k.getSprite(nomeSprite)) return;
    k.add([
      k.sprite(nomeSprite, { width: k.width(), height: k.height() }),
      k.pos(0, 0),
      k.fixed(),
      k.z(-100),
    ]);
  };

  if (k.getSprite(nomeSprite)) {
    desenharFundo();
  } else if (fundosProntos[nomeSprite]) {
    fundosProntos[nomeSprite].then((ok) => {
      if (ok) desenharFundo();
    });
  }
}

carregarFundoTratado("fundo-fase1", FUNDO_FASE1, FILTRO_FUNDO_FASE1);
carregarFundoTratado("fundo-fase2", FUNDO_FASE2, FILTRO_FUNDO_FASE2);

const elEstado = document.getElementById("estado-atual");
const elPilha = document.getElementById("pilha-visual");
const elStatus = document.getElementById("status-msg");

const nomesEstados = {
  q0: "q0: Coletar Moedas",
  q1: "q1: Comerciante (Moeda 1)",
  q2: "q2: Comerciante (Moeda 2)",
  q3: "q3: Pegue o Diamante!",
  q4: "q4: Chaves Liberadas!",
  q5: "q5: Portão (Chave 1)",
  q6: "q6: Portão (Chave 2)",
  qf: "qf: FIM Fase 1 (Portão Aberto)",
  q7: "q7: Fase 2 - Coletar Armas",
  q8: "q8: Boss (Escudo Bloqueou)",
  q9: "q9: Boss (Espada 1)",
  q10: "q10: Boss (Espada 2)",
  qf2: "qf2: VITÓRIA (Boss Derrotado)",
};

function atualizarHUD(estado, pilha, mensagem) {
  elEstado.textContent = nomesEstados[estado] || estado;
  if (mensagem) elStatus.textContent = mensagem;

  elPilha.innerHTML = "";
  pilha.forEach((item) => {
    const div = document.createElement("div");
    div.className = "stack-item";
    if (item === "Base") div.classList.add("stack-base");
    if (item === "Moeda") div.classList.add("stack-moeda");
    if (item === "Chave") div.classList.add("stack-chave");
    if (item === "Diamante") {
      div.classList.add("stack-diamante");
      div.style.background = "#06b6d4";
      div.style.color = "#082f49";
      div.style.fontWeight = "700";
    }
    if (item === "Espada") div.classList.add("stack-espada");
    if (item === "Escudo") div.classList.add("stack-escudo");
    div.textContent = item;
    elPilha.appendChild(div);
  });
}

// Balão de diálogo limpo acima do personagem (evita cortar nas bordas)
async function mostrarBalao(alvo, texto, larguraMapa, duracao = 2.2) {
  const largura = Math.min(260, Math.max(150, texto.length * 6.8 + 24));
  const linhas = Math.ceil(texto.length / 28);
  const altura = Math.max(36, linhas * 18 + 16);

  const posX = Math.max(
    largura / 2 + 12,
    Math.min(alvo.pos.x, larguraMapa - largura / 2 - 12)
  );
  const offsetY = alvo.balaoOffsetY || 78;
  const posY = Math.max(altura + 16, alvo.pos.y - offsetY);

  const balao = k.add([
    k.rect(largura, altura, { radius: 8 }),
    k.pos(posX, posY),
    k.anchor("bot"),
    k.color(255, 255, 255),
    k.outline(2, k.rgb(30, 41, 59)),
    k.z(100),
  ]);

  balao.add([
    k.text(texto, {
      size: 13,
      width: largura - 18,
      align: "center",
    }),
    k.pos(0, -altura / 2),
    k.anchor("center"),
    k.color(15, 23, 42),
  ]);

  await k.wait(duracao);
  k.destroy(balao);
}

k.scene("fase1", () => {
  adicionarFundo("fundo-fase1", [18, 28, 48], 0.16);

  let estadoAtual = "q0";
  const pilha = ["Base"];
  let validando = false;
  let invulneravel = false;
  let comerciantePago = false;
  let diamanteDropado = false;

  atualizarHUD(
    estadoAtual,
    pilha,
    "Colete pelo menos 3 moedas e entregue ao Comerciante."
  );

  // Mapa expandido (60 colunas x 18 linhas = 2400x720px)
  const mapa = [
    "                                                           ",
    "                                                           ",
    "                                                           ",
    "                                                           ",
    "                          C                  C             ",
    "                         ===                ====           ",
    "                                     =                  P  ",
    "  V         ===         $                            ======",
    " ====                 ====              C                  ",
    "         =                             =====               ",
    "    ^           ==                                   ==    ",
    "   ====                  =====                             ",
    "             $     ==              ====                 == ",
    "          =====                                ===         ",
    "                       ==    $                             ",
    "     ===                    ===          ===         ===   ",
    "  @       ^      $  =     ^       ^                ^     $ ",
    "=============   ===   ===============   =======   ==========",
  ];

  const TILE = 40;
  const LARGURA_MAPA = mapa[0].length * TILE;
  const ALTURA_MAPA = mapa.length * TILE;

  const level = k.addLevel(mapa, {
    tileWidth: TILE,
    tileHeight: TILE,
    tiles: {
      "=": () => [
        k.sprite("plataforma", { width: 45, height: 40 }),
        k.area(),
        k.body({ isStatic: true }),
        "plataforma",
      ],
      $: () => [
        k.sprite("moeda", { width: 50, height: 60 }),
        k.anchor("center"),
        k.pos(20, 15),
        k.area({ scale: 0.8 }),
        "moeda",
      ],
      C: () => [
        k.sprite("chave", { width: 34, height: 34 }),
        k.anchor("center"),
        k.pos(20, 20),
        k.area({ scale: 0.8 }),
        "chave",
      ],
      "^": () => [
        k.sprite("espinho", { width: 40, height: 50 }),
        k.anchor("bot"),
        k.pos(20, 55),
        k.area({ scale: 0.75 }),
        "obstaculo",
      ],
      P: () => [
        k.sprite("portao-fechado", { width: 58, height: 64 }),
        k.anchor("bot"),
        k.pos(20, 45.6),
        k.area({ scale: 0.8 }),
        "portao",
      ],
      V: () => [
        k.sprite("comerciante-andando", { width: 70, height: 80 }),
        k.anchor("bot"),
        k.pos(20, 46),
        k.area({ scale: 0.8 }),
        "comerciante",
      ],
      "@": () => [
        k.sprite("player", { width: 90, height: 80 }),
        k.anchor("center"),
        k.area({ scale: 0.8 }),
        k.body(),
        "player",
      ],
    },
  });

  const player = level.get("player")[0];
  const SPAWN = k.vec2(player.pos.x, player.pos.y);
  const VELOCIDADE = 250;
  const PULO = 645;

  // Patrulha do Comerciante (anda 1 bloco para a esquerda e volta)
  const comerciante = level.get("comerciante")[0];
  if (comerciante) {
    const inicioX = comerciante.pos.x;
    const DISTANCIA = 40;
    const VEL_COMERCIANTE = 50;
    let direcao = -1;
    comerciante.flipX = true;
    comerciante.play("andando");

    comerciante.onUpdate(() => {
      if (comerciantePago) return;

      if (validando) {
        if (comerciante.curAnim() !== "parado") comerciante.play("parado");
        return;
      }

      if (comerciante.curAnim() !== "andando") comerciante.play("andando");
      comerciante.move(VEL_COMERCIANTE * direcao, 0);

      if (comerciante.pos.x <= inicioX - DISTANCIA) {
        direcao = 1;
        comerciante.flipX = false;
      } else if (comerciante.pos.x >= inicioX) {
        direcao = -1;
        comerciante.flipX = true;
      }
    });
  }

  // Câmera, limites do mapa, queda e animação das pernas do player
  k.onUpdate(() => {
    if (player.pos.x < 25) player.pos.x = 25;
    if (player.pos.x > LARGURA_MAPA - 25) player.pos.x = LARGURA_MAPA - 25;

    if (player.pos.y > ALTURA_MAPA + 60) {
      player.pos = SPAWN.clone();
      player.vel = k.vec2(0, 0);
      atualizarHUD(estadoAtual, pilha, "Você caiu no buraco! Voltando ao início.");
    }

    const metadeLargura = k.width() / 2;
    const metadeAltura = k.height() / 2;

    const camX = Math.max(
      metadeLargura,
      Math.min(player.pos.x, LARGURA_MAPA - metadeLargura)
    );
    const camY = Math.max(
      metadeAltura,
      Math.min(player.pos.y, ALTURA_MAPA - metadeAltura)
    );

    k.camPos(camX, camY);

    const andando =
      k.isKeyDown("left") ||
      k.isKeyDown("a") ||
      k.isKeyDown("right") ||
      k.isKeyDown("d");

    if (andando && player.isGrounded() && !validando) {
      if (player.curAnim() !== "andando") {
        player.play("andando");
      }
    } else {
      if (player.curAnim() !== "parado") {
        player.play("parado");
      }
    }
  });

  // Movimentação
  const moverEsquerda = () => {
    if (validando) return;
    player.move(-VELOCIDADE, 0);
    player.flipX = true;
  };

  const moverDireita = () => {
    if (validando) return;
    player.move(VELOCIDADE, 0);
    player.flipX = false;
  };

  const pular = () => {
    if (player.isGrounded() && !validando) {
      player.jump(PULO);
    }
  };

  k.onKeyDown("left", moverEsquerda);
  k.onKeyDown("a", moverEsquerda);
  k.onKeyDown("right", moverDireita);
  k.onKeyDown("d", moverDireita);
  k.onKeyPress("space", pular);
  k.onKeyPress("up", pular);
  k.onKeyPress("w", pular);

  k.onKeyPress("r", () => k.go("fase1"));
  k.onKeyPress("2", () => k.go("fase2"));

  // Transição: Coletar Moeda (m)
  player.onCollide("moeda", (moeda) => {
    if (validando) return;
    const topo = pilha[pilha.length - 1];

    if (estadoAtual === "q0" && (topo === "Base" || topo === "Moeda")) {
      pilha.push("Moeda");
      k.destroy(moeda);
      atualizarHUD(estadoAtual, pilha, `Moeda, ${topo} ; empilha Moeda`);
    } else {
      atualizarHUD(
        estadoAtual,
        pilha,
        "O comerciante já pegou suas moedas! Pegue o diamante e as 2 chaves."
      );
    }
  });

  // Transição: Comerciante (v) -> Diálogos, desempilha 3+ moedas e dropa o Diamante
  player.onCollide("comerciante", async (npc) => {
    if (validando || estadoAtual === "qf") return;

    if (comerciantePago) {
      atualizarHUD(
        estadoAtual,
        pilha,
        estadoAtual === "q3"
          ? "Pegue o diamante dropado para liberar as chaves!"
          : "Comerciante: Chaves liberadas! Pegue 2 chaves e vá ao portão."
      );
      return;
    }

    const qtdMoedas = pilha.filter((item) => item === "Moeda").length;
    if (estadoAtual !== "q0" || qtdMoedas < 3) {
      atualizarHUD(
        estadoAtual,
        pilha,
        `Comerciante: Traga pelo menos 3 moedas! (Você tem ${qtdMoedas})`
      );
      return;
    }

    validando = true;

    // 1. Fala do Player
    await mostrarBalao(player, "Somente tenho isso!", LARGURA_MAPA, 2.8);

    // 2. 1º balão do Comerciante
    await mostrarBalao(
      npc,
      "Se quiser passar me de minhas moedas hahahaha o amor venceu!",
      LARGURA_MAPA,
      2.8
    );

    // 3. Desempilha as moedas (q0 -> q3)
    const passosComerciante = [
      { estado: "q1", msg: "Comerciante, Moeda ; tira Moeda (q0 -> q1)" },
      { estado: "q2", msg: "Vazio, Moeda ; tira Moeda (q1 -> q2)" },
      { estado: "q3", msg: "Vazio, Moeda ; tira Moeda (q2 -> q3)" },
    ];

    for (const passo of passosComerciante) {
      pilha.pop();
      estadoAtual = passo.estado;
      atualizarHUD(estadoAtual, pilha, passo.msg);
      await k.wait(0.35);
    }

    while (pilha[pilha.length - 1] === "Moeda") {
      pilha.pop();
      atualizarHUD(estadoAtual, pilha, "Vazio, Moeda ; tira Moeda extra (q3)");
      await k.wait(0.25);
    }

    // 4. Comerciante para na pose estática fazendo o L
    comerciantePago = true;
    npc.use(k.sprite("comerciante-parado", { width: 75, height: 80 }));
    npc.flipX = false;

    // 5. 2º balão do Comerciante
    await mostrarBalao(
      npc,
      "Te roubei, mas te entrego esse diamante !",
      LARGURA_MAPA,
      3.0
    );

    // 6. Dropa o diamante na plataforma do comerciante
    if (!diamanteDropado) {
      diamanteDropado = true;
      const dropX = Math.min(npc.pos.x + 55, 180);
      const dropY = npc.pos.y - 26;

      const diamante = k.add([
        k.sprite("diamante", { width: 38, height: 38 }),
        k.pos(dropX, dropY),
        k.anchor("center"),
        k.area({ scale: 0.85 }),
        "diamante",
      ]);

      const baseY = dropY;
      diamante.onUpdate(() => {
        diamante.pos.y = baseY + Math.sin(k.time() * 5) * 4;
      });
    }

    validando = false;
    atualizarHUD(
      estadoAtual,
      pilha,
      "O Comerciante dropou o Diamante! Pegue-o para liberar as chaves."
    );
  });

  // Transição: Coletar Diamante -> Empilha Diamante e libera as chaves (q3 -> q4)
  player.onCollide("diamante", (diamante) => {
    if (validando) return;
    k.destroy(diamante);
    pilha.push("Diamante");
    estadoAtual = "q4";
    atualizarHUD(
      estadoAtual,
      pilha,
      "Diamante, Base ; empilha Diamante -> Chaves liberadas! (q3 -> q4)"
    );
  });

  // Transição: Coletar Chave (c) -> Só funciona com o Diamante na pilha (q4)
  player.onCollide("chave", (chave) => {
    if (validando) return;
    const topo = pilha[pilha.length - 1];

    if (
      estadoAtual === "q4" &&
      pilha.includes("Diamante") &&
      (topo === "Diamante" || topo === "Chave")
    ) {
      pilha.push("Chave");
      k.destroy(chave);
      atualizarHUD(estadoAtual, pilha, `Chave, ${topo} ; empilha Chave`);
    } else {
      atualizarHUD(
        estadoAtual,
        pilha,
        "Bloqueado: pegue o Diamante com o Comerciante primeiro!"
      );
    }
  });

  // Transição: Obstáculo / Dano (d) -> Não remove Base nem Diamante
  player.onCollide("obstaculo", () => {
    if (invulneravel || validando) return;
    invulneravel = true;
    player.jump(350);

    const topo = pilha[pilha.length - 1];
    if (topo === "Moeda" || topo === "Chave") {
      pilha.pop();
      atualizarHUD(estadoAtual, pilha, `Dano, ${topo} ; tira ${topo}`);
    } else {
      atualizarHUD(
        estadoAtual,
        pilha,
        `Dano sofrido (${topo} protegido na pilha).`
      );
    }

    k.wait(1, () => {
      invulneravel = false;
    });
  });

  // Transição: Portão (p) -> Exige Diamante + 2 Chaves na pilha
  player.onCollide("portao", async (portao) => {
    if (validando || estadoAtual === "qf") return;

    const esperado = ["Base", "Diamante", "Chave", "Chave"];
    const pilhaValida =
      estadoAtual === "q4" &&
      pilha.length === esperado.length &&
      pilha.every((item, i) => item === esperado[i]);

    if (!pilhaValida) {
      atualizarHUD(
        estadoAtual,
        pilha,
        estadoAtual !== "q4"
          ? "Portão trancado! Consiga o Diamante com o Comerciante primeiro."
          : "Portão trancado! Precisa do Diamante + exatamente 2 Chaves na pilha."
      );
      return;
    }

    validando = true;
    const passosPortao = [
      { estado: "q5", msg: "Portão, Chave ; tira Chave (q4 -> q5)" },
      { estado: "q6", msg: "Vazio, Chave ; tira Chave (q5 -> q6)" },
    ];

    for (const passo of passosPortao) {
      pilha.pop();
      estadoAtual = passo.estado;
      atualizarHUD(estadoAtual, pilha, passo.msg);
      await k.wait(0.35);
    }

    // Consome o diamante na abertura final e valida a Base
    pilha.pop();
    estadoAtual = "qf";
    portao.use(k.sprite("portao-aberto", { width: 58, height: 64 }));
    atualizarHUD(
      estadoAtual,
      pilha,
      "Vazio, Diamante ; tira Diamante -> Portão aberto! Entrando na Fase 2..."
    );

    await k.wait(2.2);
    k.go("fase2");
  });
});

// ============================================================
// FASE 2: PARKOUR + 3 ESPADAS + 1 ESCUDO NO TOPO + BOSS FINAL
// ============================================================
k.scene("fase2", () => {
  adicionarFundo("fundo-fase2", [15, 18, 36], 0.22);

  let estadoAtual = "q7";
  const pilha = ["Base"];
  const historicoSpawns = []; // guarda { tipo, pos } para reaparecer item perdido no dano
  let validando = false;
  let invulneravel = false;
  let bossDerrotado = false;

  atualizarHUD(
    estadoAtual,
    pilha,
    "Fase 2: Colete 3 Espadas e pegue o Escudo POR ÚLTIMO (no topo da pilha) para enfrentar o Boss!"
  );

  // Mapa 60x18 (2400x720px) com parkour nas laterais/topo e Arena do Boss no centro
  // E = Espada (3) | S = Escudo (1) | B = Boss Final | ^ = Espinho | @ = Player
  const mapa = [
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                                                            ",
    "                             E                   =      S   ",
    "                           ======          =          ===== ",
    "                                                            ",
    "                        ====          ====         ====     ",
    "    E                                                       ",
    "  =====           ====                                ====  ",
    "        =                          =    =         =         ",
    "                                                            ",
    "            =====            =               ===      E     ",
    "  ====                   =                            ===== ",
    "                                                            ",
    "        ===          =                            ===        ",
    "  @          ^               B                ^        ^    ",
    "========   =====   ======================   =====   ========",
  ];

  const TILE = 40;
  const LARGURA_MAPA = mapa[0].length * TILE;
  const ALTURA_MAPA = mapa.length * TILE;

  function ativarFlutuacao(obj) {
    const baseY = obj.pos.y;
    const fase = Math.random() * Math.PI * 2;
    obj.onUpdate(() => {
      obj.pos.y = baseY + Math.sin(k.time() * 4.5 + fase) * 4;
    });
  }

  function criarItemFase2(tipo, spawnPos) {
    const item = k.add([
      k.sprite(tipo, { width: 42, height: 42 }),
      k.anchor("center"),
      k.pos(spawnPos.x, spawnPos.y),
      k.area({ scale: 0.85 }),
      tipo,
    ]);
    item.spawnPos = spawnPos.clone();
    ativarFlutuacao(item);
    return item;
  }

  function esvaziarPilha() {
    while (pilha.length > 1) {
      pilha.pop();
    }
    while (historicoSpawns.length > 0) {
      const item = historicoSpawns.pop();
      criarItemFase2(item.tipo, item.pos);
    }
  }

  const level = k.addLevel(mapa, {
    tileWidth: TILE,
    tileHeight: TILE,
    tiles: {
      "=": () => [
        k.sprite("plataforma", { width: 45, height: 40 }),
        k.area(),
        k.body({ isStatic: true }),
        "plataforma",
      ],
      E: () => [
        k.sprite("espada", { width: 42, height: 42 }),
        k.anchor("center"),
        k.pos(20, 18),
        k.area({ scale: 0.85 }),
        "espada",
      ],
      S: () => [
        k.sprite("escudo", { width: 42, height: 42 }),
        k.anchor("center"),
        k.pos(20, 18),
        k.area({ scale: 0.85 }),
        "escudo",
      ],
      "^": () => [
        k.sprite("espinho", { width: 40, height: 50 }),
        k.anchor("bot"),
        k.pos(20, 55),
        k.area({ scale: 0.75 }),
        "obstaculo",
      ],
      B: () => [
        k.sprite("boss", { width: 122, height: 100 }),
        k.anchor("bot"),
        k.pos(20, 42),
        k.area({ scale: 0.72 }),
        k.z(10),
        "boss",
      ],
      "@": () => [
        k.sprite("player", { width: 90, height: 80 }),
        k.anchor("center"),
        k.area({ scale: 0.8 }),
        k.body(),
        "player",
      ],
    },
  });

  // Salva posição original e adiciona animação de flutuação às Espadas e ao Escudo
  for (const espada of level.get("espada")) {
    espada.spawnPos = espada.pos.clone();
    ativarFlutuacao(espada);
  }
  for (const escudo of level.get("escudo")) {
    escudo.spawnPos = escudo.pos.clone();
    ativarFlutuacao(escudo);
  }

  const player = level.get("player")[0];
  const SPAWN = k.vec2(player.pos.x, player.pos.y);
  const VELOCIDADE = 250;
  const PULO = 645;

  // Patrulha e animação do Boss Final no centro (anda ~3.75 quadrados virando para os dois lados)
  const boss = level.get("boss")[0];
  if (boss) {
    const centroX = boss.pos.x;
    const RAIO_PATRULHA = 75; // 150px total (entre 3 e 4 quadrados de 40px)
    const VEL_BOSS = 115;
    let direcao = 1;

    boss.balaoOffsetY = 115;
    boss.flipX = false;
    boss.play("atacando");

    boss.onUpdate(() => {
      if (bossDerrotado) return;

      if (validando) {
        if (boss.curAnim() !== "parado") boss.play("parado");
        return;
      }

      if (boss.curAnim() !== "atacando") boss.play("atacando");
      boss.move(VEL_BOSS * direcao, 0);

      if (boss.pos.x >= centroX + RAIO_PATRULHA) {
        boss.pos.x = centroX + RAIO_PATRULHA;
        direcao = -1;
        boss.flipX = true;
      } else if (boss.pos.x <= centroX - RAIO_PATRULHA) {
        boss.pos.x = centroX - RAIO_PATRULHA;
        direcao = 1;
        boss.flipX = false;
      }
    });
  }

  // Câmera, limites do mapa, queda e animação do player
  k.onUpdate(() => {
    if (player.pos.x < 25) player.pos.x = 25;
    if (player.pos.x > LARGURA_MAPA - 25) player.pos.x = LARGURA_MAPA - 25;

    if (player.pos.y > ALTURA_MAPA + 60) {
      esvaziarPilha();
      player.pos = SPAWN.clone();
      player.vel = k.vec2(0, 0);
      atualizarHUD(
        estadoAtual,
        pilha,
        "Você caiu na vala! Perdeu tudo na pilha e voltou ao início da Fase 2."
      );
    }

    const metadeLargura = k.width() / 2;
    const metadeAltura = k.height() / 2;

    const camX = Math.max(
      metadeLargura,
      Math.min(player.pos.x, LARGURA_MAPA - metadeLargura)
    );
    const camY = Math.max(
      metadeAltura,
      Math.min(player.pos.y, ALTURA_MAPA - metadeAltura)
    );

    k.camPos(camX, camY);

    const andando =
      k.isKeyDown("left") ||
      k.isKeyDown("a") ||
      k.isKeyDown("right") ||
      k.isKeyDown("d");

    if (andando && player.isGrounded() && !validando) {
      if (player.curAnim() !== "andando") {
        player.play("andando");
      }
    } else {
      if (player.curAnim() !== "parado") {
        player.play("parado");
      }
    }
  });

  // Movimentação
  const moverEsquerda = () => {
    if (validando) return;
    player.move(-VELOCIDADE, 0);
    player.flipX = true;
  };

  const moverDireita = () => {
    if (validando) return;
    player.move(VELOCIDADE, 0);
    player.flipX = false;
  };

  const pular = () => {
    if (player.isGrounded() && !validando) {
      player.jump(PULO);
    }
  };

  k.onKeyDown("left", moverEsquerda);
  k.onKeyDown("a", moverEsquerda);
  k.onKeyDown("right", moverDireita);
  k.onKeyDown("d", moverDireita);
  k.onKeyPress("space", pular);
  k.onKeyPress("up", pular);
  k.onKeyPress("w", pular);

  k.onKeyPress("r", () => k.go("fase2"));
  k.onKeyPress("1", () => k.go("fase1"));

  // Transição: Coletar Espada -> Empilha Espada
  player.onCollide("espada", (espada) => {
    if (validando || bossDerrotado) return;
    const topo = pilha[pilha.length - 1];
    const spawnPos = espada.spawnPos ? espada.spawnPos.clone() : espada.pos.clone();

    pilha.push("Espada");
    historicoSpawns.push({ tipo: "espada", pos: spawnPos });
    k.destroy(espada);

    const avisoOrdem =
      pilha.includes("Escudo")
        ? " (Atenção: o Escudo não está mais no topo!)"
        : "";
    atualizarHUD(
      estadoAtual,
      pilha,
      `Espada, ${topo} ; empilha Espada${avisoOrdem}`
    );
  });

  // Transição: Coletar Escudo -> Empilha Escudo (precisa ficar no TOPO/fim da pilha!)
  player.onCollide("escudo", (escudo) => {
    if (validando || bossDerrotado) return;
    const topo = pilha[pilha.length - 1];
    const spawnPos = escudo.spawnPos ? escudo.spawnPos.clone() : escudo.pos.clone();

    pilha.push("Escudo");
    historicoSpawns.push({ tipo: "escudo", pos: spawnPos });
    k.destroy(escudo);

    const qtdEspadas = pilha.filter((item) => item === "Espada").length;
    const dica =
      qtdEspadas === 3
        ? " Pilha pronta! Enfrente o Boss no centro!"
        : ` (Cuidado: faltam ${3 - qtdEspadas} Espada(s) abaixo do Escudo!)`;

    atualizarHUD(estadoAtual, pilha, `Escudo, ${topo} ; empilha Escudo.${dica}`);
  });

  // Transição: Obstáculo / Espinho -> Sem Escudo no topo perde tudo na pilha; com Escudo, o Escudo protege
  player.onCollide("obstaculo", () => {
    if (invulneravel || validando || bossDerrotado) return;
    invulneravel = true;
    player.jump(350);

    const topo = pilha[pilha.length - 1];
    if (topo === "Escudo") {
      pilha.pop();
      const ultimo = historicoSpawns.pop();
      if (ultimo) criarItemFase2(ultimo.tipo, ultimo.pos);
      atualizarHUD(
        estadoAtual,
        pilha,
        "Dano, Escudo ; Escudo absorveu o hit e reapareceu no mapa!"
      );
    } else if (pilha.length > 1) {
      esvaziarPilha();
      atualizarHUD(
        estadoAtual,
        pilha,
        "Dano sem Escudo! Você perdeu tudo na pilha (itens reapareceram no mapa)."
      );
    } else {
      atualizarHUD(estadoAtual, pilha, "Dano sofrido (Base protegida na pilha).");
    }

    k.wait(1, () => {
      invulneravel = false;
    });
  });

  // Transição: Boss Final -> Exige Escudo no TOPO da pilha (senão HIT KILL!) + 3 Espadas abaixo
  player.onCollide("boss", async (bossObj) => {
    if (validando || bossDerrotado || invulneravel) return;

    const topo = pilha[pilha.length - 1];

    // 1. Sem Escudo no topo (fim da pilha) = HIT KILL e perde tudo na pilha!
    if (topo !== "Escudo") {
      validando = true;
      esvaziarPilha();
      atualizarHUD(
        estadoAtual,
        pilha,
        "HIT KILL sem Escudo! Você perdeu tudo na pilha! Reiniciando Fase 2..."
      );
      await mostrarBalao(
        bossObj,
        "HIT KILL! Sem o Escudo no topo da pilha você perde tudo!",
        LARGURA_MAPA,
        2.3
      );
      k.go("fase2");
      return;
    }

    // 2. Escudo está no topo, mas ainda não tem exatamente 3 Espadas abaixo
    const esperado = ["Base", "Espada", "Espada", "Espada", "Escudo"];
    const pilhaValida =
      pilha.length === esperado.length &&
      pilha.every((item, i) => item === esperado[i]);

    if (!pilhaValida) {
      invulneravel = true;
      pilha.pop(); // Escudo absorve o Hit-Kill
      const ultimo = historicoSpawns.pop();
      if (ultimo) criarItemFase2(ultimo.tipo, ultimo.pos);

      const ladoRecuo = player.pos.x < bossObj.pos.x ? -1 : 1;
      player.pos.x += ladoRecuo * 55;
      player.jump(420);

      atualizarHUD(
        estadoAtual,
        pilha,
        "Boss, Escudo ; Escudo salvou do Hit-Kill, mas faltam as 3 Espadas! (Escudo reapareceu)"
      );

      k.wait(1.2, () => {
        invulneravel = false;
      });
      return;
    }

    // 3. Pilha válida: ["Base", "Espada", "Espada", "Espada", "Escudo"] -> Derrota o Boss!
    validando = true;
    await mostrarBalao(
      player,
      "Escudo no topo! Defendi seu golpe, agora tome as 3 espadas!",
      LARGURA_MAPA,
      2.2
    );

    const passosBoss = [
      {
        estado: "q8",
        msg: "Boss, Escudo ; bloqueia Hit-Kill e tira Escudo (q7 -> q8)",
      },
      {
        estado: "q9",
        msg: "Vazio, Espada ; golpe 1 e tira Espada (q8 -> q9)",
      },
      {
        estado: "q10",
        msg: "Vazio, Espada ; golpe 2 e tira Espada (q9 -> q10)",
      },
    ];

    for (const passo of passosBoss) {
      pilha.pop();
      historicoSpawns.pop();
      estadoAtual = passo.estado;
      atualizarHUD(estadoAtual, pilha, passo.msg);
      await k.wait(0.45);
    }

    // Golpe final com a 3ª Espada -> resta apenas Base
    pilha.pop();
    historicoSpawns.pop();
    estadoAtual = "qf2";
    bossDerrotado = true;

    atualizarHUD(
      estadoAtual,
      pilha,
      "Vazio, Espada ; golpe final -> Boss derrotado! (R: Fase 2 | 1: Fase 1)"
    );

    await mostrarBalao(
      bossObj,
      "NÃÃÃO! Fui derrotado pelo Autômato de Pilha!",
      LARGURA_MAPA,
      2.2
    );
    k.destroy(bossObj);
  });
});

k.onLoad(() => {
  k.go("fase1");
});