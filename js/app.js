/**
 * Main Application Orchestrator
 * Mengatur inisialisasi modul, router navigasi global, modal pengaturan, dan event listener header.
 */

// Polyfill Canvas roundRect jika dijalankan di browser lama
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 8) {
    const radius = typeof r === 'number' ? r : (r[0] || 8);
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + w, y, x + w, y + h, radius);
    this.arcTo(x + w, y + h, x, y + h, radius);
    this.arcTo(x, y + h, x, y, radius);
    this.arcTo(x, y, x + w, y, radius);
    this.closePath();
    return this;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inisialisasi State dan Komponen
  window.appState.updateHeaderUI();
  window.materialModule.init();
  window.videoPlayer.init();
  window.practiceEngine.init();
  window.gameEngine.init();
  window.storyMissions.init();
  window.resultsPage.init();
  if (window.missionMap) window.missionMap.init();
  if (window.materialModule) window.materialModule.updateFlowButtonsUI();
  if (window.practiceEngine) window.practiceEngine.updateNextButtonUI();

  // 2. Setup Global Navigation Router
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const targetScreen = el.dataset.nav;
      if (targetScreen) {
        window.appState.navigateTo(targetScreen);
      }
    });
  });

  // 3. Header Sound Toggle Button
  const soundBtn = document.getElementById('headerSoundBtn');
  if (soundBtn) {
    const isMuted = window.soundApp.isMuted;
    soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    soundBtn.title = isMuted ? 'Nyalakan Suara' : 'Matikan Suara';

    soundBtn.addEventListener('click', () => {
      const muted = window.soundApp.toggleMute();
      soundBtn.innerHTML = muted ? '🔇' : '🔊';
      soundBtn.title = muted ? 'Nyalakan Suara' : 'Matikan Suara';
      window.appState.showToast(muted ? "Suara dinonaktifkan 🔇" : "Suara diaktifkan 🔊", "🎵");
    });
  }

  // 4. Settings Modal
  const settingsBtn = document.getElementById('headerSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const volumeSlider = document.getElementById('settingVolumeSlider');
  const narrationSwitch = document.getElementById('settingNarrationSwitch');
  const battleBgmSwitch = document.getElementById('settingBattleBgmSwitch');

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      window.soundApp.playClick();
      settingsModal.classList.add('active');
      if (battleBgmSwitch) battleBgmSwitch.checked = window.soundApp.isWarBgmEnabled;
    });
  }

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      window.soundApp.playClick();
      settingsModal.classList.remove('active');
    });
  }

  if (volumeSlider) {
    volumeSlider.value = window.soundApp.volume;
    volumeSlider.addEventListener('input', (e) => {
      window.soundApp.setVolume(parseFloat(e.target.value));
    });
  }

  if (narrationSwitch) {
    narrationSwitch.checked = window.soundApp.narrationEnabled;
    narrationSwitch.addEventListener('change', (e) => {
      window.soundApp.setNarration(e.target.checked);
      window.appState.showToast(e.target.checked ? "Narasi Suara Diaktifkan" : "Narasi Suara Dimatikan", "🗣️");
    });
  }

  if (battleBgmSwitch) {
    battleBgmSwitch.checked = window.soundApp.isWarBgmEnabled;
    battleBgmSwitch.addEventListener('change', (e) => {
      window.soundApp.setWarBgmEnabled(e.target.checked);
      window.appState.showToast(e.target.checked ? "Musik Perang Diaktifkan ⚔️" : "Musik Perang Dimatikan 🔇", "🎵");
    });
  }

  // 5. Fullscreen Toggle
  const fullscreenBtn = document.getElementById('headerFullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      window.soundApp.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fullscreenBtn.innerHTML = '⤓';
      } else {
        document.exitFullscreen().catch(() => {});
        fullscreenBtn.innerHTML = '⛶';
      }
    });
  }

  // Pastikan klik pertama di layar menginisialisasi audio context browser
  window.addEventListener('click', () => {
    window.soundApp.initContext();
  }, { once: true });

  // 6. Pilot Mascot Interaktif (Terbang & Berbicara)
  const pilotActor = document.getElementById('hero-pilot-actor');
  const pilotBubble = document.getElementById('pilot-speech-bubble');
  const pilotListenBtn = document.getElementById('btn-pilot-talk-play');
  const soundWaves = document.getElementById('talking-sound-waves');

  const pilotGreetingText = "Halo, Pilot Cilik! Hari ini kita akan terbang menjelajahi dunia angka. Yuk, bantu pesawat menyelesaikan misi penjumlahan dengan menyimpan. Kumpulkan bintang sebanyak-banyaknya!";

  function triggerPilotSpeech() {
    window.soundApp.initContext();
    if (window.soundApp.isMuted) {
      window.appState.showToast("Nyalakan suara di pojok kanan atas 🔊", "🔇");
    }

    if (pilotActor) pilotActor.classList.add('is-speaking');
    if (pilotBubble) pilotBubble.classList.add('is-speaking');
    if (soundWaves) soundWaves.classList.add('active');

    window.soundApp.speak(pilotGreetingText, () => {
      if (pilotActor) pilotActor.classList.remove('is-speaking');
      if (pilotBubble) pilotBubble.classList.remove('is-speaking');
      if (soundWaves) soundWaves.classList.remove('active');
    });
  }

  if (pilotListenBtn) {
    pilotListenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerPilotSpeech();
    });
  }

  if (pilotActor) {
    pilotActor.addEventListener('click', () => {
      triggerPilotSpeech();
    });
  }

  if (pilotBubble) {
    pilotBubble.addEventListener('click', (e) => {
      if (e.target.closest('#btn-pilot-talk-play')) return;
      triggerPilotSpeech();
    });
  }

  // 7. Interaktivitas Elemen Latar Belakang HD (Balon Udara, Matahari, Pulau)
  const bgHotAirBalloon = document.getElementById('bgHotAirBalloon');
  const bgSunActor = document.getElementById('bgSunActor');
  const bgFloatingIsland = document.getElementById('bgFloatingIsland');

  if (bgHotAirBalloon) {
    bgHotAirBalloon.addEventListener('click', () => {
      window.soundApp.playClick();
      window.soundApp.playBonus();
      window.appState.showToast("Halo dari Balon Udara HD! 🎈", "🌈");
    });
  }

  if (bgSunActor) {
    bgSunActor.addEventListener('click', () => {
      window.soundApp.playClick();
      window.soundApp.playCorrect();
      window.appState.showToast("Matahari tersenyum cerah hari ini! ☀️", "💛");
    });
  }

  if (bgFloatingIsland) {
    bgFloatingIsland.addEventListener('click', () => {
      window.soundApp.playClick();
      window.soundApp.playLevelUp();
      window.appState.showToast("Pulau Matematika 1-2-3 penuh keajaiban! 🏝️", "⭐");
    });
  }

  // Interaksi Klik Judul Utama (Sound + Efek Bersorak)
  const heroTitleWrap = document.getElementById('heroTitleArtworkWrap');
  if (heroTitleWrap) {
    heroTitleWrap.addEventListener('click', () => {
      window.soundApp.playBonus();
      window.appState.showToast("Petualangan Pesawat Angka! Siap Terbang Menuju Kemenangan! ✈️✨", "⭐");
    });
  }
});

