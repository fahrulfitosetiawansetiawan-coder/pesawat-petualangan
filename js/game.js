/**
 * Main Airplane Canvas Game: "MISI PESAWAT TEMPUR: TEMBAK JAWABAN BENAR!"
 * Game edukasi matematika dengan pesawat tempur supersonik,
 * gerbang jawaban matematika, proyektil roket supersonik, dan pemandangan perbukitan.
 */

class AirplaneGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.isPaused = false;
    this.animId = null;

    // Game states
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.progress = 0;
    this.goalPerLevel = 5;
    this.selectedGateIdx = 1; // 0: A, 1: B, 2: C

    // Pesawat Tempur (Fighter Jet) - Ukuran Lebih Besar & Gagah
    this.plane = {
      x: 135,
      y: 200,
      targetY: 200,
      width: 175,
      height: 66,
      speed: 4,
      tilt: 0,
      propellerAngle: 0
    };

    // Preload Sprite Pesawat Tempur HD
    this.jetImg = new Image();
    this.jetImg.src = 'assets/images/fighter_jet.png';
    this.jetImgLoaded = false;
    this.jetImg.onload = () => { this.jetImgLoaded = true; };

    // Preload Background Peta Misi Terbang Bersih (Tanpa Kotak ABC Statis)
    this.bgMissionImg = new Image();
    this.bgMissionImg.src = 'assets/images/peta_misi_terbang_clean.png';
    this.bgMissionImgLoaded = false;
    this.bgMissionImg.onload = () => { this.bgMissionImgLoaded = true; };
    this.bgScrollOffset = 0;
    this.bgScrollSpeed = 1.45; // Kecepatan scroll bergerak melintasi alam ke arah kanan
    this.flightTime = 0;

    // Offset Parallax Lanskap
    this.terrainOffsetFar = 0;
    this.terrainOffsetMid = 0;
    this.terrainOffsetNear = 0;

    // Timers & Screen Shake
    this.invulnerableTimer = 0;
    this.screenShake = 0;

    // Parallax background clouds
    this.clouds = [];

    // Question & Gates
    this.currentQuestion = null;
    this.gates = [];
    this.gateSpeed = 1.8;
    this.checkpointX = 180; // Titik pemeriksaan pesawat harus melewati gerbang terbuka
    this.projectiles = [];
    this.particles = [];

    this.isGameOver = false;
    this.isLevelWin = false;
    this.lastTime = performance.now();
  }

  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindInputs();
    this.initBackgroundElements();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width || 800;
    this.canvas.height = rect.height || 450;
  }

  initBackgroundElements() {
    this.clouds = [
      { x: 90, y: 35, scale: 0.85, speed: 0.4 },
      { x: 310, y: 65, scale: 1.15, speed: 0.6 },
      { x: 570, y: 40, scale: 0.75, speed: 0.35 },
      { x: 820, y: 60, scale: 0.95, speed: 0.55 }
    ];
  }

  bindInputs() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning || this.isPaused || this.isGameOver) return;

      if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        this.selectGate(0);
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        this.selectGate(1);
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        this.selectGate(2);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.shoot();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.plane.targetY = Math.max(65, this.plane.targetY - 55);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.plane.targetY = Math.min(this.canvas.height - 65, this.plane.targetY + 55);
      }
    });

    // Touch & Mouse click directly on gates or canvas
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', (e) => {
        if (!this.isRunning || this.isPaused || this.isGameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Cek jika menyentuh salah satu gerbang
        let clickedGate = false;
        this.gates.forEach((gate, idx) => {
          if (
            clientX >= gate.x - 45 && clientX <= gate.x + 45 &&
            clientY >= gate.y - 45 && clientY <= gate.y + 45
          ) {
            this.selectGate(idx);
            this.shoot();
            clickedGate = true;
          }
        });

        if (!clickedGate) {
          // Gerakkan pesawat mengikuti klik/sentuhan
          this.plane.targetY = Math.max(65, Math.min(this.canvas.height - 65, clientY));
        }
      });
    }

    const shootBtn = document.getElementById('btnGameShoot');
    const pauseBtn = document.getElementById('btnGamePause');
    const battleBgmBtn = document.getElementById('btnBattleBgmToggle');
    const gateBtns = document.querySelectorAll('.gate-select-btn');

    if (shootBtn) {
      shootBtn.addEventListener('click', () => {
        this.shoot();
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }

    if (battleBgmBtn) {
      battleBgmBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        const isEnabled = window.soundApp.toggleWarBgm();
        window.appState.showToast(isEnabled ? "Backsound perang udara diaktifkan! ⚔️" : "Backsound perang dimatikan 🔇", "🎵");
      });
    }

    gateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        this.selectGate(idx);
      });
    });

    // Modal buttons (Coba lagi & Kembali belajar)
    const retryBtn = document.getElementById('btnGameOverRetry');
    const backBtn = document.getElementById('btnGameOverBack');
    const nextLevelBtn = document.getElementById('btnLevelWinNext');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hideModals();
        this.start();
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hideModals();
        window.appState.navigateTo('screen-material');
      });
    }
    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', () => {
        this.hideModals();
        window.appState.unlockNextLevel();
        this.level = window.appState.currentLevel;
        this.start();
      });
    }

    const nextMission5Btn = document.getElementById('btnNextMission5');
    if (nextMission5Btn) {
      nextMission5Btn.addEventListener('click', () => {
        this.hideModals();
      });
    }
  }

  selectGate(idx) {
    if (idx < 0 || idx > 2) return;
    this.selectedGateIdx = idx;
    window.soundApp.playClick();

    // Sesuaikan posisi terbang pesawat tempur ke arah gerbang yang dipilih
    if (this.gates[idx]) {
      this.plane.targetY = this.gates[idx].y;
    }

    // Perbarui sorotan tombol UI
    document.querySelectorAll('.gate-select-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelWin = false;
    this.lives = 3;
    this.progress = 0;
    this.invulnerableTimer = 0;
    this.screenShake = 0;
    this.level = window.appState.currentLevel;
    this.gateSpeed = 1.6 + this.level * 0.35;
    this.projectiles = [];
    this.particles = [];

    this.resizeCanvas();
    this.hideModals();
    this.spawnNewQuestion();

    window.soundApp.initContext();
    window.soundApp.playGameStart();
    window.soundApp.startEngine();
    window.soundApp.startWarBgm();

    this.updateHUD();
    this.lastTime = performance.now();
    if (this.animId) cancelAnimationFrame(this.animId);
    this.loop();
  }

  stop() {
    this.isRunning = false;
    window.soundApp.stopEngine();
    window.soundApp.stopWarBgm();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  togglePause() {
    if (!this.isRunning || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('btnGamePause');
    const modal = document.getElementById('gamePauseModal');

    if (this.isPaused) {
      window.soundApp.stopEngine();
      window.soundApp.pauseWarBgm();
      if (pauseBtn) pauseBtn.innerHTML = '▶️ Lanjut';
      if (modal) modal.classList.add('active');
    } else {
      window.soundApp.startEngine();
      window.soundApp.resumeWarBgm();
      if (pauseBtn) pauseBtn.innerHTML = '⏸️ Jeda';
      if (modal) modal.classList.remove('active');
      this.lastTime = performance.now();
      this.loop();
    }
  }

  hideModals() {
    document.querySelectorAll('.game-overlay-modal').forEach(m => m.classList.remove('active'));
  }

  spawnNewQuestion() {
    let q = {};
    if (this.level === 1) {
      // Level 1: Tanpa Menyimpan (Pemanasan)
      const u1 = 1 + Math.floor(Math.random() * 4); // 1-4
      const u2 = 1 + Math.floor(Math.random() * 5); // 1-5 (u1+u2 <= 9)
      const t1 = 2 + Math.floor(Math.random() * 4);
      const t2 = 1 + Math.floor(Math.random() * 3);
      const n1 = t1 * 10 + u1;
      const n2 = t2 * 10 + u2;
      const correct = n1 + n2;
      q = {
        n1, n2,
        correct,
        isCarry: false,
        text: `${n1} + ${n2} = ?`,
        explain: `${u1} + ${u2} = ${u1 + u2} satuan. ${t1} + ${t2} = ${t1 + t2} puluhan. Jadi hasilnya ${correct}!`
      };
    } else if (this.level === 2) {
      // Level 2: Pilot Pemula (Menyimpan ringan)
      const pairs = [
        { n1: 27, n2: 18, res: 45 },
        { n1: 36, n2: 25, res: 61 },
        { n1: 45, n2: 19, res: 64 },
        { n1: 28, n2: 17, res: 45 },
        { n1: 39, n2: 24, res: 63 }
      ];
      const picked = pairs[Math.floor(Math.random() * pairs.length)];
      q = {
        n1: picked.n1,
        n2: picked.n2,
        correct: picked.res,
        isCarry: true,
        text: `${picked.n1} + ${picked.n2} = ?`,
        explain: `Satuan dijumlahkan dan menyimpan 1 puluhan. Jadi hasilnya ${picked.res}!`
      };
    } else if (this.level === 3) {
      // Level 3: Pilot Hebat (57 + 25 dan variasi dua angka besar menyimpan)
      const pairs = [
        { n1: 57, n2: 25, res: 82 },
        { n1: 48, n2: 36, res: 84 },
        { n1: 67, n2: 28, res: 95 },
        { n1: 59, n2: 26, res: 85 },
        { n1: 46, n2: 37, res: 83 }
      ];
      const picked = pairs[Math.floor(Math.random() * pairs.length)];
      q = {
        n1: picked.n1,
        n2: picked.n2,
        correct: picked.res,
        isCarry: true,
        text: `${picked.n1} + ${picked.n2} = ?`,
        explain: `7 + 5 = 12 (simpan 1, tulis 2). 5 + 2 + 1 = 8 puluhan. Jadi ${picked.res}!`
      };
    } else {
      // Level 4: Kapten Angka (Soal Cerita Udara)
      const stories = [
        { text: "Rani punya 36 stiker + dapat 25 lagi. Berapa stikernya?", n1: 36, n2: 25, res: 61 },
        { text: "Di perpustakaan ada 28 buku + 17 buku baru. Jumlahnya?", n1: 28, n2: 17, res: 45 },
        { text: "Kebun sekolah ada 47 bunga + 16 bunga mekar. Total?", n1: 47, n2: 16, res: 63 },
        { text: "Kotak ada 29 pensil + 24 pensil lagi. Seluruhnya?", n1: 29, n2: 24, res: 53 },
        { text: "Pilot mengangkut 57 koper + 25 koper tambahan. Total?", n1: 57, n2: 25, res: 82 }
      ];
      const picked = stories[Math.floor(Math.random() * stories.length)];
      q = {
        n1: picked.n1,
        n2: picked.n2,
        correct: picked.res,
        isCarry: true,
        text: picked.text,
        explain: `Soal cerita penjumlahan: ${picked.n1} + ${picked.n2} = ${picked.res}!`
      };
    }

    this.currentQuestion = q;

    // Perbarui banner soal di atas canvas
    const qPrompt = document.getElementById('gamePromptText');
    const qMath = document.getElementById('gameMathText');
    if (qPrompt) qPrompt.textContent = this.level === 4 ? "Misi Tempur Soal Cerita:" : "Hitung hasil penjumlahan misi ini:";
    if (qMath) qMath.textContent = q.text;

    // Generate 3 gerbang jawaban (1 benar, 2 pengecoh yang masuk akal dan acak posisinya)
    const wrong1 = q.correct - 10;
    const wrong2 = q.correct + 10;
    const options = [
      { val: q.correct, isCorrect: true },
      { val: wrong1, isCorrect: false },
      { val: wrong2, isCorrect: false }
    ];

    // Acak urutan jawaban secara adil (Fisher-Yates)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Bangun 3 gerbang pada jarak canvas
    const startX = this.canvas.width + 100;
    const labels = ['A', 'B', 'C'];
    const colors = ['#ef4444', '#10b981', '#f59e0b']; // Merah, Hijau, Kuning/Oranye

    const spacingY = (this.canvas.height - 160) / 2;
    this.gates = options.map((opt, idx) => ({
      x: startX,
      y: 75 + idx * spacingY,
      label: labels[idx],
      val: opt.val,
      isCorrect: opt.isCorrect,
      color: colors[idx],
      isOpen: false,
      isHit: false,
      alpha: 1
    }));

    // Otomatis arahkan pesawat ke gerbang tengah di awal
    this.selectGate(1);
  }

  shoot() {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    window.soundApp.playShoot();

    // Spawn roket supersonik dari moncong pesawat tempur
    const targetGate = this.gates[this.selectedGateIdx];
    const spawnX = this.plane.x + 76;
    const spawnY = this.plane.y + 8;

    this.projectiles.push({
      x: spawnX,
      y: spawnY,
      targetX: targetGate ? targetGate.x : this.canvas.width + 100,
      targetY: targetGate ? targetGate.y : spawnY,
      speed: 16,
      targetIdx: this.selectedGateIdx,
      radius: 11,
      rotation: 0
    });

    // Kilau api peluncuran roket (Muzzle blast)
    this.createMuzzleBlast(spawnX, spawnY);
  }

  createMuzzleBlast(x, y) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: 3 + Math.random() * 4,
        vy: (Math.random() - 0.5) * 3,
        color: i % 2 === 0 ? '#f97316' : '#facc15',
        size: 3 + Math.random() * 3,
        alpha: 0.9
      });
    }
  }

  loop(timestamp = performance.now()) {
    if (!this.isRunning || this.isPaused) return;

    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(delta);
    this.render();

    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  update(delta) {
    if (this.isGameOver || this.isLevelWin) return;

    // Normalisasi Delta Time (Terkunci stabil pada basis 60 FPS, bebas micro-stutter)
    const dt = Math.min(Math.max(delta || 0.016, 0.001), 0.05);
    const frameScale = dt * 60;
    this.flightTime += dt;

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake *= Math.pow(0.88, frameScale);
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // Countdown invulnerability
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // 1. Fisika Pesawat Tempur (Ultra-smooth frame-rate independent easing ke targetY)
    const smoothFactor = 1 - Math.pow(0.86, frameScale);
    this.plane.y += (this.plane.targetY - this.plane.y) * smoothFactor;
    this.plane.tilt = (this.plane.targetY - this.plane.y) * 0.04;
    this.plane.propellerAngle += 0.4 * frameScale;

    // 2. Scroll Background Peta Misi Terbang (Gerak Jelajah ke Arah Kanan Mulus Konsisten)
    this.bgScrollOffset += this.bgScrollSpeed * frameScale;
    this.terrainOffsetFar = (this.terrainOffsetFar + 0.45 * frameScale) % 2400;
    this.terrainOffsetMid = (this.terrainOffsetMid + 1.1 * frameScale) % 2400;
    this.terrainOffsetNear = (this.terrainOffsetNear + 2.0 * frameScale) % 2400;

    // Parallax Awan Mulus
    this.clouds.forEach(c => {
      c.x -= c.speed * frameScale;
      if (c.x < -160) c.x = this.canvas.width + 120;
    });

    // 3. Gerakan Gerbang Jawaban dari Kanan ke Kiri (Delta-timed)
    let isAnyGateActive = false;
    this.gates.forEach(gate => {
      gate.x -= this.gateSpeed * frameScale;
      if (gate.x > -100) isAnyGateActive = true;

      // Peringatan jika mendekati checkpoint
      if (Math.abs(gate.x - this.checkpointX) < 5 && !gate.isOpen) {
        window.soundApp.playWarning();
      }

      // Deteksi jika gerbang melewati checkpoint tanpa ditembak benar
      if (gate.x <= this.checkpointX && !gate.hasPassedCheckpoint) {
        gate.hasPassedCheckpoint = true;
        if (!gate.isOpen && gate.isCorrect) {
          this.handleFailedGate("Pesawat melewati gerbang tanpa menembak jawaban benar!");
        }
      }
    });

    // 4. Update Proyektil Roket Pesawat Tempur
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.rotation += 0.2 * frameScale;

      // Jejak asap roket
      if (Math.random() > 0.4) {
        this.particles.push({
          x: p.x - 12,
          y: p.y,
          vx: -1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: 'rgba(255, 255, 255, 0.7)',
          size: 3 + Math.random() * 2,
          alpha: 0.7
        });
      }

      // Bergerak ke arah gerbang yang ditargetkan
      const target = this.gates[p.targetIdx];
      if (target) {
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 28) {
          this.handleGateHit(target);
          this.projectiles.splice(i, 1);
          continue;
        }

        p.x += (dx / dist) * p.speed * frameScale;
        p.y += (dy / dist) * p.speed * frameScale;
      } else {
        p.x += p.speed * frameScale;
      }

      if (p.x > this.canvas.width + 60) {
        this.projectiles.splice(i, 1);
      }
    }

    // 5. Update Partikel Ledakan
    for (let j = this.particles.length - 1; j >= 0; j--) {
      const pt = this.particles[j];
      pt.x += pt.vx * frameScale;
      pt.y += pt.vy * frameScale;
      pt.alpha -= 0.03 * frameScale;
      if (pt.alpha <= 0) {
        this.particles.splice(j, 1);
      }
    }

    // Jika seluruh gerbang sudah lewat di sebelah kiri
    if (this.gates.length > 0 && this.gates[0].x < -60) {
      if (!this.isGameOver && !this.isLevelWin) {
        this.spawnNewQuestion();
      }
    }
  }

  handleGateHit(gate) {
    if (gate.isHit) return;
    gate.isHit = true;

    // Spawn efek ledakan visual & audio proyektil
    this.createExplosion(gate.x, gate.y, gate.isCorrect ? '#22c55e' : '#ef4444');
    window.soundApp.playExplosion(gate.isCorrect);

    if (gate.isCorrect) {
      // JAWABAN BENAR!
      gate.isOpen = true;
      window.soundApp.playCorrect();
      window.soundApp.playGatePass();

      this.score += 100;
      window.appState.addScore(100);
      this.progress++;
      window.appState.showToast("Hebat! Gerbang terbuka lebar!", "✨");

      this.updateHUD();

      // Cek apakah level selesai
      if (this.progress >= this.goalPerLevel) {
        this.triggerLevelWin();
      }
    } else {
      // JAWABAN SALAH!
      window.soundApp.playWrong();
      this.lives--;
      this.screenShake = 8;
      window.appState.recordWrongAnswer();
      window.appState.showToast(`Jawaban ${gate.val} kurang tepat! Hati-hati!`, "⚠️");
      this.updateHUD();

      if (this.lives <= 0) {
        this.triggerGameOver("Pesawat kehabisan kesempatan karena menembak gerbang yang salah.");
      }
    }
  }

  handleFailedGate(reason) {
    this.lives--;
    window.soundApp.playWrong();
    window.appState.recordWrongAnswer();
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver(reason);
    } else {
      window.appState.showToast("Gerbang terlewat! Kurang satu kesempatan!", "⚠️");
    }
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 / 16) * i;
      const speed = 2 + Math.random() * 4.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4 + Math.random() * 5,
        alpha: 1
      });
    }
  }

  triggerGameOver(reason) {
    this.isGameOver = true;
    window.soundApp.stopEngine();
    window.soundApp.stopWarBgm();
    window.soundApp.playGameOver();

    // Tampilkan modal review jawaban
    const modal = document.getElementById('gameOverModal');
    const reasonEl = document.getElementById('gameOverReason');
    const mathRev = document.getElementById('gameOverMathReview');

    if (reasonEl) reasonEl.textContent = reason;
    if (mathRev && this.currentQuestion) {
      mathRev.innerHTML = `
        <p><strong>Soal:</strong> ${this.currentQuestion.text}</p>
        <p><strong>Jawaban Benar:</strong> <span style="color:#16a34a;font-size:1.3rem;">${this.currentQuestion.correct}</span></p>
        <p style="color:#475569;font-size:0.95rem;margin-top:6px;"><strong>Penjelasan:</strong> ${this.currentQuestion.explain}</p>
      `;
    }
    if (modal) modal.classList.add('active');
  }

  triggerLevelWin() {
    this.isLevelWin = true;
    window.soundApp.stopEngine();
    window.soundApp.stopWarBgm();
    window.soundApp.playLevelWin();

    // Selesaikan Misi 5 & buka Misi 6 (Halaman Penghargaan)
    window.appState.completeMission(5);

    const modal = document.getElementById('gameLevelWinModal');
    const titleEl = document.getElementById('levelWinTitle');
    if (titleEl) titleEl.textContent = `Selamat! Misi Udara Level ${this.level} Sukses! 🛩️`;
    if (modal) modal.classList.add('active');
  }

  updateHUD() {
    const scoreEl = document.getElementById('gameScoreDisplay');
    const starsEl = document.getElementById('gameStarsDisplay');
    const levelEl = document.getElementById('gameLevelDisplay');
    const progEl = document.getElementById('gameProgressBar');
    const livesEl = document.getElementById('gameLivesDisplay');

    if (scoreEl) scoreEl.textContent = this.score;
    if (starsEl) starsEl.textContent = window.appState.stars;
    if (levelEl) levelEl.textContent = `Level ${this.level}`;
    if (progEl) {
      const pct = Math.min(100, (this.progress / this.goalPerLevel) * 100);
      progEl.style.width = `${pct}%`;
    }
    if (livesEl) {
      livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.save();

    // Efek guncangan layar jika ada getaran
    if (this.screenShake > 0.2) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
    }

    // 1. Gambar Background Peta Misi Terbang HD dari Folder (Seamless Horizontal Scroll)
    this.drawFlightMissionBackground(w, h);

    // 2. Gambar Awan Parallax di Langit
    this.clouds.forEach(c => {
      this.drawCloud(c.x, c.y, c.scale);
    });

    // 3. Gambar Garis Checkpoint / Batas Aman
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.setLineDash([8, 8]);
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.checkpointX, 0);
    this.ctx.lineTo(this.checkpointX, h);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 4. Gambar Gerbang Jawaban A, B, C
    this.gates.forEach((gate, idx) => {
      this.drawGate(gate, idx === this.selectedGateIdx);
    });

    // 5. Gambar Roket / Proyektil Pesawat Tempur
    this.projectiles.forEach(p => {
      this.drawMissileProjectile(p.x, p.y, p.radius, p.rotation);
    });

    // 6. Gambar Pesawat Tempur (Fighter Jet)
    this.drawPlaneSprite(this.plane.x, this.plane.y, this.plane.tilt);

    // 7. Gambar Partikel Ledakan
    this.particles.forEach(pt => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, pt.alpha);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    this.ctx.restore();
  }

  drawMountainBackground(w, h) {
    // A. Langit cerah gradasi keemasan horizon
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.35, '#38bdf8');
    skyGrad.addColorStop(0.7, '#bae6fd');
    skyGrad.addColorStop(1, '#fef08a');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, h);

    // B. Matahari lembut berpendar di kejauhan
    const sunGrad = this.ctx.createRadialGradient(w - 110, 70, 6, w - 110, 70, 60);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.4)');
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(w - 110, 70, 60, 0, Math.PI * 2);
    this.ctx.fill();

    // C. LAYER 1: Pegunungan Biru Berkabut Jauh (Far Mountains, slow parallax)
    this.ctx.fillStyle = '#818cf8';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let x = 0; x <= w + 30; x += 20) {
      const worldX = x + this.terrainOffsetFar;
      const y = 200 + Math.sin(worldX * 0.005) * 45 + Math.cos(worldX * 0.012) * 22;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Puncak Salju / Kabut Putih pada gunung jauh
    this.ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let x = 0; x <= w + 30; x += 20) {
      const worldX = x + this.terrainOffsetFar;
      const y = 200 + Math.sin(worldX * 0.005) * 45 + Math.cos(worldX * 0.012) * 22;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // D. LAYER 2: Perbukitan Hijau Pinus Sedang (Mid Hills, medium parallax)
    this.ctx.fillStyle = '#15803d';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let x = 0; x <= w + 30; x += 15) {
      const worldX = x + this.terrainOffsetMid;
      const y = 285 + Math.sin(worldX * 0.008) * 35 + Math.cos(worldX * 0.02) * 16;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Pohon Cemara / Pinus pada bukit sedang
    this.ctx.fillStyle = '#166534';
    for (let px = 10; px <= w; px += 65) {
      const worldX = px + this.terrainOffsetMid;
      const py = 285 + Math.sin(worldX * 0.008) * 35 + Math.cos(worldX * 0.02) * 16;
      // Pohon segitiga cemara
      this.ctx.beginPath();
      this.ctx.moveTo(px, py - 18);
      this.ctx.lineTo(px - 7, py);
      this.ctx.lineTo(px + 7, py);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // E. LAYER 3: Lembah Rumput Hijau Dekat (Near Foreground Slopes, fast parallax)
    this.ctx.fillStyle = '#22c55e';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let x = 0; x <= w + 30; x += 15) {
      const worldX = x + this.terrainOffsetNear;
      const y = 370 + Math.sin(worldX * 0.011) * 25 + Math.cos(worldX * 0.028) * 12;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Garis sorot rumput hijau terang di tepi
    this.ctx.strokeStyle = '#4ade80';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    for (let x = 0; x <= w + 30; x += 15) {
      const worldX = x + this.terrainOffsetNear;
      const y = 370 + Math.sin(worldX * 0.011) * 25 + Math.cos(worldX * 0.028) * 12;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    // Bunga-bunga liar kecil di lembah
    for (let fx = 25; fx <= w; fx += 55) {
      const worldX = fx + this.terrainOffsetNear;
      const fy = 375 + Math.sin(worldX * 0.011) * 25 + Math.cos(worldX * 0.028) * 12;
      this.ctx.fillStyle = (fx % 110 === 0) ? '#fde047' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(fx, fy + 8, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawCloud(x, y, scale = 1) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
    this.ctx.arc(x + 22 * scale, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
    this.ctx.arc(x + 48 * scale, y, 20 * scale, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawFlightMissionBackground(w, h) {
    if (this.bgMissionImgLoaded && this.bgMissionImg.height > 0) {
      // 1. PETA PANJANG DIAM DI TEMPAT DENGAN GERAKAN NAFAS & AYUNAN LEMBUT ATMOSFERIK
      // Peta membentang penuh (panjang) di seluruh layar tanpa perulangan/loop conveyor belt
      const baseScale = Math.max(w / this.bgMissionImg.width, h / this.bgMissionImg.height);

      // Sedikit pembesaran lembut (4.5% - 5.8%) memberi ruang ayunan atmosferik tanpa memperlihatkan tepi kosong
      const breathZoom = 1.045 + Math.sin(this.flightTime * 0.45) * 0.012;
      const scale = baseScale * breathZoom;
      const imgW = this.bgMissionImg.width * scale;
      const imgH = this.bgMissionImg.height * scale;

      // Ayunan halus melayang di tempat (Tetap diam di tempat, mengayun lembut seperti sensasi di kokpit)
      const swayX = Math.sin(this.flightTime * 0.75) * 14; // Ayunan horizontal halus ±14px di tempat
      const swayY = Math.cos(this.flightTime * 0.55) * 7;  // Ayunan vertikal halus ±7px di tempat

      const drawX = Math.round((w - imgW) / 2 + swayX);
      const drawY = Math.round((h - imgH) / 2 + swayY);

      // Gambar peta panorama utuh yang membentang panjang dan memukau
      this.ctx.drawImage(this.bgMissionImg, drawX, drawY, imgW, imgH);

      // 2. KILAU CAHAYA MATAHARI BERPENDAR DI ATAS TELUK & CANDI (Sunlight Pulse in Place)
      const sunPulse = 0.22 + Math.sin(this.flightTime * 1.6) * 0.08;
      const sunX = w * 0.88 + swayX * 0.35;
      const sunY = h * 0.12 + swayY * 0.35;
      const sunGlow = this.ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
      sunGlow.addColorStop(0, `rgba(254, 240, 138, ${sunPulse * 1.5})`);
      sunGlow.addColorStop(0.4, `rgba(253, 224, 71, ${sunPulse * 0.7})`);
      sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
      this.ctx.fillStyle = sunGlow;
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
      this.ctx.fill();

      // 3. EFEK KILAU OMBAK AIR LAUT & SUNGAI BERGERAK DI TEMPAT (Shimmering Water Ripples)
      this.drawWaterShimmer(w, h, swayX, swayY);

      // 4. EFEK GARIS KECEPATAN UDARA SUPERSONIK (Speed streaks meluncur dari kanan ke kiri)
      this.drawSupersonicWindStreaks(w, h);
    } else {
      // Fallback pemandangan gradasi jika aset sedang dimuat
      this.drawMountainBackground(w, h);
    }
  }

  drawWaterShimmer(w, h, swayX, swayY) {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    this.ctx.lineWidth = 1.8;

    // Riak-riak air berkilau di daerah teluk laut dan sungai (bagian bawah)
    const time = this.flightTime;
    for (let i = 0; i < 5; i++) {
      const rx = (w * 0.46) + ((i * 72 + time * 18) % (w * 0.44)) + swayX;
      const ry = (h * 0.72) + (i * 20) + Math.sin(time * 2.2 + i) * 3 + swayY;
      const rlen = 20 + (i % 3) * 12;

      this.ctx.beginPath();
      this.ctx.moveTo(rx, ry);
      this.ctx.quadraticCurveTo(rx + rlen * 0.5, ry - 2, rx + rlen, ry);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawSupersonicWindStreaks(w, h) {
    this.ctx.save();
    this.ctx.lineWidth = 1.6;
    const cycleW = w + 260;

    for (let i = 0; i < 7; i++) {
      const streakY = (h * 0.12) + ((i * 73 + (this.flightTime * 28)) % (h * 0.74));
      // Garis kecepatan udara melesat dari kanan ke kiri membuktikan laju tempur supersonik
      const rawX = (i * 190 - Math.floor(this.bgScrollOffset * 3.0)) % cycleW;
      const actualX = (rawX < 0 ? rawX + cycleW : rawX) - 90;
      const streakLen = 48 + (i % 3) * 32;

      // Gradasi ekor angin yang halus
      const streakGrad = this.ctx.createLinearGradient(actualX, 0, actualX + streakLen, 0);
      streakGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      streakGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.52)');
      streakGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      this.ctx.strokeStyle = streakGrad;

      this.ctx.beginPath();
      this.ctx.moveTo(actualX, streakY);
      this.ctx.lineTo(actualX + streakLen, streakY);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawGate(gate, isSelected) {
    this.ctx.save();
    this.ctx.translate(gate.x, gate.y);

    const gateW = 90;
    const gateH = 82;

    // Sorotan Reticle Bidik jika gerbang sedang dipilih
    if (isSelected) {
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 55, 0, Math.PI * 2);
      this.ctx.stroke();

      // Garis bidik (reticle pesawat tempur)
      this.ctx.strokeStyle = '#eab308';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(-58, 0); this.ctx.lineTo(-44, 0);
      this.ctx.moveTo(44, 0); this.ctx.lineTo(58, 0);
      this.ctx.moveTo(0, -58); this.ctx.lineTo(0, -44);
      this.ctx.moveTo(0, 44); this.ctx.lineTo(0, 58);
      this.ctx.stroke();
    }

    // 1. Sayap Emas Khas Peta Misi Terbang di Sisi Kiri & Kanan
    this.ctx.fillStyle = '#facc15';
    this.ctx.strokeStyle = '#d97706';
    this.ctx.lineWidth = 2.5;

    // Sayap Kiri
    this.ctx.beginPath();
    this.ctx.moveTo(-gateW / 2 + 6, -10);
    this.ctx.quadraticCurveTo(-gateW / 2 - 22, -22, -gateW / 2 - 26, -6);
    this.ctx.quadraticCurveTo(-gateW / 2 - 18, 6, -gateW / 2 + 6, 8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Sayap Kanan
    this.ctx.beginPath();
    this.ctx.moveTo(gateW / 2 - 6, -10);
    this.ctx.quadraticCurveTo(gateW / 2 + 22, -22, gateW / 2 + 26, -6);
    this.ctx.quadraticCurveTo(gateW / 2 + 18, 6, gateW / 2 - 6, 8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // 2. Tarmac Runway Mini & Terminal di Bagian Bawah Gerbang
    this.ctx.fillStyle = '#334155'; // Aspal abu-abu gelap
    this.ctx.strokeStyle = '#0284c7';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(-gateW / 2 + 8, gateH / 2 - 4, gateW - 16, 14, 4);
    this.ctx.fill();
    this.ctx.stroke();

    // Garis putih putus-putus marka landasan pacu
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(-gateW / 2 + 14, gateH / 2 + 3);
    this.ctx.lineTo(gateW / 2 - 14, gateH / 2 + 3);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 3. Bingkai Utama Gerbang Jawaban (Rounded White Card dengan Border Tebal)
    this.ctx.fillStyle = gate.isOpen ? '#dcfce7' : '#ffffff';
    this.ctx.strokeStyle = gate.isOpen ? '#22c55e' : gate.color;
    this.ctx.lineWidth = 5;
    this.ctx.beginPath();
    this.ctx.roundRect(-gateW / 2, -gateH / 2, gateW, gateH, 18);
    this.ctx.fill();
    this.ctx.stroke();

    // 4. Badge Huruf (A, B, atau C) dengan lengkungan atas
    this.ctx.fillStyle = gate.color;
    this.ctx.beginPath();
    this.ctx.roundRect(-18, -gateH / 2 - 14, 36, 22, [8, 8, 4, 4]);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px "Fredoka", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(gate.label, 0, -gateH / 2 - 3);

    // 5. Angka Jawaban di Tengah Gerbang
    this.ctx.font = 'bold 29px "Outfit", sans-serif';
    this.ctx.fillStyle = gate.isOpen ? '#15803d' : '#0f172a';
    this.ctx.fillText(gate.val, 0, 4);

    if (gate.isOpen) {
      // Efek bintang terbuka
      this.ctx.fillStyle = '#eab308';
      this.ctx.font = 'bold 13px "Fredoka", sans-serif';
      this.ctx.fillText("✨ TERBUKA ✨", 0, 26);
    }

    this.ctx.restore();
  }

  drawPlaneSprite(x, y, tilt) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(tilt);

    // Efek Berkedip saat Kebal/Invulnerable
    if (this.invulnerableTimer > 0) {
      const blink = Math.sin(this.flightTime * 25) > 0;
      this.ctx.globalAlpha = blink ? 0.45 : 1.0;
    }

    // 1. ANIMASI SEMBURAN API AFTERBURNER PESAWAT TEMPUR (Rear Thrusters at x: -78)
    const pulse = Math.sin(Date.now() * 0.035) * 8;
    const flameLen = 46 + pulse;

    // Semburan api luar oranye kemerahan menyala
    const gradFlame = this.ctx.createLinearGradient(-78, 0, -78 - flameLen, 0);
    gradFlame.addColorStop(0, '#f97316');
    gradFlame.addColorStop(0.5, '#facc15');
    gradFlame.addColorStop(1, 'rgba(239, 68, 68, 0)');
    this.ctx.fillStyle = gradFlame;
    this.ctx.beginPath();
    this.ctx.moveTo(-78, -10);
    this.ctx.lineTo(-78 - flameLen, 0);
    this.ctx.lineTo(-78, 10);
    this.ctx.closePath();
    this.ctx.fill();

    // Inti semburan supersonik biru cyan neon menyala
    const gradCore = this.ctx.createLinearGradient(-78, 0, -78 - (flameLen * 0.68), 0);
    gradCore.addColorStop(0, '#ffffff');
    gradCore.addColorStop(0.4, '#00f0ff');
    gradCore.addColorStop(0.8, '#0284c7');
    gradCore.addColorStop(1, 'rgba(56, 189, 248, 0)');
    this.ctx.fillStyle = gradCore;
    this.ctx.beginPath();
    this.ctx.moveTo(-78, -5);
    this.ctx.lineTo(-78 - (flameLen * 0.68), 0);
    this.ctx.lineTo(-78, 5);
    this.ctx.closePath();
    this.ctx.fill();

    // Jejak asap/uap tipis di ujung sayap (Wingtip contrails)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(-65, -20);
    this.ctx.lineTo(-110 - Math.random() * 20, -20 + (Math.random() - 0.5) * 3);
    this.ctx.moveTo(-40, 27);
    this.ctx.lineTo(-95 - Math.random() * 20, 27 + (Math.random() - 0.5) * 3);
    this.ctx.stroke();

    // 2. AURA NEON LATAR BELAKANG TEBAL & BERSINAR (Thick Neon Energy Backplate)
    this.ctx.save();
    const auraGrad = this.ctx.createRadialGradient(0, 0, 15, 0, 0, 115);
    auraGrad.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
    auraGrad.addColorStop(0.35, 'rgba(14, 165, 233, 0.65)');
    auraGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.35)');
    auraGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    this.ctx.fillStyle = auraGrad;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 118, 54, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // 3. PERISAI ENERGI AERODINAMIS NEON TEBAL (Mach Shockwave Aura)
    // Membuat kontur badan pesawat sangat kontras, tegas, dan tebal di atas pemandangan
    const shieldPulse = Math.sin(this.flightTime * 5.5) * 0.18 + 0.82;
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.85 * shieldPulse})`;
    this.ctx.lineWidth = 4.5;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 24;
    this.ctx.beginPath();
    this.ctx.ellipse(2, 0, 100, 44, 0, -Math.PI * 0.65, Math.PI * 0.65);
    this.ctx.stroke();

    // Garis inti perisai putih terang tebal
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.95 * shieldPulse})`;
    this.ctx.lineWidth = 2.2;
    this.ctx.beginPath();
    this.ctx.ellipse(4, 0, 96, 40, 0, -Math.PI * 0.55, Math.PI * 0.55);
    this.ctx.stroke();
    this.ctx.restore();

    // 4. GAMBAR SPRITE PESAWAT TEMPUR HD DENGAN LAPISAN NEON EKSTRA TEBAL & INTENS
    if (this.jetImgLoaded) {
      this.ctx.save();
      // Multi-pass Dilation: Gambar kontur siluet neon tebal ke 8 penjuru tepi badan pesawat
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 32;
      const dilationOffsets = [
        [-3.5, 0], [3.5, 0], [0, -3.5], [0, 3.5],
        [-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]
      ];
      for (const [ox, oy] of dilationOffsets) {
        this.ctx.drawImage(this.jetImg, -87.5 + ox, -33 + oy, 175, 66);
      }

      // Lapisan glow inti neon putih-cyan super tebal
      this.ctx.shadowColor = '#a5f3fc';
      this.ctx.shadowBlur = 16;
      this.ctx.drawImage(this.jetImg, -87.5, -33, 175, 66);
      this.ctx.drawImage(this.jetImg, -87.5, -33, 175, 66);
      this.ctx.restore();

      // Gambar sprite asli di atas lapisan glow agar detail kokpit, pilot, & misil tetap sangat tajam
      this.ctx.drawImage(this.jetImg, -87.5, -33, 175, 66);
    } else {
      // Fallback bentuk pesawat tempur vektor
      this.drawFallbackJet();
    }

    // 5. KILAU PLASMA NEON MONCONG PESAWAT TEMPUR TEBAL (Supersonic Plasma Tip)
    const noseX = 87.5;
    const noseY = 0;
    this.ctx.save();
    const plasmaGrad = this.ctx.createRadialGradient(noseX, noseY, 2, noseX, noseY, 22);
    plasmaGrad.addColorStop(0, '#ffffff');
    plasmaGrad.addColorStop(0.3, '#00f0ff');
    plasmaGrad.addColorStop(0.65, 'rgba(0, 229, 255, 0.7)');
    plasmaGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    this.ctx.fillStyle = plasmaGrad;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.arc(noseX, noseY, 22, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // 6. LAMPU STROBOSKOP NEON TEBAL PADA SAYAP & EKOR
    this.ctx.save();
    const isStrobe = Math.sin(this.flightTime * 14) > 0.1;
    const strobeAlpha = isStrobe ? 1 : 0.35;

    // Beacon Ekor Atas (Cyan Neon Menyala Tebal)
    this.ctx.fillStyle = `rgba(0, 255, 255, ${strobeAlpha})`;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.shadowBlur = 18;
    this.ctx.beginPath();
    this.ctx.arc(-54, -28, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Beacon Ujung Sayap Bawah (Emerald / Neon Green Menyala Tebal)
    this.ctx.fillStyle = `rgba(52, 211, 153, ${strobeAlpha})`;
    this.ctx.shadowColor = '#10b981';
    this.ctx.shadowBlur = 18;
    this.ctx.beginPath();
    this.ctx.arc(-22, 29, 4.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.restore();
  }

  drawFallbackJet() {
    this.ctx.save();
    this.ctx.scale(1.45, 1.45);
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 16;
    // Badan pesawat tempur siluet biru gelap dengan garis tepi neon
    this.ctx.fillStyle = '#0284c7';
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(55, 0); // moncong
    this.ctx.lineTo(20, -10);
    this.ctx.lineTo(-30, -12);
    this.ctx.lineTo(-52, -22); // ekor atas
    this.ctx.lineTo(-42, 0);
    this.ctx.lineTo(-52, 12); // sayap bawah
    this.ctx.lineTo(-20, 18);
    this.ctx.lineTo(25, 6);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Kanopi kokpit kaca neon
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.ellipse(15, -6, 16, 7, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawMissileProjectile(x, y, radius, rotation) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Tubuh roket tempur supersonik
    // Ekor api pendorong kecil
    this.ctx.fillStyle = '#f97316';
    this.ctx.beginPath();
    this.ctx.moveTo(-10, -3);
    this.ctx.lineTo(-18, 0);
    this.ctx.lineTo(-10, 3);
    this.ctx.closePath();
    this.ctx.fill();

    // Badan silinder roket
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.strokeStyle = '#0284c7';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.roundRect(-10, -4, 18, 8, 3);
    this.ctx.fill();
    this.ctx.stroke();

    // Moncong merah tajam
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.moveTo(8, -4);
    this.ctx.lineTo(16, 0);
    this.ctx.lineTo(8, 4);
    this.ctx.closePath();
    this.ctx.fill();

    // Sirip sayap roket
    this.ctx.fillStyle = '#0284c7';
    this.ctx.beginPath();
    this.ctx.moveTo(-6, -4);
    this.ctx.lineTo(-11, -8);
    this.ctx.lineTo(-8, -4);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(-6, 4);
    this.ctx.lineTo(-11, 8);
    this.ctx.lineTo(-8, 4);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }
}

window.gameEngine = new AirplaneGame();
