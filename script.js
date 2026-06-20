async function loadData() {
  const status = document.getElementById('status');
  const scoreboard = document.getElementById('scoreboard');
  const matchesBox = document.getElementById('matches');

  try {
    status.textContent = 'Обновляю результаты...';

    const res = await fetch('/api/scoreboard');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    status.textContent = `Обновлено: ${data.updatedAt || 'неизвестно'}`;

    scoreboard.innerHTML = '';
    (data.table || []).forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="row">
          <strong>${index + 1}. ${item.name}</strong>
          <strong>${item.points} очков</strong>
        </div>
      `;
      scoreboard.appendChild(div);
    });

    matchesBox.innerHTML = '';
    (data.matches || []).forEach((match) => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div><strong>${match.homeTeam}</strong> — <strong>${match.awayTeam}</strong></div>
        <div class="muted">Статус: ${match.status}</div>
        <div>Счёт: ${match.homeScore ?? '-'} : ${match.awayScore ?? '-'}</div>
      `;
      matchesBox.appendChild(div);
    });
  } catch (e) {
    status.textContent = 'Ошибка загрузки данных: ' + e.message;
  }
}

loadData();