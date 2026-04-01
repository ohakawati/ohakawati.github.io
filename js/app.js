/* ── Data Loading ── */
let teamsData = [];
let scheduleData = [];

async function loadData() {
  const [teamsRes, scheduleRes] = await Promise.all([
    fetch('data/teams.json'),
    fetch('data/schedule.json')
  ]);
  teamsData = await teamsRes.json();
  scheduleData = await scheduleRes.json();
}

function getTeam(id) {
  return teamsData.find(t => t.id === id);
}

function teamLogo(team, size) {
  size = size || 28;
  return `<img class="team-logo" src="${team.logo}" alt="${team.name}" style="width:${size}px; height:${size}px;">`;
}

function getSortedStandings() {
  return [...teamsData].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
  });
}

/* ── Standings ── */
function renderStandings(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sorted = getSortedStandings();
  let html = `
    <table class="standings-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>W</th>
          <th>L</th>
          <th>T</th>
          <th>PF</th>
          <th>PA</th>
          <th>+/-</th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach((team, i) => {
    const diff = team.pointsFor - team.pointsAgainst;
    html += `
      <tr onclick="navigateToTeam('${team.id}')">
        <td>${i + 1}</td>
        <td>
          <div class="team-name-cell">
            ${teamLogo(team, 28)}
            ${team.name}
          </div>
        </td>
        <td class="record-win">${team.wins}</td>
        <td class="record-loss">${team.losses}</td>
        <td>${team.ties}</td>
        <td>${team.pointsFor}</td>
        <td>${team.pointsAgainst}</td>
        <td style="color:${diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--red)' : 'var(--text-muted)'}">
          ${diff > 0 ? '+' : ''}${diff}
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/* ── Schedule ── */
function renderSchedule(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  scheduleData.forEach(week => {
    const date = new Date(week.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    html += `
      <div class="schedule-week">
        <div class="week-header">
          <h3>Week ${week.week}</h3>
          <span class="week-date">${dateStr}</span>
        </div>
    `;

    week.games.forEach(game => {
      const home = getTeam(game.home);
      const away = getTeam(game.away);
      const played = game.homeScore !== null;

      html += `
        <div class="game-card">
          <div class="game-team">
            ${teamLogo(home, 32)}
            ${home.name}
          </div>
          <div class="game-score">
            ${played
              ? `<div class="score">${game.homeScore} - ${game.awayScore}</div>`
              : `<span class="upcoming-badge">Upcoming</span>`
            }
            <div class="game-time">${game.time} &middot; ${game.location}</div>
          </div>
          <div class="game-team away">
            ${away.name}
            ${teamLogo(away, 32)}
          </div>
        </div>
      `;
    });

    html += '</div>';
  });

  container.innerHTML = html;
}

/* ── Teams Page ── */
function renderTeamCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sorted = getSortedStandings();
  let html = '';
  sorted.forEach(team => {
    html += `
      <div class="team-card" onclick="showTeamDetail('${team.id}')">
        <div class="team-card-header">
          ${teamLogo(team, 40)}
          <h3>${team.name}</h3>
        </div>
        <p class="team-record">${team.wins}W - ${team.losses}L - ${team.ties}T &middot; PF ${team.pointsFor} / PA ${team.pointsAgainst}</p>
      </div>
    `;
  });
  container.innerHTML = html;
}

function showTeamDetail(teamId) {
  const team = getTeam(teamId);
  const detail = document.getElementById('team-detail');
  if (!team || !detail) return;

  const hasRoster = team.roster && team.roster.length > 0;

  let html = `
    <div class="team-detail-header">
      ${teamLogo(team, 48)}
      <h2>${team.name}</h2>
      <span class="detail-record">${team.wins}W - ${team.losses}L - ${team.ties}T</span>
      <button class="close-detail" onclick="hideTeamDetail()">Close</button>
    </div>
  `;

  if (hasRoster) {
    html += `
      <div style="overflow-x:auto">
      <table class="roster-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Pos</th>
            <th>Pass Yds</th>
            <th>Rush Yds</th>
            <th>Rec</th>
            <th>Rec Yds</th>
            <th>TD</th>
            <th>INT</th>
            <th>Sacks</th>
            <th>Flag Pulls</th>
          </tr>
        </thead>
        <tbody>
    `;

    team.roster.forEach(p => {
      html += `
        <tr>
          <td class="player-number">${p.number}</td>
          <td class="player-name">${p.name}</td>
          <td>${p.position}</td>
          <td>${p.passYards || '-'}</td>
          <td>${p.rushYards || '-'}</td>
          <td>${p.receptions || '-'}</td>
          <td>${p.recYards || '-'}</td>
          <td>${p.touchdowns || '-'}</td>
          <td>${p.interceptions || '-'}</td>
          <td>${p.sacks || '-'}</td>
          <td>${p.flagPulls || '-'}</td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
  } else {
    html += '<p style="color:var(--text-muted); padding:1rem 0;">Roster coming soon.</p>';
  }

  detail.innerHTML = html;
  detail.classList.add('active');
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideTeamDetail() {
  const detail = document.getElementById('team-detail');
  if (detail) detail.classList.remove('active');
}

/* ── Navigation ── */
function navigateToTeam(teamId) {
  window.location.href = `teams.html?team=${teamId}`;
}

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ── Mobile Nav ── */
function toggleMobileNav() {
  document.querySelector('.nav-links').classList.toggle('open');
}

/* ── Stat Leaders ── */
function renderLeaders(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const categories = [
    { key: 'passYards', label: 'Passing Yards', icon: 'QBs' },
    { key: 'rushYards', label: 'Rushing Yards', icon: 'RBs' },
    { key: 'receptions', label: 'Receptions', icon: 'WRs' },
    { key: 'recYards', label: 'Receiving Yards', icon: 'WRs' },
    { key: 'touchdowns', label: 'Touchdowns', icon: 'ALL' },
    { key: 'interceptions', label: 'Interceptions', icon: 'DBs' },
    { key: 'sacks', label: 'Sacks', icon: 'DL' },
    { key: 'flagPulls', label: 'Flag Pulls', icon: 'DEF' }
  ];

  // Flatten all players with team info
  const allPlayers = [];
  teamsData.forEach(team => {
    team.roster.forEach(player => {
      allPlayers.push({ ...player, teamName: team.name, teamLogo: team.logo });
    });
  });

  if (allPlayers.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);">Player stats will appear here once rosters are added.</p>';
    return;
  }

  let html = '';
  categories.forEach(cat => {
    const sorted = [...allPlayers]
      .filter(p => p[cat.key] > 0)
      .sort((a, b) => b[cat.key] - a[cat.key])
      .slice(0, 10);

    if (sorted.length === 0) return;

    html += `
      <div class="leader-category">
        <div class="leader-category-header">
          <span class="stat-icon">${cat.icon}</span>
          ${cat.label}
        </div>
    `;

    sorted.forEach((p, i) => {
      html += `
        <div class="leader-row">
          <span class="leader-rank ${i < 3 ? 'top-3' : ''}">${i + 1}</span>
          <img class="team-logo" src="${p.teamLogo}" alt="${p.teamName}" style="width:22px; height:22px; margin-right:8px;">
          <div class="leader-info">
            <div class="leader-name">${p.name}</div>
            <div class="leader-meta">
              ${p.teamName} &middot; #${p.number} &middot; ${p.position}
            </div>
          </div>
          <span class="leader-value">${p[cat.key]}</span>
        </div>
      `;
    });

    html += '</div>';
  });

  container.innerHTML = html;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setActiveNav();

  // Homepage
  renderStandings('standings');

  // Schedule page
  renderSchedule('schedule');

  // Teams page
  renderTeamCards('team-cards');

  // Leaders page
  renderLeaders('leaders');

  // Check URL params for direct team link
  const params = new URLSearchParams(window.location.search);
  const teamParam = params.get('team');
  if (teamParam) {
    showTeamDetail(teamParam);
  }
});
