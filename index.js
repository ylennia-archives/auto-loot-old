'use strict';

module.exports.NetworkMod = function AutoLootOld(mod) {

  let c = mod.command;
  let s = mod.settings;

  let location = null;
  let loop = null;
  let loot = {};
  let timeout = null;

  // command
  c.add(['loot'], {
    '$none': () => {
      s.enable = !s.enable;
      setup();
      send(`${s.enable ? 'En' : 'Dis'}abled`);
    },
    'auto': () => {
      s.enableAuto = !s.enableAuto;
      setup();
      send(`Automatic loot interval ${s.enableAuto ? 'en' : 'dis'}abled`);
    },
    'set': {
      'delay': (n) => {
        n = parseInt(n);
        if (!isNaN(n)) {
          s.lootDelay = n;
          send(`Set automatic loot attempt delay to ${n} ms.`);
        } else {
          send(`Invalid argument. usage : loot set delay &lt;num&gt;`);
        }
      },
      'interval': (n) => {
        n = parseInt(n);
        if (!isNaN(n)) {
          s.loopInterval = n;
          send(`Set automatic loot interval delay to ${n} ms.`);
        } else {
          send(`Invalid argument. usage : loot set interval &lt;num&gt;`);
        }
      },
      '$default': () => {
        send(`Invalid argument. usage : loot set [delay|interval] &lt;num&gt;`);
      }
    },
    'status': () => {
      send(`${s.enable ? 'En' : 'Dis'}abled`,
        `Auto-loot ${s.enableAuto ? 'enabled' : 'disabled. multi-loot enabled'}`);
    },
    '$default': () => {
      send(`Invalid argument. usage : loot [auto|set|status]`);
    }
  });

  // game state
  mod.game.on('enter_loading_screen', () => {
    mod.clearInterval(loop);
    location = null;
    loot = {};
  });

  mod.game.on('leave_loading_screen', () => {
    setup();
  });

  this.destructor = () => {
    c.remove('loot');
    mod.clearTimeout(timeout);
    mod.clearInterval(loop);
  }

  // helper
  function dist3D(loc1, loc2) {
    return Math.sqrt(Math.pow(loc2.x - loc1.x, 2) + Math.pow(loc2.y - loc1.y, 2) + Math.pow(loc2.z - loc1.z, 2));
  }

  function lootAll() {
    if (!s.enable || mod.game.me.mounted || !location || Object.keys(loot).length === 0)
      return;

    mod.clearTimeout(timeout);
    for (let item in loot) {
      if (dist3D(location, loot[item].loc) < 120) {
        mod.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId });
        break;
      }
    }
    timeout = mod.setTimeout(lootAll, s.lootDelay);
  }

  function setup() {
    mod.clearInterval(loop);
    loop = s.enable && s.enableAuto ? mod.setInterval(lootAll, s.loopInterval) : null;
  }

  // code
  mod.hook('C_PLAYER_LOCATION', 5, { order: 10 }, (e) => {
    location = e.loc;
  });

  mod.hook('S_SPAWN_DROPITEM', 8, { order: 10 }, (e) => {
    !s.blacklist.includes(e.item) ? loot[e.gameId] = e : null;
  });

  mod.hook('S_DESPAWN_DROPITEM', 4, { order: 10 }, (e) => {
    e.gameId in loot ? delete loot[e.gameId] : null;
  });

  mod.hook('C_TRY_LOOT_DROPITEM', 4, () => {
    s.enable && !s.enableAuto ? lootAll() : null;
  });

  function send() { c.message(': ' + [...arguments].join('\n - ')); }

  // reload
  this.saveState = () => {}
  this.loadState = () => { setup(); }

}