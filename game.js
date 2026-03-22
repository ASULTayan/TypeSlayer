/* ═══════════════════════════════════════════════════════════
   TYPESLAYER — game.js
   All game logic: Solo Quest, 1v1 Race, Boss Battle
═══════════════════════════════════════════════════════════ */

/* ─── DATA ─── */
const PASSAGES = [
  "The sun dipped below the horizon as the weary travelers made camp for the night. Stars began to emerge from the darkening sky, their light casting long shadows across the ancient stone path. A cool breeze carried the scent of pine and distant rain.",
  "Every great journey begins with a single step forward into the unknown. Those who dare to venture beyond the walls of comfort discover worlds invisible to those who stay behind. Courage is not the absence of fear but the decision that something else matters more.",
  "Speed is nothing without accuracy and accuracy means nothing without speed. The master typist knows that fingers must learn to think on their own, flowing across keys like water finding its level. Practice is the forge where champions are made.",
  "Deep in the dungeon beneath the castle the adventurer discovered a library of forgotten knowledge. Dust covered the shelves like grey snow and silence pressed against her ears like a physical weight. Within these pages lay the secrets of ancient power.",
  "The wizard typed furiously at the keyboard conjuring spells from pure language and logic. Each keystroke was a rune inscribed with intention and each line of code a thread woven into the great tapestry of the digital realm. Magic was just technology nobody understood yet.",
];

const WORDS = [
  'fire','blade','storm','swift','crush','blast','arrow','magic','power','force',
  'slash','dodge','guard','spell','rune','iron','flame','frost','light','dark',
  'strike','thrust','parry','evade','smash','cast','summon','invoke','charge','drain',
  'shield','sword','staff','curse','heal','surge','burst','nova','chain','bolt',
  'shock','pierce','slice','hack','cleave','void','soul','claw','fang','venom',
  'toxin','wrath','fury','chaos','ghost','shade','relic','ember','glyph','sigil',
  'echo','pulse','shard','wraith','inferno','tide','forge','summit','valor','swift',
];

const BOSSES = [
  { name: 'DRAGON LORD',  spr: '🐉', maxHp: 800, col: '#ff3355', atk: 12 },
  { name: 'SHADOW KING',  spr: '👾', maxHp: 700, col: '#bb66ff', atk: 10 },
  { name: 'DEATH KNIGHT', spr: '🦴', maxHp: 600, col: '#aaaaff', atk: 9  },
  { name: 'WITCH QUEEN',  spr: '🧙', maxHp: 550, col: '#ff66bb', atk: 8  },
  { name: 'GOLEM TYRANT', spr: '🗿', maxHp: 900, col: '#88aaff', atk: 14 },
];

const BOT_NAMES = ['SpeedDemon','KeyNinja','TyperPRO','WPM_God','FlashKeys','SwiftType','RapidFire','QuickKeys'];

/* ─── STATE ─── */
let sS = {}, rS = {}, bS = {};
let botTick = null, bAtk = null;

/* ═══════════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════════ */
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goHome() {
  clearAll();
  show('screen-home');
}

/* ═══════════════════════════════════════════════════════════
   TYPING ENGINE HELPERS
═══════════════════════════════════════════════════════════ */
function buildText(el, txt) {
  el.innerHTML = '';
  [...txt].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.dataset.i = i;
    s.textContent = c === ' ' ? '\u00A0' : c;
    el.appendChild(s);
  });
  setCursor(el, 0);
}

function setCursor(el, pos) {
  el.querySelectorAll('.ch').forEach((s, i) => {
    s.classList.remove('cur');
    if (i === pos) s.classList.add('cur');
  });
}

function markCh(el, pos, ok) {
  const spans = el.querySelectorAll('.ch');
  if (pos < spans.length) {
    spans[pos].classList.remove('cur', 'ok', 'bad');
    spans[pos].classList.add(ok ? 'ok' : 'bad');
  }
}

function calcWpm(chars, t0) {
  const minutes = (Date.now() - t0) / 60000;
  return minutes === 0 ? 0 : Math.round((chars / 5) / minutes);
}

function calcAcc(ok, tot) {
  return tot === 0 ? 100 : Math.round((ok / tot) * 100);
}

function setProgress(barId, pctId, pct) {
  document.getElementById(barId).style.width = pct + '%';
  document.getElementById(pctId).textContent = pct + '%';
}

function formatMs(ms) {
  const s = Math.round(ms / 1000);
  return s + 's';
}

/* ═══════════════════════════════════════════════════════════
   COUNTDOWN
═══════════════════════════════════════════════════════════ */
function countdown(cb) {
  const el = document.getElementById('countdown');
  el.classList.remove('hide');
  let n = 3;
  el.textContent = n;

  const t = setInterval(() => {
    n--;
    if (n === 0) {
      el.textContent = 'GO!';
      setTimeout(() => {
        el.classList.add('hide');
        clearInterval(t);
        cb();
      }, 600);
    } else {
      el.textContent = n;
    }
  }, 850);
}

/* ═══════════════════════════════════════════════════════════
   BOT TICKER (used by Solo & Race)
═══════════════════════════════════════════════════════════ */
function startBot(mode) {
  clearTick();
  botTick = setInterval(() => {
    const st = mode === 's' ? sS : rS;
    if (!st.t0) return;

    const elapsed = (Date.now() - st.t0) / 60000;
    const variance = 1 + (Math.random() - 0.5) * 0.22;
    const pos = Math.min(Math.round(elapsed * st.botWpm * 5 * variance), st.txt.length);
    const pct = Math.round((pos / st.txt.length) * 100);

    if (mode === 's') {
      sS.botPos = pos;
      document.getElementById('sp-bot').style.width = pct + '%';
      document.getElementById('spp-bot').textContent = pct + '%';

      if (pos >= st.txt.length && !sS.bF) {
        sS.bF = true;
        clearTick();
        if (!sS.pF) {
          document.getElementById('s-inp').disabled = true;
          showResult(false, calcWpm(sS.pos, sS.t0), calcAcc(sS.ok, sS.tot), (Date.now() - sS.t0), false, launchSolo);
        }
      }
    } else {
      rS.oppPos = pos;
      document.getElementById('rp-opp').style.width = pct + '%';
      document.getElementById('rpp-opp').textContent = pct + '%';

      if (pos >= st.txt.length && !rS.oF) {
        rS.oF = true;
        clearTick();
        if (!rS.pF) {
          document.getElementById('r-inp').disabled = true;
          showResult(false, calcWpm(rS.pos, rS.t0), calcAcc(rS.ok, rS.tot), (Date.now() - rS.t0), false, startRace);
        }
      }
    }
  }, 160);
}

function clearTick() {
  if (botTick) { clearInterval(botTick); botTick = null; }
}

/* ═══════════════════════════════════════════════════════════
   SOLO QUEST
═══════════════════════════════════════════════════════════ */
function startSolo() {
  show('screen-solo');
  document.getElementById('solo-setup').style.display = 'flex';
  document.getElementById('solo-game').style.display = 'none';
  sS.diff = 'e';
  pickDiff('e');
}

function pickDiff(d) {
  sS.diff = d;
  ['e', 'm', 'h'].forEach(x => document.getElementById('d' + x).classList.remove('sel'));
  document.getElementById('d' + d).classList.add('sel');
}

function launchSolo() {
  const MAP = {
    e: { w: 35, n: 'BOT_EASY' },
    m: { w: 60, n: 'BOT_MED'  },
    h: { w: 90, n: 'BOT_HARD' },
  };
  const d = MAP[sS.diff || 'e'];
  const txt = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];

  sS = { diff: sS.diff, txt, pos: 0, ok: 0, tot: 0, t0: null, botWpm: d.w, pF: false, bF: false, botPos: 0 };

  document.getElementById('s-botname').textContent = d.n;
  document.getElementById('s-wpm').textContent = '0';
  document.getElementById('s-acc').textContent = '100%';
  setProgress('sp-you', 'spp-you', 0);
  setProgress('sp-bot', 'spp-bot', 0);

  document.getElementById('solo-setup').style.display = 'none';
  document.getElementById('solo-game').style.display = 'flex';

  buildText(document.getElementById('s-text'), txt);

  const inp = document.getElementById('s-inp');
  inp.value = ''; inp.disabled = false; inp.placeholder = 'Start typing…';

  countdown(() => {
    sS.t0 = Date.now();
    inp.focus();
    inp.oninput = soloInput;
    startBot('s');
  });
}

function soloInput(e) {
  if (sS.pF) return;
  const inp = e.target;
  const ch = inp.value[inp.value.length - 1];
  if (ch === undefined) return;

  const exp = sS.txt[sS.pos];
  if (!exp) return;
  sS.tot++;

  if (ch === exp) {
    sS.ok++;
    markCh(document.getElementById('s-text'), sS.pos, true);
    sS.pos++;
    setCursor(document.getElementById('s-text'), sS.pos);
    inp.classList.remove('err');
  } else {
    markCh(document.getElementById('s-text'), sS.pos, false);
    inp.classList.add('err');
    setTimeout(() => inp.classList.remove('err'), 350);
  }

  inp.value = '';
  const pct = Math.round((sS.pos / sS.txt.length) * 100);
  setProgress('sp-you', 'spp-you', pct);
  document.getElementById('s-wpm').textContent = calcWpm(sS.pos, sS.t0);
  document.getElementById('s-acc').textContent = calcAcc(sS.ok, sS.tot) + '%';

  if (sS.pos >= sS.txt.length) {
    sS.pF = true;
    inp.disabled = true;
    clearTick();
    if (!sS.bF) showResult(true, calcWpm(sS.pos, sS.t0), calcAcc(sS.ok, sS.tot), (Date.now() - sS.t0), false, launchSolo);
  }
}

/* ═══════════════════════════════════════════════════════════
   1v1 RACE
═══════════════════════════════════════════════════════════ */
function startRace() {
  show('screen-race');
  document.getElementById('race-conn').style.display = 'flex';
  document.getElementById('race-game').style.display = 'none';

  const opp = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + '_' + Math.floor(Math.random() * 999);
  let mi = 0;
  const msgs = ['FINDING OPPONENT', 'MATCHING SKILL LEVEL', 'CONNECTING…'];

  const t = setInterval(() => {
    mi = (mi + 1) % msgs.length;
    const el = document.getElementById('rc-msg');
    if (el) el.textContent = msgs[mi];
  }, 750);

  setTimeout(() => {
    clearInterval(t);
    const m = document.getElementById('rc-msg');
    if (m) m.textContent = 'OPPONENT FOUND!';
    const s = document.getElementById('rc-sub');
    if (s) s.textContent = 'Matched with ' + opp;
    setTimeout(() => launchRace(opp), 1100);
  }, 2600);
}

function launchRace(opp) {
  const txt = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
  const bw  = 48 + Math.floor(Math.random() * 32);

  rS = { txt, pos: 0, ok: 0, tot: 0, t0: null, botWpm: bw, pF: false, oF: false, oppPos: 0 };

  const nl = document.getElementById('r-oppname');
  if (nl) nl.textContent = (opp || 'PLAYER_???').slice(0, 13);

  document.getElementById('race-conn').style.display = 'none';
  document.getElementById('race-game').style.display = 'flex';
  document.getElementById('r-wpm').textContent = '0';
  document.getElementById('r-acc').textContent = '100%';
  setProgress('rp-you', 'rpp-you', 0);
  setProgress('rp-opp', 'rpp-opp', 0);

  buildText(document.getElementById('r-text'), txt);

  const inp = document.getElementById('r-inp');
  inp.value = ''; inp.disabled = false; inp.placeholder = 'Type to race…';

  countdown(() => {
    rS.t0 = Date.now();
    inp.focus();
    inp.oninput = raceInput;
    startBot('r');
  });
}

function raceInput(e) {
  if (rS.pF) return;
  const inp = e.target;
  const ch = inp.value[inp.value.length - 1];
  if (ch === undefined) return;

  const exp = rS.txt[rS.pos];
  if (!exp) return;
  rS.tot++;

  if (ch === exp) {
    rS.ok++;
    markCh(document.getElementById('r-text'), rS.pos, true);
    rS.pos++;
    setCursor(document.getElementById('r-text'), rS.pos);
    inp.classList.remove('err');
  } else {
    markCh(document.getElementById('r-text'), rS.pos, false);
    inp.classList.add('err');
    setTimeout(() => inp.classList.remove('err'), 350);
  }

  inp.value = '';
  const pct = Math.round((rS.pos / rS.txt.length) * 100);
  setProgress('rp-you', 'rpp-you', pct);
  document.getElementById('r-wpm').textContent = calcWpm(rS.pos, rS.t0);
  document.getElementById('r-acc').textContent = calcAcc(rS.ok, rS.tot) + '%';

  if (rS.pos >= rS.txt.length) {
    rS.pF = true;
    inp.disabled = true;
    clearTick();
    if (!rS.oF) showResult(true, calcWpm(rS.pos, rS.t0), calcAcc(rS.ok, rS.tot), (Date.now() - rS.t0), false, startRace);
  }
}

/* ═══════════════════════════════════════════════════════════
   BOSS BATTLE
═══════════════════════════════════════════════════════════ */
function startBoss() {
  show('screen-boss');
  document.getElementById('boss-setup').style.display = 'flex';
  document.getElementById('boss-game').style.display = 'none';
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function launchBoss(diff) {
  const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
  const hard = diff === 'h';

  bS = {
    boss, bHp: boss.maxHp, pHp: 100,
    words: shuffle([...WORDS]), wi: 0,
    cur: '', kills: 0, combo: 1, streak: 0,
    t0: Date.now(), active: true,
    atkInt:  hard ? 2800    : 5000,
    dmgPer:  hard ? 22      : 16,
    bAtk:    hard ? boss.atk * 1.6 : boss.atk,
  };

  document.getElementById('boss-setup').style.display = 'none';
  document.getElementById('boss-game').style.display = 'flex';

  document.getElementById('boss-spr').textContent     = boss.spr;
  document.getElementById('b-bname').textContent      = boss.name;
  document.getElementById('boss-namelbl').textContent = boss.name;
  document.getElementById('b-bname').style.color      = boss.col;
  document.getElementById('boss-namelbl').style.color = boss.col;
  document.getElementById('b-kills').textContent      = '0';
  document.getElementById('b-combo').textContent      = '×1';

  updateBossHp();
  updatePlayerHp();
  nextWord();
  renderQueue();

  const inp = document.getElementById('b-inp');
  inp.value = ''; inp.disabled = false; inp.className = 'boss-input';

  countdown(() => {
    inp.focus();
    inp.oninput = bossInput;
    startAttackTimer();
  });
}

function nextWord() {
  if (bS.wi >= bS.words.length) { bS.words = shuffle([...WORDS]); bS.wi = 0; }
  bS.cur = bS.words[bS.wi++];
  document.getElementById('cur-word').textContent = bS.cur.toUpperCase();
}

function renderQueue() {
  const q = document.getElementById('wqueue');
  q.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const idx = (bS.wi + i) % bS.words.length;
    const d = document.createElement('div');
    d.className = 'qw' + (i === 0 ? ' nxt' : '');
    d.textContent = bS.words[idx].toUpperCase();
    q.appendChild(d);
  }
}

function bossInput(e) {
  if (!bS.active) return;
  const inp = e.target;
  const v = inp.value.trim().toLowerCase();

  if (v === bS.cur) {
    // Hit!
    const dmg = Math.round(bS.dmgPer * bS.combo);
    bS.bHp = Math.max(0, bS.bHp - dmg);
    bS.kills++;
    bS.streak++;
    if (bS.streak >= 3) bS.combo = Math.min(6, 1 + Math.floor(bS.streak / 3));

    document.getElementById('b-kills').textContent = bS.kills;
    document.getElementById('b-combo').textContent = '×' + bS.combo;

    spawnDamageNumber(dmg, bS.combo > 1);

    const spr = document.getElementById('boss-spr');
    spr.classList.remove('shk');
    void spr.offsetWidth;
    spr.classList.add('shk');

    inp.value = '';
    inp.className = 'boss-input hit';
    setTimeout(() => inp.className = 'boss-input', 200);

    updateBossHp();
    nextWord();
    renderQueue();

    if (bS.bHp <= 0) bossWin();

  } else if (v.length > 0 && !bS.cur.startsWith(v)) {
    // Wrong!
    inp.className = 'boss-input mis';
    setTimeout(() => inp.className = 'boss-input', 200);
    bS.streak = 0;
    bS.combo = 1;
    document.getElementById('b-combo').textContent = '×1';
  }
}

function startAttackTimer() {
  if (bAtk) clearInterval(bAtk);
  bAtk = setInterval(() => {
    if (!bS.active) return;
    const dmg = Math.round(bS.bAtk + Math.random() * 4);
    bS.pHp = Math.max(0, bS.pHp - dmg);
    updatePlayerHp();

    const spr = document.getElementById('boss-spr');
    spr.classList.remove('atk');
    void spr.offsetWidth;
    spr.classList.add('atk');

    const scr = document.getElementById('screen-boss');
    scr.classList.remove('shk-screen');
    void scr.offsetWidth;
    scr.classList.add('shk-screen');

    notify('💥 BOSS ATTACKS! −' + dmg + ' HP', 'natk');

    if (bS.pHp <= 0) bossLose();
  }, bS.atkInt);
}

function updateBossHp() {
  const pct = Math.max(0, (bS.bHp / bS.boss.maxHp) * 100);
  document.getElementById('b-hpbar').style.width = pct + '%';
  document.getElementById('b-hpval').textContent = bS.bHp + ' / ' + bS.boss.maxHp;
}

function updatePlayerHp() {
  const pct = Math.max(0, bS.pHp);
  document.getElementById('p-hpbar').style.width = pct + '%';
  document.getElementById('p-hpval').textContent = pct + ' / 100';
  if (pct < 30) {
    document.getElementById('p-hpbar').style.background = 'linear-gradient(90deg,#660000,var(--red))';
  } else {
    document.getElementById('p-hpbar').style.background = 'linear-gradient(90deg,#003322,var(--neon))';
  }
}

function spawnDamageNumber(n, crit) {
  const bd = document.getElementById('boss-display');
  const el = document.createElement('div');
  el.className = 'dmg-num';
  el.style.left = (20 + Math.random() * 60) + '%';
  el.style.top  = (15 + Math.random() * 30) + '%';
  el.style.fontSize = crit ? '18px' : '13px';
  el.style.color = crit ? 'var(--yellow)' : 'var(--neon)';
  el.style.textShadow = '0 0 10px currentColor';
  el.textContent = (crit ? '⚡ CRIT! ' : '−') + n;
  bd.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function bossWin() {
  bS.active = false;
  clearAtk();
  document.getElementById('b-inp').disabled = true;
  showResult(true, bS.kills + ' WORDS', '×' + bS.combo + ' MAX', Date.now() - bS.t0, true, startBoss);
}

function bossLose() {
  bS.active = false;
  clearAtk();
  document.getElementById('b-inp').disabled = true;
  showResult(false, bS.kills + ' WORDS', '×' + bS.combo + ' MAX', Date.now() - bS.t0, true, startBoss);
}

function clearAtk() {
  if (bAtk) { clearInterval(bAtk); bAtk = null; }
}

/* ═══════════════════════════════════════════════════════════
   RESULT SCREEN
═══════════════════════════════════════════════════════════ */
function showResult(win, w, a, ms, isBoss, replayFn) {
  show('screen-result');

  const tEl = document.getElementById('res-title');
  tEl.textContent = win ? 'VICTORY!' : 'DEFEATED';
  tEl.className   = 'res-title ' + (win ? 'rw' : 'rl');

  document.getElementById('res-sub').textContent      = win ? '⚡ EXCELLENT PERFORMANCE ⚡' : '💀 BETTER LUCK NEXT TIME 💀';
  document.getElementById('res-wpm').textContent      = w;
  document.getElementById('res-wpm-lbl').textContent  = isBoss ? 'WORDS TYPED' : 'WPM';
  document.getElementById('res-acc').textContent      = isBoss ? a : (typeof a === 'number' ? a + '%' : a);
  document.getElementById('res-ext').textContent      = formatMs(ms);
  document.getElementById('res-ext-lbl').textContent  = 'TIME';
  document.getElementById('res-replay').onclick       = replayFn;
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL HELPERS
═══════════════════════════════════════════════════════════ */
function notify(msg, cls) {
  document.querySelectorAll('.notif').forEach(n => n.remove());
  const n = document.createElement('div');
  n.className   = 'notif ' + cls;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2200);
}

function clearAll() {
  clearTick();
  clearAtk();
  sS = {}; rS = {}; bS = {};
  ['s-inp', 'r-inp', 'b-inp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.oninput = null; el.value = ''; el.disabled = false; }
  });
  document.getElementById('countdown').classList.add('hide');
}
