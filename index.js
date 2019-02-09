'use strict';

const Vec3 = require('tera-vec3');

const config = require('./config.js');

module.exports = function AutoLootOld(mod) {
    const cmd = mod.command || mod.require.command;

    // config
    let enable = config.enable,
        enableAuto = config.enableAuto;

    let hold = false,
        location = new Vec3(0, 0, 0),
        loop = null,
        loot = {},
        lootDelayTimeout = null;

    // command
    cmd.add(['loot', 'ㅣㅐㅐㅅ'], {
        // toggle
        '$none': () => {
            enable = !enable;
            status();
        },
        'auto': () => {
            enableAuto = !enableAuto;
            setup();
            status();
        },
        'status': () => status(),
        '$default': () => send(`Invalid argument. usage : loot [auto|status]`)
    });

    // game state
    mod.hook('S_LOGIN', 'raw', { order: -1000 }, () => setup() );

    mod.hook('S_SPAWN_ME', 'raw', { order: -1000 }, () => { hold = false; });

    mod.hook('S_LOAD_TOPO', 'raw', () => {
        hold = true;
        loot.length = 0;
        loot = {};
    });

    // code
    mod.hook('C_PLAYER_LOCATION', 5, (e) => location = e.loc );

    mod.hook('S_SPAWN_DROPITEM', 6, (e) => {
        if (!(config.blacklist.includes(e.item)))
            loot[e.gameId] = e;
    });

    mod.hook('S_DESPAWN_DROPITEM', 4, (e) => { 
        if (e.gameId in loot)
            delete loot[e.gameId];
    });

    mod.hook('S_SYSTEM_MESSAGE', 1, (e) => { 
        if (e.message === '@41')
        return false
    });

    mod.hook('C_TRY_LOOT_DROPITEM', 4, () => lootAll() );

    // helper
    function lootAll() {
        if (!enable || hold || mod.game.me.mounted)
            return;
        clearTimeout(lootDelayTimeout);
        lootDelayTimeout = null;
        if (loot.size = 0) return;
        for (let item in loot) {
            if (location.dist3D(loot[item].loc) < 120) {
                mod.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId });
                break;
            }
        }
        lootDelayTimeout = setTimeout(lootAll, config.lootDelay);
    }
    
    function status() {
        send(`${enable ? 'En' : 'Dis'}abled`,
        `Auto-loot ${enableAuto ? 'enabled' : 'disabled. multi-loot enabled'}` );
    }

    function setup() {
        clearInterval(loop);
        loop = null;
        loop = enableAuto ? setInterval(lootAll, config.loopInterval) : null;
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