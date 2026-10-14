/**
 * Story Missions Module (Misi Soal Cerita Kehidupan Sehari-hari)
 * Menyajikan soal cerita kontekstual dengan alur 5 langkah penyelesaian terpadu dan koreksi otomatis.
 */

class StoryMissions {
  constructor() {
    this.currentIndex = 0;
    this.missions = [
      {
        id: 1,
        title: "Misi 1: Buku Cerita Perpustakaan",
        text: "Di perpustakaan ada 28 buku cerita. Guru menambahkan 17 buku baru. Berapa jumlah seluruh buku di perpustakaan sekarang?",
        image: "assets/images/story_library.jpg",
        n1: 28,
        n2: 17,
        objectName: "buku",
        step1: "Ada 28 buku lama dan 17 buku baru yang ditambahkan.",
        step2: "Operasi penjumlahan: 28 + 17",
        step3: "28 = 20 + 8 | 17 = 10 + 7",
        step4: "Satuan: 8 + 7 = 15 (simpan 1 puluhan, sisa 5 satuan). Puluhan: 20 + 10 + 10 = 40.",
        finalSum: 45,
        conclusionText: "Jadi, jumlah seluruh buku di perpustakaan adalah 45 buku."
      },
      {
        id: 2,
        title: "Misi 2: Stiker Bintang Rani",
        text: "Rani memiliki 36 stiker pesawat lucu. Ia mendapat hadiah 25 stiker lagi dari ibu guru. Berapa jumlah stiker Rani sekarang?",
        image: "assets/images/sky_bg.jpg",
        n1: 36,
        n2: 25,
        objectName: "stiker",
        step1: "Rani punya 36 stiker, lalu mendapat 25 stiker lagi.",
        step2: "Operasi penjumlahan: 36 + 25",
        step3: "36 = 30 + 6 | 25 = 20 + 5",
        step4: "Satuan: 6 + 5 = 11 (simpan 1 puluhan, sisa 1 satuan). Puluhan: 30 + 20 + 10 = 60.",
        finalSum: 61,
        conclusionText: "Jadi, jumlah stiker Rani sekarang adalah 61 stiker."
      },
      {
        id: 3,
        title: "Misi 3: Bunga Cantik di Kebun Sekolah",
        text: "Di kebun sekolah sudah mekar 47 kuntum bunga mawar. Murid-murid menanam lagi 16 kuntum bunga baru. Berapa jumlah bunga di kebun sekarang?",
        image: "assets/images/story_garden.jpg",
        n1: 47,
        n2: 16,
        objectName: "bunga",
        step1: "Ada 47 bunga awal dan ditanam 16 bunga baru.",
        step2: "Operasi penjumlahan: 47 + 16",
        step3: "47 = 40 + 7 | 16 = 10 + 6",
        step4: "Satuan: 7 + 6 = 13 (simpan 1 puluhan, sisa 3 satuan). Puluhan: 40 + 10 + 10 = 60.",
        finalSum: 63,
        conclusionText: "Jadi, jumlah bunga di kebun sekolah adalah 63 bunga."
      },
      {
        id: 4,
        title: "Misi 4: Kotak Pensil Warna Sekolah",
        text: "Di kotak alat tulis kelas terdapat 29 pensil warna. Pak Guru memasukkan 24 pensil warna tambahan. Berapa jumlah pensil warna seluruhnya?",
        image: "assets/images/mascot_plane.jpg",
        n1: 29,
        n2: 24,
        objectName: "pensil",
        step1: "Terdapat 29 pensil di kotak dan ditambah 24 pensil lagi.",
        step2: "Operasi penjumlahan: 29 + 24",
        step3: "29 = 20 + 9 | 24 = 20 + 4",
        step4: "Satuan: 9 + 4 = 13 (simpan 1 puluhan, sisa 3 satuan). Puluhan: 20 + 20 + 10 = 50.",
        finalSum: 53,
        conclusionText: "Jadi, jumlah pensil warna seluruhnya adalah 53 pensil."
      }
    ];
  }

  init() {
    this.bindEvents();
    this.renderStory();
  }

  bindEvents() {
    const prevBtn = document.getElementById('btnStoryPrev');
    const nextBtn = document.getElementById('btnStoryNext');
    const checkBtn = document.getElementById('btnStoryCheck');
    const hintBtn = document.getElementById('btnStoryHint');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentIndex > 0) {
          window.soundApp.playClick();
          this.currentIndex--;
          this.renderStory();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentIndex < this.missions.length - 1) {
          window.soundApp.playClick();
          this.currentIndex++;
          this.renderStory();
        } else {
          window.appState.showToast("Kamu telah menyelesaikan semua misi cerita!", "🎉");
        }
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkAnswer());
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.showHint());
    }
  }

  renderStory() {
    const m = this.missions[this.currentIndex];
    if (!m) return;

    const titleEl = document.getElementById('storyMissionTitle');
    const textEl = document.getElementById('storyProblemText');
    const imgEl = document.getElementById('storyImage');
    const inputEl = document.getElementById('storyAnswerInput');
    const feedbackEl = document.getElementById('storyFeedbackBox');
    const indicatorEl = document.getElementById('storyIndexIndicator');

    if (titleEl) titleEl.textContent = m.title;
    if (textEl) textEl.textContent = m.text;
    if (imgEl) imgEl.src = m.image;
    if (inputEl) {
      inputEl.value = '';
      inputEl.classList.remove('correct', 'wrong');
    }
    if (feedbackEl) feedbackEl.innerHTML = '';
    if (indicatorEl) indicatorEl.textContent = `Misi ${this.currentIndex + 1} dari ${this.missions.length}`;

    // Render 5 panduan bertahap
    const s1 = document.getElementById('storyStep1Text');
    const s2 = document.getElementById('storyStep2Text');
    const s3 = document.getElementById('storyStep3Text');
    const s4 = document.getElementById('storyStep4Text');
    const s5 = document.getElementById('storyStep5Text');

    if (s1) s1.textContent = m.step1;
    if (s2) s2.textContent = m.step2;
    if (s3) s3.textContent = m.step3;
    if (s4) s4.textContent = m.step4;
    if (s5) s5.textContent = m.conclusionText;

    // Baca soal cerita dengan suara ramah jika diizinkan
    window.soundApp.speak(m.text);
  }

  checkAnswer() {
    const m = this.missions[this.currentIndex];
    const inputEl = document.getElementById('storyAnswerInput');
    const feedbackEl = document.getElementById('storyFeedbackBox');
    if (!inputEl || !m) return;

    const val = parseInt(inputEl.value, 10);
    if (isNaN(val)) {
      window.appState.showToast("Tuliskan angka jawabanmu ya!", "⚠️");
      return;
    }

    if (val === m.finalSum) {
      inputEl.classList.remove('wrong');
      inputEl.classList.add('correct');
      window.soundApp.playCorrect();
      window.appState.addScore(100);
      window.appState.mastered.storyProblems = true;
      window.appState.saveState();

      if (feedbackEl) {
        feedbackEl.innerHTML = `
          <div style="background:#dcfce7;border:2px solid #86efac;color:#15803d;padding:14px;border-radius:12px;font-weight:800;font-size:1.1rem;margin-top:14px;">
            🎉 Hebat sekali! Jawabanmu benar: <strong>${m.finalSum} ${m.objectName}</strong>!<br>
            <span style="font-size:0.95rem;font-weight:700;">${m.conclusionText}</span>
          </div>
        `;
      }
      window.soundApp.speak(`Jawabanmu tepat sekali! ${m.conclusionText}`);
    } else {
      inputEl.classList.remove('correct');
      inputEl.classList.add('wrong');
      window.soundApp.playWrong();
      window.appState.recordWrongAnswer();

      if (feedbackEl) {
        feedbackEl.innerHTML = `
          <div style="background:#fee2e2;border:2px solid #f87171;color:#b91c1c;padding:14px;border-radius:12px;font-weight:700;margin-top:14px;">
            💡 Jawabanmu (${val}) belum tepat. Jangan lupa periksa simpanan 1 puluhan saat menjumlahkan satuan ya!
          </div>
        `;
      }
    }
  }

  showHint() {
    const m = this.missions[this.currentIndex];
    if (!m) return;
    window.soundApp.playClick();
    const hint = `Tips: Jumlahkan dulu satuannya (${m.n1 % 10} + ${m.n2 % 10}). Apakah hasilnya di atas 9? Jika ya, simpan 1 puluhan!`;
    window.appState.showToast(hint, "💡");
    window.soundApp.speak(hint);
  }
}

window.storyMissions = new StoryMissions();
