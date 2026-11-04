/**
 * Pure Stopwatch Engine & Utility Functions
 * PRODIGY_WD_02 - Stopwatch Web Application
 */

/**
 * Formats a duration in milliseconds into a structured time object and string.
 * @param {number} ms - Milliseconds (positive number).
 * @param {boolean} [showHours=true] - Whether to include hours segment.
 * @returns {{ hours: string, minutes: string, seconds: string, centiseconds: string, formatted: string }}
 */
export function formatTime(ms, showHours = true) {
  if (typeof ms !== 'number' || isNaN(ms) || ms < 0) {
    ms = 0;
  }

  const totalMilliseconds = Math.floor(ms);
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((totalMilliseconds % 1000) / 10);

  const pad = (num, digits = 2) => String(num).padStart(digits, '0');

  const hh = pad(hours);
  const mm = pad(minutes);
  const ss = pad(seconds);
  const cs = pad(centiseconds);

  const formatted = showHours
    ? `${hh}:${mm}:${ss}.${cs}`
    : `${mm}:${ss}.${cs}`;

  return {
    hours: hh,
    minutes: mm,
    seconds: ss,
    centiseconds: cs,
    formatted,
  };
}

/**
 * Computes delta string between two millisecond durations.
 * @param {number} current - Current lap duration in ms.
 * @param {number} previous - Previous lap duration in ms.
 * @returns {{ diffMs: number, text: string, sign: 'positive' | 'negative' | 'neutral' }}
 */
export function formatDelta(current, previous) {
  if (previous === 0 || previous === undefined || previous === null) {
    return { diffMs: 0, text: '--', sign: 'neutral' };
  }

  const diffMs = current - previous;
  const sign = diffMs > 0 ? 'positive' : diffMs < 0 ? 'negative' : 'neutral';
  const prefix = diffMs > 0 ? '+' : diffMs < 0 ? '-' : '±';
  const formattedAbs = formatTime(Math.abs(diffMs), false).formatted;

  return {
    diffMs,
    text: `${prefix}${formattedAbs}`,
    sign,
  };
}

/**
 * Analyzes an array of laps and computes statistical metrics.
 * @param {Array<{ id: number, number: number, lapTime: number, overallTime: number }>} laps
 * @returns {{ count: number, fastestId: number | null, slowestId: number | null, fastestTime: number, slowestTime: number, averageTime: number }}
 */
export function calculateStats(laps = []) {
  if (!Array.isArray(laps) || laps.length === 0) {
    return {
      count: 0,
      fastestId: null,
      slowestId: null,
      fastestTime: 0,
      slowestTime: 0,
      averageTime: 0,
    };
  }

  if (laps.length === 1) {
    const single = laps[0];
    return {
      count: 1,
      fastestId: null, // Don't badge single lap as both fastest and slowest
      slowestId: null,
      fastestTime: single.lapTime,
      slowestTime: single.lapTime,
      averageTime: single.lapTime,
    };
  }

  let minTime = Infinity;
  let maxTime = -Infinity;
  let fastestId = null;
  let slowestId = null;
  let totalTime = 0;

  for (const lap of laps) {
    totalTime += lap.lapTime;
    if (lap.lapTime < minTime) {
      minTime = lap.lapTime;
      fastestId = lap.id;
    }
    if (lap.lapTime > maxTime) {
      maxTime = lap.lapTime;
      slowestId = lap.id;
    }
  }

  const averageTime = Math.round(totalTime / laps.length);

  return {
    count: laps.length,
    fastestId,
    slowestId,
    fastestTime: minTime,
    slowestTime: maxTime,
    averageTime,
  };
}

/**
 * Generates CSV content from recorded laps.
 * @param {Array<{ number: number, lapTime: number, overallTime: number }>} laps
 * @returns {string}
 */
export function exportLapsCSV(laps = []) {
  const header = ['Lap Number', 'Lap Duration', 'Overall Elapsed Time', 'Lap Milliseconds', 'Overall Milliseconds'];
  const rows = laps.map((lap) => {
    const lapFormatted = formatTime(lap.lapTime, true).formatted;
    const overallFormatted = formatTime(lap.overallTime, true).formatted;
    return [
      lap.number,
      `"${lapFormatted}"`,
      `"${overallFormatted}"`,
      lap.lapTime,
      lap.overallTime,
    ].join(',');
  });

  return [header.join(','), ...rows].join('\r\n');
}

/**
 * Stopwatch Class managing monotonic high-precision timing state.
 */
export class Stopwatch {
  /**
   * @param {Object} [options]
   * @param {(state: { elapsedMs: number, formatted: object, state: string }) => void} [options.onTick]
   * @param {(lap: object, allLaps: object[]) => void} [options.onLap]
   * @param {(state: string) => void} [options.onStateChange]
   * @param {() => number} [options.nowFn]
   */
  constructor(options = {}) {
    this.state = 'STOPPED'; // 'STOPPED' | 'RUNNING' | 'PAUSED'
    this.elapsedBeforeCurrentRun = 0;
    this.startTimestamp = 0;
    this.currentElapsed = 0;
    this.laps = [];
    this.lastLapElapsed = 0;

    this.onTick = options.onTick || null;
    this.onLap = options.onLap || null;
    this.onStateChange = options.onStateChange || null;
    this.nowFn = options.nowFn || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

    this.animationFrameId = null;
    this.intervalId = null;
    this.boundTick = this.tick.bind(this);
  }

  /**
   * Current elapsed time in milliseconds.
   * @returns {number}
   */
  getElapsedTime() {
    if (this.state === 'RUNNING') {
      const now = this.nowFn();
      return this.elapsedBeforeCurrentRun + (now - this.startTimestamp);
    }
    return this.currentElapsed;
  }

  /**
   * Starts or resumes the stopwatch.
   * @returns {boolean} Whether start was successful.
   */
  start() {
    if (this.state === 'RUNNING') return false;

    this.startTimestamp = this.nowFn();
    this.state = 'RUNNING';

    if (this.onStateChange) this.onStateChange(this.state);

    this.startLoop();
    this.tick();
    return true;
  }

  /**
   * Pauses the stopwatch.
   * @returns {boolean} Whether pause was successful.
   */
  pause() {
    if (this.state !== 'RUNNING') return false;

    this.stopLoop();
    const now = this.nowFn();
    this.elapsedBeforeCurrentRun += (now - this.startTimestamp);
    this.currentElapsed = this.elapsedBeforeCurrentRun;
    this.state = 'PAUSED';

    if (this.onStateChange) this.onStateChange(this.state);
    if (this.onTick) {
      this.onTick({
        elapsedMs: this.currentElapsed,
        formatted: formatTime(this.currentElapsed),
        state: this.state,
      });
    }

    return true;
  }

  /**
   * Resets the stopwatch to 0 and clears laps.
   */
  reset() {
    this.stopLoop();
    this.state = 'STOPPED';
    this.elapsedBeforeCurrentRun = 0;
    this.startTimestamp = 0;
    this.currentElapsed = 0;
    this.laps = [];
    this.lastLapElapsed = 0;

    if (this.onStateChange) this.onStateChange(this.state);
    if (this.onTick) {
      this.onTick({
        elapsedMs: 0,
        formatted: formatTime(0),
        state: this.state,
      });
    }
  }

  /**
   * Records a lap.
   * @returns {object | null} The recorded lap, or null if stopwatch is stopped.
   */
  recordLap() {
    if (this.state === 'STOPPED') return null;

    const overallTime = this.getElapsedTime();
    const lapTime = overallTime - this.lastLapElapsed;
    const lapNumber = this.laps.length + 1;
    const previousLapTime = this.laps.length > 0 ? this.laps[0].lapTime : 0;
    const delta = formatDelta(lapTime, previousLapTime);

    const lap = {
      id: lapNumber,
      number: lapNumber,
      lapTime,
      overallTime,
      delta,
      timestamp: Date.now(),
    };

    // Prepend so newest lap appears at top of the table
    this.laps.unshift(lap);
    this.lastLapElapsed = overallTime;

    if (this.onLap) this.onLap(lap, this.laps);
    return lap;
  }

  /**
   * Clears only recorded laps without resetting elapsed time.
   */
  clearLaps() {
    this.laps = [];
    this.lastLapElapsed = this.getElapsedTime();
    if (this.onLap) this.onLap(null, this.laps);
  }

  /**
   * Starts animation frame and background timer interval.
   * @private
   */
  startLoop() {
    this.stopLoop();
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.boundTick);
    }
    // Heartbeat interval ensures updates persist if tab is throttled in background
    if (typeof setInterval !== 'undefined') {
      this.intervalId = setInterval(this.boundTick, 50);
    }
  }

  /**
   * Stops loop and interval.
   * @private
   */
  stopLoop() {
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.intervalId !== null && typeof clearInterval !== 'undefined') {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Execution tick.
   * @private
   */
  tick() {
    if (this.state !== 'RUNNING') return;

    const elapsed = this.getElapsedTime();
    this.currentElapsed = elapsed;

    if (this.onTick) {
      this.onTick({
        elapsedMs: elapsed,
        formatted: formatTime(elapsed),
        state: this.state,
      });
    }

    if (typeof requestAnimationFrame !== 'undefined' && this.state === 'RUNNING') {
      this.animationFrameId = requestAnimationFrame(this.boundTick);
    }
  }
}
