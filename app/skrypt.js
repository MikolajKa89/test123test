// Przełączanie zakładek
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
  
    document.querySelectorAll('.navbar button').forEach(btn => btn.classList.remove('active'));
    const btn = document.querySelector(`#btn-${tabId}`);
    if (btn) btn.classList.add('active');
  }
  
  // Dodawanie leku
  document.getElementById('form-lek').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nazwa: document.getElementById('nazwa').value,
      dawka: document.getElementById('dawka').value,
      godzina: document.getElementById('godzina').value,
      ilosc: document.getElementById('ilosc').value,
      data_start: document.getElementById('data_start').value,
      data_end: document.getElementById('data_end').value,
      kolor: document.getElementById('kolor').value
    };
  
    await fetch('/api/leki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  
    loadLeki();
    e.target.reset();
  });
  
  // Wczytywanie leków
  async function loadLeki() {
    const res = await fetch('/api/leki');
    const leki = await res.json();
  
    const lista = document.getElementById('lista-lekow');
    const przypominajka = document.getElementById('przypominajka-leki');
    const postepLista = document.getElementById('postep-dni');
  
    lista.innerHTML = '';
    przypominajka.innerHTML = '';
    postepLista.innerHTML = '';
  
    const today = new Date().toISOString().split('T')[0];
  
    leki.forEach(lek => {
      // Terapia
      const li = document.createElement('li');
      li.innerHTML = `${lek.nazwa} (${lek.dawka}) – ${lek.godzina}`;
      const del = document.createElement('button');
      del.innerText = '🗑️';
      del.onclick = () => deleteLek(lek.id);
      li.appendChild(del);
      lista.appendChild(li);
  
      // Przypominajka (dzisiejsze leki)
      if (lek.data_start <= today && lek.data_end >= today) {
        const key = `taken_${lek.id}_${today}`;
        const isTaken = localStorage.getItem(key) === '1';
  
        const item = document.createElement('li');
        item.textContent = `${lek.nazwa} o ${lek.godzina}`;
        if (isTaken) item.style.textDecoration = 'line-through';
  
        const btn = document.createElement('button');
        btn.textContent = isTaken ? '↩️ Cofnij' : '✅ Wzięte';
        btn.onclick = () => {
          if (isTaken) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, '1');
          }
          loadLeki();
        };
  
        item.appendChild(btn);
        przypominajka.appendChild(item);
      }
  
      // Postęp – dni do końca
      const end = new Date(lek.data_end);
      const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
      const txt = diff >= 0
        ? `${lek.nazwa} – zostało ${diff} dni kuracji`
        : `${lek.nazwa} – kuracja zakończona`;
  
      const pLi = document.createElement('li');
      pLi.textContent = txt;
      postepLista.appendChild(pLi);
    });
  
    initCalendar(leki);
    updateProgress(leki);
  }
  
  // Usuwanie leku
  async function deleteLek(id) {
    await fetch('/api/leki', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    loadLeki();
  }
  
  // Kalendarz
  let calendar;
  function initCalendar(leki) {
    const lekDates = {};
  
    leki.forEach(lek => {
      const start = new Date(lek.data_start);
      const end = new Date(lek.data_end);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        lekDates[dateStr] = lek.kolor || '#ff0000';
      }
    });
  
    const highlight = Object.entries(lekDates).map(([date, color]) => ({
      date,
      background: color
    }));
  
    if (calendar) calendar.destroy();
  
    calendar = new VanillaCalendar('#calendar', {
      settings: { visibility: { today: true } },
      dates: { highlight }
    });
  
    calendar.init();
  }
  
  // Pasek postępu
  function updateProgress(leki) {
    let total = 0;
    let taken = 0;
  
    leki.forEach(lek => {
      const start = new Date(lek.data_start);
      const end = new Date(lek.data_end);
      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      total += days;
  
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const key = `taken_${lek.id}_${dateStr}`;
        if (localStorage.getItem(key) === '1') taken++;
      }
    });
  
    const percent = total === 0 ? 0 : Math.round((taken / total) * 100);
    document.getElementById('postep-raport').innerText = `Postęp: ${percent}%`;
    document.getElementById('progress-bar-fill').style.width = `${percent}%`;
  }
  
  // Eksport PDF
  async function exportPDF() {
    const res = await fetch('/api/leki');
    const leki = await res.json();
    const pdfList = document.getElementById('pdf-lista-lekow');
    pdfList.innerHTML = '';
  
    leki.forEach(lek => {
      const li = document.createElement('li');
      li.textContent = `${lek.nazwa} (${lek.dawka}) – od ${lek.data_start} do ${lek.data_end}, ${lek.godzina}`;
      pdfList.appendChild(li);
    });
  
    html2pdf().from(document.getElementById('pdf-content')).save('leki.pdf');
  }
  
  // Start
  switchTab('terapia');
  loadLeki();
  
