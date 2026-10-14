/**
 * Results & Learning Reflection Module (Halaman Hasil Belajar)
 * Menampilkan ringkasan capaian, statistik, bintang, lencana penguasaan,
 * dan evaluasi berdasarkan Taksonomi SOLO / Tujuan Pembelajaran.
 */

class ResultsPage {
  constructor() {}

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const editNameBtn = document.getElementById('btnEditPlayerName');
    const resetBtn = document.getElementById('btnResetProgress');

    if (editNameBtn) {
      editNameBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        const newName = prompt("Masukkan nama pilot barumu:", window.appState.playerName);
        if (newName && newName.trim().length > 0) {
          window.appState.playerName = newName.trim();
          window.appState.saveState();
          this.render();
          window.appState.showToast(`Nama diperbarui: ${newName}!`, "🎖️");
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        if (confirm("Apakah kamu yakin ingin mengulang petualangan dari awal? Semua skor akan direset.")) {
          window.appState.resetAllProgress();
          this.render();
          window.appState.showToast("Progres direset. Ayo mulai petualangan baru!", "🔄");
        }
      });
    }
  }

  render() {
    const s = window.appState;
    const nameEl = document.getElementById('resPlayerName');
    const totalEl = document.getElementById('resTotalQuestions');
    const correctEl = document.getElementById('resCorrectCount');
    const wrongEl = document.getElementById('resWrongCount');
    const accuracyEl = document.getElementById('resAccuracyPercent');
    const scoreEl = document.getElementById('resGameScore');
    const levelEl = document.getElementById('resMaxLevel');
    const starsEl = document.getElementById('resStarsCount');
    const feedbackTitleEl = document.getElementById('resFeedbackTitle');
    const feedbackMsgEl = document.getElementById('resFeedbackMessage');

    if (nameEl) nameEl.textContent = s.playerName;
    if (totalEl) totalEl.textContent = s.totalSolved;
    if (correctEl) correctEl.textContent = s.totalCorrect;
    if (wrongEl) wrongEl.textContent = s.totalWrong;

    const acc = s.totalSolved > 0 ? Math.round((s.totalCorrect / s.totalSolved) * 100) : 100;
    if (accuracyEl) accuracyEl.textContent = `${acc}%`;
    if (scoreEl) scoreEl.textContent = s.score;
    if (levelEl) levelEl.textContent = s.maxLevelUnlocked;
    if (starsEl) starsEl.textContent = s.stars;

    // Evaluasi Penguasaan Materi (Berdasarkan Tujuan Pembelajaran)
    const mPlace = document.getElementById('badgePlaceValue');
    const mCarry = document.getElementById('badgeCarry');
    const mStory = document.getElementById('badgeStory');

    this.updateBadge(mPlace, s.mastered.placeValue || s.isMissionCompleted(1), "Nilai Tempat Puluhan & Satuan");
    this.updateBadge(mCarry, s.mastered.additionWithCarry || s.isMissionCompleted(2) || s.isMissionCompleted(3), "Penjumlahan Bersusun dengan Menyimpan");
    this.updateBadge(mStory, s.mastered.storyProblems || s.isMissionCompleted(4) || s.isMissionCompleted(5), "Soal Cerita Kehidupan Sehari-hari");

    // Otomatis tandai Misi 6 (Halaman Penghargaan) selesai saat dibuka
    if (s.isMissionUnlocked(6)) {
      if (!s.isMissionCompleted(6)) {
        s.completeMission(6);
      }
    }

    // Pesan Refleksi & Kelulusan Petualangan
    if (feedbackTitleEl && feedbackMsgEl) {
      if (s.getCompletedCount() >= 6 || s.unlockedMission >= 6) {
        feedbackTitleEl.textContent = "🏆 SELAMAT, KAPTEN DIRGANTARA MATEMATIKA!";
        feedbackMsgEl.textContent = "Luar biasa! Kamu berhasil menuntaskan seluruh 6 Misi Petualangan! Konsep puluhan, satuan, serta penjumlahan dengan teknik menyimpan telah kamu kuasai dengan sempurna!";
      } else if (s.stars >= 6 && acc >= 80) {
        feedbackTitleEl.textContent = "🏆 Hebat Sekali, Pilot Bintang!";
        feedbackMsgEl.textContent = "Luar biasa! Kamu sudah menguasai konsep nilai tempat, terampil melakukan penjumlahan dengan menyimpan, dan mampu menyelesaikan soal cerita!";
      } else if (s.totalCorrect >= 3) {
        feedbackTitleEl.textContent = "🌟 Bagus Sekali, Pilot Cilik!";
        feedbackMsgEl.textContent = "Kamu sudah memahami cara menyimpan puluhan dengan baik! Teruslah berlatih agar semakin cepat dan teliti dalam misi udara!";
      } else {
        feedbackTitleEl.textContent = "✈️ Terus Semangat Belajar!";
        feedbackMsgEl.textContent = "Yuk, pelajari kembali materi tentang menukar 10 kubus satuan menjadi 1 batang puluhan agar terbangmu semakin lancar!";
      }
    }
  }

  updateBadge(element, isMastered, label) {
    if (!element) return;
    if (isMastered) {
      element.className = "mastery-check-icon passed";
      element.innerHTML = "✓";
    } else {
      element.className = "mastery-check-icon review";
      element.innerHTML = "!";
    }
  }
}

window.resultsPage = new ResultsPage();

/**
 * Interactive Mission Map Controller
 * Mengatur interaktivitas 6 pulau misi, status gembok terkunci, dan alur berurutan 1 -> 6.
 */
class MissionMap {
  constructor() {
    this.isBound = false;
  }

  init() {
    if (this.isBound) return;
    this.bindEvents();
    this.isBound = true;
  }

  bindEvents() {
    // 1. Hotspot Klik Stasiun Pulau Misi (1 s.d. 6) dengan Validasi Kunci
    document.querySelectorAll('.map-island-hotspot').forEach(hotspot => {
      hotspot.addEventListener('click', (e) => {
        e.preventDefault();

        const missionIdx = parseInt(hotspot.dataset.missionIdx, 10);
        const unlockedMax = window.appState.unlockedMission;

        // Pengecekan Kunci: Jika misi lebih tinggi dari yang sudah dibuka, tolak & beri peringatan
        if (missionIdx > unlockedMax) {
          window.soundApp.playWarning();

          // Efek getar / shake pada pulau yang terkunci
          hotspot.classList.remove('shake-locked');
          void hotspot.offsetWidth; // Trigger reflow
          hotspot.classList.add('shake-locked');

          const prevMission = missionIdx - 1;
          window.appState.showToast(`🔒 Pos ${missionIdx} masih terkunci! Selesaikan Pos ${prevMission} terlebih dahulu!`, "🔒");
          window.soundApp.speak(`Pos ${missionIdx} masih terkunci. Selesaikan pos ${prevMission} terlebih dahulu!`);
          return;
        }

        window.soundApp.playClick();

        const targetScreen = hotspot.dataset.nav;
        const targetTab = hotspot.dataset.tab;

        const missionNames = {
          '1': "Pos 1: Berkas Kasus (Mengenal Puluhan & Satuan)",
          '2': "Pos 2: Ruang Sortir Bukti (Benda Konkret & Gambar)",
          '3': "Pos 3: Ruang Interogasi (Langkah Penjumlahan Bersusun)",
          '4': "Pos 4: Laboratorium Solusi (Latihan Mandiri & Input Angka)",
          '5': "Pos 5: Misi Udara Pesawat (Tembak Gerbang Jawaban Benar)",
          '6': "Pos 6: Halaman Penghargaan (Hasil Belajar & Lencana)"
        };

        const missionTitle = missionNames[missionIdx] || "Pos Belajar";
        window.appState.showToast(`Membuka ${missionTitle}! 🚀`, "🗺️");

        if (targetScreen) {
          window.appState.navigateTo(targetScreen);

          // Jika menuju materi dan memiliki target sub-tab spesifik
          if (targetScreen === 'screen-material' && targetTab && window.materialModule) {
            setTimeout(() => {
              window.materialModule.switchTab(targetTab, true);
            }, 100);
          }
        }
      });
    });

    // 2. Hotspot Pesawat Maskot Melayang
    const planeHotspot = document.getElementById('mapMascotPlaneHotspot');
    if (planeHotspot) {
      planeHotspot.addEventListener('click', () => {
        window.soundApp.playStar();
        const completed = window.appState.getCompletedCount();
        if (completed >= 6) {
          window.soundApp.speak("Hebat luar biasa, Kapten Juara! Semua enam pos petualangan sudah kamu taklukkan!");
          window.appState.showToast("Pilot Cilik: Selamat! Seluruh pulau pos matematika sudah kamu taklukkan! 🏆", "⭐");
        } else {
          window.soundApp.speak(`Ayo teruskan petualanganmu, Pilot Cilik! Selesaikan Pos ${window.appState.unlockedMission} untuk membuka pulau berikutnya!`);
          window.appState.showToast(`Pilot Cilik: Semangat menuntaskan Pos ${window.appState.unlockedMission}! ✈️`, "⭐");
        }
      });
    }
  }

  render() {
    this.init();
    const s = window.appState;
    const unlockedMax = s.unlockedMission;

    // Perbarui status visual untuk seluruh 6 pulau
    document.querySelectorAll('.map-island-hotspot').forEach(hotspot => {
      const missionIdx = parseInt(hotspot.dataset.missionIdx, 10);
      const isCompleted = s.isMissionCompleted(missionIdx);

      // Bersihkan class status sebelumnya
      hotspot.classList.remove('is-locked', 'is-active', 'is-completed');

      // Ambil atau buat status badge dinamis
      let statusBadge = hotspot.querySelector('.island-status-badge');
      if (!statusBadge) {
        statusBadge = document.createElement('div');
        statusBadge.className = 'island-status-badge';
        hotspot.appendChild(statusBadge);
      }

      const prompt = hotspot.querySelector('.island-click-prompt');

      if (missionIdx > unlockedMax) {
        // 🔒 TERKUNCI: Siswa belum menyelesaikan pos sebelumnya
        hotspot.classList.add('is-locked');
        statusBadge.className = 'island-status-badge is-locked';
        statusBadge.innerHTML = `<span class="badge-lock-icon">🔒</span> <span class="badge-lock-text">Pos Terkunci</span>`;
        if (prompt) prompt.innerHTML = `🔒 Selesaikan Pos ${missionIdx - 1} Dulu`;
      } else if (missionIdx === unlockedMax && !isCompleted) {
        // ⚡ AKTIF: Pos yang harus diselesaikan saat ini
        hotspot.classList.add('is-active');
        statusBadge.className = 'island-status-badge is-active';
        statusBadge.innerHTML = `<span class="badge-active-dot"></span> <span class="badge-active-text">Buka Pos ${missionIdx} ➔</span>`;
        if (prompt) prompt.innerHTML = `⚡ Mulai Pos ${missionIdx} ➔`;
      } else {
        // ✓ SELESAI: Pos sudah pernah dituntaskan, bisa dibuka kembali
        hotspot.classList.add('is-completed');
        statusBadge.className = 'island-status-badge is-completed';
        statusBadge.innerHTML = `<span class="badge-check-icon">✓</span> <span class="badge-check-text">Selesai</span>`;
        if (prompt) prompt.innerHTML = `✓ Pos ${missionIdx} Selesai (Buka ➔)`;
      }
    });

    // Perbarui teks kemajuan pada pita
    const completedCount = s.getCompletedCount();
    const ribbonText = document.getElementById('mapRibbonProgress');
    if (ribbonText) {
      if (completedCount >= 6) {
        ribbonText.textContent = `Semua 6 pos selesai! 🎉`;
      } else {
        ribbonText.textContent = `${completedCount} dari 6 pos selesai`;
      }
    }
  }
}

window.missionMap = new MissionMap();
