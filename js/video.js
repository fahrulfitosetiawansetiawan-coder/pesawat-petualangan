/**
 * Educational Video Player Module
 * Memainkan file video MP4 asli: "video pembelajaran penjumlahan bersusun panjang dengan menyimpan.mp4"
 * Dilengkapi kontrol kustom interaktif, lompat babak/daftar isi, pengatur kecepatan, dan kuis pemahaman.
 */

class VideoPlayer {
  constructor() {
    this.video = null;
    this.playbackSpeeds = [1.0, 1.25, 1.5, 0.75];
    this.currentSpeedIdx = 0;
  }

  init() {
    this.video = document.getElementById('mainRealVideo');
    if (!this.video) return;

    this.bindControls();
    this.bindChapterList();
    this.bindTranscriptDrawer();
    this.bindPostQuiz();
  }

  bindControls() {
    const playBtn = document.getElementById('videoPlayBtn');
    const replayBtn = document.getElementById('videoReplayBtn');
    const rewindBtn = document.getElementById('videoRewind10Btn');
    const forwardBtn = document.getElementById('videoForward10Btn');
    const slider = document.getElementById('videoTimeSlider');
    const timeDisplay = document.getElementById('videoTimeDisplay');
    const speedBtn = document.getElementById('videoSpeedBtn');
    const fullscreenBtn = document.getElementById('videoFullscreenBtn');

    // Play / Pause
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        if (this.video.paused) {
          this.video.play().catch(e => console.warn("Video play error:", e));
        } else {
          this.video.pause();
        }
      });
    }

    // Replay
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        this.video.currentTime = 0;
        this.video.play().catch(e => console.warn("Video play error:", e));
      });
    }

    // Rewind 10s
    if (rewindBtn) {
      rewindBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
      });
    }

    // Forward 10s
    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        const max = this.video.duration || 100;
        this.video.currentTime = Math.min(max, this.video.currentTime + 10);
      });
    }

    // Speed Cycle
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        this.currentSpeedIdx = (this.currentSpeedIdx + 1) % this.playbackSpeeds.length;
        const speed = this.playbackSpeeds[this.currentSpeedIdx];
        this.video.playbackRate = speed;
        speedBtn.textContent = `${speed}x`;
        window.appState.showToast(`Kecepatan video: ${speed}x`, "⚡");
      });
    }

    // Fullscreen
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        if (this.video.requestFullscreen) {
          this.video.requestFullscreen().catch(() => {});
        } else if (this.video.webkitRequestFullscreen) {
          this.video.webkitRequestFullscreen();
        }
      });
    }

    // Timeline Slider
    if (slider) {
      slider.addEventListener('input', (e) => {
        if (this.video.duration) {
          const seekTime = (parseFloat(e.target.value) / 100) * this.video.duration;
          this.video.currentTime = seekTime;
        }
      });
    }

    // Video Events
    this.video.addEventListener('play', () => {
      if (playBtn) playBtn.textContent = '⏸️';
    });

    this.video.addEventListener('pause', () => {
      if (playBtn) playBtn.textContent = '▶️';
    });

    this.video.addEventListener('loadedmetadata', () => {
      this.updateTimeDisplay();
    });

    this.video.addEventListener('timeupdate', () => {
      if (this.video.duration && slider) {
        const pct = (this.video.currentTime / this.video.duration) * 100;
        slider.value = pct;
      }
      this.updateTimeDisplay();
      this.highlightActiveChapter();
    });

    this.video.addEventListener('ended', () => {
      if (playBtn) playBtn.textContent = '▶️';
      window.soundApp.playLevelWin();
      window.appState.showToast("Luar biasa! Video telah selesai ditonton!", "🎉");
      const quizCard = document.getElementById('videoPostQuizCard');
      if (quizCard) {
        quizCard.style.display = 'block';
        quizCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  updateTimeDisplay() {
    const timeDisplay = document.getElementById('videoTimeDisplay');
    if (!timeDisplay || !this.video) return;

    const cur = this.formatTime(this.video.currentTime || 0);
    const dur = this.formatTime(this.video.duration || 0);
    timeDisplay.textContent = `${cur} / ${dur}`;
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // 2. Daftar Babak Video (Sidebar Chapter Jump)
  bindChapterList() {
    const chapters = document.querySelectorAll('#videoChapterList .video-index-item');
    chapters.forEach(item => {
      item.addEventListener('click', () => {
        window.soundApp.playClick();
        const pct = parseFloat(item.dataset.pct || 0);
        if (this.video && this.video.duration) {
          this.video.currentTime = (pct / 100) * this.video.duration;
          this.video.play().catch(() => {});
        } else if (this.video) {
          this.video.play().catch(() => {});
        }
      });
    });
  }

  highlightActiveChapter() {
    if (!this.video || !this.video.duration) return;
    const currentPct = (this.video.currentTime / this.video.duration) * 100;

    const chapters = Array.from(document.querySelectorAll('#videoChapterList .video-index-item'));
    if (!chapters.length) return;

    let activeIdx = 0;
    chapters.forEach((item, idx) => {
      const pct = parseFloat(item.dataset.pct || 0);
      if (currentPct >= pct) {
        activeIdx = idx;
      }
    });

    chapters.forEach((item, idx) => {
      item.classList.toggle('current', idx === activeIdx);
    });
  }

  // 3. Drawer Transkrip
  bindTranscriptDrawer() {
    const transcriptBtn = document.getElementById('videoTranscriptBtn');
    const drawer = document.getElementById('videoTranscriptDrawer');
    if (transcriptBtn && drawer) {
      transcriptBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        transcriptBtn.textContent = isHidden ? '❌ Tutup Ringkasan' : '📄 Teks Ringkasan Materi Video';
        if (isHidden) {
          drawer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  // 4. Kuis Pemahaman Pasca Video
  bindPostQuiz() {
    const submitBtn = document.getElementById('btnSubmitVideoQuiz');
    const feedback = document.getElementById('videoQuizFeedback');

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const q1 = document.querySelector('input[name="vq1"]:checked');
        const q2 = document.querySelector('input[name="vq2"]:checked');

        if (!q1 || !q2) {
          window.appState.showToast("Pilih semua jawaban kuis dulu ya!", "⚠️");
          return;
        }

        const isQ1Correct = q1.value === 'satuan';
        const isQ2Correct = q2.value === '1';

        if (isQ1Correct && isQ2Correct) {
          window.soundApp.playLevelWin();
          if (feedback) {
            feedback.innerHTML = "🎉 Luar Biasa! Semua jawabanmu benar 100%! Kamu siap untuk latihan soal!";
            feedback.style.color = "#15803d";
          }
          window.appState.addScore(100);
          window.appState.addStar(2);
          window.soundApp.speak("Hebat sekali! Kamu memahami video penjumlahan bersusun dengan sempurna!");
        } else {
          window.soundApp.playWrong();
          if (feedback) {
            feedback.innerHTML = "Yuk periksa lagi: yang dijumlahkan pertama adalah satuan, dan simpanannya adalah 1 puluhan.";
            feedback.style.color = "#dc2626";
          }
        }
      });
    }
  }

  // Dipanggil router saat keluar dari screen video
  pause() {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }
}

// Global singleton instance
window.videoPlayer = new VideoPlayer();
