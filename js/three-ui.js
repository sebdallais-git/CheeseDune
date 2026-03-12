// Game/public/dune/js/three-ui.js — HTML overlay UI manager (stub)

export function initUI() {
  // Will be fully implemented in Batch 6
}

export function sync() {
  // Will be fully implemented in Batch 6
}

export function showMenu(stateId) {
  // Will be fully implemented in Batch 6
  // For now, just make sure the main menu is visible
  const allMenus = document.querySelectorAll('.menu-screen, .result-overlay');
  allMenus.forEach(el => el.classList.add('hidden'));

  if (stateId === 'MAIN_MENU') {
    const el = document.getElementById('menu-main');
    if (el) el.classList.remove('hidden');
  } else if (stateId === 'SKIRMISH_SETUP') {
    const el = document.getElementById('menu-skirmish');
    if (el) el.classList.remove('hidden');
  } else if (stateId === 'CAMPAIGN_SETUP') {
    const el = document.getElementById('menu-campaign');
    if (el) el.classList.remove('hidden');
  } else if (stateId === 'VICTORY' || stateId === 'DEFEAT') {
    const el = document.getElementById('menu-result');
    if (el) el.classList.remove('hidden');
  }
}

export function hideGameUI() {
  // Will be fully implemented in Batch 6
  const sidebar = document.getElementById('sidebar');
  const resourceBar = document.getElementById('resource-bar');
  const selectionPanel = document.getElementById('selection-panel');
  if (sidebar) sidebar.style.display = 'none';
  if (resourceBar) resourceBar.style.display = 'none';
  if (selectionPanel) selectionPanel.style.display = 'none';
}

export function showGameUI() {
  // Will be fully implemented in Batch 6
  const sidebar = document.getElementById('sidebar');
  const resourceBar = document.getElementById('resource-bar');
  const selectionPanel = document.getElementById('selection-panel');
  if (sidebar) sidebar.style.display = '';
  if (resourceBar) resourceBar.style.display = '';
  if (selectionPanel) selectionPanel.style.display = '';

  // Hide all menu screens
  const allMenus = document.querySelectorAll('.menu-screen, .result-overlay');
  allMenus.forEach(el => el.classList.add('hidden'));
}
