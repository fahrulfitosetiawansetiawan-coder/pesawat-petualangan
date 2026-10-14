/**
 * Dynamic Math Practice Engine
 * Menghitung dan memvalidasi secara dinamis SEMUA bilangan 0-99 buatan siswa maupun acak.
 * Menyediakan 3 mode latihan: Uraian Bilangan, Langkah Penyimpanan, Penjumlahan Bersusun.
 */

class PracticeEngine {
  constructor() {
    this.num1 = 57;
    this.num2 = 25;
    this.activeMode = 1; // 1: Uraian, 2: Penyimpanan, 3: Bersusun
    this.isCurrentProblemSolved = false;
  }

  init() {
    this.bindModeNav();
    this.bindCustomInputs();
    this.bindActionButtons();
    this.renderCurrentMode();
    this.updateNextButtonUI();
  }

  bindModeNav() {
    const modeBtns = document.querySelectorAll('.mode-nav-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundApp.playClick();
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMode = parseInt(btn.dataset.mode, 10);
        this.renderCurrentMode();
      });
    });
  }

  bindCustomInputs() {
    const makeBtn = document.getElementById('btnCreateCustomProblem');
    const randomBtn = document.getElementById('btnRandomProblem');
    const input1 = document.getElementById('inputNum1');
    const input2 = document.getElementById('inputNum2');

    if (makeBtn) {
      makeBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        const v1 = parseInt(input1.value, 10);
        const v2 = parseInt(input2.value, 10);

        if (isNaN(v1) || isNaN(v2)) {
          window.appState.showToast("Masukkan angka ya, tidak boleh kosong atau huruf!", "⚠️");
          return;
        }
        if (v1 < 0 || v2 < 0) {
          window.appState.showToast("Gunakan bilangan positif (bukan negatif) ya!", "⚠️");
          return;
        }
        if (v1 > 99 || v2 > 99) {
          window.appState.showToast("Batas angka untuk kelas 2 SD adalah 0 sampai 99!", "⚠️");
          return;
        }

        this.num1 = v1;
        this.num2 = v2;
        this.isCurrentProblemSolved = false;
        window.appState.showToast(`Soal baru dibuat: ${v1} + ${v2}!`, "🚀");
        this.renderCurrentMode();
      });
    }

    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        // Hasilkan soal yang menarik (80% kemungkinan dengan menyimpan)
        const withCarry = Math.random() > 0.2;
        let n1, n2;
        if (withCarry) {
          const u1 = 5 + Math.floor(Math.random() * 5); // 5-9
          const u2 = 5 + Math.floor(Math.random() * 5); // 5-9
          const t1 = 1 + Math.floor(Math.random() * 6);
          const t2 = 1 + Math.floor(Math.random() * (8 - t1));
          n1 = t1 * 10 + u1;
          n2 = t2 * 10 + u2;
        } else {
          n1 = 10 + Math.floor(Math.random() * 40);
          n2 = 10 + Math.floor(Math.random() * 40);
        }

        this.num1 = n1;
        this.num2 = n2;
        if (input1) input1.value = n1;
        if (input2) input2.value = n2;
        this.isCurrentProblemSolved = false;
        window.appState.showToast(`Soal acak: ${n1} + ${n2}!`, "🎲");
        this.renderCurrentMode();
      });
    }
  }

  bindActionButtons() {
    const checkBtn = document.getElementById('btnCheckPractice');
    const resetBtn = document.getElementById('btnResetPractice');
    const hintBtn = document.getElementById('btnHintPractice');

    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkCurrentMode());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.soundApp.playClick();
        this.renderCurrentMode();
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.showHint());
    }
  }

  // Perhitungan dinamis matematika
  getMathDetails() {
    const t1 = Math.floor(this.num1 / 10);
    const u1 = this.num1 % 10;
    const t2 = Math.floor(this.num2 / 10);
    const u2 = this.num2 % 10;

    const tensValue1 = t1 * 10;
    const tensValue2 = t2 * 10;
    const tensSumValue = tensValue1 + tensValue2;

    const unitsSum = u1 + u2;
    const carryTens = Math.floor(unitsSum / 10);
    const finalUnit = unitsSum % 10;

    const totalTensValue = tensSumValue + carryTens * 10;
    const totalSum = this.num1 + this.num2;
    const isWithCarry = unitsSum >= 10;

    return {
      t1, u1, t2, u2,
      tensValue1, tensValue2, tensSumValue,
      unitsSum, carryTens, finalUnit,
      totalTensValue, totalSum, isWithCarry
    };
  }

  renderCurrentMode() {
    const container = document.getElementById('practiceInteractiveArea');
    if (!container) return;

    const d = this.getMathDetails();
    let html = '';

    if (this.activeMode === 1) {
      // Mode 1: Uraian Bilangan Bersusun Panjang
      if (d.isWithCarry) {
        html = `
          <div style="text-align:center;margin-bottom:15px;">
            <h3 style="font-family:var(--font-display);color:#0369a1;font-size:1.4rem;">
              Uraikan dan Jumlahkan: ${this.num1} + ${this.num2}
            </h3>
            <p style="font-size:0.95rem;color:#475569;">Isi setiap kotak kosong di bawah ini!</p>
          </div>
          <div class="worksheet-board">
            <div class="ws-calc-grid-table">
              <!-- Baris 1: Bilangan 1 -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label">${this.num1}</span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_t1" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_u1" placeholder="?">
                </div>
              </div>

              <!-- Baris 2: Bilangan 2 -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label">${this.num2}</span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_t2" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_u2" placeholder="?">
                </div>
              </div>

              <!-- Garis Pemisah -->
              <div class="ws-grid-divider"></div>

              <!-- Baris 3: Jumlah puluhan + satuan -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label ws-empty"></span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_sumTens" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_sumUnits" placeholder="?">
                </div>
              </div>

              <!-- Baris 4: Tiga Kolom Menyimpan (Puluhan + Simpanan + Satuan) -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label ws-empty"></span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_tSum" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_carryT" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_remU" placeholder="?">
                </div>
              </div>

              <!-- Baris 5: Puluhan Gabungan + Satuan -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label ws-empty"></span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_finalT" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_finalU" placeholder="?">
                </div>
              </div>

              <!-- Baris 6: Total Akhir -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label ws-empty"></span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_total" placeholder="?" style="width:90px;border-color:#0284c7;">
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Tanpa menyimpan
        html = `
          <div style="text-align:center;margin-bottom:15px;">
            <h3 style="font-family:var(--font-display);color:#0369a1;font-size:1.4rem;">
              Uraikan dan Jumlahkan: ${this.num1} + ${this.num2} (Tanpa Menyimpan)
            </h3>
            <p style="font-size:0.95rem;color:#475569;">Isi kotak puluhan dan satuan!</p>
          </div>
          <div class="worksheet-board">
            <div class="ws-calc-grid-table">
              <!-- Baris 1: Bilangan 1 -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label">${this.num1}</span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_t1" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_u1" placeholder="?">
                </div>
              </div>

              <!-- Baris 2: Bilangan 2 -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label">${this.num2}</span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_t2" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_u2" placeholder="?">
                </div>
              </div>

              <!-- Garis Pemisah -->
              <div class="ws-grid-divider"></div>

              <!-- Baris 3: Jumlah puluhan + satuan -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label ws-empty"></span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_sumTens" placeholder="?">
                  <span class="ws-math-plus">+</span>
                  <input type="number" class="interactive-ws-input" id="m1_sumUnits" placeholder="?">
                </div>
              </div>

              <!-- Baris 4: Total Akhir -->
              <div class="ws-grid-row">
                <div class="ws-grid-label">
                  <span class="ws-num-label ws-empty"></span>
                  <span class="ws-eq-sign">=</span>
                </div>
                <div class="ws-grid-content">
                  <input type="number" class="interactive-ws-input" id="m1_total" placeholder="?" style="width:90px;border-color:#0284c7;">
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
    else if (this.activeMode === 2) {
      // Mode 2: Langkah Penyimpanan
      html = `
        <div style="text-align:center;margin-bottom:15px;">
          <h3 style="font-family:var(--font-display);color:#0369a1;font-size:1.4rem;">
            Langkah Menyimpan: ${this.num1} + ${this.num2}
          </h3>
          <p style="font-size:0.95rem;color:#475569;">Pahami pertukaran 10 satuan menjadi puluhan simpanan!</p>
        </div>
        <div class="worksheet-board" style="max-width:580px;">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="step-check-row">
              <span style="font-weight:700;">1. Penjumlahan Satuan (${d.u1} + ${d.u2}) =</span>
              <input type="number" class="interactive-ws-input" id="m2_unitsSum" placeholder="?">
            </div>
            <div class="step-check-row">
              <span style="font-weight:700;">2. Angka Satuan pada Hasil Akhir =</span>
              <input type="number" class="interactive-ws-input" id="m2_finalUnit" placeholder="?">
            </div>
            <div class="step-check-row">
              <span style="font-weight:700;">3. Angka Puluhan yang Disimpan =</span>
              <input type="number" class="interactive-ws-input" id="m2_carry" placeholder="?">
            </div>
            <div class="step-check-row">
              <span style="font-weight:700;">4. Jumlah Puluhan (${d.t1} + ${d.t2} + simpanan) =</span>
              <input type="number" class="interactive-ws-input" id="m2_tensSum" placeholder="?">
            </div>
            <div class="step-check-row step-final">
              <span style="font-weight:800;color:#15803d;font-size:1.15rem;">5. Hasil Akhir (${this.num1} + ${this.num2}) =</span>
              <input type="number" class="interactive-ws-input" id="m2_total" placeholder="?" style="width:85px;border-color:#22c55e;">
            </div>
          </div>
        </div>
      `;
    }
    else if (this.activeMode === 3) {
      // Mode 3: Penjumlahan Bersusun (Kolom Vertikal)
      html = `
        <div style="text-align:center;margin-bottom:15px;">
          <h3 style="font-family:var(--font-display);color:#0369a1;font-size:1.4rem;">
            Penjumlahan Bersusun: ${this.num1} + ${this.num2}
          </h3>
          <p style="font-size:0.95rem;color:#475569;">Tuliskan angka simpanan di lingkaran atas jika ada!</p>
        </div>
        <div class="vertical-addition-board">
          <table class="vert-table">
            <thead>
              <tr style="font-size:1.1rem;color:#64748b;">
                <th>P</th>
                <th>S</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="carry-box-cell">
                  <input type="number" class="interactive-ws-input" id="m3_carry" placeholder="0" style="width:48px;height:48px;border-radius:50%;font-size:1.2rem;border-color:#f59e0b;" title="Simpanan">
                </td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>${d.t1}</td>
                <td>${d.u1}</td>
                <td></td>
              </tr>
              <tr>
                <td>${d.t2}</td>
                <td>${d.u2}</td>
                <td style="font-size:2rem;color:#0284c7;font-weight:900;">+</td>
              </tr>
              <tr class="vert-divider-row">
                <td colspan="3"></td>
              </tr>
              <tr>
                <td><input type="number" class="interactive-ws-input" id="m3_tens" placeholder="?" style="width:58px;"></td>
                <td><input type="number" class="interactive-ws-input" id="m3_units" placeholder="?" style="width:58px;"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div class="carry-arrow-note">
            <span>💡 <strong>Tips:</strong> Mulai hitung dari kolom SATUAN (kanan), lalu pindah ke kolom PULUHAN (kiri)!</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  checkCurrentMode() {
    const d = this.getMathDetails();
    let isAllCorrect = true;

    if (this.activeMode === 1) {
      const eT1 = document.getElementById('m1_t1');
      const eU1 = document.getElementById('m1_u1');
      const eT2 = document.getElementById('m1_t2');
      const eU2 = document.getElementById('m1_u2');
      const eSumT = document.getElementById('m1_sumTens');
      const eSumU = document.getElementById('m1_sumUnits');
      const eTotal = document.getElementById('m1_total');

      this.markInput(eT1, parseInt(eT1?.value, 10) === d.tensValue1);
      this.markInput(eU1, parseInt(eU1?.value, 10) === d.u1);
      this.markInput(eT2, parseInt(eT2?.value, 10) === d.tensValue2);
      this.markInput(eU2, parseInt(eU2?.value, 10) === d.u2);
      this.markInput(eSumT, parseInt(eSumT?.value, 10) === d.tensSumValue);
      this.markInput(eSumU, parseInt(eSumU?.value, 10) === d.unitsSum);

      if (d.isWithCarry) {
        const eCarryT = document.getElementById('m1_carryT');
        const eRemU = document.getElementById('m1_remU');
        const eFinalT = document.getElementById('m1_finalT');
        const eFinalU = document.getElementById('m1_finalU');
        const eTSum = document.getElementById('m1_tSum');

        this.markInput(eTSum, parseInt(eTSum?.value, 10) === d.tensSumValue);
        this.markInput(eCarryT, parseInt(eCarryT?.value, 10) === d.carryTens * 10);
        this.markInput(eRemU, parseInt(eRemU?.value, 10) === d.finalUnit);
        this.markInput(eFinalT, parseInt(eFinalT?.value, 10) === d.totalTensValue);
        this.markInput(eFinalU, parseInt(eFinalU?.value, 10) === d.finalUnit);
      }

      this.markInput(eTotal, parseInt(eTotal?.value, 10) === d.totalSum);

      const allInputs = document.querySelectorAll('#practiceInteractiveArea input');
      allInputs.forEach(inp => {
        if (!inp.classList.contains('correct')) isAllCorrect = false;
      });
    }
    else if (this.activeMode === 2) {
      const eUnitsSum = document.getElementById('m2_unitsSum');
      const eFinalU = document.getElementById('m2_finalUnit');
      const eCarry = document.getElementById('m2_carry');
      const eTensSum = document.getElementById('m2_tensSum');
      const eTotal = document.getElementById('m2_total');

      this.markInput(eUnitsSum, parseInt(eUnitsSum?.value, 10) === d.unitsSum);
      this.markInput(eFinalU, parseInt(eFinalU?.value, 10) === d.finalUnit);
      this.markInput(eCarry, parseInt(eCarry?.value, 10) === d.carryTens);
      this.markInput(eTensSum, parseInt(eTensSum?.value, 10) === (d.t1 + d.t2 + d.carryTens));
      this.markInput(eTotal, parseInt(eTotal?.value, 10) === d.totalSum);

      const allInputs = document.querySelectorAll('#practiceInteractiveArea input');
      allInputs.forEach(inp => {
        if (!inp.classList.contains('correct')) isAllCorrect = false;
      });
    }
    else if (this.activeMode === 3) {
      const eCarry = document.getElementById('m3_carry');
      const eTens = document.getElementById('m3_tens');
      const eUnits = document.getElementById('m3_units');

      const expectedCarry = d.carryTens;
      const actualCarry = parseInt(eCarry?.value || 0, 10);
      this.markInput(eCarry, actualCarry === expectedCarry);

      const expectedTens = Math.floor(d.totalSum / 10);
      const expectedUnits = d.totalSum % 10;
      this.markInput(eTens, parseInt(eTens?.value, 10) === expectedTens);
      this.markInput(eUnits, parseInt(eUnits?.value, 10) === expectedUnits);

      const allInputs = document.querySelectorAll('#practiceInteractiveArea input');
      allInputs.forEach(inp => {
        if (!inp.classList.contains('correct')) isAllCorrect = false;
      });
    }

    if (isAllCorrect) {
      window.soundApp.playCorrect();
      window.appState.showToast("Hebat sekali! Semua langkah terisi dengan benar!", "🌟");
      if (!this.isCurrentProblemSolved) {
        window.appState.addScore(100);
        this.isCurrentProblemSolved = true;
      }
      window.soundApp.speak(`Hebat! Jawaban ${this.num1} tambah ${this.num2} adalah ${d.totalSum}! Gerbang Pos 5 sekarang sudah terbuka!`);

      // Tandai tantangan Pos 4 selesai & perbarui UI tombol lanjut
      window.appState.setChallengeDone(4);
      this.updateNextButtonUI();
    } else {
      window.soundApp.playWrong();
      window.appState.recordWrongAnswer();
      window.appState.showToast("Ada bagian yang perlu diperiksa lagi ya! Cek kotak yang berwarna merah.", "💡");
    }
  }

  updateNextButtonUI() {
    const btn = document.getElementById('btnNextMission4');
    const heading = document.getElementById('mission4Heading');
    const subtext = document.getElementById('mission4Subtext');
    const s = window.appState;
    if (!btn || !s) return;

    const isDone = s.isChallengeDone(4);
    btn.classList.toggle('is-locked', !isDone);
    btn.classList.toggle('glow-pulse', isDone);

    if (isDone) {
      btn.innerHTML = `<span class="btn-flow-icon">✓</span> <span class="btn-flow-text">Selesai Pos 4 ➔ Lanjut Pos 5 (Game Pesawat)!</span> <span class="btn-flow-arrow">❯</span>`;
      if (heading) heading.innerHTML = "🎉 Latihan Sukses! Gerbang Pos 5 Siap Dibuka!";
      if (subtext) subtext.innerHTML = "Hebat! Kamu sudah berhasil memecahkan soal latihan dengan benar. Ayo lanjut ke <strong>Pos 5: Misi Udara Pesawat</strong>!";
    } else {
      btn.innerHTML = `<span class="btn-flow-icon">🔒</span> <span class="btn-flow-text">Kerjakan Soal ➔ Lanjut Pos 5</span> <span class="btn-flow-arrow">❯</span>`;
    }
  }

  markInput(el, isCorrect) {
    if (!el) return;
    el.classList.remove('correct', 'wrong');
    if (isCorrect) {
      el.classList.add('correct');
    } else {
      el.classList.add('wrong');
    }
  }

  showHint() {
    window.soundApp.playClick();
    const d = this.getMathDetails();
    let hintText = "";
    if (d.isWithCarry) {
      hintText = `Perhatikan satuan: ${d.u1} + ${d.u2} = ${d.unitsSum}. Karena di atas 9, simpan ${d.carryTens} puluhan dan tulis ${d.finalUnit} di satuan!`;
    } else {
      hintText = `Soal ini tidak memerlukan simpanan! Cukup jumlahkan satuan (${d.u1}+${d.u2}) dan puluhan (${d.t1}+${d.t2}).`;
    }
    window.appState.showToast(hintText, "💡");
    window.soundApp.speak(hintText);
  }
}

window.practiceEngine = new PracticeEngine();
