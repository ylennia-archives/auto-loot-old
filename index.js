// May : manifest.json, majorPatchVersion update required
// - S_LOGIN

// Version 1.37 r:00

const Command = require('command')
const config = require('./config.json')
const blacklist = require('./blacklist.js')

// credit : https://github.com/Some-AV-Popo
String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }

module.exports = function AutoLoot(d) {
    const command = Command(d)

    let auto = config.auto,
        enable = config.enable,
        lootInterval = config.interval,
        lootScanInterval = config.scanInterval

    let location = {},
        loop = -1,
        loot = {},
        lootTimeout = 0,
        mounted = false

    // code
    d.hook('S_LOGIN', () => { setup() })
    d.hook('S_LOAD_TOPO', () => { loot = {}; mounted = false })
    d.hook('C_PLAYER_LOCATION', (e) => { location = e.loc })

    // mount condition
    d.hook('S_MOUNT_VEHICLE', () => { mounted = true })
    d.hook('S_UNMOUNT_VEHICLE', () => { mounted = false })

    // collect items in set
    d.hook('S_SPAWN_DROPITEM', (e) => { if (!(blacklist.includes(e.item))) loot[e.gameId] = e })
    
    // remove despawned items in set
    d.hook('S_DESPAWN_DROPITEM', (e) => { if (e.gameId in loot) delete loot[e.gameId] })

    // K TERA : 'That isn't yours.' message
    d.hook('S_SYSTEM_MESSAGE', (e) => { if (e.message === '@41') return false })

    // for when auto is disabled, attempt to loot items nearby (ranged)
    d.hook('C_TRY_LOOT_DROPITEM', () => { lootAll() })

    // helper
    function lootAll() {
        if (!enable || mounted) return
        for (let item in loot) {
            if (location) {
                if (Math.abs(loot[item].loc.x - location.x) < 120 && Math.abs(loot[item].loc.y - location.y) < 120) {
                    d.toServer('C_TRY_LOOT_DROPITEM', { gameId: loot[item].gameId })
                }
            }
            // rudimentary way to delay loot attempt
            // could convert async function/await as alternative
            lootTimeout = setTimeout(() => {}, lootScanInterval)
        }
    }

    function setup() {
        clearInterval(loop)
        loop = -1;
        loop = auto ? setInterval(lootAll, lootInterval) : -1
    }

    // command
    command.add(['loot', 'ㅣㅐㅐㅅ'], (arg) => {
        // toggle
        if (!arg) { enable = !enable; status() }
        // auto
        else if (arg === 'a' || arg === 'auto') {
            auto = !auto
            setup()
            send(`Auto loot ${auto ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')}`)
        // status
        } else if (arg === 's' || arg === 'status') status()
        else send(`Invalid argument.`.clr('FF0000'))
    })
    function send(msg) { command.message(`[auto-loot] : ` + [...arguments].join('\n\t - '.clr('FFFFFF'))) }
    function status() { send(
        `Ranged loot : ${enable ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`,
        `Auto loot : ${auto ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}`)
    }

}
