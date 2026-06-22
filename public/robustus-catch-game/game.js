const CONFIG = {
  durationSeconds: 30,
  normalScore: 5,
  specialScore: 10,
  maxScore: 250,
  canvasWidth: 720,
  canvasHeight: 1280,
  productUrls: [
    { src: "package-cao-filhote.png", species: "dog", line: "special" },
    { src: "package-cao-mini.png", species: "dog", line: "special" },
    { src: "package-cao-adulto.png", species: "dog", line: "special" },
    { src: "package-gato-castrado.png", species: "cat", line: "special" },
    { src: "package-gato-adulto.png", species: "cat", line: "normal" }
  ],
  // Mascotes oficiais RobustUS. Native facing = LEFT (cabeca para a esquerda).
  dogPoses: {
    idle: "robuscao-idle.webp",
    walkA: "robuscao-walk-a.webp",
    walkB: "robuscao-walk-b.webp"
  },
  catPoses: {
    idle: "robuscat-idle.webp",
    walkA: "robuscat-walk-a.webp",
    walkB: "robuscat-walk-b.webp"
  },
  // Sprites nativos olham para a ESQUERDA. Inverter quando direcao = +1.
  nativeFacing: -1,
  logoUrl: "robustus-logo.png"
};

class ProductAsset {
  constructor(src, name, species = "dog", line = "normal") {
    this.name = name;
    this.species = species;
    this.line = line;
    this.image = new Image();
    this.image.decoding = "async";
    this.image.src = src;
  }

  get ready() {
    return this.image.complete && this.image.naturalWidth > 0;
  }
}

class FallingProduct {
  constructor(game) {
    this.game = game;
    this.asset = game.pickProduct();
    this.isPenalty = this.asset.species !== game.selectedSpecies;
    this.special = this.asset.line === "special";
    this.baseValue = this.special ? CONFIG.specialScore : CONFIG.normalScore;
    this.width = this.special ? 112 : 92;
    this.height = this.special ? 180 : 148;
    this.x = 34 + Math.random() * (game.width - this.width - 68);
    this.y = -this.height - 300 - Math.random() * 200;
    this.speed = (this.special ? 5.9 : 4.9) + game.speedBoost + Math.random() * 1.45;
    this.rotation = (Math.random() - 0.5) * 0.18;
    this.trailLength = game.lowPowerMode ? 0 : this.special ? 196 : 158;
    this.value = this.isPenalty ? -this.baseValue : this.baseValue;
  }

  update(delta) {
    this.y += this.speed * delta;
    this.rotation += (this.special ? 0.004 : 0.002) * delta;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);

    if (!this.game.lowPowerMode) {
      const trail = ctx.createLinearGradient(0, -this.height / 2 - this.trailLength, 0, -this.height * 0.18);
      trail.addColorStop(0, "rgba(255,255,255,0)");
      trail.addColorStop(
        0.45,
        this.isPenalty ? "rgba(239, 68, 68, 0.45)" : this.special ? "rgba(255, 229, 164, 0.62)" : "rgba(255,255,255,0.42)"
      );
      trail.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = trail;
      roundedRect(ctx, -this.width * 0.13, -this.height / 2 - this.trailLength, this.width * 0.26, this.trailLength, this.width * 0.13);
      ctx.fill();
    }

    if (this.asset.ready) {
      ctx.shadowColor = this.isPenalty
        ? "rgba(239, 68, 68, 0.42)"
        : this.special
          ? "rgba(255, 144, 18, 0.46)"
          : "rgba(0, 49, 120, 0.28)";
      ctx.shadowBlur = this.game.lowPowerMode ? 0 : this.special ? 18 : 12;
      ctx.shadowOffsetY = this.game.lowPowerMode ? 0 : 9;
      drawContainedImage(ctx, this.asset.image, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    } else {
      ctx.fillStyle = "#004fb6";
      ctx.font = "900 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("ROBUSTUS", 0, -4);
      ctx.fillStyle = "#ff9012";
      ctx.fillRect(-22, 8, 44, 8);
    }

    ctx.fillStyle = this.isPenalty ? "#ef4444" : this.special ? "#ff9012" : "#004fb6";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.font = "900 18px Arial";
    ctx.textAlign = "center";
    const label = this.value > 0 ? `+${this.value}` : String(this.value);
    ctx.strokeText(label, 0, this.height / 2 + 18);
    ctx.fillText(label, 0, this.height / 2 + 18);
    ctx.restore();
  }

  get bounds() {
    return {
      x: this.x + this.width * 0.15,
      y: this.y + this.height * 0.2,
      width: this.width * 0.7,
      height: this.height * 0.65
    };
  }
}

class RobustUSCatchGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = CONFIG.canvasWidth;
    this.height = CONFIG.canvasHeight;

    this.products = CONFIG.productUrls.map((product, index) => {
      const item = typeof product === "string" ? { src: product, species: "dog", line: "normal" } : product;
      return new ProductAsset(item.src, `Produto ${index + 1}`, item.species, item.line);
    });
    this.dogPoses = {
      idle: new ProductAsset(CONFIG.dogPoses.idle, "RobusCao idle"),
      walkA: new ProductAsset(CONFIG.dogPoses.walkA, "RobusCao walk A"),
      walkB: new ProductAsset(CONFIG.dogPoses.walkB, "RobusCao walk B")
    };
    this.catPoses = {
      idle: new ProductAsset(CONFIG.catPoses.idle, "RobusCat idle"),
      walkA: new ProductAsset(CONFIG.catPoses.walkA, "RobusCat walk A"),
      walkB: new ProductAsset(CONFIG.catPoses.walkB, "RobusCat walk B")
    };
    this.logo = new ProductAsset(CONFIG.logoUrl, "Logo RobustUS");
    this.selectedSpecies = "dog";
    this.lowPowerMode =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0 ||
      (navigator.hardwareConcurrency || 8) <= 4;
    window.__robustusLowPower = this.lowPowerMode;
    this.state = "start";
    this.keys = new Set();
    this.leftHeld = false;
    this.rightHeld = false;
    this.pointerActive = false;
    this.targetX = null;
    this.facing = CONFIG.nativeFacing; // -1 = esquerda (nativo), +1 = direita
    this.animTime = 0;
    this.bounce = 0;
    this.spawnClock = 0;
    this.lastTime = 0;
    this.fx = [];
    this.productsFalling = [];
    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundReady = false;
    this.syncCanvasToViewport();
    this.resetGame();
    this.bindEvents();
    this.bindMessageEvents();
    this.drawStaticPreview();
  }

  bindMessageEvents() {
    window.addEventListener("message", (event) => {
      if (event.data.type === "ROBUSTUS_CATCH_RESTART") {
        this.resetGame();
        this.showStart();
      } else if (event.data.type === "ROBUSTUS_CATCH_MUTE") {
        this.isMuted = event.data.muted;
      }
    });
  }

  playSound(type) {
    if (this.isMuted) return;
    window.parent.postMessage({ type: "ROBUSTUS_CATCH_PLAY_SOUND", soundType: type }, "*");
  }

  syncCanvasToViewport() {
    const viewportWidth = Math.max(1, window.innerWidth || CONFIG.canvasWidth);
    const viewportHeight = Math.max(1, window.innerHeight || CONFIG.canvasHeight);
    const aspect = viewportWidth / viewportHeight;
    const nextHeight = CONFIG.canvasHeight;
    const nextWidth = Math.max(640, Math.round(nextHeight * aspect));

    if (this.backgroundReady && this.width === nextWidth && this.height === nextHeight && this.canvas.width === nextWidth) {
      return false;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.backgroundCanvas.width = this.width;
    this.backgroundCanvas.height = this.height;
    drawCartoonParkBackground(this.backgroundCanvas.getContext("2d"), this.width, this.height);
    this.backgroundReady = true;
    return true;
  }

  resetGame() {
    this.score = 0;
    this.elapsed = 0;
    this.remaining = CONFIG.durationSeconds;
    this.speedBoost = 0;
    this.productsFalling = [];
    this.fx = [];
    const catMode = this.selectedSpecies === "cat";
    this.player = {
      x: this.width / 2,
      y: this.height - (catMode ? 520 : 480),
      spriteWidth: catMode ? 280 : 320,
      spriteHeight: catMode ? 280 : 320,
      basketWidth: catMode ? 210 : 220,
      basketHeight: catMode ? 64 : 64,
      // Offset onde a cesta sai do corpo do mascote (em relacao a player.y)
      basketOffsetY: catMode ? 200 : 215,
      speed: catMode ? 8.1 : 8.4
    };
    this.targetX = this.player.x;
    this.facing = CONFIG.nativeFacing;
    this.animTime = 0;
    this.bounce = 0;
  }

  bindEvents() {
    document.getElementById("start-button").addEventListener("click", () => {
      this.playSound('flip');
      this.start();
    });
    document.getElementById("restart-button").addEventListener("click", () => {
      this.playSound('flip');
      window.parent.postMessage({ type: "ROBUSTUS_CATCH_NAVIGATE_HOME" }, "*");
    });
    document.getElementById("choose-dog-button").addEventListener("click", () => {
      this.playSound('flip');
      this.setSelectedPet("dog");
    });
    document.getElementById("choose-cat-button").addEventListener("click", () => {
      this.playSound('flip');
      this.setSelectedPet("cat");
    });

    window.addEventListener("keydown", (event) => this.keys.add(event.key));
    window.addEventListener("keyup", (event) => this.keys.delete(event.key));

    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerActive = true;
      this.updateTargetFromPointer(event);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (this.pointerActive) this.updateTargetFromPointer(event);
    });
    const releasePointer = () => {
      this.pointerActive = false;
      // Travar target onde esta para parar o movimento imediatamente.
      this.targetX = this.player.x;
    };
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    this.canvas.addEventListener("pointerleave", () => {
      if (this.pointerActive) {
        this.pointerActive = false;
        this.targetX = this.player.x;
      }
    });

    window.addEventListener("resize", () => {
      if (this.state === "playing") return;
      if (this.syncCanvasToViewport()) {
        this.resetGame();
        this.drawStaticPreview();
      }
    });
  }

  setSelectedPet(species) {
    this.selectedSpecies = species;
    document.querySelectorAll(".pet-option").forEach((button) => {
      button.classList.toggle("selected", button.dataset.pet === species);
    });
    document.getElementById("start-button").textContent = species === "cat" ? "Comecar com RobusCat" : "Comecar com RobusCão";
    window.parent.postMessage({ type: "ROBUSTUS_CATCH_PET_SELECTED", pet: species === "cat" ? "gato" : "cachorro" }, "*");
    this.drawStaticPreview();
  }

  pickProduct() {
    const catProducts = this.products.filter((product) => product.species === "cat");
    const dogProducts = this.products.filter((product) => product.species !== "cat");
    const pool = Math.random() < 0.56 && catProducts.length > 0 ? catProducts : dogProducts;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  start() {
    this.syncCanvasToViewport();
    this.resetGame();
    this.state = "playing";
    window.parent.postMessage({ type: "ROBUSTUS_CATCH_STATE_CHANGE", state: "playing" }, "*");
    showScreen("game-screen");
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  showStart() {
    this.state = "start";
    window.parent.postMessage({ type: "ROBUSTUS_CATCH_STATE_CHANGE", state: "start" }, "*");
    this.syncCanvasToViewport();
    showScreen("start-screen");
    this.drawStaticPreview();
  }

  updateTargetFromPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const ratioX = this.canvas.width / rect.width;
    const pointerX = (event.clientX - rect.left) * ratioX;
    this.targetX = clamp(pointerX, this.player.basketWidth / 2, this.width - this.player.basketWidth / 2);
  }

  loop(time) {
    if (this.state !== "playing") return;

    const delta = Math.min((time - this.lastTime) / 16.67, 2);
    this.lastTime = time;

    this.update(delta);
    
    // Envia atualização para o componente React pai
    if (this.state === "playing") {
      window.parent.postMessage({
        type: "ROBUSTUS_CATCH_UPDATE",
        score: this.score,
        remaining: this.remaining
      }, "*");
    }

    this.draw();

    if (this.remaining <= 0) {
      this.finish("finished");
      return;
    }

    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(delta) {
    this.elapsed += delta / 60;
    this.remaining = Math.max(0, CONFIG.durationSeconds - this.elapsed);
    this.speedBoost = Math.min(4.3, this.elapsed / 8.5);

    const movingLeftKey = this.keys.has("ArrowLeft") || this.keys.has("a") || this.keys.has("A") || this.leftHeld;
    const movingRightKey = this.keys.has("ArrowRight") || this.keys.has("d") || this.keys.has("D") || this.rightHeld;

    if (movingLeftKey) this.targetX = (this.targetX ?? this.player.x) - this.player.speed * delta;
    if (movingRightKey) this.targetX = (this.targetX ?? this.player.x) + this.player.speed * delta;
    if (this.targetX != null) {
      this.targetX = clamp(this.targetX, this.player.basketWidth / 2, this.width - this.player.basketWidth / 2);
    }

    // Suavizacao do movimento - segue o dedo sem atraso visivel mas sem trepidacao
    const target = this.targetX ?? this.player.x;
    const dx = target - this.player.x;
    const follow = Math.min(1, 0.32 * delta);
    this.player.x += dx * follow;
    if (Math.abs(dx) < 0.4) this.player.x = target;
    this.player.x = clamp(this.player.x, this.player.basketWidth / 2, this.width - this.player.basketWidth / 2);

    // Direcao e animacao de andar
    const speedNow = Math.abs(dx);
    const isMoving = (this.pointerActive || movingLeftKey || movingRightKey) && speedNow > 0.6;
    if (dx > 0.4) this.facing = 1;
    else if (dx < -0.4) this.facing = -1;
    if (isMoving) {
      this.animTime += delta;
      // Pequeno balanco vertical (passos)
      this.bounce = Math.sin(this.animTime * 0.55) * 8;
    } else {
      this.animTime = 0;
      this.bounce = 0;
    }
    this.isMoving = isMoving;

    this.spawnClock -= delta;
    if (this.spawnClock <= 0) {
      this.productsFalling.push(new FallingProduct(this));
      this.spawnClock = this.lowPowerMode
        ? Math.max(26, 58 - this.elapsed * 0.28)
        : Math.max(18, 50 - this.elapsed * 0.35);
    }

    const basket = this.basketBounds();
    this.productsFalling = this.productsFalling.filter((product) => {
      product.update(delta);
      if (intersects(basket, product.bounds)) {
        this.score = clamp(this.score + product.value, 0, CONFIG.maxScore);
        if (product.value > 0) {
          this.playSound('match');
        } else {
          this.playSound('error');
        }
        this.fx.push({
          text: product.value > 0 ? `+${product.value}` : String(product.value),
          x: product.x + product.width / 2,
          y: product.y,
          life: this.lowPowerMode ? 28 : 42,
          color: product.isPenalty ? "#ef4444" : product.special ? "#ff9012" : "#ffffff"
        });
        return false;
      }
      return product.y < this.height + product.height;
    });

    this.fx = this.fx.filter((effect) => {
      effect.y -= 1.3 * delta;
      effect.life -= delta;
      return effect.life > 0;
    });
  }

  finish(result) {
    this.state = "finished";
    window.parent.postMessage({
      type: "ROBUSTUS_CATCH_STATE_CHANGE",
      state: "finished",
      score: this.score,
      pet: this.selectedSpecies === "cat" ? "gato" : "cachorro"
    }, "*");
    const elapsedSeconds = Math.round(this.elapsed);

    window.parent?.postMessage(
      {
        type: "ROBUSTUS_CATCH_FINISHED",
        result,
        score: this.score,
        pet: this.selectedSpecies === "cat" ? "gato" : "cachorro",
        elapsedSeconds
      },
      "*"
    );

    document.getElementById("result-title").textContent = "Fim de jogo!";
    document.getElementById("result-message").textContent =
      "Veja seus pontos e jogue novamente quando quiser.";
    document.getElementById("final-score").textContent = String(this.score);
    document.getElementById("result-badge").style.background = "#ff9012";
    showScreen("result-screen");
  }

  basketBounds() {
    // Cesta centrada em (player.x, player.y + basketOffsetY). Reduzimos um pouco
    // a largura para a colisao parecer alinhada com a boca da cesta.
    const bw = this.player.basketWidth;
    const bh = this.player.basketHeight;
    return {
      x: this.player.x - bw / 2 + 18,
      y: this.player.y + this.player.basketOffsetY - bh / 2,
      width: bw - 36,
      height: bh
    };
  }

  drawStaticPreview() {
    this.drawEnvironment();
    this.drawMascot();
    this.drawBasketLayer();
    this.drawHud();
  }

  draw() {
    this.drawEnvironment();
    this.drawMascot();
    this.productsFalling.forEach((product) => product.draw(this.ctx));
    this.drawBasketLayer();
    this.drawEffects();
    this.drawHud();
  }

  drawEnvironment() {
    const ctx = this.ctx;
    ctx.drawImage(this.backgroundCanvas, 0, 0);
  }

  getPoses() {
    return this.selectedSpecies === "cat" ? this.catPoses : this.dogPoses;
  }

  drawMascot() {
    const ctx = this.ctx;
    const x = this.player.x;
    const y = this.player.y - (this.bounce || 0);
    const sw = this.player.spriteWidth;
    const sh = this.player.spriteHeight;

    // Sombra no chao - segue o personagem mas nao sobe com o bounce
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.22)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    const shadowScale = 1 - Math.min(0.25, (this.bounce || 0) * 0.02);
    ctx.ellipse(this.player.x, this.player.y + sh - 18, sw * 0.34 * shadowScale, 18 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const poses = this.getPoses();
    let img;
    if (this.isMoving) {
      // Alterna walkA / walkB a cada ~180ms (~10 frames)
      const frame = Math.floor(this.animTime / 10) % 2;
      img = frame === 0 ? poses.walkA.image : poses.walkB.image;
      if (!(img && img.complete && img.naturalWidth > 0)) img = poses.idle.image;
    } else {
      img = poses.idle.image;
    }

    if (!(img && img.complete && img.naturalWidth > 0)) return;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.24)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 10;
    // Sprites nativos olham para a ESQUERDA (CONFIG.nativeFacing = -1).
    // Quando facing = +1 (direita), invertemos horizontalmente.
    const flip = this.facing !== CONFIG.nativeFacing ? -1 : 1;
    ctx.translate(x, y);
    ctx.scale(flip, 1);
    drawContainedImage(ctx, img, -sw / 2, 0, sw, sh);
    ctx.restore();
  }

  drawBasketLayer() {
    // Cesta como camada separada SEMPRE na frente das racoes.
    const ctx = this.ctx;
    const x = this.player.x;
    const y = this.player.y - (this.bounce || 0);
    const basketCenterY = y + this.player.basketOffsetY;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 8;
    drawBasket(ctx, x, basketCenterY, this.player.basketWidth, this.player.basketHeight);
    ctx.restore();
  }

  drawEffects() {
    const ctx = this.ctx;
    this.fx.forEach((effect) => {
      ctx.save();
      ctx.globalAlpha = Math.min(1, effect.life / 18);
      ctx.fillStyle = effect.color;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 5;
      ctx.font = "900 34px Arial";
      ctx.textAlign = "center";
      ctx.strokeText(effect.text, effect.x, effect.y);
      ctx.fillText(effect.text, effect.x, effect.y);
      ctx.restore();
    });
  }

  drawHud() {
    // HUD agora é renderizado pelo React pai para ser idêntico ao jogo da memória
    return;
  }
}

function showScreen(id) {
  ["start-screen", "game-screen", "result-screen"].forEach((screenId) => {
    document.getElementById(screenId).classList.toggle("hidden", screenId !== id);
  });
  
  // Sincronizar estado com o pai ao trocar de tela internamente
  const gameState = id === 'game-screen' ? 'playing' : (id === 'result-screen' ? 'finished' : 'start');
  window.parent.postMessage({ type: "ROBUSTUS_CATCH_STATE_CHANGE", state: gameState }, "*");

  document.querySelector(".totem-shell")?.classList.toggle("game-active", id === "game-screen");
  document.body.classList.toggle("game-active", id === "game-screen");
}

function bindHoldButton(button, setter) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setter(true);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
    button.addEventListener(type, () => setter(false));
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawContainedImage(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawPaw(ctx, x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y + size * 0.2, size * 0.42, 0, Math.PI * 2);
  ctx.arc(x - size * 0.45, y - size * 0.35, size * 0.22, 0, Math.PI * 2);
  ctx.arc(x, y - size * 0.5, size * 0.24, 0, Math.PI * 2);
  ctx.arc(x + size * 0.45, y - size * 0.35, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawBlob(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, -0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawCartoonParkBackground(ctx, width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#0798ee");
  sky.addColorStop(0.44, "#31c7ff");
  sky.addColorStop(0.72, "#a4ecff");
  sky.addColorStop(1, "#79d869");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawCloud(ctx, 78, 260, 88, 0.78);
  drawCloud(ctx, width - 76, 230, 118, 0.78);
  drawCloud(ctx, 442, 640, 82, 0.55);
  drawCloud(ctx, 214, 720, 92, 0.5);

  ctx.fillStyle = "rgba(28, 123, 154, 0.18)";
  ctx.beginPath();
  ctx.moveTo(0, height - 410);
  ctx.quadraticCurveTo(150, height - 520, 310, height - 395);
  ctx.quadraticCurveTo(445, height - 505, width, height - 370);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  drawTree(ctx, 46, height - 334, 1.02, "left");
  drawTree(ctx, width - 34, height - 342, 1.04, "right");
  drawFence(ctx, 0, height - 320, width);

  const ground = ctx.createLinearGradient(0, height - 300, 0, height);
  ground.addColorStop(0, "#a7ef39");
  ground.addColorStop(0.58, "#61c947");
  ground.addColorStop(1, "#22964b");
  ctx.fillStyle = ground;
  ctx.fillRect(0, height - 288, width, 288);

  ctx.fillStyle = "rgba(53, 159, 54, 0.35)";
  ctx.beginPath();
  ctx.ellipse(width * 0.26, height - 70, width * 0.44, 68, -0.08, 0, Math.PI * 2);
  ctx.ellipse(width * 0.78, height - 92, width * 0.34, 56, 0.08, 0, Math.PI * 2);
  ctx.fill();

  drawGrassAndFlowers(ctx, width, height);
}

function drawCloud(ctx, x, y, size, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(x, y, size * 0.08, x, y, size);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "rgba(255,255,255,0.24)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x - size * 0.5, y + size * 0.12, size * 0.44, size * 0.22, 0, 0, Math.PI * 2);
  ctx.ellipse(x - size * 0.14, y - size * 0.06, size * 0.5, size * 0.32, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.32, y + size * 0.04, size * 0.58, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTree(ctx, x, y, scale, side) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const trunkShift = side === "left" ? -12 : 12;
  const trunk = ctx.createLinearGradient(trunkShift - 18, -160, trunkShift + 18, 90);
  trunk.addColorStop(0, "#9b652d");
  trunk.addColorStop(1, "#6d401c");
  ctx.fillStyle = trunk;
  roundedRect(ctx, trunkShift - 34, -180, 68, 288, 26);
  ctx.fill();

  const leafColors = ["#b8f244", "#8ee232", "#58c945", "#3fb23e"];
  const leaves = side === "left"
    ? [[-82, -205, 98], [-18, -268, 116], [62, -216, 104], [-112, -120, 96], [20, -116, 132]]
    : [[82, -205, 98], [18, -268, 116], [-62, -216, 104], [112, -120, 96], [-20, -116, 132]];

  leaves.forEach((leaf, index) => {
    ctx.fillStyle = leafColors[index % leafColors.length];
    ctx.beginPath();
    ctx.ellipse(leaf[0], leaf[1], leaf[2], leaf[2] * 0.74, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawFence(ctx, x, y, width) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 248, 214, 0.94)";
  ctx.strokeStyle = "rgba(119, 96, 44, 0.18)";
  ctx.lineWidth = 3;

  for (let postX = x - 20; postX < width + 45; postX += 44) {
    ctx.beginPath();
    ctx.moveTo(postX, y + 92);
    ctx.lineTo(postX, y + 24);
    ctx.lineTo(postX + 16, y);
    ctx.lineTo(postX + 32, y + 24);
    ctx.lineTo(postX + 32, y + 92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  roundedRect(ctx, x - 12, y + 42, width + 24, 20, 10);
  ctx.fill();
  roundedRect(ctx, x - 12, y + 78, width + 24, 18, 9);
  ctx.fill();
  ctx.restore();
}

function drawGrassAndFlowers(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(37, 137, 54, 0.44)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 56; i += 1) {
    const x = (i * 61) % width;
    const y = height - 38 - ((i * 29) % 150);
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.quadraticCurveTo(x + 8, y + 6, x + 18, y);
    ctx.stroke();
  }

  const flowerSpots = [
    [64, height - 48],
    [132, height - 120],
    [526, height - 54],
    [620, height - 130],
    [42, height - 180]
  ];
  flowerSpots.forEach(([flowerX, flowerY], index) => drawFlower(ctx, flowerX, flowerY, index % 2 ? 9 : 12));
  ctx.restore();
}

function drawFlower(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = "#fff7d0";
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * size, y + Math.sin(angle) * size, size * 0.52, size * 0.28, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffb11a";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawScoreBadge(ctx, x, y, score) {
  ctx.save();
  const scale = ctx.canvas.width < 700 ? 0.8 : 1;
  ctx.scale(scale, scale);
  x = x / scale;
  y = y / scale;
  ctx.shadowColor = "rgba(67, 34, 8, 0.35)";
  ctx.shadowOffsetY = 7;

  const wood = ctx.createLinearGradient(x, y, x, y + 106);
  wood.addColorStop(0, "#b86b22");
  wood.addColorStop(0.48, "#8f4a14");
  wood.addColorStop(1, "#5f300c");
  ctx.fillStyle = wood;
  roundedRect(ctx, x, y, 178, 112, 24);
  ctx.fill();

  ctx.strokeStyle = "#f5a529";
  ctx.lineWidth = 8;
  roundedRect(ctx, x + 4, y + 4, 170, 104, 20);
  ctx.stroke();

  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ffd58d";
  ctx.lineWidth = 2;
  for (let lineY = y + 22; lineY < y + 104; lineY += 22) {
    ctx.beginPath();
    ctx.moveTo(x + 18, lineY);
    ctx.quadraticCurveTo(x + 80, lineY - 8, x + 158, lineY + 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe79c";
  ctx.strokeStyle = "#5c2d06";
  ctx.lineWidth = 5;
  ctx.font = "900 28px Arial";
  ctx.strokeText("PONTOS", x + 89, y + 42);
  ctx.fillText("PONTOS", x + 89, y + 42);

  ctx.font = "900 50px Arial";
  ctx.strokeText(String(score), x + 89, y + 92);
  ctx.fillText(String(score), x + 89, y + 92);
  ctx.restore();
}

function drawTimerBadge(ctx, x, y, seconds) {
  ctx.save();
  const scale = ctx.canvas.width < 700 ? 0.8 : 1;
  ctx.scale(scale, scale);
  x = x / scale;
  y = y / scale;
  ctx.shadowColor = "rgba(0, 32, 80, 0.3)";
  ctx.shadowOffsetY = 7;

  const panel = ctx.createLinearGradient(x + 56, y, x + 228, y + 82);
  panel.addColorStop(0, "#6b879c");
  panel.addColorStop(1, "#314e66");
  ctx.fillStyle = panel;
  roundedRect(ctx, x + 60, y + 14, 172, 76, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 4;
  roundedRect(ctx, x + 60, y + 14, 172, 76, 28);
  ctx.stroke();

  ctx.fillStyle = "#ff6d00";
  ctx.beginPath();
  ctx.arc(x + 66, y + 51, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + 66, y + 51, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#395064";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 66, y + 51, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#ff6d00";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 66, y + 51);
  ctx.lineTo(x + 66, y + 29);
  ctx.stroke();
  ctx.strokeStyle = "#395064";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 66, y + 51);
  ctx.lineTo(x + 78, y + 52);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.24)";
  ctx.lineWidth = 6;
  ctx.font = "900 54px Arial";
  ctx.textAlign = "center";
  ctx.strokeText(String(seconds), x + 148, y + 72);
  ctx.fillText(String(seconds), x + 148, y + 72);
  ctx.restore();
}

function drawRobustusLogo(ctx, image, centerX, y) {
  const scale = ctx.canvas.width < 700 ? 0.8 : 1;
  const width = 190 * scale;
  const height = 54 * scale;
  const x = centerX - width / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 32, 80, 0.24)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  roundedRect(ctx, x, y, width, height, 22);
  ctx.fill();

  ctx.strokeStyle = "#ff9012";
  ctx.lineWidth = 4;
  roundedRect(ctx, x + 2, y + 2, width - 4, height - 4, 20);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (image?.complete && image.naturalWidth > 0) {
    drawContainedImage(ctx, image, x + 14, y + 8, width - 28, height - 16);
  } else {
    ctx.fillStyle = "#007daf";
    ctx.font = "italic 900 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ROBUSTUS", centerX, y + 41);
  }
  ctx.restore();
}

function drawForestBackground(ctx, image, canvasWidth, canvasHeight) {
  const sourceHeight = image.naturalHeight;
  const sourceWidth = sourceHeight * (canvasWidth / canvasHeight);
  const sourceX = image.naturalWidth - sourceWidth - 40;
  const sourceY = 0;

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);

  const shade = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  shade.addColorStop(0, "rgba(0, 60, 130, 0.1)");
  shade.addColorStop(0.45, "rgba(0, 79, 182, 0.12)");
  shade.addColorStop(1, "rgba(0, 41, 96, 0.24)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function drawPhotoCard(ctx, asset, x, y, width, height, label) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundedRect(ctx, x, y, width, height, 20);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  roundedRect(ctx, x + 12, y + 12, width - 24, height - 24, 14);
  ctx.fill();

  if (asset?.ready) {
    drawContainedImage(ctx, asset.image, x + 20, y + 22, width - 40, height - 56);
  } else {
    ctx.fillStyle = "#dcecff";
    roundedRect(ctx, x + 24, y + 26, width - 48, height - 70, 10);
    ctx.fill();
    ctx.fillStyle = "#004fb6";
    ctx.font = "italic 900 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ROBUSTUS", x + width / 2, y + height / 2);
  }

  ctx.fillStyle = "#004fb6";
  ctx.font = "900 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(label, x + width / 2, y + height - 20);

  ctx.strokeStyle = "rgba(255,255,255,0.48)";
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, height, 20);
  ctx.stroke();
  ctx.restore();
}

function drawBasket(ctx, x, y, width, height) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "#7b4b19";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(0, 4, width * 0.32, Math.PI, Math.PI * 2);
  ctx.stroke();

  const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
  gradient.addColorStop(0, "#ffba47");
  gradient.addColorStop(1, "#c66b12");
  ctx.fillStyle = gradient;
  roundedRect(ctx, -width / 2, -height / 2, width, height, 26);
  ctx.fill();

  ctx.strokeStyle = "rgba(123,75,25,0.7)";
  ctx.lineWidth = 4;
  for (let i = -width / 2 + 24; i < width / 2; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, -height / 2 + 8);
    ctx.lineTo(i + 38, height / 2 - 8);
    ctx.stroke();
  }
  for (let i = width / 2 - 24; i > -width / 2; i -= 28) {
    ctx.beginPath();
    ctx.moveTo(i, -height / 2 + 8);
    ctx.lineTo(i - 38, height / 2 - 8);
    ctx.stroke();
  }

  ctx.strokeStyle = "#6b3f14";
  ctx.lineWidth = 7;
  roundedRect(ctx, -width / 2, -height / 2, width, height, 26);
  ctx.stroke();
  ctx.restore();
}

function drawDog(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "#f8fbff";
  ctx.beginPath();
  ctx.ellipse(0, 112, size * 0.44, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101418";
  ctx.beginPath();
  ctx.ellipse(-54, 90, size * 0.14, size * 0.36, -0.2, 0, Math.PI * 2);
  ctx.ellipse(54, 90, size * 0.14, size * 0.36, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, 46, size * 0.46, size * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#171717";
  ctx.beginPath();
  ctx.ellipse(-50, 28, size * 0.16, size * 0.32, -0.55, 0, Math.PI * 2);
  ctx.ellipse(50, 28, size * 0.16, size * 0.32, 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(-24, 28, size * 0.12, size * 0.25, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(0, 60, size * 0.25, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0f2550";
  ctx.beginPath();
  ctx.arc(-18, 38, 7, 0, Math.PI * 2);
  ctx.arc(22, 38, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(2, 58, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(2, 64, 20, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.fillStyle = "#ff9012";
  roundedRect(ctx, -40, 92, 80, 14, 7);
  ctx.fill();
  ctx.restore();
}

function drawRobustusDog(ctx, image, x, y, width, height) {
  ctx.save();

  const sx = image.naturalWidth * 0.0;
  const sy = image.naturalHeight * 0.31;
  const sw = image.naturalWidth * 0.34;
  const sh = image.naturalHeight * 0.69;
  const dx = x - width / 2;
  const dy = y;

  ctx.shadowColor = "rgba(0,0,0,0.24)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, width, height);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#ff9012";
  roundedRect(ctx, x - 52, y + height * 0.76, 104, 16, 8);
  ctx.fill();

  ctx.restore();
}

function drawPixelDog(ctx, image, x, y, width, height) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const sx = image.naturalWidth * 0.27;
  const sy = image.naturalHeight * 0.56;
  const sw = image.naturalWidth * 0.36;
  const sh = image.naturalHeight * 0.34;
  const dx = x - width / 2;
  const dy = y;

  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, width, height);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.imageSmoothingEnabled = true;
  ctx.restore();
}

function drawBasketDogPhoto(ctx, image, x, y, width, height) {
  ctx.save();

  const dx = x - width / 2;
  const dy = y;

  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 12;
  drawContainedImage(ctx, image, dx, dy, width, height);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.restore();
}

function drawDogPaws(ctx, x, y, basketWidth) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#ffffff";
  [-basketWidth * 0.24, basketWidth * 0.24].forEach((pawX) => {
    ctx.beginPath();
    ctx.ellipse(pawX, 0, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f2550";
    ctx.beginPath();
    ctx.arc(pawX - 8, -2, 3, 0, Math.PI * 2);
    ctx.arc(pawX, -5, 3, 0, Math.PI * 2);
    ctx.arc(pawX + 8, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
  });
  ctx.fill();
  ctx.restore();
}

function bootCatchGame() {
  window.__robustusGame = new RobustUSCatchGame();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootCatchGame, { once: true });
} else {
  bootCatchGame();
}
