// Version 1.38 r:01

const Command = require('command')
const GameState = require('tera-game-state')
const Vec3 = require('tera-vec3')

const config = require('./config.js')

module.exports = function AutoLootOld(d) {
    const command = Command(d)
    const game = GameState(d)

    // config
    let blacklist = config.blacklist,
        enableAuto = config.enableAuto,
        enable = config.enable,
        loopInterval = config.loopInterval,
        lootDelay = config.lootDelay

    let location = new Vec3(0, 0, 0),
        loop = 0,
        loot = {},
        lootDelayTimeout = 0

    // command
    command.add(['loot', 'ㅣㅐㅐㅅ'], (arg) => {
        // toggle
        if (!arg) {
            enable = !enable
            status()
        }
        // auto
        else if (arg === 'a' || arg === 'auto') {
            enableAuto = !enableAuto
            setup()
        }
        // status
        else if (arg === 's' || arg === 'status') status()
        else send(`Invalid argument.`)
    })

    // code
    d.hook('S_LOGIN', 'raw', () => { setup() })
    d.hook('S_LOAD_TOPO', 'raw', () => { loot.length = 0; loot = {} })
    d.hook('C_PLAYER_LOCATION', 3, (e) => { location = e.loc })

    // collect items in set
    // remove despawned items in set
    d.hook('S_SPAWN_DROPITEM', 6, (e) => { if (!(blacklist.includes(e.item))) loot[e.gameId] = e })
    d.hook('S_DESPAWN_DROPITEM', 4, (e) => { if (e.gameId in loot) delete loot[e.gameId] })

    // K TERA : 'That isn't yours.' message
    d.hook('S_SYSTEM_MESSAGE', 1, (e) => { if (e.message === '@41') return false })

    // for when auto is disabled, attempt to loot items nearby (ranged)
    d.hook('C_TRY_LOOT_DROPITEM', 4, () => { lootAll() })

    // helper
    function lootAll() {
        if (!enable || game.me.mounted) return
        clearTimeout(lootDelayTimeout)
        lootDelayTimeout = 0
        if (loot.size = 0) return
        for (let item in loot) {
            if (location.dist3D(loot[item].loc) < 120) {
                d.send('C_TRY_LOOT_DROPITEM', 4, { gameId: loot[item].gameId })
                break
            }
        }
        lootDelayTimeout = setTimeout(lootAll, lootDelay)
    }

    function setup() {
        clearInterval(loop)
        loop = 0;
        loop = enableAuto ? setInterval(lootAll, loopInterval) : 0
    }

    function send(msg) { command.message(`[auto-loot-old] : ` + [...arguments].join('\n\t - ')) }

    function status() { send(
        `Ranged loot : ${enable ? 'Enabled' : 'Disabled'}`,
        `Auto loot : ${enableAuto ? 'Enabled' : 'Disabled'}`)
    }

}