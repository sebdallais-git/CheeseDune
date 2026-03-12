// Game/public/dune/js/ai.js
import {
  BuildingType, BuildingStats, UnitType, UnitStats, TILE_SIZE, AI_SETTINGS
} from './constants.js';
import { getPlayerBuildings, hasBuilding, canPlaceBuilding } from './buildings.js';
import {
  startBuilding, getCurrentBuild, canBuildType, placePendingBuilding
} from './construction.js';
import { getUnits, spawnUnit, moveUnitTo } from './units.js';
import { canAfford, spendCheese } from './economy.js';
import { getPowerStatus } from './power.js';

const AIState = {
  BUILD_POWER: 'buildPower',
  BUILD_ECONOMY: 'buildEconomy',
  BUILD_MILITARY: 'buildMilitary',
  ATTACK: 'attack',
  REBUILD: 'rebuild',
};

export class AIPlayer {
  constructor(owner, faction, difficulty) {
    this.owner = owner;
    this.faction = faction;
    this.difficulty = difficulty;
    this.settings = AI_SETTINGS[difficulty];
    this.state = AIState.BUILD_POWER;
    this.decisionTimer = difficulty === 'easy' ? 8.0 : 2.0; // easy: long initial delay
    this.attackTimer = 0;
    this.trainTimer = 0;
  }

  update(dt) {
    this.decisionTimer -= dt;
    this.trainTimer -= dt;
    if (this.decisionTimer > 0) return;
    this.decisionTimer = this.difficulty === 'easy' ? 5.0 : 1.0; // easy: very slow decisions

    const myBuildings = getPlayerBuildings(this.owner);
    const allUnits = getUnits();
    const myUnits = allUnits.filter(u => u.owner === this.owner && u.alive);
    const myMilitary = myUnits.filter(u =>
      u.type !== UnitType.HARVESTER && u.type !== UnitType.MCV && !u.deploying
    );
    const myHarvesters = myUnits.filter(u => u.type === UnitType.HARVESTER);

    const hasCY = myBuildings.some(b => b.type === BuildingType.CONSTRUCTION_YARD);
    if (!hasCY) return;

    // Always: place pending buildings
    const current = getCurrentBuild(this.owner);
    if (current && current.pendingPlacement) {
      const spot = this._findBuildSpot(current.type, myBuildings);
      if (spot) placePendingBuilding(this.owner, spot.x, spot.y, this.faction);
    }

    switch (this.state) {
      case AIState.BUILD_POWER: {
        const surplus = getPowerStatus(this.owner).surplus;
        if (surplus > 10) {
          this.state = AIState.BUILD_ECONOMY;
        } else {
          this._tryBuild(BuildingType.POWER_PLANT, myBuildings);
        }
        break;
      }

      case AIState.BUILD_ECONOMY: {
        const hasRef = myBuildings.some(b => b.type === BuildingType.REFINERY);
        const hTarget = this.difficulty === 'easy' ? 1 : 3;

        if (!hasRef) {
          this._tryBuild(BuildingType.REFINERY, myBuildings);
        } else if (myHarvesters.length < hTarget) {
          this._trainUnit(UnitType.HARVESTER, myBuildings);
        } else {
          this.state = AIState.BUILD_MILITARY;
        }

        if (getPowerStatus(this.owner).surplus < 5) {
          this._tryBuild(BuildingType.POWER_PLANT, myBuildings);
        }
        break;
      }

      case AIState.BUILD_MILITARY: {
        if (!hasBuilding(BuildingType.BARRACKS, this.owner)) {
          this._tryBuild(BuildingType.BARRACKS, myBuildings);
        } else if (this.settings.maxUnitTier >= 2 && !hasBuilding(BuildingType.LIGHT_FACTORY, this.owner)) {
          this._tryBuild(BuildingType.LIGHT_FACTORY, myBuildings);
        } else if (this.settings.maxUnitTier >= 3 && !hasBuilding(BuildingType.HEAVY_FACTORY, this.owner)) {
          this._tryBuild(BuildingType.HEAVY_FACTORY, myBuildings);
        } else {
          this._trainArmy(myBuildings, myMilitary);
        }

        if (getPowerStatus(this.owner).surplus < 5) {
          this._tryBuild(BuildingType.POWER_PLANT, myBuildings);
        }

        const hTarget2 = this.difficulty === 'easy' ? 1 : 3;
        if (myHarvesters.length < hTarget2) {
          this._trainUnit(UnitType.HARVESTER, myBuildings);
        }

        if (myMilitary.length >= this.settings.armyThreshold) {
          this.state = AIState.ATTACK;
          this.attackTimer = 30;
        }
        break;
      }

      case AIState.ATTACK: {
        this._executeAttack(myMilitary, allUnits);
        this.attackTimer -= 1;
        if (this.attackTimer <= 0 || myMilitary.length < 3) {
          this.state = AIState.REBUILD;
          this.decisionTimer = this.settings.rebuildDelay;
        }
        break;
      }

      case AIState.REBUILD: {
        const hasRefinery = myBuildings.some(b => b.type === BuildingType.REFINERY);
        this.state = hasRefinery ? AIState.BUILD_MILITARY : AIState.BUILD_ECONOMY;
        break;
      }
    }
  }

  _tryBuild(type, myBuildings) {
    const current = getCurrentBuild(this.owner);
    if (current && !current.pendingPlacement) return false;
    if (!canBuildType(type, this.owner)) return false;
    return startBuilding(type, this.owner, this.faction);
  }

  _findBuildSpot(type, myBuildings) {
    if (myBuildings.length === 0) return null;
    const base = myBuildings[0];

    for (let r = 1; r <= 15; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = base.tileX + dx;
          const ty = base.tileY + dy;
          if (canPlaceBuilding(type, tx, ty, this.owner)) {
            return { x: tx, y: ty };
          }
        }
      }
    }
    return null;
  }

  _trainUnit(unitType, myBuildings) {
    if (this.trainTimer > 0) return;
    const stats = UnitStats[unitType];
    if (!canAfford(stats.cost, this.owner)) return;

    let producer = null;
    for (const b of myBuildings) {
      const bs = BuildingStats[b.type];
      if (bs && bs.produces && bs.produces.includes(unitType)) {
        producer = b;
        break;
      }
    }
    if (!producer) return;

    spendCheese(stats.cost, this.owner);
    const spawnX = producer.tileX + producer.footprint[0];
    const spawnY = producer.tileY + Math.floor(producer.footprint[1] / 2);
    spawnUnit(unitType, this.faction, spawnX, spawnY, this.owner);
    this.trainTimer = stats.buildTime * this.settings.buildTimeMult;
  }

  _trainArmy(myBuildings, myMilitary) {
    const tier = this.settings.maxUnitTier;
    let unitType;

    if (tier >= 3 && hasBuilding(BuildingType.HEAVY_FACTORY, this.owner)) {
      unitType = myMilitary.length % 3 === 0 ? UnitType.TANK : UnitType.HEAVY_INFANTRY;
    } else if (tier >= 2 && hasBuilding(BuildingType.LIGHT_FACTORY, this.owner)) {
      unitType = myMilitary.length % 2 === 0 ? UnitType.LIGHT_VEHICLE : UnitType.HEAVY_INFANTRY;
    } else {
      // Easy: only light infantry (no mix with heavy)
      unitType = UnitType.LIGHT_INFANTRY;
    }

    this._trainUnit(unitType, myBuildings);
  }

  _executeAttack(myMilitary, allUnits) {
    if (myMilitary.length === 0) return;

    const playerBuildings = getPlayerBuildings('player');
    if (playerBuildings.length === 0) return;

    // Easy AI only sends a fraction of its army (attackFraction)
    const fraction = this.settings.attackFraction || 1.0;
    let attackForce = myMilitary;
    if (fraction < 1.0) {
      const count = Math.max(2, Math.floor(myMilitary.length * fraction));
      attackForce = myMilitary.slice(0, count);
    }

    let target;
    if (this.difficulty === 'hard') {
      target = playerBuildings.find(b => b.type === BuildingType.REFINERY) || playerBuildings[0];
    } else {
      // Easy/medium: just attack nearest building (not smart targeting)
      const avgX = attackForce.reduce((s, u) => s + u.x, 0) / attackForce.length;
      const avgY = attackForce.reduce((s, u) => s + u.y, 0) / attackForce.length;
      let nearest = playerBuildings[0];
      let nearDist = Infinity;
      for (const b of playerBuildings) {
        const bx = (b.tileX + b.footprint[0] / 2) * TILE_SIZE;
        const by = (b.tileY + b.footprint[1] / 2) * TILE_SIZE;
        const d = Math.sqrt((bx - avgX) ** 2 + (by - avgY) ** 2);
        if (d < nearDist) { nearDist = d; nearest = b; }
      }
      target = nearest;
    }

    const tx = target.tileX + Math.floor(target.footprint[0] / 2);
    const ty = target.tileY + Math.floor(target.footprint[1] / 2);
    for (const u of attackForce) {
      if (!u.moving && !u.target) {
        moveUnitTo(u, tx, ty);
      }
    }
  }
}

let aiPlayers = [];

export function createAI(owner, faction, difficulty) {
  const ai = new AIPlayer(owner, faction, difficulty);
  aiPlayers.push(ai);
  return ai;
}

export function updateAI(dt) {
  for (const ai of aiPlayers) {
    ai.update(dt);
  }
}

export function clearAI() {
  aiPlayers = [];
}
