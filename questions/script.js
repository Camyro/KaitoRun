const STORAGE_KEY = 'quizPacks_v1';
const LETTERS = ['A','B','C','D'];

const DEFAULT_PACK = {
  id: '__default__',
  name: 'Pack Padrão',
  locked: true,
  questions: [
    { question: "Qual é a capital do Brasil?",               options: ["São Paulo","Rio de Janeiro","Brasília","Salvador"],      correct: 2, timeLimit: 10 },
    { question: "Quanto é 5 x 8?",                           options: ["35","40","45","48"],                                     correct: 1, timeLimit: 8  },
    { question: "Qual é o maior planeta do Sistema Solar?",  options: ["Terra","Marte","Júpiter","Saturno"],                     correct: 2, timeLimit: 12 },
    { question: "Em que ano o Brasil foi descoberto?",        options: ["1492","1500","1822","1889"],                             correct: 1, timeLimit: 10 },
    { question: "Qual é a fórmula da água?",                 options: ["H2O","CO2","O2","NaCl"],                                 correct: 0, timeLimit: 8  },
    { question: "Quantos continentes existem no mundo?",     options: ["5","6","7","8"],                                         correct: 2, timeLimit: 10 },
    { question: "Quem pintou a Mona Lisa?",                  options: ["Van Gogh","Picasso","Leonardo da Vinci","Michelangelo"], correct: 2, timeLimit: 15 },
    { question: "Qual é o menor estado do Brasil?",          options: ["Sergipe","Alagoas","Rio de Janeiro","Espírito Santo"],   correct: 0, timeLimit: 12 },
    { question: "Quantos dias tem um ano bissexto?",         options: ["365","366","364","367"],                                 correct: 1, timeLimit: 8  },
    { question: "Qual é a velocidade da luz?",               options: ["300.000 km/s","150.000 km/s","500.000 km/s","250.000 km/s"], correct: 0, timeLimit: 12 }
  ]
};

let packs = [], selectedId = null, editingQIdx = null;

function getAllPacks() { return [DEFAULT_PACK, ...packs]; }
function getSelected() { return getAllPacks().find(p => p.id === selectedId) || null; }

function loadPacks() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    packs = r ? JSON.parse(r) : [];
  } catch { packs = []; }
}

function savePacks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(packs)); }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

/* ── SIDEBAR ── */
function renderSidebar() {
  const list = document.getElementById('packList');
  list.innerHTML = '';
  getAllPacks().forEach(pack => {
    const el = document.createElement('div');
    el.className = 'pack-item' + (pack.locked ? ' locked' : '') + (pack.id === selectedId ? ' active' : '');
    el.innerHTML = `
      <div class="pack-item-icon">${pack.locked ? '🔒' : '📦'}</div>
      <div class="pack-item-info">
        <div class="pack-item-name">${escHtml(pack.name)}</div>
        <div class="pack-item-meta">${pack.questions.length} pergunta${pack.questions.length !== 1 ? 's' : ''}</div>
      </div>
      ${pack.locked ? '<span class="pack-locked-badge">FIXO</span>' : ''}
      <button class="pack-play-btn" title="Jogar">▶</button>
    `;
    el.querySelector('.pack-play-btn').addEventListener('click', e => { e.stopPropagation(); playPack(pack.id); });
    el.addEventListener('click', () => { selectPack(pack.id); closeSidebar(); });
    list.appendChild(el);
  });
}

function selectPack(id) {
  selectedId = id;
  renderSidebar();
  renderDetail();
}

/* ── DETAIL ── */
function renderDetail() {
  const pack = getSelected();
  document.getElementById('emptyState').style.display = pack ? 'none' : 'flex';
  const detailEl = document.getElementById('packDetail');
  if (!pack) { detailEl.style.display = 'none'; return; }
  detailEl.style.display = 'flex';

  const nameHtml = pack.locked
    ? `<div class="pack-name-display">${escHtml(pack.name)}</div>`
    : `<input class="pack-name-input" value="${escAttr(pack.name)}" onchange="renamePack(this.value)" />`;

  const addBtn = pack.locked ? '' : `<button class="btn btn-sm" onclick="openNewQuestionModal()">+ Pergunta</button>`;
  const delBtn = pack.locked ? '' : `<button class="btn btn-danger btn-sm" onclick="confirmDeletePack()">🗑 Pack</button>`;

  detailEl.innerHTML = `
    <div class="pack-detail-header">
      ${nameHtml}
      <div class="pack-detail-actions">
        ${addBtn}${delBtn}
        <button class="btn btn-play btn-sm" onclick="playPack()">▶ Jogar</button>
      </div>
    </div>
    <div class="pack-questions-area">
      <div class="questions-header">
        <span class="questions-count">${pack.questions.length} PERGUNTAS</span>
      </div>
      <div id="questionsList"></div>
    </div>
  `;
  renderQuestions(pack);
}

function renderQuestions(pack) {
  const c = document.getElementById('questionsList');
  if (!c) return;
  c.innerHTML = '';
  if (!pack.questions.length) {
    c.innerHTML = '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:#777;text-align:center;padding:28px 0;">Nenhuma pergunta neste pack.</div>';
    return;
  }
  pack.questions.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    const opts = q.options.map((opt, oi) => `
      <div class="question-option ${oi === q.correct ? 'correct' : ''}">
        <span class="question-option-letter">${LETTERS[oi]}</span>${escHtml(opt)}
      </div>`).join('');
    const actions = pack.locked ? '' : `
      <div class="question-actions">
        <button class="btn btn-icon" onclick="openEditQuestionModal(${i})">✏️</button>
        <button class="btn btn-icon danger" onclick="confirmDeleteQuestion(${i})">🗑</button>
      </div>`;
    card.innerHTML = `
      <div class="question-num">#${String(i+1).padStart(2,'0')}</div>
      <div class="question-body">
        <div class="question-text">${escHtml(q.question)}</div>
        <div class="question-options">${opts}</div>
        <div class="question-meta"><span>✓ ${escHtml(q.options[q.correct])}</span><span>⏱ ${q.timeLimit}s</span></div>
      </div>${actions}`;
    c.appendChild(card);
  });
}

/* ── PACK ACTIONS ── */
function renamePack(v) {
  const p = packs.find(p => p.id === selectedId);
  if (!p) return;
  p.name = v.trim() || p.name;
  savePacks();
  renderSidebar();
}

function openNewPackModal() {
  const name = prompt('Nome do novo pack:');
  if (!name || !name.trim()) return;
  const np = { id: uid(), name: name.trim(), locked: false, questions: [] };
  packs.push(np);
  savePacks();
  selectedId = np.id;
  renderSidebar();
  renderDetail();
  toast('Pack criado!');
}

function confirmDeletePack() {
  const pack = getSelected();
  if (!pack) return;
  showConfirm('Excluir pack', `Excluir <b>${escHtml(pack.name)}</b>? Não pode ser desfeito.`, () => {
    packs = packs.filter(p => p.id !== selectedId);
    selectedId = null;
    savePacks();
    renderSidebar();
    renderDetail();
    toast('Pack excluído.');
  });
}

/* ── QUESTION MODAL ── */
function openNewQuestionModal() {
  editingQIdx = null;
  document.getElementById('modalTitle').textContent = 'Nova Pergunta';
  document.getElementById('qText').value = '';
  ['opt0','opt1','opt2','opt3'].forEach(id => document.getElementById(id).value = '');
  document.querySelectorAll('input[name="correct"]').forEach(r => r.checked = false);
  document.getElementById('qTime').value = 10;
  openModal();
}

function openEditQuestionModal(idx) {
  const pack = getSelected();
  if (!pack) return;
  const q = pack.questions[idx];
  editingQIdx = idx;
  document.getElementById('modalTitle').textContent = 'Editar Pergunta';
  document.getElementById('qText').value = q.question;
  q.options.forEach((opt, i) => document.getElementById('opt'+i).value = opt);
  document.querySelectorAll('input[name="correct"]').forEach(r => r.checked = parseInt(r.value) === q.correct);
  document.getElementById('qTime').value = q.timeLimit;
  openModal();
}

function saveQuestion() {
  const text = document.getElementById('qText').value.trim();
  const opts  = ['opt0','opt1','opt2','opt3'].map(id => document.getElementById(id).value.trim());
  const cr    = document.querySelector('input[name="correct"]:checked');
  const tl    = parseInt(document.getElementById('qTime').value);

  if (!text)              { toast('Digite a pergunta.', true); return; }
  if (opts.some(o => !o)) { toast('Preencha todas as 4 opções.', true); return; }
  if (!cr)                { toast('Selecione a resposta correta.', true); return; }
  if (!tl || tl < 3)      { toast('Tempo mínimo: 3s.', true); return; }

  const qObj = { question: text, options: opts, correct: parseInt(cr.value), timeLimit: tl };
  const pack  = packs.find(p => p.id === selectedId);
  if (!pack) return;

  if (editingQIdx === null) {
    pack.questions.push(qObj);
    toast('Pergunta adicionada!');
  } else {
    pack.questions[editingQIdx] = qObj;
    toast('Pergunta atualizada!');
  }
  savePacks();
  closeModal();
  renderDetail();
  renderSidebar();
}

function confirmDeleteQuestion(idx) {
  const pack = getSelected();
  if (!pack) return;
  const q = pack.questions[idx];
  showConfirm('Excluir pergunta', `Excluir: <b>${escHtml(q.question)}</b>?`, () => {
    const p = packs.find(p => p.id === selectedId);
    p.questions.splice(idx, 1);
    savePacks();
    renderDetail();
    renderSidebar();
    toast('Pergunta excluída.');
  });
}

/* ── PLAY ── */
function playPack(id) {
  const targetId = (id !== undefined && id !== null) ? id : selectedId;
  const pack = getAllPacks().find(p => p.id === targetId);
  if (!pack)                  { toast('Nenhum pack selecionado.', true); return; }
  if (!pack.questions.length) { toast('O pack não tem perguntas!', true); return; }
  const url = window.location.origin + '/theGame/index.html?question=' + encodeURIComponent(JSON.stringify(pack.questions));
  const a = document.createElement('a');
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ── MODAL HELPERS ── */
function openModal()  { document.getElementById('questionModal').classList.add('open'); }
function closeModal() { document.getElementById('questionModal').classList.remove('open'); }

/* ── CONFIRM ── */
let _cb = null;

function showConfirm(title, msg, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').innerHTML = msg;
  _cb = cb;
  document.getElementById('confirmOverlay').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmOverlay').classList.remove('open');
  _cb = null;
}

document.getElementById('confirmOkBtn').onclick = () => { if (_cb) _cb(); closeConfirm(); };

document.getElementById('questionModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('confirmOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

/* ── TOAST ── */
function toast(msg, error = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ── UTILS ── */
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function escAttr(s) { return escHtml(s); }

/* ── SIDEBAR MOBILE ── */
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebarBackdrop').classList.toggle('open');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');
}

/* ── INIT ── */
loadPacks();
renderSidebar();
renderDetail();