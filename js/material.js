/**
 * Interactive Learning Materials Module
 * Mengelola interaktivitas materi infografis:
 * 1. Puluhan & Satuan (28 & 25)
 * 2. Misi 1: Gabungkan Satuan (28 + 6)
 * 3. Misi 2: Susun dan Hitung (28 + 6)
 * 4. Laboratorium Angka Mandiri
 */

class MaterialModule {
  constructor() {
    this.activeTab = 'topic-placevalue';
  }

  init() {
    this.bindTopicTabs();
    this.bindNextTabButtons();
    this.bindSampleSwapping();
    this.bindAyoBerpikirQuiz();
    this.bindPos2Challenge();
    this.bindPos3Challenge();
    this.bindConcreteExplorer();
    this.renderConcreteRepresentation(28, 'customExploreRods', 'customExploreCubes');
    this.updateTabUI();
    this.updateFlowButtonsUI();
    this.bindFlowNextButtons();
  }

  // 1. Tab Navigasi Sub Topik
  bindTopicTabs() {
    const tabs = document.querySelectorAll('.topic-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.target;
        this.switchTab(target);
      });
    });
  }

  updateTabUI() {
    const s = window.appState;
    if (!s) return;

    const tabMission1 = document.querySelector('.topic-tab-btn[data-target="topic-mission1"]');
    const tabMission2 = document.querySelector('.topic-tab-btn[data-target="topic-mission2"]');

    if (tabMission1) {
      const isUnlocked = s.isMissionUnlocked(2);
      tabMission1.classList.toggle('is-locked', !isUnlocked);
      let lockBadge = tabMission1.querySelector('.tab-lock-indicator');
      if (!isUnlocked) {
        if (!lockBadge) {
          const span = document.createElement('span');
          span.className = 'tab-lock-indicator';
          span.textContent = ' 🔒';
          tabMission1.appendChild(span);
        }
      } else if (lockBadge) {
        lockBadge.remove();
      }
    }

    if (tabMission2) {
      const isUnlocked = s.isMissionUnlocked(3);
      tabMission2.classList.toggle('is-locked', !isUnlocked);
      let lockBadge = tabMission2.querySelector('.tab-lock-indicator');
      if (!isUnlocked) {
        if (!lockBadge) {
          const span = document.createElement('span');
          span.className = 'tab-lock-indicator';
          span.textContent = ' 🔒';
          tabMission2.appendChild(span);
        }
      } else if (lockBadge) {
        lockBadge.remove();
      }
    }
  }

  updateFlowButtonsUI() {
    const s = window.appState;
    if (!s) return;

    // Pos 1 Flow Button
    const btnPos1 = document.getElementById('btnNextMission1');
    const headPos1 = document.getElementById('headingPos1');
    const subPos1 = document.getElementById('subtextPos1');
    if (btnPos1) {
      const isDone = s.isChallengeDone(1);
      btnPos1.classList.toggle('is-locked', !isDone);
      btnPos1.classList.toggle('glow-pulse', isDone);
      if (isDone) {
        btnPos1.innerHTML = `<span class="btn-flow-icon">✓</span> <span class="btn-flow-text">Selesai Pos 1 ➔ Lanjut Pos 2!</span> <span class="btn-flow-arrow">❯</span>`;
        if (headPos1) headPos1.textContent = "🎉 Hebat! Tantangan Pos 1 Berhasil Diselesaikan!";
        if (subPos1) subPos1.innerHTML = "Puluhan dan satuan telah kamu kuasai. Ayo lanjut ke <strong>Pos 2: Ruang Sortir Bukti</strong>!";
      } else {
        btnPos1.innerHTML = `<span class="btn-flow-icon">🔒</span> <span class="btn-flow-text">Selesaikan Tantangan ➔ Lanjut Pos 2</span> <span class="btn-flow-arrow">❯</span>`;
      }
    }

    // Pos 2 Flow Button
    const btnPos2 = document.getElementById('btnNextMission2');
    const headPos2 = document.getElementById('headingPos2');
    const subPos2 = document.getElementById('subtextPos2');
    if (btnPos2) {
      const isDone = s.isChallengeDone(2);
      btnPos2.classList.toggle('is-locked', !isDone);
      btnPos2.classList.toggle('glow-pulse', isDone);
      if (isDone) {
        btnPos2.innerHTML = `<span class="btn-flow-icon">✓</span> <span class="btn-flow-text">Selesai Pos 2 ➔ Lanjut Pos 3!</span> <span class="btn-flow-arrow">❯</span>`;
        if (headPos2) headPos2.textContent = "🎉 Keren! Tantangan Pos 2 Berhasil Diselesaikan!";
        if (subPos2) subPos2.innerHTML = "Kamu sudah bisa menukar 10 satuan menjadi 1 puluhan! Ayo lanjut ke <strong>Pos 3: Ruang Interogasi</strong>!";
      } else {
        btnPos2.innerHTML = `<span class="btn-flow-icon">🔒</span> <span class="btn-flow-text">Selesaikan Tantangan ➔ Lanjut Pos 3</span> <span class="btn-flow-arrow">❯</span>`;
      }
    }

    // Pos 3 Flow Button
    const btnPos3 = document.getElementById('btnNextMission3');
    const btnBottomPractice = document.getElementById('btnBottomToPractice');
    const headPos3 = document.getElementById('headingPos3');
    const subPos3 = document.getElementById('subtextPos3');
    if (btnPos3) {
      const isDone = s.isChallengeDone(3);
      btnPos3.classList.toggle('is-locked', !isDone);
      btnPos3.classList.toggle('glow-pulse', isDone);
      if (btnBottomPractice) {
        btnBottomPractice.classList.toggle('is-locked', !isDone);
        btnBottomPractice.classList.toggle('glow-pulse', isDone);
      }
      if (isDone) {
        btnPos3.innerHTML = `<span class="btn-flow-icon">✓</span> <span class="btn-flow-text">Selesai Pos 3 ➔ Lanjut Pos 4!</span> <span class="btn-flow-arrow">❯</span>`;
        if (headPos3) headPos3.textContent = "🎉 Luar Biasa! Tantangan Pos 3 Berhasil Diselesaikan!";
        if (subPos3) subPos3.innerHTML = "Penjumlahan bersusun panjang tuntas dikuasai! Ayo uji kemampuanmu di <strong>Pos 4: Laboratorium Solusi</strong>!";
      } else {
        btnPos3.innerHTML = `<span class="btn-flow-icon">🔒</span> <span class="btn-flow-text">Selesaikan Tantangan ➔ Lanjut Pos 4</span> <span class="btn-flow-arrow">❯</span>`;
      }
    }
  }

  switchTab(targetId, force = false) {
    const s = window.appState;

    // Validasi apakah target materi terkunci
    if (!force && s) {
      if (targetId === 'topic-mission1' && !s.isMissionUnlocked(2)) {
        window.soundApp.playWarning();
        s.showToast("🔒 Pos 2 (Ruang Sortir Bukti) masih terkunci! Selesaikan Pos 1 terlebih dahulu!", "🔒");
        window.soundApp.speak("Pos dua masih terkunci. Selesaikan tantangan pos satu terlebih dahulu!");
        return;
      }
      if (targetId === 'topic-mission2' && !s.isMissionUnlocked(3)) {
        window.soundApp.playWarning();
        s.showToast("🔒 Pos 3 (Ruang Interogasi) masih terkunci! Selesaikan Pos 2 terlebih dahulu!", "🔒");
        window.soundApp.speak("Pos tiga masih terkunci. Selesaikan tantangan pos dua terlebih dahulu!");
        return;
      }
    }

    window.soundApp.playClick();
    this.activeTab = targetId;
    this.updateTabUI();
    this.updateFlowButtonsUI();

    // Update active tab buttons
    document.querySelectorAll('.topic-tab-btn').forEach(t => {
      t.classList.toggle('active', t.dataset.target === targetId);
    });

    // Update active sections
    document.querySelectorAll('.topic-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(targetId);
    if (activeSec) {
      activeSec.classList.add('active');
      activeSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Audio narration intro per tab
    if (targetId === 'topic-placevalue') {
      window.soundApp.speak("Pos satu: Berkas Kasus! Mengenal puluhan dan satuan. Bilangan dua angka terdiri dari puluhan dan satuan.");
    } else if (targetId === 'topic-mission1') {
      window.soundApp.speak("Pos dua: Ruang Sortir Bukti! Mari kita gabungkan satuan, dua puluh delapan ditambah enam.");
    } else if (targetId === 'topic-mission2') {
      window.soundApp.speak("Pos tiga: Ruang Interogasi! Ayo lakukan penjumlahan bersusun panjang dengan menyimpan.");
    } else if (targetId === 'topic-explore') {
      window.soundApp.speak("Laboratorium Angka! Pilih bilangan sesukamu untuk melihat puluhan dan satuan.");
    }
  }

  // 2. Tombol Navigasi Lanjut Antar Tab & Alur Misi Global
  bindFlowNextButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-flow-next');
      if (!btn) return;
      e.preventDefault();

      const currentMission = parseInt(btn.dataset.completeMission, 10);
      const nextScreen = btn.dataset.nextScreen;
      const nextTab = btn.dataset.nextTab;
      const s = window.appState;

      // Pengecekan Kunci: Siswa WAJIB menyelesaikan tantangan pada pos saat ini
      if (!s.isChallengeDone(currentMission)) {
        window.soundApp.playWarning();
        btn.classList.remove('challenge-highlight-shake');
        void btn.offsetWidth;
        btn.classList.add('challenge-highlight-shake');

        if (currentMission === 1) {
          s.showToast("🔒 Jawab pertanyaan 'Ayo Berpikir' (8 + 6 = ?) terlebih dahulu untuk membuka Pos 2!", "🔒");
          window.soundApp.speak("Selesaikan dulu pertanyaan Ayo Berpikir di atas untuk membuka Pos dua!");
          const el = document.getElementById('inputPikirSatuan');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
            el.classList.add('challenge-highlight-shake');
            setTimeout(() => el.classList.remove('challenge-highlight-shake'), 1200);
          }
        } else if (currentMission === 2) {
          s.showToast("🔒 Selesaikan tantangan sortir 14 satuan di atas terlebih dahulu untuk membuka Pos 3!", "🔒");
          window.soundApp.speak("Sortir dulu empat belas satuan menjadi puluhan dan satuan pada kotak di atas!");
          const p = document.getElementById('challengePos2Panel');
          if (p) {
            p.scrollIntoView({ behavior: 'smooth', block: 'center' });
            p.classList.add('challenge-highlight-shake');
            setTimeout(() => p.classList.remove('challenge-highlight-shake'), 1200);
          }
        } else if (currentMission === 3) {
          s.showToast("🔒 Selesaikan verifikasi hasil akhir 28 + 6 di atas terlebih dahulu untuk membuka Pos 4!", "🔒");
          window.soundApp.speak("Hitung dulu hasil akhir dua puluh delapan ditambah enam di atas untuk membuka Pos empat!");
          const p = document.getElementById('challengePos3Panel');
          if (p) {
            p.scrollIntoView({ behavior: 'smooth', block: 'center' });
            p.classList.add('challenge-highlight-shake');
            setTimeout(() => p.classList.remove('challenge-highlight-shake'), 1200);
          }
        } else if (currentMission === 4) {
          s.showToast("🔒 Kerjakan dan periksa minimal 1 soal latihan dengan benar terlebih dahulu untuk membuka Pos 5!", "🔒");
          window.soundApp.speak("Kerjakan minimal satu soal latihan dengan benar terlebih dahulu untuk membuka Pos lima!");
          const area = document.getElementById('practiceInteractiveArea');
          if (area) {
            area.scrollIntoView({ behavior: 'smooth', block: 'center' });
            area.classList.add('challenge-highlight-shake');
            setTimeout(() => area.classList.remove('challenge-highlight-shake'), 1200);
          }
        }
        return;
      }

      window.soundApp.playClick();

      // Selesaikan misi saat ini & dapatkan nomor misi berikutnya
      s.completeMission(currentMission);

      // Pindah ke layar atau tab berikutnya
      if (nextScreen) {
        s.navigateTo(nextScreen);
        if (nextScreen === 'screen-material' && nextTab && window.materialModule) {
          setTimeout(() => {
            window.materialModule.switchTab(nextTab, true);
          }, 150);
        }
      }
    });
  }

  bindNextTabButtons() {
    document.querySelectorAll('.btn-next-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const nextTarget = btn.dataset.nextTarget;
        if (nextTarget) {
          this.switchTab(nextTarget);
        }
      });
    });
  }

  // 3. Interaksi Kotak Ingat: Tukar 10 Satuan Menjadi 1 Puluhan
  bindSampleSwapping() {
    const swapBtn = document.getElementById('btnSwapSample');
    const feedbackEl = document.getElementById('swapSampleFeedback');

    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        window.soundApp.playStar();
        if (feedbackEl) {
          feedbackEl.innerHTML = "✨ Hore! 10 kubus satuan bersatu menjadi 1 batang puluhan!";
          feedbackEl.style.color = "#15803d";
        }
        window.appState.addStar(1);
        window.soundApp.speak("Hebat! Sepuluh kubus satuan ditukar menjadi satu batang puluhan.");
      });
    }
  }

  // 4. Kuis Interaktif Ayo Berpikir (Pos 1: 8 + 6 = 14)
  bindAyoBerpikirQuiz() {
    const inputEl = document.getElementById('inputPikirSatuan');
    const checkBtn = document.getElementById('btnCheckPikir');
    const feedbackEl = document.getElementById('pikirFeedback');

    if (checkBtn && inputEl) {
      const handleCheck = () => {
        const val = parseInt(inputEl.value, 10);
        if (isNaN(val)) {
          window.appState.showToast("Isi jawabanmu dulu ya!", "⚠️");
          return;
        }

        if (val === 14) {
          window.soundApp.playLevelWin();
          inputEl.classList.remove('wrong');
          inputEl.classList.add('correct');
          if (feedbackEl) {
            feedbackEl.innerHTML = "🎉 Jawabanmu Benar! 8 + 6 = 14 satuan. Tombol menuju Pos 2 sudah terbuka!";
            feedbackEl.style.color = "#15803d";
          }
          window.appState.addScore(50);
          window.appState.addStar(1);
          window.soundApp.speak("Jawabanmu tepat sekali! Delapan satuan ditambah enam satuan sama dengan empat belas satuan! Tombol menuju Pos dua sudah terbuka!");
          window.appState.setChallengeDone(1);
        } else {
          window.soundApp.playWrong();
          inputEl.classList.remove('correct');
          inputEl.classList.add('wrong');
          if (feedbackEl) {
            feedbackEl.innerHTML = "Ayo hitung lagi: 8 kubus ditambah 6 kubus hasilnya adalah 14 ya!";
            feedbackEl.style.color = "#dc2626";
          }
          window.soundApp.speak("Coba hitung lagi ya. Delapan ditambah enam sama dengan empat belas.");
        }
      };

      checkBtn.addEventListener('click', handleCheck);
      inputEl.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleCheck();
      });
    }
  }

  // 5. Tantangan Interaktif Pos 2: Ruang Sortir Bukti (14 = 1 puluhan + 4 satuan)
  bindPos2Challenge() {
    const inputTens = document.getElementById('inputPos2Puluhan');
    const inputUnits = document.getElementById('inputPos2Satuan');
    const checkBtn = document.getElementById('btnCheckPos2');
    const feedbackEl = document.getElementById('pos2Feedback');

    if (checkBtn && inputTens && inputUnits) {
      const handleCheck = () => {
        const tVal = parseInt(inputTens.value, 10);
        const uVal = parseInt(inputUnits.value, 10);

        if (isNaN(tVal) || isNaN(uVal)) {
          window.appState.showToast("Isi puluhan dan satuan dulu ya!", "⚠️");
          return;
        }

        if (tVal === 1 && uVal === 4) {
          inputTens.classList.remove('wrong');
          inputTens.classList.add('correct');
          inputUnits.classList.remove('wrong');
          inputUnits.classList.add('correct');

          if (feedbackEl) {
            feedbackEl.innerHTML = "🎉 Benar Sekali! 14 satuan = 1 puluhan (10) + 4 satuan. Tombol menuju Pos 3 sudah terbuka!";
            feedbackEl.style.color = "#15803d";
          }
          window.appState.addScore(50);
          window.appState.addStar(1);
          window.soundApp.playLevelWin();
          window.soundApp.speak("Luar biasa! Empat belas satuan ditukar menjadi satu puluhan dan empat satuan! Sekarang Pos tiga sudah terbuka!");
          window.appState.setChallengeDone(2);
        } else {
          window.soundApp.playWrong();
          if (tVal !== 1) inputTens.classList.add('wrong'); else inputTens.classList.add('correct');
          if (uVal !== 4) inputUnits.classList.add('wrong'); else inputUnits.classList.add('correct');

          if (feedbackEl) {
            feedbackEl.innerHTML = "Ayo ingat: 10 satuan ditukar menjadi 1 puluhan, jadi sisanya ada 4 satuan ya!";
            feedbackEl.style.color = "#dc2626";
          }
          window.soundApp.speak("Coba periksa lagi. Sepuluh satuan ditukar jadi satu puluhan, sisanya empat satuan.");
        }
      };

      checkBtn.addEventListener('click', handleCheck);
      [inputTens, inputUnits].forEach(inp => {
        inp.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') handleCheck();
        });
      });
    }
  }

  // 6. Tantangan Interaktif Pos 3: Ruang Interogasi (Hasil Akhir 28 + 6 = 34)
  bindPos3Challenge() {
    const inputHasil = document.getElementById('inputPos3Hasil');
    const checkBtn = document.getElementById('btnCheckPos3');
    const feedbackEl = document.getElementById('pos3Feedback');

    if (checkBtn && inputHasil) {
      const handleCheck = () => {
        const val = parseInt(inputHasil.value, 10);
        if (isNaN(val)) {
          window.appState.showToast("Isi jawaban hasil akhir dulu ya!", "⚠️");
          return;
        }

        if (val === 34) {
          inputHasil.classList.remove('wrong');
          inputHasil.classList.add('correct');

          if (feedbackEl) {
            feedbackEl.innerHTML = "🎉 Jawaban Sempurna! 28 + 6 = 34! Penjumlahan bersusun panjang sukses dikuasai! Tombol Pos 4 siap dibuka!";
            feedbackEl.style.color = "#15803d";
          }
          window.appState.addScore(100);
          window.appState.addStar(2);
          window.soundApp.playLevelWin();
          window.soundApp.speak("Hebat luar biasa! Dua puluh delapan ditambah enam hasilnya tiga puluh empat! Gerbang Pos empat latihan soal sudah terbuka!");
          window.appState.setChallengeDone(3);
        } else {
          window.soundApp.playWrong();
          inputHasil.classList.remove('correct');
          inputHasil.classList.add('wrong');

          if (feedbackEl) {
            feedbackEl.innerHTML = "Coba hitung lagi: 20 puluhan + 10 puluhan simpanan = 30, lalu 30 + 4 satuan = 34 ya!";
            feedbackEl.style.color = "#dc2626";
          }
          window.soundApp.speak("Coba hitung kembali. Tiga puluh ditambah empat sama dengan tiga puluh empat.");
        }
      };

      checkBtn.addEventListener('click', handleCheck);
      inputHasil.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleCheck();
      });
    }
  }

  // 5. Laboratorium Eksplorasi Benda Konkret
  renderConcreteRepresentation(num, rodsContainerId, cubesContainerId) {
    const rodsEl = document.getElementById(rodsContainerId);
    const cubesEl = document.getElementById(cubesContainerId);
    if (!rodsEl || !cubesEl) return;

    const tens = Math.floor(num / 10);
    const units = num % 10;

    // Batang puluhan bertali emas
    let rodsHtml = '';
    for (let i = 0; i < tens; i++) {
      rodsHtml += `
        <div class="ten-rod-graphic" title="1 Puluhan (10 Satuan)">
          <div class="ten-rod-segment"></div>
          <div class="ten-rod-segment"></div>
          <div class="ten-rod-segment"></div>
          <div class="ten-rod-segment"></div>
          <div class="ten-rod-segment"></div>
        </div>
      `;
    }
    rodsEl.innerHTML = rodsHtml || '<span style="color:#94a3b8;font-size:0.85rem;">(0 puluhan)</span>';

    // Kubus satuan kuning emas
    let cubesHtml = '';
    for (let j = 0; j < units; j++) {
      cubesHtml += `<span class="unit-cube-yellow" title="1 Satuan"></span>`;
    }
    cubesEl.innerHTML = cubesHtml || '<span style="color:#94a3b8;font-size:0.85rem;">(0 satuan)</span>';
  }

  bindConcreteExplorer() {
    const numPicker = document.getElementById('explorerNumberPicker');
    const exploreBtn = document.getElementById('exploreNumberBtn');
    if (exploreBtn && numPicker) {
      exploreBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        let val = parseInt(numPicker.value, 10);
        if (isNaN(val) || val < 0 || val > 99) {
          window.appState.showToast("Masukkan angka 0 sampai 99 ya!", "⚠️");
          return;
        }
        const tens = Math.floor(val / 10);
        const units = val % 10;
        document.getElementById('exploreResultTitle').textContent = val;
        document.getElementById('exploreTensText').textContent = `${tens} puluhan (${tens * 10})`;
        document.getElementById('exploreUnitsText').textContent = `${units} satuan`;
        this.renderConcreteRepresentation(val, 'customExploreRods', 'customExploreCubes');
        window.soundApp.playStar();
        window.soundApp.speak(`Bilangan ${val} terdiri dari ${tens} puluhan dan ${units} satuan.`);
      });
    }
  }
}

// Global instance
window.materialModule = new MaterialModule();
