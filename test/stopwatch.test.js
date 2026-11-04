import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Stopwatch,
  formatTime,
  formatDelta,
  calculateStats,
  exportLapsCSV,
} from '../stopwatch.js';

test('formatTime() formats milliseconds properly', () => {
  assert.deepStrictEqual(formatTime(0), {
    hours: '00',
    minutes: '00',
    seconds: '00',
    centiseconds: '00',
    formatted: '00:00:00.00',
  });

  // 1 minute, 23 seconds, 450 ms -> 00:01:23.45
  const t1 = (1 * 60 + 23) * 1000 + 450;
  assert.strictEqual(formatTime(t1).formatted, '00:01:23.45');

  // Without hours -> 01:23.45
  assert.strictEqual(formatTime(t1, false).formatted, '01:23.45');

  // 2 hours, 5 minutes, 9 seconds, 80 ms -> 02:05:09.08
  const t2 = (2 * 3600 + 5 * 60 + 9) * 1000 + 80;
  assert.strictEqual(formatTime(t2).formatted, '02:05:09.08');

  // Negative / NaN fallbacks
  assert.strictEqual(formatTime(-500).formatted, '00:00:00.00');
  assert.strictEqual(formatTime(NaN).formatted, '00:00:00.00');
});

test('formatDelta() calculates differences accurately', () => {
  // First lap has no previous lap
  const d0 = formatDelta(15000, 0);
  assert.strictEqual(d0.text, '--');
  assert.strictEqual(d0.sign, 'neutral');

  // Slower lap (+2.50s)
  const d1 = formatDelta(17500, 15000);
  assert.strictEqual(d1.text, '+00:02.50');
  assert.strictEqual(d1.sign, 'positive');

  // Faster lap (-1.20s)
  const d2 = formatDelta(13800, 15000);
  assert.strictEqual(d2.text, '-00:01.20');
  assert.strictEqual(d2.sign, 'negative');

  // Equal lap
  const d3 = formatDelta(15000, 15000);
  assert.strictEqual(d3.text, '±00:00.00');
  assert.strictEqual(d3.sign, 'neutral');
});

test('calculateStats() calculates fastest, slowest, and average lap', () => {
  assert.deepStrictEqual(calculateStats([]), {
    count: 0,
    fastestId: null,
    slowestId: null,
    fastestTime: 0,
    slowestTime: 0,
    averageTime: 0,
  });

  const singleLap = [{ id: 1, number: 1, lapTime: 10000, overallTime: 10000 }];
  const singleStat = calculateStats(singleLap);
  assert.strictEqual(singleStat.count, 1);
  assert.strictEqual(singleStat.fastestId, null); // should not highlight when only 1 lap
  assert.strictEqual(singleStat.averageTime, 10000);

  const multipleLaps = [
    { id: 1, number: 1, lapTime: 20000, overallTime: 20000 },
    { id: 2, number: 2, lapTime: 15000, overallTime: 35000 }, // fastest
    { id: 3, number: 3, lapTime: 25000, overallTime: 60000 }, // slowest
  ];

  const multiStat = calculateStats(multipleLaps);
  assert.strictEqual(multiStat.count, 3);
  assert.strictEqual(multiStat.fastestId, 2);
  assert.strictEqual(multiStat.slowestId, 3);
  assert.strictEqual(multiStat.fastestTime, 15000);
  assert.strictEqual(multiStat.slowestTime, 25000);
  assert.strictEqual(multiStat.averageTime, 20000);
});

test('exportLapsCSV() exports valid CSV structure', () => {
  const laps = [
    { number: 1, lapTime: 15200, overallTime: 15200 },
    { number: 2, lapTime: 14100, overallTime: 29300 },
  ];

  const csv = exportLapsCSV(laps);
  assert.match(csv, /Lap Number,Lap Duration,Overall Elapsed Time/);
  assert.match(csv, /1,"00:00:15.20","00:00:15.20",15200,15200/);
  assert.match(csv, /2,"00:00:14.10","00:00:29.30",14100,29300/);
});

test('Stopwatch state machine: start, pause, resume, reset with mocked clock', () => {
  let simulatedTime = 1000;
  const nowFn = () => simulatedTime;

  let lastState = null;
  const sw = new Stopwatch({
    nowFn,
    onStateChange: (s) => {
      lastState = s;
    },
  });

  assert.strictEqual(sw.state, 'STOPPED');
  assert.strictEqual(sw.getElapsedTime(), 0);

  // Start
  sw.start();
  assert.strictEqual(sw.state, 'RUNNING');
  assert.strictEqual(lastState, 'RUNNING');

  // Advance clock by 3.5 seconds
  simulatedTime += 3500;
  assert.strictEqual(sw.getElapsedTime(), 3500);

  // Pause
  sw.pause();
  assert.strictEqual(sw.state, 'PAUSED');
  assert.strictEqual(lastState, 'PAUSED');
  assert.strictEqual(sw.getElapsedTime(), 3500);

  // Advance time while paused: elapsed should not change
  simulatedTime += 2000;
  assert.strictEqual(sw.getElapsedTime(), 3500);

  // Resume
  sw.start();
  assert.strictEqual(sw.state, 'RUNNING');
  simulatedTime += 1500;
  assert.strictEqual(sw.getElapsedTime(), 5000);

  // Record Lap 1 (at 5.00s)
  const lap1 = sw.recordLap();
  assert.strictEqual(lap1.number, 1);
  assert.strictEqual(lap1.lapTime, 5000);
  assert.strictEqual(lap1.overallTime, 5000);

  // Advance 3.00s and record Lap 2
  simulatedTime += 3000;
  const lap2 = sw.recordLap();
  assert.strictEqual(lap2.number, 2);
  assert.strictEqual(lap2.lapTime, 3000);
  assert.strictEqual(lap2.overallTime, 8000);
  assert.strictEqual(lap2.delta.diffMs, -2000); // 2 seconds faster than lap 1

  // Reset
  sw.reset();
  assert.strictEqual(sw.state, 'STOPPED');
  assert.strictEqual(sw.getElapsedTime(), 0);
  assert.strictEqual(sw.laps.length, 0);
});
