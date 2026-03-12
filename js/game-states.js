// Game/public/dune/js/game-states.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

// Game states
export const GameStateId = {
  MAIN_MENU: 'MAIN_MENU',
  SKIRMISH_SETUP: 'SKIRMISH_SETUP',
  CAMPAIGN_SETUP: 'CAMPAIGN_SETUP',
  PLAYING: 'PLAYING',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
};

let currentState = GameStateId.MAIN_MENU;

let skirmishSettings = {
  faction: 'swiss',
  mapSize: 48,
  opponents: 1,
  difficulty: 'medium',
  seed: Date.now(),
};

let gameTime = 0;
let resultData = null;

// Owner → faction registry
const ownerFactions = {};

// Callback for starting a game (avoids circular import with main.js)
let onStartGame = null;
export function setOnStartGame(fn) { onStartGame = fn; }

export function getGameState() { return currentState; }
export function setGameState(state) { currentState = state; }
export function getSkirmishSettings() { return { ...skirmishSettings }; }
export function setSkirmishSettings(s) { Object.assign(skirmishSettings, s); }
export function getGameTime() { return gameTime; }
export function addGameTime(dt) { gameTime += dt; }
export function resetGameTime() { gameTime = 0; }
export function getResultData() { return resultData; }
export function setResultData(data) { resultData = data; }

export function registerOwnerFaction(owner, faction) {
  ownerFactions[owner] = faction;
}

export function getOwnerFaction(owner) {
  return ownerFactions[owner] || 'swiss';
}

export function clearOwnerFactions() {
  for (const key in ownerFactions) delete ownerFactions[key];
}

// --- Menu/Setup Screen Rendering ---

const MAP_SIZES = [
  { label: 'S', value: 32 },
  { label: 'M', value: 48 },
  { label: 'L', value: 64 },
  { label: 'XL', value: 80 },
];

const FACTIONS = [
  { id: 'swiss', label: 'Swiss', color: '#cc0000' },
  { id: 'french', label: 'French', color: '#0055a4' },
  { id: 'german', label: 'German', color: '#ffcc00' },
];

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

let menuButtons = [];

function btn(label, x, y, w, h, action) {
  return { label, x, y, w, h, action };
}

/**
 * Draw main menu screen.
 */
export function drawMainMenu(ctx) {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALPINE CHEESE RUSH', CANVAS_WIDTH / 2, 200);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('A Dune 2-style RTS', CANVAS_WIDTH / 2, 240);

  const bw = 240, bh = 60;
  const bx = (CANVAS_WIDTH - bw) / 2;
  const by = 340;

  ctx.fillStyle = '#2a3a2a';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#4a8a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#ccddcc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('SKIRMISH', CANVAS_WIDTH / 2, by + 38);

  const cy2 = by + bh + 20;
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(bx, cy2, bw, bh);
  ctx.strokeStyle = '#4a4a8a';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, cy2, bw, bh);
  ctx.fillStyle = '#ccccdd';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('CAMPAIGN', CANVAS_WIDTH / 2, cy2 + 38);

  ctx.textAlign = 'left';

  menuButtons = [
    btn('skirmish', bx, by, bw, bh, () => setGameState(GameStateId.SKIRMISH_SETUP)),
    btn('campaign', bx, cy2, bw, bh, () => setGameState(GameStateId.CAMPAIGN_SETUP)),
  ];
}

/**
 * Draw skirmish setup screen.
 */
export function drawSkirmishSetup(ctx) {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('SKIRMISH SETUP', CANVAS_WIDTH / 2, 60);

  menuButtons = [];
  const cx = CANVAS_WIDTH / 2;
  const btnW = 100, btnH = 44, gap = 10;

  // Faction row
  let rowY = 120;
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.fillText('Faction', cx, rowY);
  rowY += 20;
  const factionStartX = cx - ((FACTIONS.length * (btnW + gap) - gap) / 2);
  for (let i = 0; i < FACTIONS.length; i++) {
    const f = FACTIONS[i];
    const bx = factionStartX + i * (btnW + gap);
    const selected = skirmishSettings.faction === f.id;
    ctx.fillStyle = selected ? f.color : '#1a1a24';
    ctx.fillRect(bx, rowY, btnW, btnH);
    ctx.strokeStyle = selected ? '#fff' : '#444';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bx, rowY, btnW, btnH);
    ctx.fillStyle = selected ? '#fff' : '#888';
    ctx.font = '14px monospace';
    ctx.fillText(f.label, bx + btnW / 2, rowY + 28);
    menuButtons.push(btn(f.id, bx, rowY, btnW, btnH, () => {
      skirmishSettings.faction = f.id;
    }));
  }

  // Map size row
  rowY += btnH + 30;
  ctx.fillStyle = '#aaa';
  ctx.fillText('Map Size', cx, rowY);
  rowY += 20;
  const sizeW = 60;
  const sizeStartX = cx - ((MAP_SIZES.length * (sizeW + gap) - gap) / 2);
  for (let i = 0; i < MAP_SIZES.length; i++) {
    const ms = MAP_SIZES[i];
    const bx = sizeStartX + i * (sizeW + gap);
    const selected = skirmishSettings.mapSize === ms.value;
    ctx.fillStyle = selected ? '#336633' : '#1a1a24';
    ctx.fillRect(bx, rowY, sizeW, btnH);
    ctx.strokeStyle = selected ? '#6a6' : '#444';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bx, rowY, sizeW, btnH);
    ctx.fillStyle = selected ? '#cfc' : '#888';
    ctx.font = '14px monospace';
    ctx.fillText(ms.label, bx + sizeW / 2, rowY + 28);
    menuButtons.push(btn(ms.label, bx, rowY, sizeW, btnH, () => {
      skirmishSettings.mapSize = ms.value;
    }));
  }

  // Opponents row
  rowY += btnH + 30;
  ctx.fillStyle = '#aaa';
  ctx.fillText('Opponents', cx, rowY);
  rowY += 20;
  const oppW = 60;
  const opponents = [1, 2, 3];
  const oppStartX = cx - ((opponents.length * (oppW + gap) - gap) / 2);
  for (let i = 0; i < opponents.length; i++) {
    const n = opponents[i];
    const bx = oppStartX + i * (oppW + gap);
    const selected = skirmishSettings.opponents === n;
    ctx.fillStyle = selected ? '#333366' : '#1a1a24';
    ctx.fillRect(bx, rowY, oppW, btnH);
    ctx.strokeStyle = selected ? '#66f' : '#444';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bx, rowY, oppW, btnH);
    ctx.fillStyle = selected ? '#ccf' : '#888';
    ctx.font = '16px monospace';
    ctx.fillText(String(n), bx + oppW / 2, rowY + 28);
    menuButtons.push(btn(String(n), bx, rowY, oppW, btnH, () => {
      skirmishSettings.opponents = n;
    }));
  }

  // Difficulty row
  rowY += btnH + 30;
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.fillText('Difficulty', cx, rowY);
  rowY += 20;
  const diffStartX = cx - ((DIFFICULTIES.length * (btnW + gap) - gap) / 2);
  for (let i = 0; i < DIFFICULTIES.length; i++) {
    const d = DIFFICULTIES[i];
    const bx = diffStartX + i * (btnW + gap);
    const selected = skirmishSettings.difficulty === d.id;
    const diffColors = { easy: '#336633', medium: '#666633', hard: '#663333' };
    ctx.fillStyle = selected ? (diffColors[d.id] || '#333') : '#1a1a24';
    ctx.fillRect(bx, rowY, btnW, btnH);
    ctx.strokeStyle = selected ? '#aaa' : '#444';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bx, rowY, btnW, btnH);
    ctx.fillStyle = selected ? '#fff' : '#888';
    ctx.font = '14px monospace';
    ctx.fillText(d.label, bx + btnW / 2, rowY + 28);
    menuButtons.push(btn(d.id, bx, rowY, btnW, btnH, () => {
      skirmishSettings.difficulty = d.id;
    }));
  }

  // Start button
  rowY += btnH + 50;
  const startW = 260, startH = 60;
  const startX = (CANVAS_WIDTH - startW) / 2;
  ctx.fillStyle = '#2a4a2a';
  ctx.fillRect(startX, rowY, startW, startH);
  ctx.strokeStyle = '#4a8a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, rowY, startW, startH);
  ctx.fillStyle = '#ccffcc';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('START BATTLE', cx, rowY + 38);
  menuButtons.push(btn('start', startX, rowY, startW, startH, 'START_GAME'));

  ctx.textAlign = 'left';
}

// --- Campaign ---

const CAMPAIGN_MISSIONS = [
  { name: 'First Steps', desc: 'Establish your base and defeat a single opponent.', opponents: 1, difficulty: 'easy', mapSize: 32 },
  { name: 'Border Skirmish', desc: 'Two enemies challenge your territory.', opponents: 2, difficulty: 'easy', mapSize: 40 },
  { name: 'Alpine Assault', desc: 'Hold your ground against two aggressive foes.', opponents: 2, difficulty: 'medium', mapSize: 48 },
  { name: 'Three-Front War', desc: 'Surrounded on all sides. Survive and conquer.', opponents: 3, difficulty: 'medium', mapSize: 56 },
  { name: 'The Grand Melee', desc: 'A massive battle for alpine supremacy.', opponents: 3, difficulty: 'hard', mapSize: 64 },
];

let campaignProgress = 0;
try {
  campaignProgress = parseInt(localStorage.getItem('cheesedune_campaign') || '0', 10);
} catch (e) { /* no localStorage */ }

function saveCampaignProgress() {
  try { localStorage.setItem('cheesedune_campaign', String(campaignProgress)); } catch (e) { /* noop */ }
}

let campaignFaction = 'swiss';
let activeMission = 0;

// Setters for HTML UI (three-ui.js) — Batch 7 will consolidate these
export function setCampaignFaction(f) { campaignFaction = f; }
export function setActiveMission(idx) { activeMission = idx; }

/**
 * Draw campaign setup screen.
 */
export function drawCampaignSetup(ctx) {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('CAMPAIGN', CANVAS_WIDTH / 2, 50);

  menuButtons = [];
  const cx = CANVAS_WIDTH / 2;

  // Faction selector
  const btnW = 100, btnH = 40, gap = 10;
  let rowY = 80;
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.fillText('Faction', cx, rowY);
  rowY += 18;
  const factionStartX = cx - ((FACTIONS.length * (btnW + gap) - gap) / 2);
  for (let i = 0; i < FACTIONS.length; i++) {
    const f = FACTIONS[i];
    const bx = factionStartX + i * (btnW + gap);
    const selected = campaignFaction === f.id;
    ctx.fillStyle = selected ? f.color : '#1a1a24';
    ctx.fillRect(bx, rowY, btnW, btnH);
    ctx.strokeStyle = selected ? '#fff' : '#444';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bx, rowY, btnW, btnH);
    ctx.fillStyle = selected ? '#fff' : '#888';
    ctx.font = '14px monospace';
    ctx.fillText(f.label, bx + btnW / 2, rowY + 26);
    menuButtons.push(btn(f.id, bx, rowY, btnW, btnH, () => {
      campaignFaction = f.id;
    }));
  }

  // Mission list
  rowY += btnH + 24;
  const mw = 440, mh = 56;
  const mx = (CANVAS_WIDTH - mw) / 2;

  for (let i = 0; i < CAMPAIGN_MISSIONS.length; i++) {
    const m = CAMPAIGN_MISSIONS[i];
    const my = rowY + i * (mh + 8);
    const unlocked = i <= campaignProgress;
    const isActive = activeMission === i;

    ctx.fillStyle = isActive ? '#2a3a2a' : unlocked ? '#1a1a2e' : '#111118';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = isActive ? '#4a8a4a' : unlocked ? '#444' : '#222';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(mx, my, mw, mh);

    // Mission number
    ctx.fillStyle = unlocked ? '#ffcc00' : '#333';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}.`, mx + 10, my + 24);

    // Mission name
    ctx.fillStyle = unlocked ? '#ddd' : '#444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(m.name, mx + 40, my + 20);

    // Description
    ctx.fillStyle = unlocked ? '#888' : '#333';
    ctx.font = '11px monospace';
    ctx.fillText(unlocked ? m.desc : 'Locked', mx + 40, my + 40);

    // Completed checkmark
    if (i < campaignProgress) {
      ctx.fillStyle = '#44cc44';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('\u2713', mx + mw - 10, my + 30);
    }

    ctx.textAlign = 'center';

    if (unlocked) {
      menuButtons.push(btn('mission' + i, mx, my, mw, mh, () => {
        activeMission = i;
      }));
    }
  }

  // Start mission button
  rowY += CAMPAIGN_MISSIONS.length * (mh + 8) + 10;
  const startW = 260, startH = 50;
  const startX = (CANVAS_WIDTH - startW) / 2;
  ctx.fillStyle = '#2a4a2a';
  ctx.fillRect(startX, rowY, startW, startH);
  ctx.strokeStyle = '#4a8a4a';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, rowY, startW, startH);
  ctx.fillStyle = '#ccffcc';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('START MISSION', cx, rowY + 32);
  menuButtons.push(btn('startMission', startX, rowY, startW, startH, 'START_CAMPAIGN_MISSION'));

  // Back button
  const backY = rowY + startH + 16;
  const backW = 160, backH = 36;
  const backX = (CANVAS_WIDTH - backW) / 2;
  ctx.fillStyle = '#1a1a24';
  ctx.fillRect(backX, backY, backW, backH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(backX, backY, backW, backH);
  ctx.fillStyle = '#888';
  ctx.font = '14px monospace';
  ctx.fillText('BACK', cx, backY + 24);
  menuButtons.push(btn('back', backX, backY, backW, backH, () => {
    setGameState(GameStateId.MAIN_MENU);
  }));

  ctx.textAlign = 'left';
}

export function getCampaignMission() {
  const m = CAMPAIGN_MISSIONS[activeMission];
  return {
    ...m,
    faction: campaignFaction,
    missionIndex: activeMission,
    seed: 42000 + activeMission,
  };
}

export function advanceCampaign() {
  if (activeMission >= campaignProgress) {
    campaignProgress = activeMission + 1;
    saveCampaignProgress();
  }
}

/**
 * Draw victory/defeat overlay.
 */
export function drawResultOverlay(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  const cx = CANVAS_WIDTH / 2;

  if (currentState === GameStateId.VICTORY) {
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('VICTORY', cx, 280);
  } else {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('DEFEAT', cx, 280);
  }

  const mins = Math.floor(gameTime / 60);
  const secs = Math.floor(gameTime % 60);
  ctx.fillStyle = '#aaa';
  ctx.font = '18px monospace';
  ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, cx, 340);

  const bw = 240, bh = 50;
  const bx = (CANVAS_WIDTH - bw) / 2;
  const by = 420;
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#ccc';
  ctx.font = '16px monospace';
  ctx.fillText('RETURN TO MENU', cx, by + 32);

  menuButtons = [
    btn('menu', bx, by, bw, bh, () => setGameState(GameStateId.MAIN_MENU)),
  ];

  ctx.textAlign = 'left';
}

/**
 * Handle menu tap input. Returns action string or null.
 */
export function handleMenuInput(canvasX, canvasY) {
  for (const b of menuButtons) {
    if (canvasX >= b.x && canvasX <= b.x + b.w &&
        canvasY >= b.y && canvasY <= b.y + b.h) {
      if (typeof b.action === 'function') {
        b.action();
        return 'handled';
      }
      if (b.action === 'START_GAME' && onStartGame) {
        skirmishSettings.seed = Date.now();
        onStartGame('skirmish');
        return 'handled';
      }
      if (b.action === 'START_CAMPAIGN_MISSION' && onStartGame) {
        onStartGame('campaign');
        return 'handled';
      }
      return b.action;
    }
  }
  return null;
}
