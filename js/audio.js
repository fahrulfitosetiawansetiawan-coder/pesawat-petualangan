// Canvas roundRect polyfill for compatibility
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

/**
 * Web Audio API & Speech Synthesis Sound Engine
 * Menyediakan seluruh 12 efek suara dan fitur narasi suara ramah anak tanpa dependensi eksternal.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.8;
    this.engineOsc = null;
    this.engineGain = null;
    this.isEngineRunning = false;
    this.narrationEnabled = true;

    // Sistem Backsound & Musik Perang Udara (War BGM Synthesizer)
    this.isWarBgmEnabled = true;
    this.isWarBgmRunning = false;
    this.warBgmVolume = 0.45;
    this.warBgmMasterGain = null;
    this.warBgmTimer = null;
    this.warBgmStep = 0;
    this.warBgmNextTime = 0;
    this.warNoiseBuffer = null;
    this.warThrusterNode = null;
    this.warThrusterGain = null;

    // Load saved settings
    try {
      const savedMute = localStorage.getItem('plane_sound_mute');
      if (savedMute !== null) this.isMuted = savedMute === 'true';
      const savedVol = localStorage.getItem('plane_sound_vol');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
      const savedNar = localStorage.getItem('plane_sound_narration');
      if (savedNar !== null) this.narrationEnabled = savedNar === 'true';
      const savedWarBgm = localStorage.getItem('plane_war_bgm');
      if (savedWarBgm !== null) this.isWarBgmEnabled = savedWarBgm === 'true';
    } catch (e) {}
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.ensureWarBgmNodes();
  }

  setMute(mute) {
    this.isMuted = mute;
    try { localStorage.setItem('plane_sound_mute', mute); } catch(e) {}
    if (this.warBgmMasterGain && this.ctx) {
      const targetGain = (!this.isMuted && this.isWarBgmEnabled && this.isWarBgmRunning) ? this.volume * this.warBgmVolume : 0.0001;
      this.warBgmMasterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    if (mute) {
      this.stopEngine();
      this.stopSpeech();
      this.stopThrusterAmbience();
    } else {
      if (this.isWarBgmRunning && this.isWarBgmEnabled) {
        this.startThrusterAmbience();
      }
    }
    this.syncWarBgmButtonsUI();
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('plane_sound_vol', this.volume); } catch(e) {}
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(this.volume * 0.12, this.ctx.currentTime);
    }
    if (this.warBgmMasterGain && this.ctx) {
      const targetGain = (!this.isMuted && this.isWarBgmEnabled && this.isWarBgmRunning) ? this.volume * this.warBgmVolume : 0.0001;
      this.warBgmMasterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  setNarration(enabled) {
    this.narrationEnabled = enabled;
    try { localStorage.setItem('plane_sound_narration', enabled); } catch(e) {}
    if (!enabled) this.stopSpeech();
  }

  // 1. Suara Tombol Ditekan (bubble pop / click ceria)
  playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 2. Game Dimulai (melodi petualangan ceria)
  playGameStart() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.volume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  // 3. Suara Mesin Pesawat (propeller hum lembut, loop)
  startEngine() {
    if (this.isMuted || this.isEngineRunning) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(85, this.ctx.currentTime); // putaran baling-baling

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(14, this.ctx.currentTime); // getaran baling-baling
      lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);

      lfo.connect(this.engineOsc.frequency);

      this.engineGain.gain.setValueAtTime(this.volume * 0.08, this.ctx.currentTime);

      // Low pass filter agar suara mesin halus tidak bising di telinga anak
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      lfo.start();
      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn("Audio engine error:", e);
    }
  }

  stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      }
      setTimeout(() => {
        if (this.engineOsc) {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
          this.engineOsc = null;
        }
        this.isEngineRunning = false;
      }, 160);
    } catch(e) {
      this.isEngineRunning = false;
    }
  }

  // 4. Tembakan Meriam Laser / Supersonic Plasma Cannon (Seru & Gagah)
  playShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Dual Laser Pitch Sweep (Sawtooth + Sine)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(980, t);
    osc1.frequency.exponentialRampToValueAtTime(160, t + 0.16);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1440, t);
    osc2.frequency.exponentialRampToValueAtTime(240, t + 0.14);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(550, t + 0.16);

    gain.gain.setValueAtTime(this.volume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.17);
    osc2.stop(t + 0.17);
  }

  // 4b. Efek Ledakan Tembakan Mengenai Gerbang (Explosion SFX)
  playExplosion(isCorrect = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.getNoiseBuffer();

    if (isCorrect) {
      // Ledakan Keberhasilan Gerbang Terbuka (Sonic boom kemenangan & gemerlap)
      if (noise) {
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noise;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1300, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(220, t + 0.35);
        noiseFilter.Q.setValueAtTime(2.2, t);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(this.volume * 0.45, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseNode.start(t);
        noiseNode.stop(t + 0.36);
      }

      // Sub-bass thud punch
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, t);
      subOsc.frequency.exponentialRampToValueAtTime(42, t + 0.28);

      subGain.gain.setValueAtTime(this.volume * 0.55, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.29);
    } else {
      // Ledakan Salah Target (Heavy crunch impact)
      if (noise) {
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noise;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(700, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(95, t + 0.45);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(this.volume * 0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noiseNode.start(t);
        noiseNode.stop(t + 0.46);
      }

      const crunchOsc = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunchOsc.type = 'sawtooth';
      crunchOsc.frequency.setValueAtTime(110, t);
      crunchOsc.frequency.linearRampToValueAtTime(40, t + 0.38);

      crunchGain.gain.setValueAtTime(this.volume * 0.45, t);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      crunchOsc.connect(crunchGain);
      crunchGain.connect(this.ctx.destination);
      crunchOsc.start(t);
      crunchOsc.stop(t + 0.39);
    }
  }

  // 5. Jawaban Benar (harmoni riang berdering cerah)
  playCorrect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(this.volume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // 6. Jawaban Salah (efek lembut 'boing' kartun, tidak menakutkan)
  playWrong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  // 7. Gerbang Berhasil Dilewati (whoosh cerah + lonceng lolos)
  playGatePass() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t);
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.2);

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // 8. Peringatan Mendekati Gerbang (ticking halus)
  playWarning() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, t);

    gain.gain.setValueAtTime(this.volume * 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // 9. Pesawat Turun Ketika GAME OVER (suara peluit/glissando turun lembut)
  playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.6);

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.66);
  }

  // 10. Mendapat Bintang (kelap-kelip kristal tinggi)
  playStar() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1174.66, t); // D6
    osc.frequency.setValueAtTime(1760.00, t + 0.08); // A6

    gain.gain.setValueAtTime(this.volume * 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.31);
  }

  // 11. Kemenangan Level (fanfare trompet sukacita)
  playLevelWin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 392.00, d: 0.12 }, // G4
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.35 }  // G5
    ];

    let start = this.ctx.currentTime;
    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, start);

      gain.gain.setValueAtTime(this.volume * 0.5, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + note.d + 0.02);

      start += note.d + 0.04;
    });
  }

  // 12. Video Diputar atau Dijeda
  playVideoTone() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  playRadioChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, t); // E5
      gain1.gain.setValueAtTime(this.volume * 0.35, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.16);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, t + 0.1); // A5
      gain2.gain.setValueAtTime(this.volume * 0.4, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.1);
      osc2.stop(t + 0.32);
    } catch(e) {}
  }

  // Web Speech Synthesis (Narasi Suara Bahasa Indonesia)
  speak(text, onEnd = null) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    // Selalu mainkan nada radio intercom pesawat agar terdengar respons suara instan
    this.playRadioChime();

    if (!this.narrationEnabled || !('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 2500);
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'id-ID';
          utterance.rate = 1.0;
          utterance.pitch = 1.15; // Suara ramah ceria
          utterance.volume = this.volume;

          const voices = window.speechSynthesis.getVoices();
          const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID') || v.name.includes('Indonesian'));
          if (idVoice) {
            utterance.voice = idVoice;
          }

          let ended = false;
          const handleEnd = () => {
            if (ended) return;
            ended = true;
            window.activeUtterance = null;
            if (onEnd) onEnd();
          };

          utterance.onend = handleEnd;
          utterance.onerror = (e) => {
            console.warn("Speech error, continuing:", e);
            handleEnd();
          };

          // Simpan referensi global agar tidak di-garbage collect oleh Chromium
          window.activeUtterance = utterance;

          // Watchdog timer: jika speech synthesis macet atau tidak ada suara, fallback onEnd
          const estimatedDuration = Math.max(3000, text.length * 90);
          setTimeout(() => {
            if (!ended) {
              handleEnd();
            }
          }, estimatedDuration + 1500);

          window.speechSynthesis.speak(utterance);
        } catch(err) {
          console.error("Speech synthesis error:", err);
          if (onEnd) onEnd();
        }
      }, 50);
    } catch(e) {
      console.warn("SpeechSynthesis failed:", e);
      if (onEnd) onEnd();
    }
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // =========================================================================
  // SISTEM MUSIK & EFEK BACKSOUND PERANG UDARA (WAR BGM SYNTHESIZER)
  // Musik orkestrasi pertempuran udara heroik 132 BPM dengan Web Audio API
  // Menggunakan lookahead accurate scheduler, procedural drum, bass, lead & jet thruster
  // =========================================================================

  getNoiseBuffer() {
    if (this.warNoiseBuffer) return this.warNoiseBuffer;
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * 2);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.warNoiseBuffer = buffer;
    return buffer;
  }

  ensureWarBgmNodes() {
    if (!this.ctx) return;
    if (!this.warBgmMasterGain) {
      this.warBgmMasterGain = this.ctx.createGain();
      const initialGain = (!this.isMuted && this.isWarBgmEnabled && this.isWarBgmRunning)
        ? this.volume * this.warBgmVolume
        : 0.0001;
      this.warBgmMasterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
      this.warBgmMasterGain.connect(this.ctx.destination);
    }
  }

  startWarBgm() {
    if (!this.isWarBgmEnabled || this.isMuted) {
      this.isWarBgmRunning = true;
      this.syncWarBgmButtonsUI();
      return;
    }
    this.initContext();
    if (!this.ctx) return;
    this.ensureWarBgmNodes();

    if (this.isWarBgmRunning && this.warBgmTimer) return;
    this.isWarBgmRunning = true;

    // Smooth fade in
    const t = this.ctx.currentTime;
    this.warBgmMasterGain.gain.cancelScheduledValues(t);
    this.warBgmMasterGain.gain.setValueAtTime(Math.max(0.0001, this.warBgmMasterGain.gain.value), t);
    this.warBgmMasterGain.gain.linearRampToValueAtTime(this.volume * this.warBgmVolume, t + 0.35);

    this.startThrusterAmbience();

    this.warBgmStep = 0;
    this.warBgmNextTime = this.ctx.currentTime + 0.05;

    // Lookahead loop scheduler (setiap 35ms menjadwalkan 160ms ke depan)
    clearInterval(this.warBgmTimer);
    this.warBgmTimer = setInterval(() => {
      this.scheduleWarBgm();
    }, 35);

    this.syncWarBgmButtonsUI();
  }

  stopWarBgm() {
    this.isWarBgmRunning = false;
    if (this.warBgmTimer) {
      clearInterval(this.warBgmTimer);
      this.warBgmTimer = null;
    }

    if (this.warBgmMasterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.warBgmMasterGain.gain.cancelScheduledValues(t);
      this.warBgmMasterGain.gain.setValueAtTime(this.warBgmMasterGain.gain.value, t);
      this.warBgmMasterGain.gain.linearRampToValueAtTime(0.0001, t + 0.25);
    }

    this.stopThrusterAmbience();
    this.warBgmStep = 0;
    this.syncWarBgmButtonsUI();
  }

  pauseWarBgm() {
    if (this.warBgmTimer) {
      clearInterval(this.warBgmTimer);
      this.warBgmTimer = null;
    }
    if (this.warBgmMasterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.warBgmMasterGain.gain.cancelScheduledValues(t);
      this.warBgmMasterGain.gain.linearRampToValueAtTime(0.0001, t + 0.15);
    }
    this.stopThrusterAmbience();
  }

  resumeWarBgm() {
    if (!this.isWarBgmRunning || !this.isWarBgmEnabled || this.isMuted) return;
    this.startWarBgm();
  }

  toggleWarBgm() {
    this.setWarBgmEnabled(!this.isWarBgmEnabled);
    return this.isWarBgmEnabled;
  }

  setWarBgmEnabled(enabled) {
    this.isWarBgmEnabled = !!enabled;
    try { localStorage.setItem('plane_war_bgm', this.isWarBgmEnabled); } catch(e) {}

    if (this.isWarBgmEnabled) {
      if (window.gameEngine && window.gameEngine.isRunning && !window.gameEngine.isPaused && !window.gameEngine.isGameOver) {
        this.startWarBgm();
      }
    } else {
      if (this.isWarBgmRunning) {
        this.stopWarBgm();
      }
    }
    this.syncWarBgmButtonsUI();
  }

  syncWarBgmButtonsUI() {
    const hudBtn = document.getElementById('btnBattleBgmToggle');
    if (hudBtn) {
      if (this.isWarBgmEnabled && !this.isMuted) {
        hudBtn.classList.add('active');
        hudBtn.innerHTML = '⚔️ Musik Perang: ON';
        hudBtn.title = 'Musik Perang Udara Aktif (Klik untuk Matikan)';
      } else {
        hudBtn.classList.remove('active');
        hudBtn.innerHTML = '⚔️ Musik Perang: OFF';
        hudBtn.title = 'Musik Perang Udara Mati (Klik untuk Nyalakan)';
      }
    }

    const modalSwitch = document.getElementById('settingBattleBgmSwitch');
    if (modalSwitch) {
      modalSwitch.checked = this.isWarBgmEnabled;
    }
  }

  startThrusterAmbience() {
    if (this.warThrusterNode || !this.ctx || !this.warBgmMasterGain) return;
    try {
      const noise = this.getNoiseBuffer();
      if (!noise) return;

      this.warThrusterNode = this.ctx.createBufferSource();
      this.warThrusterNode.buffer = noise;
      this.warThrusterNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.2, this.ctx.currentTime);

      this.warThrusterGain = this.ctx.createGain();
      this.warThrusterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.warThrusterNode.connect(filter);
      filter.connect(this.warThrusterGain);
      this.warThrusterGain.connect(this.warBgmMasterGain);

      this.warThrusterNode.start();
    } catch(e) {
      console.warn("Thruster audio error:", e);
    }
  }

  stopThrusterAmbience() {
    if (this.warThrusterNode) {
      try {
        if (this.warThrusterGain && this.ctx) {
          this.warThrusterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
        }
        setTimeout(() => {
          if (this.warThrusterNode) {
            this.warThrusterNode.stop();
            this.warThrusterNode.disconnect();
            this.warThrusterNode = null;
          }
          this.warThrusterGain = null;
        }, 160);
      } catch(e) {
        this.warThrusterNode = null;
        this.warThrusterGain = null;
      }
    }
  }

  scheduleWarBgm() {
    if (!this.ctx || !this.isWarBgmRunning || !this.isWarBgmEnabled || this.isMuted) return;

    // 132 BPM: Step 16th note durasi
    const stepDuration = 60 / 132 / 4; // ~0.113636s

    while (this.warBgmNextTime < this.ctx.currentTime + 0.18) {
      this.playWarBgmStep(this.warBgmStep, this.warBgmNextTime, stepDuration);
      this.warBgmNextTime += stepDuration;
      this.warBgmStep = (this.warBgmStep + 1) % 64; // 64-step loop (4 bars)
    }
  }

  playWarBgmStep(step, time, stepDur) {
    if (!this.warBgmMasterGain) return;

    // 1. War Kick (Ritme Pacu Tempur Ksatria Udara)
    const kickSteps = [0, 6, 8, 14, 16, 22, 24, 30, 32, 38, 40, 46, 48, 54, 56, 62];
    if (kickSteps.includes(step)) {
      this.playWarKick(time);
    }

    // 2. Military Combat Snare
    const snareSteps = [4, 12, 20, 28, 36, 44, 52];
    const militaryRolls = [58, 60, 61, 62, 63];
    if (snareSteps.includes(step)) {
      this.playWarSnare(time, 0.28);
    } else if (militaryRolls.includes(step)) {
      const volRoll = 0.14 + (step - 58) * 0.04;
      this.playWarSnare(time, volRoll);
    }

    // 3. Hi-Hat / Turbine Sizzle (16th note drive)
    const hatVol = (step % 2 === 1) ? 0.08 : 0.045;
    this.playWarHat(time, hatVol);

    // 4. War Bassline (Resonant Sawtooth Bass Arpeggio D-Minor)
    const bassNotes = [
      // Bar 1 (0-15)
      73.42, 73.42, 146.83, 73.42, 87.31, 73.42, 110.00, 73.42,
      98.00, 73.42, 87.31, 73.42, 164.81, 73.42, 130.81, 73.42,
      // Bar 2 (16-31)
      73.42, 73.42, 146.83, 73.42, 87.31, 73.42, 110.00, 73.42,
      116.54, 73.42, 110.00, 73.42, 98.00, 73.42, 87.31, 164.81,
      // Bar 3 (32-47)
      98.00, 98.00, 196.00, 98.00, 116.54, 98.00, 146.83, 98.00,
      110.00, 110.00, 220.00, 110.00, 130.81, 110.00, 164.81, 110.00,
      // Bar 4 (48-63)
      73.42, 73.42, 87.31, 98.00, 110.00, 130.81, 146.83, 174.61,
      164.81, 146.83, 130.81, 110.00, 98.00, 87.31, 164.81, 73.42
    ];
    const bassFreq = bassNotes[step] || 73.42;
    this.playWarBass(time, bassFreq, stepDur * 0.85);

    // 5. Heroic Aerial Combat Anthem Melody (Lead Brass Synth)
    const melodyMap = {
      0: { f: 293.66, dur: 3 * stepDur },   // D4
      3: { f: 349.23, dur: 1 * stepDur },   // F4
      4: { f: 440.00, dur: 2 * stepDur },   // A4
      6: { f: 392.00, dur: 2 * stepDur },   // G4
      8: { f: 349.23, dur: 4 * stepDur },   // F4
      12: { f: 329.63, dur: 3 * stepDur },  // E4
      15: { f: 261.63, dur: 1 * stepDur },  // C4
      16: { f: 293.66, dur: 4 * stepDur },  // D4
      20: { f: 440.00, dur: 4 * stepDur },  // A4
      24: { f: 587.33, dur: 3 * stepDur },  // D5
      27: { f: 523.25, dur: 1 * stepDur },  // C5
      28: { f: 440.00, dur: 4 * stepDur },  // A4
      32: { f: 466.16, dur: 3 * stepDur },  // Bb4
      35: { f: 440.00, dur: 1 * stepDur },  // A4
      36: { f: 392.00, dur: 2 * stepDur },  // G4
      38: { f: 349.23, dur: 2 * stepDur },  // F4
      40: { f: 392.00, dur: 4 * stepDur },  // G4
      44: { f: 440.00, dur: 4 * stepDur },  // A4
      48: { f: 587.33, dur: 3 * stepDur },  // D5
      51: { f: 523.25, dur: 1 * stepDur },  // C5
      52: { f: 440.00, dur: 2 * stepDur },  // A4
      54: { f: 349.23, dur: 2 * stepDur },  // F4
      56: { f: 329.63, dur: 2 * stepDur },  // E4
      58: { f: 293.66, dur: 6 * stepDur }   // D4 (Ringing Heroic Sustain)
    };

    if (melodyMap[step]) {
      this.playWarLead(time, melodyMap[step].f, melodyMap[step].dur);
    }
  }

  playWarKick(time) {
    if (!this.ctx || !this.warBgmMasterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.11);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.warBgmMasterGain);

    osc.start(time);
    osc.stop(time + 0.13);
  }

  playWarSnare(time, vol = 0.28) {
    if (!this.ctx || !this.warBgmMasterGain) return;
    const noise = this.getNoiseBuffer();
    if (noise) {
      const src = this.ctx.createBufferSource();
      src.buffer = noise;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, time);
      filter.Q.setValueAtTime(1.6, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.warBgmMasterGain);

      src.start(time);
      src.stop(time + 0.15);
    }

    // Snare tone body
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(185, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(75, time + 0.08);

    bodyGain.gain.setValueAtTime(vol * 0.7, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.warBgmMasterGain);

    bodyOsc.start(time);
    bodyOsc.stop(time + 0.10);
  }

  playWarHat(time, vol = 0.05) {
    if (!this.ctx || !this.warBgmMasterGain) return;
    const noise = this.getNoiseBuffer();
    if (!noise) return;

    const src = this.ctx.createBufferSource();
    src.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.warBgmMasterGain);

    src.start(time);
    src.stop(time + 0.05);
  }

  playWarBass(time, freq, dur) {
    if (!this.ctx || !this.warBgmMasterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.8, time);
    filter.frequency.setValueAtTime(850, time);
    filter.frequency.exponentialRampToValueAtTime(280, time + dur);

    gain.gain.setValueAtTime(0.32, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.warBgmMasterGain);

    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  playWarLead(time, freq, dur) {
    if (!this.ctx || !this.warBgmMasterGain) return;
    // Dual Detuned Oscillators (Sawtooth + Square for rich brassy flight presence)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.004, time); // slight detune (+7 cents)

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, time);
    filter.frequency.exponentialRampToValueAtTime(1400, time + dur);

    // Attack & release envelope
    const attackDur = Math.min(0.02, dur * 0.15);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.20, time + attackDur);
    gain.gain.setValueAtTime(0.20, time + Math.max(attackDur, dur - 0.04));
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.warBgmMasterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.02);
    osc2.stop(time + dur + 0.02);
  }
}

// Global singleton instance
window.soundApp = new SoundEngine();
