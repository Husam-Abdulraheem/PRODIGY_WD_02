/**
 * PRODIGY_WD_02: Stopwatch Web Application Controller
 * High-precision timing, UI reactivity, Web Audio synthesis, and accessibility.
 */

import {
  Stopwatch,
  formatTime,
  calculateStats,
  exportLapsCSV,
} from './stopwatch.js';

/* ==========================================================================
   Sound Synthesizer (Web Audio API)
   ========================================================================== */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('prodigy_stopwatch_muted') === 'true';
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('prodigy_stopwatch_muted', String(this.muted));
    return this.muted;
  }

  playTone(freq, duration = 0.08, type = 'sine', gainVal = 0.15) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {
      // Audio playback failsafe
    }
  }

  playStart() {
    this.playTone(600, 0.06, 'triangle', 0.2);
    setTimeout(() => this.playTone(900, 0.09, 'triangle', 0.25), 60);
  }

  playPause() {
    this.playTone(800, 0.06, 'sine', 0.18);
    setTimeout(() => this.playTone(450, 0.1, 'sine', 0.18), 60);
  }

  playLap() {
    this.playTone(1100, 0.08, 'sine', 0.22);
  }

  playReset() {
    this.playTone(400, 0.05, 'triangle', 0.15);
    setTimeout(() => this.playTone(320, 0.08, 'triangle', 0.15), 50);
  }
}

/* ==========================================================================
   Application Controller
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Sound
  const sfx = new SoundEffects();

  // DOM Elements: Display
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const centisecondsEl = document.getElementById('centiseconds');
  const currentLapSplitEl = document.getElementById('currentLapSplit');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const progressCircle = document.getElementById('progressCircle');

  // DOM Elements: Controls
  const startPauseBtn = document.getElementById('startPauseBtn');
  const startPauseText = document.getElementById('startPauseText');
  const iconPlay = startPauseBtn.querySelector('.icon-play');
  const iconPause = startPauseBtn.querySelector('.icon-pause');
  const lapBtn = document.getElementById('lapBtn');
  const resetBtn = document.getElementById('resetBtn');

  // DOM Elements: Stats
  const statLapsCountEl = document.getElementById('statLapsCount');
  const statFastestTimeEl = document.getElementById('statFastestTime');
  const statFastestLapNumEl = document.getElementById('statFastestLapNum');
  const statSlowestTimeEl = document.getElementById('statSlowestTime');
  const statSlowestLapNumEl = document.getElementById('statSlowestLapNum');
  const statAverageTimeEl = document.getElementById('statAverageTime');

  // DOM Elements: Laps Table & Actions
  const lapsEmptyState = document.getElementById('lapsEmptyState');
  const lapsTable = document.getElementById('lapsTable');
  const lapsTableBody = document.getElementById('lapsTableBody');
  const lapsBadge = document.getElementById('lapsBadge');
  const copyLapsBtn = document.getElementById('copyLapsBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const clearLapsBtn = document.getElementById('clearLapsBtn');

  // DOM Elements: Header & Extras
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const themeBtn = document.getElementById('themeBtn');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const shortcutsDialog = document.getElementById('shortcutsDialog');
  const closeDialogBtn = document.getElementById('closeDialogBtn');
  const dialogOkBtn = document.getElementById('dialogOkBtn');
  const liveAnnouncer = document.getElementById('liveAnnouncer');
  const toastEl = document.getElementById('toast');

  // Circumference for r=140: 2 * Math.PI * 140 = 879.6459
  const CIRCUMFERENCE = 879.6459;
  progressCircle.style.strokeDasharray = `${CIRCUMFERENCE}`;
  progressCircle.style.strokeDashoffset = `${CIRCUMFERENCE}`;

  // Toast Timer Reference
  let toastTimeout = null;

  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    toastTimeout = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2800);
  }

  function announce(msg) {
    if (liveAnnouncer) {
      liveAnnouncer.textContent = msg;
    }
  }

  // Synchronize Sound Button UI with initial state
  function updateSoundButton() {
    if (sfx.muted) {
      soundToggleBtn.classList.add('muted');
      soundToggleBtn.setAttribute('aria-label', 'Unmute sound effects');
      soundToggleBtn.title = 'Unmute Sound (M)';
    } else {
      soundToggleBtn.classList.remove('muted');
      soundToggleBtn.setAttribute('aria-label', 'Mute sound effects');
      soundToggleBtn.title = 'Mute Sound (M)';
    }
  }
  updateSoundButton();

  // Theme Management
  const themes = ['indigo', 'midnight', 'light'];
  const savedTheme = localStorage.getItem('prodigy_stopwatch_theme') || 'indigo';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function cycleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'indigo';
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('prodigy_stopwatch_theme', nextTheme);

    const themeNames = { indigo: 'Cyber Indigo', midnight: 'Midnight Dark', light: 'Nordic Light' };
    showToast(`Theme: ${themeNames[nextTheme]}`);
    announce(`Theme changed to ${themeNames[nextTheme]}`);
  }

  // Instantiate Core Stopwatch Engine
  const stopwatch = new Stopwatch({
    onTick: ({ elapsedMs, formatted, state }) => {
      hoursEl.textContent = formatted.hours;
      minutesEl.textContent = formatted.minutes;
      secondsEl.textContent = formatted.seconds;
      centisecondsEl.textContent = formatted.centiseconds;

      // Update Current Lap Split (Overall - lastLapElapsed)
      const currentLapDuration = elapsedMs - stopwatch.lastLapElapsed;
      const lapTimeObj = formatTime(currentLapDuration, false);
      currentLapSplitEl.textContent = lapTimeObj.formatted;

      // Update SVG Ring Progress (loops smoothly every 60 seconds)
      const secondFraction = (elapsedMs % 60000) / 60000;
      const offset = CIRCUMFERENCE - (secondFraction * CIRCUMFERENCE);
      progressCircle.style.strokeDashoffset = `${offset}`;
    },

    onStateChange: (state) => {
      updateUIState(state);
    },

    onLap: () => {
      renderLaps();
    },
  });

  function updateUIState(state) {
    statusBadge.className = 'status-indicator-badge';

    if (state === 'RUNNING') {
      statusBadge.classList.add('running');
      statusText.textContent = 'RUNNING';

      startPauseBtn.classList.add('running');
      startPauseBtn.setAttribute('aria-label', 'Pause stopwatch');
      startPauseText.textContent = 'Pause';
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');

      lapBtn.disabled = false;
      resetBtn.disabled = false;

      announce('Stopwatch running');
    } else if (state === 'PAUSED') {
      statusBadge.classList.add('paused');
      statusText.textContent = 'PAUSED';

      startPauseBtn.classList.remove('running');
      startPauseBtn.setAttribute('aria-label', 'Resume stopwatch');
      startPauseText.textContent = 'Resume';
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');

      lapBtn.disabled = false;
      resetBtn.disabled = false;

      const formatted = formatTime(stopwatch.getElapsedTime()).formatted;
      announce(`Stopwatch paused at ${formatted}`);
    } else {
      // STOPPED
      statusText.textContent = 'READY';

      startPauseBtn.classList.remove('running');
      startPauseBtn.setAttribute('aria-label', 'Start stopwatch');
      startPauseText.textContent = 'Start';
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');

      lapBtn.disabled = true;
      resetBtn.disabled = true;

      progressCircle.style.strokeDashoffset = `${CIRCUMFERENCE}`;
      currentLapSplitEl.textContent = '00:00.00';

      announce('Stopwatch reset to zero');
    }
  }

  function renderLaps() {
    const laps = stopwatch.laps;
    const stats = calculateStats(laps);

    // Update Counter & Action Buttons
    lapsBadge.textContent = `${laps.length} recorded`;
    const hasLaps = laps.length > 0;
    copyLapsBtn.disabled = !hasLaps;
    exportCsvBtn.disabled = !hasLaps;
    clearLapsBtn.disabled = !hasLaps;

    // Update Statistics Cards
    statLapsCountEl.textContent = String(stats.count);

    if (stats.count >= 1) {
      statFastestTimeEl.textContent = formatTime(stats.fastestTime, false).formatted;
      statFastestLapNumEl.textContent = stats.fastestId ? `Lap #${stats.fastestId}` : 'Best so far';

      statSlowestTimeEl.textContent = formatTime(stats.slowestTime, false).formatted;
      statSlowestLapNumEl.textContent = stats.slowestId ? `Lap #${stats.slowestId}` : 'Slowest so far';

      statAverageTimeEl.textContent = formatTime(stats.averageTime, false).formatted;
    } else {
      statFastestTimeEl.textContent = '--:--.--';
      statFastestLapNumEl.textContent = 'No laps yet';

      statSlowestTimeEl.textContent = '--:--.--';
      statSlowestLapNumEl.textContent = 'No laps yet';

      statAverageTimeEl.textContent = '--:--.--';
    }

    // Toggle Empty State vs Table
    if (!hasLaps) {
      lapsEmptyState.classList.remove('hidden');
      lapsTable.classList.add('hidden');
      lapsTableBody.innerHTML = '';
      return;
    }

    lapsEmptyState.classList.add('hidden');
    lapsTable.classList.remove('hidden');

    // Build Table Rows
    lapsTableBody.innerHTML = laps.map((lap) => {
      const isFastest = stats.fastestId === lap.id;
      const isSlowest = stats.slowestId === lap.id;
      const splitTimeFormatted = formatTime(lap.lapTime, false).formatted;
      const overallTimeFormatted = formatTime(lap.overallTime, true).formatted;

      let badgeHtml = '';
      if (isFastest) {
        badgeHtml = `<span class="lap-pill-tag fastest">Fastest</span>`;
      } else if (isSlowest) {
        badgeHtml = `<span class="lap-pill-tag slowest">Slowest</span>`;
      }

      return `
        <tr class="lap-row">
          <td>
            <span class="td-lap-badge">#${lap.number}</span>
          </td>
          <td>
            <div class="time-with-badge">
              <span class="time-main-val">${splitTimeFormatted}</span>
              ${badgeHtml}
            </div>
          </td>
          <td>
            <span class="text-muted">${overallTimeFormatted}</span>
          </td>
          <td>
            <span class="delta-badge ${lap.delta.sign}">${lap.delta.text}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // User Actions
  function handleStartPause() {
    if (stopwatch.state === 'RUNNING') {
      sfx.playPause();
      stopwatch.pause();
    } else {
      sfx.playStart();
      stopwatch.start();
    }
  }

  function handleLap() {
    if (stopwatch.state === 'STOPPED') return;
    sfx.playLap();
    const lap = stopwatch.recordLap();
    if (lap) {
      const formatted = formatTime(lap.lapTime, false).formatted;
      announce(`Lap ${lap.number} recorded: ${formatted}`);
      showToast(`Lap ${lap.number}: ${formatted}`);
    }
  }

  function handleReset() {
    if (stopwatch.getElapsedTime() === 0 && stopwatch.laps.length === 0) return;
    sfx.playReset();
    stopwatch.reset();
    renderLaps();
    showToast('Stopwatch reset');
  }

  function handleCopyLaps() {
    if (stopwatch.laps.length === 0) return;
    const lines = [
      'Prodigy Stopwatch - Lap Times',
      `Date: ${new Date().toLocaleString()}`,
      '----------------------------------------',
      'Lap # | Split Time | Overall Time | Delta',
      '----------------------------------------',
    ];

    // Laps are stored descending; print in chronological order
    const chronoLaps = [...stopwatch.laps].reverse();
    for (const lap of chronoLaps) {
      const split = formatTime(lap.lapTime, false).formatted;
      const overall = formatTime(lap.overallTime, true).formatted;
      lines.push(`#${lap.number.toString().padEnd(4)}| ${split.padEnd(11)}| ${overall.padEnd(13)}| ${lap.delta.text}`);
    }

    const textToCopy = lines.join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        showToast('Lap records copied to clipboard!');
        announce('Lap records copied to clipboard');
      })
      .catch(() => {
        showToast('Failed to copy to clipboard');
      });
  }

  function handleExportCsv() {
    if (stopwatch.laps.length === 0) return;
    const csvContent = exportLapsCSV(stopwatch.laps);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stopwatch_laps_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded laps CSV');
    announce('Downloaded laps CSV file');
  }

  function handleClearLaps() {
    if (stopwatch.laps.length === 0) return;
    stopwatch.clearLaps();
    renderLaps();
    showToast('Lap history cleared');
    announce('Lap history cleared');
  }

  // Event Listeners: Main Buttons
  startPauseBtn.addEventListener('click', handleStartPause);
  lapBtn.addEventListener('click', handleLap);
  resetBtn.addEventListener('click', handleReset);

  // Event Listeners: Laps Actions
  copyLapsBtn.addEventListener('click', handleCopyLaps);
  exportCsvBtn.addEventListener('click', handleExportCsv);
  clearLapsBtn.addEventListener('click', handleClearLaps);

  // Event Listeners: Header Controls
  soundToggleBtn.addEventListener('click', () => {
    const isMuted = sfx.toggleMute();
    updateSoundButton();
    showToast(isMuted ? 'Sound muted' : 'Sound unmuted');
    announce(isMuted ? 'Sound muted' : 'Sound unmuted');
  });

  themeBtn.addEventListener('click', cycleTheme);

  // Keyboard Shortcuts Dialog Management
  function openShortcutsDialog() {
    if (shortcutsDialog && typeof shortcutsDialog.showModal === 'function') {
      shortcutsDialog.showModal();
    }
  }

  function closeShortcutsDialog() {
    if (shortcutsDialog && typeof shortcutsDialog.close === 'function') {
      shortcutsDialog.close();
    }
  }

  shortcutsBtn.addEventListener('click', openShortcutsDialog);
  closeDialogBtn.addEventListener('click', closeShortcutsDialog);
  dialogOkBtn.addEventListener('click', closeShortcutsDialog);

  // Close dialog when clicking on backdrop
  shortcutsDialog.addEventListener('click', (e) => {
    const rect = shortcutsDialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      closeShortcutsDialog();
    }
  });

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore keystrokes when typing inside text controls
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      return;
    }

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      handleStartPause();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      handleLap();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      handleReset();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      soundToggleBtn.click();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      cycleTheme();
    } else if (e.key === 'c' || e.key === 'C') {
      if (!copyLapsBtn.disabled) {
        e.preventDefault();
        handleCopyLaps();
      }
    } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      openShortcutsDialog();
    }
  });
});
