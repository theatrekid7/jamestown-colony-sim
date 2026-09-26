const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const logEl = document.getElementById('log');
const npcListEl = document.getElementById('npcList');
const objectiveText = document.getElementById('objectiveText');
const seasonLabel = document.getElementById('seasonLabel');
const survivalFill = document.getElementById('survivalFill');

const state = {
  food: 24,
  population: 18,
  wood: 10,
  tools: 5,
  copper: 2,
  beads: 3,
  morale: 60,
  trust: 42,
  survival: 55,
  seasonIndex: 0,
  seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
  turn: 1,
  state: 'playing'
};

const mapConfig = {
  cols: 14,
  rows: 14,
  tileW: 52,
  tileH: 26,
  originX: 90,
  originY: 70,
};

const map = [
  ['water','water','water','water','water','water','water','water','water','water','water','water','water','water'],
  ['water','forest','forest','shore','field','field','field','forest','forest','shore','forest','field','field','water'],
  ['water','forest','field','field','field','forest','forest','field','shore','field','forest','field','forest','water'],
  ['water','forest','field','field','shore','shore','field','field','forest','field','field','forest','field','water'],
  ['water','field','field','shore','shore','shore','field','field','field','forest','field','field','forest','water'],
  ['water','forest','field','field','shore','field','field','forest','field','field','forest','field','field','water'],
  ['water','forest','forest','field','field','field','forest','shore','field','field','forest','field','forest','water'],
  ['water','forest','field','forest','field','forest','field','field','forest','forest','field','field','shore','water'],
  ['water','field','field','forest','forest','field','field','shore','shore','field','field','forest','field','water'],
  ['water','forest','field','field','forest','field','field','field','forest','forest','forest','field','field','water'],
  ['water','forest','forest','field','field','shore','field','field','field','forest','field','forest','field','water'],
  ['water','field','field','field','forest','field','field','forest','forest','forest','field','field','forest','water'],
  ['water','forest','field','forest','field','forest','field','field','field','forest','field','forest','field','water'],
  ['water','water','water','water','water','water','water','water','water','water','water','water','water','water'],
];

const player = { x: 2, y: 2, dirX: 1, dirY: 0 };
const colonyPos = { x: 4, y: 4 };
const powhatanPos = { x: 9, y: 7 };

const historicalFigures = [
  { name: 'Captain John Smith', role: 'Leader of Jamestown', x: 4, y: 4, type: 'leader', description: 'The colony is strongest when Smith commands it through famine, fear, and diplomacy.' },
  { name: 'Chief Powhatan', role: 'Powhatan polity leader', x: 9, y: 7, type: 'powhatan', description: 'The elder political power in the region, suspicious of English encroachment but willing to bargain.' },
  { name: 'Pocahontas', role: 'Intermediary and diplomat', x: 8, y: 6, type: 'diplomat', description: 'Her influence can sway fragile peace and lessen the risk of open war.' },
  { name: 'Opechancanough', role: 'Powhatan military leader', x: 10, y: 8, type: 'war', description: 'A cautious and dangerous military thinker who sees the English as a growing threat.' },
  { name: 'John Rolfe', role: 'Tobacco planter', x: 5, y: 5, type: 'planter', description: 'Could help the colony find a profitable crop, but only if the colony survives long enough.' },
  { name: 'Lord De La Warr', role: 'Governor-in-waiting', x: 3, y: 6, type: 'governor', description: 'A disciplinarian whose authority could stabilize the colony or deepen resentment.' },
  { name: 'Edward Maria Wingfield', role: 'Council member', x: 5, y: 3, type: 'council', description: 'A political operator with influence over the council and the long-term direction of the colony.' }
];

const tileColors = {
  water: '#2d6c97',
  forest: '#3f6d3c',
  field: '#7fa85a',
  shore: '#d9bb76',
  stone: '#b6b0a4',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function addLog(text) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = text;
  logEl.prepend(entry);
}

function updateHud() {
  document.getElementById('foodStat').textContent = state.food;
  document.getElementById('popStat').textContent = state.population;
  document.getElementById('woodStat').textContent = state.wood;
  document.getElementById('toolStat').textContent = state.tools;
  document.getElementById('copperStat').textContent = state.copper;
  document.getElementById('beadStat').textContent = state.beads;
  document.getElementById('moraleStat').textContent = state.morale;
  document.getElementById('trustStat').textContent = state.trust;

  const survivalPercent = clamp(state.survival, 0, 100);
  survivalFill.style.width = survivalPercent + '%';
  seasonLabel.textContent = state.seasons[state.seasonIndex];

  if (survivalPercent <= 30) {
    objectiveText.textContent = 'The colony is near collapse. Find food, negotiate peace, and secure the future before winter breaks the settlement.';
  } else if (survivalPercent <= 60) {
    objectiveText.textContent = 'Jamestown survives by grit and strategy. Keep the people fed and the Powhatan relationship manageable.';
  } else {
    objectiveText.textContent = 'The colony has a chance to endure. Continue to map, trade, and lead with careful diplomacy.';
  }
}

function isBlocked(x, y) {
  if (x < 0 || y < 0 || x >= mapConfig.cols || y >= mapConfig.rows) return true;
  return map[y][x] === 'water';
}

function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (!isBlocked(nx, ny)) {
    player.x = nx;
    player.y = ny;
    player.dirX = dx || player.dirX;
    player.dirY = dy || player.dirY;
  }
}

function getNearestNpc() {
  let nearest = null;
  let best = Infinity;
  for (const npc of historicalFigures) {
    const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
    if (dist < best) {
      best = dist;
      nearest = npc;
    }
  }
  return nearest;
}

function renderNpcList() {
  npcListEl.innerHTML = '';
  const nearest = getNearestNpc();

  historicalFigures.forEach((npc) => {
    const button = document.createElement('button');
    button.className = 'npc';
    button.innerHTML = `<span class="npc-title">${npc.name}</span><span class="npc-role">${npc.role}</span>`;
    if (nearest && nearest.name === npc.name) {
      button.style.borderColor = 'rgba(246,211,113,0.75)';
      button.style.boxShadow = 'inset 0 0 0 1px rgba(246,211,113,0.3)';
    }
    button.addEventListener('click', () => interactWithNpc(npc));
    npcListEl.appendChild(button);
  });
}

function interactWithNpc(npc) {
  const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);
  if (dist > 2) {
    addLog(`You are too far away to speak with ${npc.name}.`);
    return;
  }

  const choices = {
    'Captain John Smith': [
      { label: 'Organize supplies', effect: () => { state.food += 2; state.morale += 8; state.survival += 7; addLog('You organize the colony to secure provisions more efficiently.'); } },
      { label: 'Fortify the settlement', effect: () => { state.wood = Math.max(0, state.wood - 2); state.tools = Math.max(0, state.tools - 1); state.morale += 8; state.survival += 10; addLog('The fortifications strengthen Jamestown, but the labor costs the colony.'); } },
      { label: 'Negotiate with the Powhatan', effect: () => { state.trust += 10; state.survival += 5; addLog('You choose diplomacy, a necessary move if the colony is to survive.'); } }
    ],
    'Chief Powhatan': [
      { label: 'Offer gifts', effect: () => { state.trust += 12; state.food += 3; addLog('Chief Powhatan is impressed by the gifts and grants a more open exchange.'); } },
      { label: 'Demand tribute', effect: () => { state.trust -= 18; state.survival -= 10; addLog('Your demand stokes fear and resentment. Relations worsen sharply.'); } },
      { label: 'Ask for corn and fish', effect: () => { state.food += 5; state.trust += 3; addLog('The exchange yields food, but the terms remain fragile.'); } }
    ],
    'Pocahontas': [
      { label: 'Seek mediation', effect: () => { state.trust += 9; state.food += 2; addLog('Pocahontas helps broker communication and lowers the risk of open conflict.'); } },
      { label: 'Keep a distance', effect: () => { state.trust -= 5; addLog('Distance and mistrust deepen the gap between the settlers and their neighbors.'); } }
    ],
    'Opechancanough': [
      { label: 'Speak of alliance', effect: () => { state.trust += 6; state.survival += 5; addLog('He listens, though war remains a real possibility.'); } },
      { label: 'Threaten the frontier', effect: () => { state.trust -= 16; state.survival -= 12; addLog('Your threat puts the colony on a path toward open conflict.'); } }
    ],
    'John Rolfe': [
      { label: 'Try a tobacco crop', effect: () => { state.food -= 1; state.survival += 8; addLog('A promising crop could one day generate wealth, if the colony survives the first years.'); } },
      { label: 'Focus on food security', effect: () => { state.food += 3; state.morale += 4; addLog('The colony concentrates on primal survival rather than speculation.'); } }
    ],
    'Lord De La Warr': [
      { label: 'Follow strict discipline', effect: () => { state.morale -= 4; state.survival += 7; addLog('Discipline creates order, though the settlers resent the harshness.'); } },
      { label: 'Support practical survival', effect: () => { state.morale += 7; state.food += 2; addLog('The colony gets a more humane form of authority.'); } }
    ],
    'Edward Maria Wingfield': [
      { label: 'Reform the council', effect: () => { state.morale += 5; addLog('The council is reorganized to direct labor and food more efficiently.'); } },
      { label: 'Centralize power', effect: () => { state.morale -= 6; state.survival += 3; addLog('Strong central control may improve order, but it breeds resentment.'); } }
    ]
  };

  const options = choices[npc.name] || [{ label: 'Talk survival', effect: () => { state.survival += 4; addLog('A practical conversation shifts the colony toward survival.'); } }];

  addLog(`${npc.name}: ${npc.description}`);

  const choiceBox = document.createElement('div');
  choiceBox.className = 'choice-box';
  choiceBox.innerHTML = '<div class="choice-title">Choose your response</div>';

  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.textContent = option.label;
    btn.addEventListener('click', () => {
      option.effect();
      applyConsequences();
      choiceBox.remove();
      updateHud();
      renderNpcList();
    });
    choiceBox.appendChild(btn);
  });

  logEl.prepend(choiceBox);
  updateHud();
}

function gatherResources() {
  const tile = map[player.y][player.x];
  if (tile === 'forest') {
    state.wood += 2;
    addLog('You cut timber for the settlement and gather firewood.');
  } else if (tile === 'field') {
    state.food += 3;
    addLog('You forage and harvest nearby food sources.');
  } else if (tile === 'shore') {
    state.copper += 1;
    addLog('You inspect the shoreline and gather copper and raw metal.');
  } else {
    state.food += 1;
    addLog('You search the edge of the settlement and find enough to keep the colony alive a little longer.');
  }

  state.morale += 2;
  state.survival += 4;
  applyConsequences();
  updateHud();
}

function trade() {
  if (state.copper > 0 || state.beads > 0 || state.tools > 0) {
    const gain = Math.min(state.copper, 1) + Math.min(state.beads, 1) + Math.min(state.tools, 1);
    state.food += 3 + gain;
    state.trust += 8;
    state.copper = Math.max(0, state.copper - 1);
    state.beads = Math.max(0, state.beads - 1);
    state.tools = Math.max(0, state.tools - 1);
    addLog('You exchange goods with neighboring communities and gain vital food and goodwill.');
  } else {
    addLog('You have no trade goods to bargain with. Tools, copper, or beads are needed before a proper exchange can happen.');
  }
  applyConsequences();
  updateHud();
}

function fortifyJamestown() {
  state.wood = Math.max(0, state.wood - 2);
  state.tools = Math.max(0, state.tools - 1);
  state.morale += 8;
  state.survival += 10;
  addLog('You order stronger fortifications and improved planning around the colony.');
  applyConsequences();
  updateHud();
}

function mapBay() {
  state.survival += 7;
  state.trust += 3;
  state.food += 1;
  addLog('You chart the bay and rivers, giving the colony a clearer view of the countryside and its trade routes.');
  applyConsequences();
  updateHud();
}

function advanceSeason() {
  if (state.state !== 'playing') return;

  state.turn += 1;
  state.seasonIndex = (state.seasonIndex + 1) % state.seasons.length;

  if (state.seasonIndex === 0) {
    state.food -= 6;
    state.morale -= 3;
    addLog('Spring returns. The colony must rebuild and prepare for another difficult year.');
  } else if (state.seasonIndex === 1) {
    state.food -= 4;
    state.tools += 1;
    addLog('Summer labor strengthens the colony and improves practical work, but food remains a concern.');
  } else if (state.seasonIndex === 2) {
    state.food -= 5;
    state.trust -= 2;
    addLog('Autumn brings the harvest, but tension and uncertainty continue to grow.');
  } else {
    state.food -= 8;
    state.morale -= 8;
    state.survival -= 6;
    addLog('Winter closes in. Jamestown feels the danger of starvation and isolation.');
  }

  if (state.trust < 30) {
    state.survival -= 8;
    addLog('Relations with the Powhatan become dangerous. Tension is growing.');
  }

  applyConsequences();
  updateHud();
}

function applyConsequences() {
  state.population = clamp(state.population + (state.food < 10 ? -1 : 0) + (state.trust < 30 ? -1 : 0), 0, 60);
  state.food = clamp(state.food, 0, 999);
  state.morale = clamp(state.morale, 0, 100);
  state.trust = clamp(state.trust, 0, 100);
  state.survival = clamp(state.survival, 0, 100);

  if (state.food <= 0) {
    state.survival -= 12;
  }
  if (state.trust <= 15) {
    state.survival -= 10;
  }
  if (state.morale <= 20) {
    state.survival -= 10;
  }

  if (state.population <= 0) {
    state.state = 'lost';
    objectiveText.textContent = 'Jamestown collapses. The colony cannot survive without food, trust, and leadership.';
    addLog('Game Over: There are no settlers left to carry the colony.');
  } else if (state.survival >= 75 && state.trust >= 55 && state.food >= 18) {
    state.state = 'won';
    objectiveText.textContent = 'Survival achieved. Jamestown endures and your leadership shapes the future of the colony.';
    addLog('Victory: Jamestown survives through your leadership, diplomacy, and hard choices.');
  }

  if (state.state !== 'playing') {
    state.survival = clamp(state.survival, 0, 100);
    updateHud();
  }
}

function drawTile(x, y, tile) {
  const px = (x - y) * mapConfig.tileW / 2 + mapConfig.originX;
  const py = (x + y) * mapConfig.tileH / 2 + mapConfig.originY;
  const color = tileColors[tile] || '#5a7d47';

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + mapConfig.tileW / 2, py + mapConfig.tileH / 2);
  ctx.lineTo(px, py + mapConfig.tileH);
  ctx.lineTo(px - mapConfig.tileW / 2, py + mapConfig.tileH / 2);
  ctx.closePath();
  ctx.fill();

  if (tile === 'field') {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }
}

function drawMarker(x, y, color) {
  const px = (x - y) * mapConfig.tileW / 2 + mapConfig.originX;
  const py = (x + y) * mapConfig.tileH / 2 + mapConfig.originY;

  ctx.fillStyle = color;
  ctx.fillRect(px - 9, py + 4, 18, 18);
}

function drawPlayer() {
  const px = (player.x - player.y) * mapConfig.tileW / 2 + mapConfig.originX;
  const py = (player.x + player.y) * mapConfig.tileH / 2 + mapConfig.originY;

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(px + 2, py + 14, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f4d87a';
  ctx.beginPath();
  ctx.arc(px, py - 6, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff1b3';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, py - 6);
  ctx.lineTo(px + player.dirX * 18, py - 6 + player.dirY * 18);
  ctx.stroke();
}

function drawNpcs() {
  historicalFigures.forEach((npc) => {
    const px = (npc.x - npc.y) * mapConfig.tileW / 2 + mapConfig.originX;
    const py = (npc.x + npc.y) * mapConfig.tileH / 2 + mapConfig.originY;
    const dist = Math.abs(player.x - npc.x) + Math.abs(player.y - npc.y);

    if (npc.type === 'powhatan') {
      ctx.fillStyle = '#9e7340';
    } else if (npc.type === 'diplomat') {
      ctx.fillStyle = '#d2d9ff';
    } else if (npc.type === 'war') {
      ctx.fillStyle = '#d66f6f';
    } else if (npc.type === 'planter') {
      ctx.fillStyle = '#9fe79d';
    } else if (npc.type === 'leader') {
      ctx.fillStyle = '#f6d371';
    } else {
      ctx.fillStyle = '#d9d9d9';
    }

    ctx.beginPath();
    ctx.arc(px, py - 10, dist <= 2 ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      drawTile(x, y, map[y][x]);
    }
  }

  drawMarker(colonyPos.x, colonyPos.y, '#d7c9ae');
  drawMarker(powhatanPos.x, powhatanPos.y, '#9e7340');
  drawNpcs();
  drawPlayer();

  requestAnimationFrame(render);
}

function handleKeydown(e) {
  const key = e.key.toLowerCase();

  if (state.state !== 'playing') return;

  if (key === 'w' || key === 'arrowup') movePlayer(0, -1);
  if (key === 's' || key === 'arrowdown') movePlayer(0, 1);
  if (key === 'a' || key === 'arrowleft') movePlayer(-1, 0);
  if (key === 'd' || key === 'arrowright') movePlayer(1, 0);
  if (key === 'e') {
    const npc = getNearestNpc();
    if (npc) interactWithNpc(npc);
  }

  if (key === ' ') {
    advanceSeason();
  }

  renderNpcList();
}

document.addEventListener('keydown', handleKeydown);
document.getElementById('harvestBtn').addEventListener('click', gatherResources);
document.getElementById('tradeBtn').addEventListener('click', trade);
document.getElementById('fortifyBtn').addEventListener('click', fortifyJamestown);
document.getElementById('mapBtn').addEventListener('click', mapBay);
document.getElementById('seasonBtn').addEventListener('click', advanceSeason);

addLog('The Susan Constant reaches the Chesapeake. Jamestown needs leadership, food, and diplomacy.');
addLog('You are Captain John Smith, tasked with guiding the colony through the first hard year.');
renderNpcList();
updateHud();
render();
