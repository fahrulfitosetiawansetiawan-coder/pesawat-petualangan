/**
 * State Management & Navigation Manager
 * Mengatur data pemain, penyimpanan lokal, pergantian layar, serta sinkronisasi skor.
 */

class AppState {
  constructor() {
    this.playerName = "Pilot Bintang";
    this.score = 0;
    this.stars = 0;
    this.currentLevel = 1;
    this.maxLevelUnlocked = 1;
    this.totalSolved = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.streak = 0;
    this.activeScreen = 'screen-home';

    // Topik yang dikuasai
    this.mastered = {
      placeValue: false,
      additionWithCarry: false,
      storyProblems: false
    };

    // Alur Progresi 6 Misi (Sequential Mission System)
    // Siswa wajib menyelesaikan Misi 1 untuk membuka Misi 2, dst.
    this.unlockedMission = 1;
    this.completedMissions = [];

    // Status penyelesaian tantangan syarat per Pos (1 s.d. 5)
    this.challengeStatus = {
      1: false,
      2: false,
      3: false,
      4: false,
      5: false
    };

    this.loadState();
  }

  loadState() {
    try {
      const data = localStorage.getItem('plane_math_save');
      if (data) {
        const parsed = JSON.parse(data);
        this.playerName = parsed.playerName || this.playerName;
        this.score = parsed.score || 0;
        this.stars = parsed.stars || 0;
        this.currentLevel = parsed.currentLevel || 1;
        this.maxLevelUnlocked = parsed.maxLevelUnlocked || 1;
        this.totalSolved = parsed.totalSolved || 0;
        this.totalCorrect = parsed.totalCorrect || 0;
        this.totalWrong = parsed.totalWrong || 0;
        this.streak = parsed.streak || 0;
        if (parsed.mastered) this.mastered = { ...this.mastered, ...parsed.mastered };
        this.unlockedMission = Math.max(1, Math.min(6, parseInt(parsed.unlockedMission, 10) || 1));
        this.completedMissions = Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [];
        if (parsed.challengeStatus) this.challengeStatus = { ...this.challengeStatus, ...parsed.challengeStatus };
      }
      // Sinkronkan tantangan pos yang sudah pernah diselesaikan
      for (let i = 1; i <= 6; i++) {
        if (this.completedMissions.includes(i)) {
          this.challengeStatus[i] = true;
        }
      }
    } catch(e) {
      console.warn("Storage load error:", e);
    }
  }

  saveState() {
    try {
      const data = {
        playerName: this.playerName,
        score: this.score,
        stars: this.stars,
        currentLevel: this.currentLevel,
        maxLevelUnlocked: this.maxLevelUnlocked,
        totalSolved: this.totalSolved,
        totalCorrect: this.totalCorrect,
        totalWrong: this.totalWrong,
        streak: this.streak,
        mastered: this.mastered,
        unlockedMission: this.unlockedMission,
        completedMissions: this.completedMissions,
        challengeStatus: this.challengeStatus
      };
      localStorage.setItem('plane_math_save', JSON.stringify(data));
    } catch(e) {}
    this.updateHeaderUI();
  }

  resetAllProgress() {
    try {
      localStorage.removeItem('plane_math_save');
    } catch(e) {}
    this.score = 0;
    this.stars = 0;
    this.currentLevel = 1;
    this.maxLevelUnlocked = 1;
    this.totalSolved = 0;
    this.totalCorrect = 0;
    this.totalWrong = 0;
    this.streak = 0;
    this.mastered = { placeValue: false, additionWithCarry: false, storyProblems: false };
    this.unlockedMission = 1;
    this.completedMissions = [];
    this.challengeStatus = { 1: false, 2: false, 3: false, 4: false, 5: false };
    this.saveState();
  }

  addScore(points) {
    this.score += points;
    this.totalSolved++;
    this.totalCorrect++;
    this.streak++;
    if (this.streak >= 3) {
      this.stars += 1;
      window.soundApp.playStar();
    }
    this.saveState();
  }

  recordWrongAnswer() {
    this.totalSolved++;
    this.totalWrong++;
    this.streak = 0;
    this.saveState();
  }

  addStar(count = 1) {
    this.stars += count;
    window.soundApp.playStar();
    this.saveState();
  }

  unlockNextLevel() {
    if (this.currentLevel < 4) {
      this.currentLevel++;
      if (this.currentLevel > this.maxLevelUnlocked) {
        this.maxLevelUnlocked = this.currentLevel;
      }
      this.addStar(2);
      this.saveState();
    }
  }

  // Helper Misi Berurutan (1 s.d. 6)
  isMissionUnlocked(missionIdx) {
    const idx = parseInt(missionIdx, 10);
    return idx <= this.unlockedMission;
  }

  isMissionCompleted(missionIdx) {
    const idx = parseInt(missionIdx, 10);
    return this.completedMissions.includes(idx);
  }

  isChallengeDone(missionIdx) {
    const idx = parseInt(missionIdx, 10);
    return !!(this.challengeStatus[idx] || this.completedMissions.includes(idx));
  }

  setChallengeDone(missionIdx) {
    const idx = parseInt(missionIdx, 10);
    this.challengeStatus[idx] = true;
    this.saveState();
    if (window.materialModule) {
      window.materialModule.updateFlowButtonsUI();
      window.materialModule.updateTabUI();
    }
    if (window.practiceEngine) {
      window.practiceEngine.updateNextButtonUI();
    }
  }

  getCompletedCount() {
    return this.completedMissions.length;
  }

  completeMission(missionIdx) {
    const idx = parseInt(missionIdx, 10);
    if (isNaN(idx) || idx < 1 || idx > 6) return idx;

    const missionTitles = {
      1: "Pos 1: Berkas Kasus",
      2: "Pos 2: Ruang Sortir Bukti",
      3: "Pos 3: Ruang Interogasi",
      4: "Pos 4: Laboratorium Solusi",
      5: "Pos 5: Misi Udara Pesawat",
      6: "Pos 6: Halaman Penghargaan"
    };

    // Tandai tantangan pos ini selesai
    this.challengeStatus[idx] = true;

    // Jika belum pernah diselesaikan, beri hadiah bintang & skor
    if (!this.completedMissions.includes(idx)) {
      this.completedMissions.push(idx);
      this.stars += (idx === 6 ? 3 : 2);
      this.score += (idx === 6 ? 200 : 100);
      window.soundApp.playStar();
    }

    // Perbarui status penguasaan materi (Solo Taxonomy / Capaian)
    if (idx === 1) this.mastered.placeValue = true;
    if (idx === 2 || idx === 3) this.mastered.additionWithCarry = true;
    if (idx === 4 || idx === 5) this.mastered.storyProblems = true;

    // Buka misi berikutnya jika siswa baru pertama kali menuntaskan tahap ini
    if (idx >= this.unlockedMission && this.unlockedMission < 6) {
      this.unlockedMission = idx + 1;
    }

    this.saveState();

    const nextIdx = Math.min(6, idx + 1);
    if (idx < 6) {
      this.showToast(`🎉 Hore! ${missionTitles[idx]} Selesai! Membuka ${missionTitles[nextIdx]}! (+2 ⭐)`, "🌟");
      window.soundApp.speak(`Hebat! ${missionTitles[idx]} berhasil diselesaikan! Sekarang ${missionTitles[nextIdx]} sudah terbuka!`);
    } else {
      this.showToast(`🏆 Luar Biasa! Semua 6 Pos Belajar Berhasil Diselesaikan! (+3 ⭐)`, "🎓");
      window.soundApp.speak(`Luar biasa sekali! Seluruh enam pos petualangan berhasil kamu selesaikan dengan gemilang! Selamat Kapten!`);
    }

    if (window.missionMap) {
      window.missionMap.render();
    }

    if (window.materialModule) {
      window.materialModule.updateTabUI();
      window.materialModule.updateFlowButtonsUI();
    }

    if (window.practiceEngine) {
      window.practiceEngine.updateNextButtonUI();
    }

    return nextIdx;
  }

  updateHeaderUI() {
    const starEl = document.getElementById('headerStars');
    const scoreEl = document.getElementById('headerScore');
    const playerEl = document.getElementById('headerPlayerName');
    if (starEl) starEl.textContent = this.stars;
    if (scoreEl) scoreEl.textContent = this.score;
    if (playerEl) playerEl.textContent = this.playerName;
  }

  // Navigation Controller dengan validasi kunci misi
  navigateTo(screenId) {
    if (screenId === this.activeScreen) return;

    // Pengecekan Kunci Misi agar siswa wajib urut 1 -> 2 -> 3 -> 4 -> 5 -> 6
    if (screenId === 'screen-practice' && !this.isMissionUnlocked(4)) {
      window.soundApp.playWarning();
      this.showToast("🔒 Pos 4 (Laboratorium Solusi) masih terkunci! Selesaikan Pos 1, 2, dan 3 terlebih dahulu!", "🔒");
      window.soundApp.speak("Pos 4 masih terkunci. Selesaikan pos satu sampai tiga terlebih dahulu!");
      // Alihkan ke peta misi jika belum terbuka
      if (this.activeScreen !== 'screen-map') {
        this.navigateTo('screen-map');
      }
      return;
    }

    if (screenId === 'screen-game' && !this.isMissionUnlocked(5)) {
      window.soundApp.playWarning();
      this.showToast("🔒 Pos 5 (Game Pesawat) masih terkunci! Selesaikan Pos 1 sampai 4 terlebih dahulu!", "🔒");
      window.soundApp.speak("Pos 5 masih terkunci. Selesaikan pos satu sampai empat terlebih dahulu!");
      if (this.activeScreen !== 'screen-map') {
        this.navigateTo('screen-map');
      }
      return;
    }

    if (screenId === 'screen-results' && !this.isMissionUnlocked(6)) {
      window.soundApp.playWarning();
      this.showToast("🔒 Pos 6 (Halaman Penghargaan) masih terkunci! Selesaikan Pos 1 sampai 5 terlebih dahulu!", "🔒");
      window.soundApp.speak("Pos 6 masih terkunci. Selesaikan seluruh pos penerbangan terlebih dahulu!");
      if (this.activeScreen !== 'screen-map') {
        this.navigateTo('screen-map');
      }
      return;
    }

    // Bersihkan aktivitas di screen sebelumnya agar tidak berjalan di latar belakang
    if (this.activeScreen === 'screen-game' && window.gameEngine) {
      window.gameEngine.stop();
    }
    if (this.activeScreen === 'screen-video' && window.videoPlayer) {
      window.videoPlayer.pause();
    }
    window.soundApp.stopEngine();
    window.soundApp.stopWarBgm();
    window.soundApp.stopSpeech();

    // Sembunyikan semua layar
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.remove('active');
    });

    // Tampilkan layar yang dituju
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.activeScreen = screenId;
      window.soundApp.playClick();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Inisialisasi spesifik layar
      if (screenId === 'screen-map' && window.missionMap) {
        window.missionMap.render();
      } else if (screenId === 'screen-material' && window.materialModule) {
        window.materialModule.updateTabUI();
        window.materialModule.updateFlowButtonsUI();
      } else if (screenId === 'screen-practice' && window.practiceEngine) {
        window.practiceEngine.updateNextButtonUI();
      } else if (screenId === 'screen-game' && window.gameEngine) {
        window.gameEngine.start();
      } else if (screenId === 'screen-results' && window.resultsPage) {
        window.resultsPage.render();
      } else if (screenId === 'screen-video' && window.videoPlayer) {
        window.videoPlayer.init();
      }
    }
  }

  showToast(message, icon = '✨') {
    const toast = document.getElementById('appToast');
    if (!toast) return;
    toast.innerHTML = `<span style="font-size:1.4rem;">${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}

window.appState = new AppState();
