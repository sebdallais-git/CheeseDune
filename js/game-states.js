// Game/public/dune/js/game-states.js

// Game states
export const GameStateId = {
  MAIN_MENU: 'MAIN_MENU',
  SKIRMISH_SETUP: 'SKIRMISH_SETUP',
  CAMPAIGN_SETUP: 'CAMPAIGN_SETUP',
  MISSION_BRIEFING: 'MISSION_BRIEFING',
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
let activeDifficulty = 'medium';
let campaignGame = false;

// Owner -> faction registry
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
export function getActiveDifficulty() { return activeDifficulty; }
export function setActiveDifficulty(d) { activeDifficulty = d; }
export function getIsCampaignGame() { return campaignGame; }
export function setIsCampaignGame(v) { campaignGame = v; }

export function registerOwnerFaction(owner, faction) {
  ownerFactions[owner] = faction;
}

export function getOwnerFaction(owner) {
  return ownerFactions[owner] || 'swiss';
}

export function clearOwnerFactions() {
  for (const key in ownerFactions) delete ownerFactions[key];
}

// --- Config arrays (exported for HTML UI) ---

export const MAP_SIZES = [
  { label: 'S', value: 32 },
  { label: 'M', value: 48 },
  { label: 'L', value: 64 },
  { label: 'XL', value: 80 },
];

export const FACTIONS = [
  { id: 'swiss', label: 'Swiss', color: '#cc0000' },
  { id: 'french', label: 'French', color: '#0055a4' },
  { id: 'german', label: 'German', color: '#ffcc00' },
];

export const DIFFICULTIES = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

// --- Campaign ---

export const CAMPAIGN_MISSIONS = [
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

// Campaign state getters/setters
export function getCampaignProgress() { return campaignProgress; }
export function getCampaignFaction() { return campaignFaction; }
export function setCampaignFaction(f) { campaignFaction = f; }
export function getActiveMission() { return activeMission; }
export function setActiveMission(idx) { activeMission = idx; }

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
