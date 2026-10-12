let currentPaugeran = 'kbj';
let kasusData = [];
let currentKasusIndex = 0;
let userAnswers = {};

function convertToAksara(text) {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  let result = '';

  if (currentPaugeran === 'kbj' && typeof window.transliterasiKBJ === 'function') {
    result = window.transliterasiKBJ(lowerText);
  } else if (currentPaugeran === 'kawi' && typeof window.transliterasiKawi === 'function') {
    result = window.transliterasiKawi(lowerText);
  } else if (currentPaugeran === 'sriwedari' && typeof window.transliterasiSriwedari === 'function') {
    result = window.transliterasiSriwedari(lowerText);
  } else {
    result = lowerText;
  }

  // Menghapus alternatif penulisan di dalam kurung beserta spasi di depannya
  return result.replace(/\s*\([^)]*\)/g, '');
}

function updateActiveFont() {
  const activeFontFamily = (currentPaugeran === 'kawi') ? "'Ngayogyan', serif" : "'Ngayogyann', serif";
  const elements = document.querySelectorAll('.aksara-jawa');
  elements.forEach(el => {
    el.style.fontFamily = activeFontFamily;
  });
}

async function loadScriptIsolated(scriptSrc, funcName) {
  try {
    const response = await fetch(scriptSrc);
    if (!response.ok) throw new Error('Fetch failed');
    const code = await response.text();
    const fn = new Function(`
      ${code}
      return typeof ${funcName} !== 'undefined' ? ${funcName} : null;
    `)();
    if (typeof fn === 'function') return fn;
    throw new Error(`Fungsi ${funcName} tidak ditemukan`);
  } catch (e) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><script src="${scriptSrc}"><\/script></head><body></body></html>`);
      doc.close();
      iframe.onload = () => {
        const fn = iframe.contentWindow[funcName];
        if (typeof fn === 'function') {
          resolve(fn.bind(iframe.contentWindow));
        } else {
          reject(new Error(`Fungsi ${funcName} tidak ditemukan di ${scriptSrc}`));
        }
      };
      iframe.onerror = reject;
    });
  }
}

async function loadTransliterators() {
  const scripts = [
    { name: 'transliterasiKBJ', file: 'kbj.js', func: 'transliterasiKalimat' },
    { name: 'transliterasiSriwedari', file: 'sriwedari.js', func: 'transliterasiKalimat' },
    { name: 'transliterasiKawi', file: 'carakawi.js', func: 'transliterateKawi' }
  ];

  for (const script of scripts) {
    try {
      const fn = await loadScriptIsolated(script.file, script.func);
      window[script.name] = fn;
    } catch (err) {
      console.error(`Gagal memuat ${script.file}:`, err);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const paugeranSelect = document.getElementById('paugeranSelect');
  if (paugeranSelect) {
    currentPaugeran = paugeranSelect.value || 'kbj';
    paugeranSelect.addEventListener('change', (e) => {
      currentPaugeran = e.target.value;
      renderAll();
    });
  }

  const nextBtn = document.getElementById('next-story-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentKasusIndex < kasusData.length - 1) {
        currentKasusIndex++;
        userAnswers = {};
        renderAll();
      }
    });
  }

  await loadTransliterators();
  await fetchKasusData();
});

async function fetchKasusData() {
  try {
    const response = await fetch('kasus.json');
    kasusData = await response.json();
    renderAll();
  } catch (error) {
    console.error('Gagal memuat kasus.json:', error);
  }
}

function renderAll() {
  if (!kasusData || kasusData.length === 0) return;

  document.getElementById('ui-title').textContent = convertToAksara("Aplikasi Maca Aksara Jawa");
  document.getElementById('ui-label-paugeran').textContent = convertToAksara("Pilih Pauger-an:");
  document.getElementById('ui-questions-title').textContent = convertToAksara("Wangsul-ana Pitakon-Pitakon Ing Ngisor Iki:");
  document.getElementById('next-story-btn').textContent = convertToAksara("Crita Sabanjur-é");

  const activeKasus = kasusData[currentKasusIndex];

  document.getElementById('story-title').textContent = convertToAksara(activeKasus.judul);
  document.getElementById('story-content').textContent = convertToAksara(activeKasus.cerita);

  renderSoal(activeKasus.soal);

  const nextBtn = document.getElementById('next-story-btn');
  if (currentKasusIndex < kasusData.length - 1) {
    nextBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'none';
  }

  updateActiveFont();
}

function renderSoal(soalList) {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  if (!soalList || !Array.isArray(soalList)) return;

  const prefixes = ['a. ', 'b. ', 'c. ', 'd. '];

  soalList.forEach((q, qIndex) => {
    const qBlock = document.createElement('div');
    qBlock.className = 'question-block';

    const qTitle = document.createElement('div');
    qTitle.className = 'aksara-jawa';
    qTitle.style.fontWeight = 'bold';
    qTitle.textContent = convertToAksara(`${qIndex + 1}. ${q.pertanyaan}`);
    qBlock.appendChild(qTitle);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'options-grid';

    q.pilihan.forEach((opt, optIndex) => {
      const optBtn = document.createElement('button');
      optBtn.className = 'option-btn aksara-jawa';
      optBtn.textContent = convertToAksara(`${prefixes[optIndex]}${opt}`);

      const hasAnswered = userAnswers[qIndex] !== undefined;

      if (hasAnswered) {
        optBtn.disabled = true;
        const selectedOpt = userAnswers[qIndex];
        const correctOpt = q.kunci;

        if (optIndex === correctOpt) {
          optBtn.classList.add('correct');
        } else if (optIndex === selectedOpt) {
          optBtn.classList.add('incorrect');
        }
      } else {
        optBtn.addEventListener('click', () => {
          userAnswers[qIndex] = optIndex;
          renderAll();
        });
      }

      optionsGrid.appendChild(optBtn);
    });

    qBlock.appendChild(optionsGrid);
    container.appendChild(qBlock);
  });
}
