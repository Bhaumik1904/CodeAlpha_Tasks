'use strict';

// ── STATE ──
let state = {
  current:    '0',       // what's shown in the main display
  prev:       '',        // the left operand (stored as string)
  op:         null,      // pending operator symbol
  expr:       '',        // full expression string shown above
  justCalc:   false,     // did we just hit =?
  mode:       'std',     // 'std' | 'sci'
  histOpen:   false,     // is history panel visible?
};

const history = [];      // [{expr, result}]

// ── DOM ──
const dispMain    = document.getElementById('dispMain');
const dispExpr    = document.getElementById('dispExpr');
const historyList = document.getElementById('historyList');
const historyEmpty= document.getElementById('historyEmpty');
const histPanel   = document.getElementById('historyPanel');
const btnToggleH  = document.getElementById('btnToggleHistory');
const toast       = document.getElementById('toast');

// ── DISPLAY ──
function updateDisplay() {
  dispMain.textContent = state.current;
  dispExpr.textContent = state.expr || '\u00a0';

  // Dynamic font sizing based on length
  const len = state.current.length;
  if      (len > 14) dispMain.style.fontSize = '1.2rem';
  else if (len > 11) dispMain.style.fontSize = '1.6rem';
  else if (len > 8)  dispMain.style.fontSize = '2rem';
  else               dispMain.style.fontSize = '2.6rem';

  dispMain.classList.remove('error', 'result');
}

function showResult(val) {
  state.current = val;
  dispMain.classList.add('result');
  updateDisplay();
  // brief flash then settle
  setTimeout(() => dispMain.classList.remove('result'), 600);
}

function showError(msg = 'Error') {
  state.current = msg;
  dispMain.classList.add('error');
  dispMain.style.fontSize = '1.5rem';
  dispMain.textContent = msg;
  dispExpr.textContent = '\u00a0';
}

// ── NUMBER INPUT ──
function inputNum(n) {
  if (state.justCalc) {
    // Start fresh after =
    state.current = n === '0' ? '0' : n;
    state.expr = '';
    state.justCalc = false;
  } else if (state.current === '0' && n !== '.') {
    state.current = n;
  } else {
    if (state.current.replace('-', '').length >= 15) return; // max digits
    state.current += n;
  }
  updateDisplay();
}

// ── DECIMAL ──
function inputDot() {
  if (state.justCalc) { state.current = '0.'; state.expr = ''; state.justCalc = false; updateDisplay(); return; }
  if (state.current.includes('.')) return;
  state.current += '.';
  updateDisplay();
}

// ── OPERATORS ──
function inputOp(op) {
  // Allow chaining: if there's a pending op, evaluate first
  if (state.op && !state.justCalc && state.prev !== '') {
    const res = evaluate(parseFloat(state.prev), parseFloat(state.current), state.op);
    if (res === null) { showError(); return; }
    state.prev = String(res);
    state.current = formatNum(res);
  } else {
    state.prev = state.current;
  }

  state.op      = op;
  state.expr    = `${trimZero(state.prev)} ${op}`;
  state.justCalc = false;
  // Next inputNum will clear current
  state.current  = '0';
  state._opJustSet = true;

  highlightOp(op);
  updateDisplay();
}

// ── EVALUATE CORE ──
function evaluate(a, b, op) {
  let r;
  switch (op) {
    case '+': r = a + b; break;
    case '−': r = a - b; break;
    case '×': r = a * b; break;
    case '÷': if (b === 0) return null; r = a / b; break;
    case '^': r = Math.pow(a, b); break;
    default:  return null;
  }
  // Guard against floating point noise
  return parseFloat(r.toPrecision(12));
}

// ── CALCULATE (=) ──
function calculate() {
  if (!state.op || state.prev === '') return;

  const a   = parseFloat(state.prev);
  const b   = parseFloat(state.current);
  const res = evaluate(a, b, state.op);

  if (res === null) { showError('÷ by 0'); return; }

  const full = `${trimZero(state.prev)} ${state.op} ${trimZero(state.current)} =`;
  const formatted = formatNum(res);

  addHistory(full, formatted);

  state.expr     = full;
  state.prev     = '';
  state.op       = null;
  state.justCalc = true;

  clearOpHighlight();
  showResult(formatted);
}

// ── CLEAR ──
function clearAll() {
  state.current   = '0';
  state.prev      = '';
  state.op        = null;
  state.expr      = '';
  state.justCalc  = false;
  state._opJustSet = false;
  clearOpHighlight();
  dispMain.classList.remove('error', 'result');
  updateDisplay();
}

// ── TOGGLE SIGN ──
function toggleSign() {
  if (state.current === '0' || state.current === 'Error') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  updateDisplay();
}

// ── PERCENT ──
function percent() {
  const val = parseFloat(state.current);
  if (isNaN(val)) return;
  // If there's a pending op, compute % relative to the operand
  if (state.op && state.prev !== '') {
    const base = parseFloat(state.prev);
    state.current = formatNum(base * val / 100);
  } else {
    state.current = formatNum(val / 100);
  }
  updateDisplay();
}

// ── SCIENTIFIC OPS ──
function sciOp(fn) {
  const x = parseFloat(state.current);
  if (isNaN(x)) return;
  let res;
  const DEG = Math.PI / 180; // use degrees for trig
  switch (fn) {
    case 'sin':  res = Math.sin(x * DEG); break;
    case 'cos':  res = Math.cos(x * DEG); break;
    case 'tan':
      if (Math.abs(Math.cos(x * DEG)) < 1e-10) { showError('Undefined'); return; }
      res = Math.tan(x * DEG); break;
    case 'sqrt':
      if (x < 0) { showError('Domain err'); return; }
      res = Math.sqrt(x); break;
    case 'log':
      if (x <= 0) { showError('Domain err'); return; }
      res = Math.log10(x); break;
    case 'ln':
      if (x <= 0) { showError('Domain err'); return; }
      res = Math.log(x); break;
  }
  const formatted = formatNum(parseFloat(res.toPrecision(10)));
  state.expr    = `${fn}(${trimZero(state.current)}) =`;
  addHistory(state.expr, formatted);
  state.current = formatted;
  state.justCalc = true;
  showResult(formatted);
}

// ── CONSTANT INPUT ──
function inputConst(c) {
  if (c === 'π') state.current = String(parseFloat(Math.PI.toPrecision(12)));
  state.justCalc = false;
  updateDisplay();
}

// ── MODE SWITCH ──
function setMode(m) {
  state.mode = m;
  document.getElementById('modeStd').classList.toggle('active', m === 'std');
  document.getElementById('modeSci').classList.toggle('active', m === 'sci');
  document.getElementById('sciRow').classList.toggle('hidden', m === 'std');
}

// ── HISTORY ──
function addHistory(expr, result) {
  history.unshift({ expr, result });
  if (history.length > 50) history.pop();
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyEmpty.style.display = 'block';
    // Remove all items
    [...historyList.querySelectorAll('.hp-item')].forEach(el => el.remove());
    return;
  }
  historyEmpty.style.display = 'none';
  historyList.innerHTML = '';

  history.forEach(({ expr, result }) => {
    const li  = document.createElement('li');
    li.className = 'hp-item';
    li.innerHTML = `<div class="hp-item-expr">${expr}</div>
                    <div class="hp-item-result">${result}</div>`;
    li.addEventListener('click', () => {
      state.current  = result;
      state.justCalc = true;
      state.expr     = expr;
      dispMain.classList.remove('error');
      updateDisplay();
      toast_('Recalled from history');
    });
    historyList.appendChild(li);
  });
}

document.getElementById('btnClearHistory').addEventListener('click', () => {
  history.length = 0;
  renderHistory();
  toast_('History cleared');
});

// ── HISTORY TOGGLE ──
function toggleHistory() {
  state.histOpen = !state.histOpen;
  histPanel.classList.toggle('hidden', !state.histOpen);
  btnToggleH.classList.toggle('active', state.histOpen);
}
btnToggleH.addEventListener('click', toggleHistory);
// Start closed
histPanel.classList.add('hidden');

// ── OP HIGHLIGHT ──
const opMap = { '+': 'btnAdd', '−': 'btnSub', '×': 'btnMul', '÷': 'btnDiv', '^': 'btnPow' };
function highlightOp(op) {
  clearOpHighlight();
  const el = document.getElementById(opMap[op]);
  if (el) el.classList.add('pressed');
}
function clearOpHighlight() {
  Object.values(opMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('pressed');
  });
}

// ── NUMBER FORMATTING ──
function formatNum(n) {
  if (!isFinite(n)) return 'Error';
  // Use exponential for very large / very small
  if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-7 && n !== 0)) {
    return n.toExponential(6).replace(/\.?0+e/, 'e');
  }
  // Strip trailing zeros after decimal
  const s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

function trimZero(s) {
  // Remove trailing .0 style artifacts for display
  return s.replace(/\.?0+$/, '') || s;
}

// ── KEYBOARD SUPPORT ──
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;

  if (k >= '0' && k <= '9')         { inputNum(k); rippleBtn(`btn${k}`); }
  else if (k === '.')                { inputDot(); rippleBtn('btnDot'); }
  else if (k === '+')                { inputOp('+'); rippleBtn('btnAdd'); }
  else if (k === '-')                { inputOp('−'); rippleBtn('btnSub'); }
  else if (k === '*')                { inputOp('×'); rippleBtn('btnMul'); }
  else if (k === '/')                { e.preventDefault(); inputOp('÷'); rippleBtn('btnDiv'); }
  else if (k === '^')                { inputOp('^'); }
  else if (k === 'Enter' || k === '='){ calculate(); rippleBtn('btnEq'); }
  else if (k === 'Backspace')        { handleBackspace(); }
  else if (k === 'Escape')           { clearAll(); rippleBtn('btnAC'); }
  else if (k === '%')                { percent(); rippleBtn('btnPct'); }
});

// ── BACKSPACE ──
function handleBackspace() {
  if (state.justCalc) { clearAll(); return; }
  if (state.current.length <= 1 || state.current === '0') {
    state.current = '0';
  } else {
    state.current = state.current.slice(0, -1);
  }
  updateDisplay();
}

// ── RIPPLE HELPER ──
function rippleBtn(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('kb-active');
  void el.offsetWidth; // reflow
  el.classList.add('kb-active');
  setTimeout(() => el.classList.remove('kb-active'), 150);
}

// Add kb-active style dynamically
const kbStyle = document.createElement('style');
kbStyle.textContent = `.kb-active { transform: scale(.93) !important; filter: brightness(1.2); }`;
document.head.appendChild(kbStyle);

// ── TOAST ──
let _tt;
function toast_(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ── INIT ──
updateDisplay();
renderHistory();
