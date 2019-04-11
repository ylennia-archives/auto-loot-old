'use strict';

const config = require('./config.js');

module.exports = function AutoLootOld(mod) {
  const cmd = mod.command;

  // config
  let enable = config.enable;
  let enableAuto = config.enableAuto;

  let hold = true;
  let location = { x: 0, y: 0, z: 0 };
  let loop = null;
  let loot = {};
  let lootDelayTimeout = null;

  // command
  cmd.add(['loot', 'ㅣㅐㅐㅅ'], {
    // toggle
    '$none': () => {
      enable = !enable;
      setup();
      send(`${enable ? 'En' : 'Dis'}abled`);
    },
    'auto': () => {
      enableAuto = !enableAuto;
      setup();
      send(`Automatic loot interval ${enableAuto ? 'en' : 'dis'}abled`);
    },
    'status': () => {
      status();
    },
    '$default': () => {
      send(`Invalid argument. usage : loot [auto|status]`);
    }
  });

  // game state
  mod.hook('S_LOGIN', 'raw', { order: -1000 }, () => { setup(); });

  mod.hook('S_SPAWN_ME', 'raw', { order: -1000 }, () => { hold = false; });

  mod.hook('S_LOAD_TOPO', 3, { order: -1000 }, (e) => {
    hold = true;
    location = e.loc;
    loot.length = 0;
    loot = {};
  });

  // code
  mod.hook('C_PLAYER_LOCATION', 5, (e) => { location = e.loc; });

  mod.hook('S_SPAWN_DROPITEM', 7, (e) => {
    if (!(config.blacklist.includes(e.item))) {
      loot[e.gameId] = e;
    }
  });

  mod.hook('S_DESPAWN_DROPITEM', 4, (e) => {
    if (e.gameId in loot) {
      delete loot[e.gameId];
    }
  });

  mod.hook('S_SYSTEM_MESSAGE', 1, (e) => {
    let msg = mod.parseSystemMessage(e.message).id;
    if (msg === 'SMT_CANNOT_LOOT_ITEM') {
      return false;
    }
  });

  mod.hook('C_TRY_LOOT_DROPITEM', 4, () => {
    lootAll();
  });

  // helper
  function dist3D(loc1, loc2) {
    return Math.sqrt(
      Math.pow(loc2.x - loc1.x, 2) +
      Math.pow(loc2.y - loc1.y, 2) +
      Math.pow(loc2.z - loc1.z, 2)
    );
  }

  function lootAll() {
    if (!enable || hold || loot.size === 0) {
      return;
    }
    clearTimeout(lootDelayTimeout);
    lootDelayTimeout = null;
    for (let item in loot) {
      if (dist3D(location, loot[item].loc) < 120) {
        mod.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId });
        break;
      }
    }
    lootDelayTimeout = setTimeout(lootAll, config.lootDelay);
  }

  function status() {
    send(`${enable ? 'En' : 'Dis'}abled`,
      `Auto-loot ${enableAuto ? 'enabled' : 'disabled. multi-loot enabled'}`);
  }

  function setup() {
    clearInterval(loop);
    loop = null;
    loop = enable && enableAuto ? setInterval(lootAll, config.loopInterval) : null;
  }

  function send(msg) { cmd.message(': ' + [...arguments].join('\n\t - ')); }

  // reload
  this.saveState = () => {
    let state = {
      enable: enable,
      enableAuto: enableAuto
    };
    return state;
  }

  this.loadState = (state) => {
    enable = state.enable;
    enableAuto = state.enableAuto;
    setup();
    status();
  }

  this.destructor = () => {
    clearTimeout(lootDelayTimeout);
    clearInterval(loop);
    cmd.remove(['loot', 'ㅣㅐㅐㅅ']);
  }

}