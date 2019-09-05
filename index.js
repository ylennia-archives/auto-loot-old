'use strict';

module.exports = function AutoLootOld(mod) {
  const cmd = mod.command;

  let settings = mod.settings;

  let location = { x: 0, y: 0, z: 0 };
  let loop = null;
  let loot = {};
  let timeout = null;

  // command
  cmd.add(['loot', 'ㅣㅐㅐㅅ'], {
    '$none': () => {
      settings.enable = !settings.enable;
      setup();
      send(`${settings.enable ? 'En' : 'Dis'}abled`);
    },
    'auto': () => {
      settings.enableAuto = !settings.enableAuto;
      setup();
      send(`Automatic loot interval ${settings.enableAuto ? 'en' : 'dis'}abled`);
    },
    'set': {
      'delay': (num) => {
        num = parseInt(num);
        if (!isNaN(num)) {
          settings.lootDelay = num;
          send(`Set automatic loot attempt delay to ${num} ms.`);
        }
      },
      'interval': (num) => {
        num = parseInt(num);
        if (!isNaN(num)) {
          settings.loopInterval = num;
          send(`Set automatic loot interval delay to ${num} ms.`);
        }
      },
      '$default': () => {
        send(`Invalid argument. usage : loot set [delay|interval]`);
      }
    },
    'status': () => {
      send(`${settings.enable ? 'En' : 'Dis'}abled`,
        `Auto-loot ${settings.enableAuto ? 'enabled' : 'disabled. multi-loot enabled'}`);
    },
    '$default': () => {
      send(`Invalid argument. usage : loot [auto|set|status]`);
    }
  });

  // game state
  mod.game.on('enter_loading_screen', () => {
    clearInterval(loop);
    location = null;
    loot = {};
  });

  mod.game.on('leave_loading_screen', () => {
    setup();
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
    if (!settings.enable || !location || Object.keys(loot).length === 0) {
      return;
    }
    clearTimeout(timeout);
    timeout = null;
    for (let item in loot) {
      if (dist3D(location, loot[item].loc) < 120) {
        mod.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId });
        break;
      }
    }
    timeout = setTimeout(lootAll, settings.lootDelay);
  }

  function setup() {
    clearInterval(loop);
    loop = null;
    loop = settings.enable && settings.enableAuto ? setInterval(lootAll, settings.loopInterval) : null;
  }

  // code
  mod.hook('C_PLAYER_LOCATION', 5, (e) => {
    location = e.loc;
  });

  mod.hook('S_SPAWN_DROPITEM', 8, { order: 10 }, (e) => {
    if (!settings.blacklist.includes(e.item)) {
      loot[e.gameId] = e;
    }
  });

  mod.hook('S_DESPAWN_DROPITEM', 4, { order: 10 }, (e) => {
    if (e.gameId in loot) {
      delete loot[e.gameId];
    }
  });

  mod.hook('C_TRY_LOOT_DROPITEM', 4, () => {
    if (settings.enable && !settings.enableAuto) {
      lootAll();
    }
  });

  function send() { cmd.message(': ' + [...arguments].join('\n\t - ')); }

  // reload
  this.saveState = () => {
    return location;
  }

  this.loadState = (state) => {
    location = state;
    setup();
  }

  this.destructor = () => {
    cmd.remove(['loot', 'ㅣㅐㅐㅅ']);
    clearTimeout(timeout);
    clearInterval(loop);

    timeout = undefined;
    loot = undefined;
    loop = undefined;
    location = undefined;
  }

}