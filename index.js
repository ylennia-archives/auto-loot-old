// Version 1.39 r:00

const Vec3 = require('tera-vec3');

const config = require('./config.js');

module.exports = function AutoLootOld(m) {

    // config
    let enableAuto = config.enableAuto,
        enable = config.enable;

    let location = new Vec3(0, 0, 0),
        loop = null,
        loot = {},
        lootDelayTimeout = null;

    // command
    m.command.add(['loot', 'ㅣㅐㅐㅅ'], {
        // toggle
        $none() {
            enable = !enable;
            status();
        },
        auto() {
            enableAuto = enableAuto;
            setup();
            status();
        },
        status() { status(); },
        $default() { send('Invalid argument. usage : loot [auto|status]'); }
    });

    // mod.game
    m.game.on('enter_game', () => { setup(); });
    m.game.on('change_zone', () => { loot.length = 0; loot = {}; })

    m.game.on('leave_game', () => {
        clearTimeout(lootDelayTimeout);
        lootDelayTimeout = null;
        clearInterval(loop);
        loop = null;
    });

    // code
    m.hook('C_PLAYER_LOCATION', 5, (e) => { location = e.loc; });

    // collect items in set
    // remove despawned items in set
    m.hook('S_SPAWN_DROPITEM', 6, (e) => { if (!(config.blacklist.includes(e.item))) loot[e.gameId] = e });
    m.hook('S_DESPAWN_DROPITEM', 4, (e) => { if (e.gameId in loot) delete loot[e.gameId] });

    // K TERA : 'That isn't yours.' message
    m.hook('S_SYSTEM_MESSAGE', 1, (e) => { if (e.message === '@41') return false });

    // for when auto is disabled, attempt to loot items nearby (ranged)
    m.hook('C_TRY_LOOT_DROPITEM', 4, () => { lootAll(); });

    // helper
    function lootAll() {
        if (!enable || m.game.me.mounted) return
        clearTimeout(lootDelayTimeout)
        lootDelayTimeout = null;
        if (loot.size = 0) return
        for (let item in loot) {
            if (location.dist3D(loot[item].loc) < 120) {
                m.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId });
                break
            }
        }
        lootDelayTimeout = setTimeout(lootAll, config.lootDelay);
    }

    function setup() {
        clearInterval(loop);
        loop = null;
        loop = enableAuto ? setInterval(lootAll, config.loopInterval) : null;
    }

    function send(msg) { m.command.message(`: ` + [...arguments].join('\n\t - ')); }

    function status() { send(
        `Ranged loot : ${enable ? 'Enabled' : 'Disabled'}`,
        `Auto loot : ${enableAuto ? 'Enabled' : 'Disabled'}`);
    }

}