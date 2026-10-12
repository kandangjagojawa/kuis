let currentPaugeran = 'kbj';
let kasusData = [];
let currentKasusIndex = 0;
let userAnswers = {};

function convertToAksara(text) {
  if (!text) return '';
  if (currentPaugeran === 'kbj' && typeof window.transliterasiKBJ === 'function') {
    return window.transliterasiKBJ(text);
  } else if (currentPaugeran === 'kawi' && typeof window.transliterasiKawi === 'function') {
    return window.transliterasiKawi(text);
  } else if (typeof window.transliterasiSriwedari === 'function') {
    return window.transliterasiSriwedari(text);
  }
  return text;
}

document.addEventListener('DOMContentLoaded', () => {
  const paugeranSelect = document.getElementById('paugeranSelect');
  
  paugeranSelect.addEventListener('change', (e) => {
    currentPaugeran = e.target.value;
    renderAll();
  });

  document.getElementById('next-story-btn').addEventListener('click', () => {
    if (currentKasusIndex < kasusData.length - 1) {
      currentKasusIndex++;
      userAnswers = {};
      renderAll();
    }
  });

  fetchKasusData();
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
  if (kasusData.length === 0) return;

  // Render Label UI Statis ke Aksara Jawa (Dropdown dikecualikan)
  document.getElementById('ui-title').textContent = convertToAksara("kuis Aksara jawa");
  document.getElementById('ui-label-paugeran').textContent = convertToAksara("pilih paugeran:");
  document.getElementById('ui-questions-title').textContent = convertToAksara("wangsul-ana pitakon ing ngisor iki:");
  document.getElementById('next-story-btn').textContent = convertToAksara("crita sabanjur-é");

  const activeKasus = kasusData[currentKasusIndex];

  // Render Cerita
  document.getElementById('story-title').textContent = convertToAksara(activeKasus.judul);
  document.getElementById('story-content').textContent = convertToAksara(activeKasus.cerita);

  // Render Soal Pilihan Ganda
  renderSoal(activeKasus.soal);

  // Navigasi Tombol
  const nextBtn = document.getElementById('next-story-btn');
  if (currentKasusIndex < kasusData.length - 1) {
    nextBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'none';
  }
}

function renderSoal(soalList) {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  const prefixes = ['ha. ', 'na. ', 'ca. ', 'ra. '];

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
