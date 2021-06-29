'use strict';

module.exports.NetworkMod = function AutoLootOld(mod) {

  // init
  let location = null;
  let loop = null;
  let loot = {};
  let timeout = null;

  // command
  mod.command.add('loot', {
    '$none': () => {
      mod.settings.enable = !mod.settings.enable;
      setup();
      send(`${mod.settings.enable ? 'En' : 'Dis'}abled`);
    },
    'auto': () => {
      mod.settings.enableAuto = !mod.settings.enableAuto;
      setup();
      send(`Automatic loot interval ${mod.settings.enableAuto ? 'en' : 'dis'}abled`);
    },
    'set': {
      'delay': (num) => {
        num = parseInt(num);
        if (isNaN(num))
          return send(`Invalid argument. usage : loot set delay &lt;num&gt;`);

        mod.settings.lootDelay = num;
        send(`Set automatic loot attempt delay to ${num} ms.`);
      },
      'interval': (num) => {
        num = parseInt(num);
        if (isNaN(num))
          return send(`Invalid argument. usage : loot set interval &lt;num&gt;`);

        mod.settings.loopInterval = num;
        send(`Set automatic loot interval delay to ${num} ms.`);

      },
      '$default': () => send(`Invalid argument. usage : loot set [delay|interval] &lt;num&gt;`)
    },
    'status': () => {
      send(`${mod.settings.enable ? 'En' : 'Dis'}abled`);
      send(`Auto-loot ${mod.settings.enableAuto ? 'enabled' : 'disabled. multi-loot enabled'}`);
    },
    '?': () => send(`usage : loot [auto|set|status]`),
    '$default': () => send(`Invalid argument. usage : loot [auto|set|status|?]`)
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
    mod.command.remove('loot');
    mod.clearTimeout(timeout);
    mod.clearInterval(loop);
  }

  // helper
  function lootAll() {
    if (!mod.settings.enable || mod.game.me.mounted || !location || Object.keys(loot).length === 0) return;

    mod.clearTimeout(timeout);
    for (let item in loot) {
      if (location.dist3D(loot[item].loc) < 120) {
        mod.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId });
        break;
      }
    }
    timeout = mod.setTimeout(lootAll, mod.settings.lootDelay);
  }

  function setup() {
    mod.clearInterval(loop);
    loop = mod.settings.enable && mod.settings.enableAuto ? mod.setInterval(lootAll, mod.settings.loopInterval) : null;
  }

  // code
  mod.hook('C_PLAYER_LOCATION', 5, { order: 10 }, (e) => location = e.loc);

  mod.hook('S_SPAWN_DROPITEM', 9, { order: 10 }, (e) => {
    !mod.settings.blacklist.includes(e.item) ? loot[e.gameId] = e : null;
  });

  mod.hook('S_DESPAWN_DROPITEM', 4, { order: 10 }, (e) => {
    e.gameId in loot ? delete loot[e.gameId] : null;
  });

  mod.hook('C_TRY_LOOT_DROPITEM', 4, () => {
    mod.settings.enable && !mod.settings.enableAuto ? lootAll() : null;
  });

  function send(msg) { mod.command.message(': ' + msg); }

  // reload
  this.saveState = () => { }
  this.loadState = () => { }

}