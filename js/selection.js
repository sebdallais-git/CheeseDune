// Game/public/dune/js/selection.js
// Selection state is owned entirely by this module — not stored on unit objects.
import { getUnitAtPosition, getUnitsInRect, getUnitsOfType } from './units.js';

let selectedUnits = [];
const selectedSet = new Set(); // For O(1) isSelected() lookups

export function getSelectedUnits() { return selectedUnits; }
export function isSelected(unit) { return selectedSet.has(unit); }

export function selectUnit(unit) {
  deselectAll();
  if (unit && unit.owner === 'player') {
    selectedUnits = [unit];
    selectedSet.add(unit);
  }
}

export function deselectAll() {
  selectedUnits = [];
  selectedSet.clear();
}

export function selectAtPosition(worldX, worldY) {
  const unit = getUnitAtPosition(worldX, worldY, 20);
  if (unit && unit.owner === 'player') {
    selectUnit(unit);
    return unit;
  }
  return null;
}

export function selectInRect(x1, y1, x2, y2) {
  deselectAll();
  const inBox = getUnitsInRect(x1, y1, x2, y2);
  selectedUnits = inBox.filter(u => u.owner === 'player');
  for (const u of selectedUnits) selectedSet.add(u);
}

export function selectAllOfType(unit) {
  if (!unit || unit.owner !== 'player') return;
  deselectAll();
  selectedUnits = getUnitsOfType(unit.type, 'player');
  for (const u of selectedUnits) selectedSet.add(u);
}

export function hasSelection() {
  return selectedUnits.length > 0;
}

/**
 * Remove dead units from selection. Called each game tick.
 */
export function cleanSelection() {
  const before = selectedUnits.length;
  selectedUnits = selectedUnits.filter(u => u.alive);
  if (selectedUnits.length !== before) {
    selectedSet.clear();
    for (const u of selectedUnits) selectedSet.add(u);
  }
}
