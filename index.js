// OPCODE REQUIRED : 
// - C_PLAYER_LOCATION
// - C_TRY_LOOT_DROPITEM
// - S_DESPAWN_DROPITEM
// - S_LOGIN
// - S_LOAD_TOPO
// - S_MOUNT_VEHICLE
// - S_SPAWN_DROPITEM
// - S_SYSTEM_MESSAGE
// - S_UNMOUNT_VEHICLE

// Version 1.35 r:00

const blacklist = [
    7214, // Scroll of Resurrection
    8000, // Rejuvenation Mote
    8001, // HP Recovery Mote
    8002, // MP Replenishment Mote
    8005, // Healing Mote
    8018, // Arun's Vitae XI Mote
    8023, // Arun's Tear Mote
    8025, // Keening Dawn Mote
    169886,
    169887,
    169888,
    169889,
    169890, // Locked Extensive Strongbox
    169891, // Locked Spellbound Strongbox
    139113, // 행운의 상자 (kTERA)
    166718, // 행운의 상자 (kTERA)
    213026, // 행운의 상자 (kTERA)
]

module.exports = function AutoLoot(d) {

    let auto = true,
        enable = true,
        location = -1,
        mounted = false

    let loop = -1,
        loot = {}
    
    // code
    d.hook('S_LOGIN', () => { setup() })
    d.hook('S_LOAD_TOPO', () => { loot = {}; mounted = false })
    d.hook('C_PLAYER_LOCATION', (e) => { location = e })

    // mount condition
    d.hook('S_MOUNT_VEHICLE', () => { mounted = true })
    d.hook('S_UNMOUNT_VEHICLE', () => { mounted = false })

    // collect items in set
    d.hook('S_SPAWN_DROPITEM', (e) => { if (!(blacklist.includes(e.item))) loot[e.id] = e }) 
    
    // remove despawned items in set
    d.hook('S_DESPAWN_DROPITEM', (e) => { if (e.id in loot) delete loot[e.id] })

    // K TERA : 'That isn't yours.' message
    d.hook('S_SYSTEM_MESSAGE', (e) => { if (e.message === '@41') return false })

    // for when auto is disabled, attempt to loot items nearby (ranged)
    d.hook('C_TRY_LOOT_DROPITEM', () => { lootAll() })

    // helper
    function lootAll() {
        if (!enable || mounted) return
        for (let item in loot) {
            if (location) {
                if (Math.abs(loot[item].x - location.x) < 120 && Math.abs(loot[item].y - location.y) < 120) {
                    d.toServer('C_TRY_LOOT_DROPITEM', { id: loot[item].id })
                }
            }
        }
    }

    function setup() {
        clearInterval(loop)
        loop = -1;
        loop = auto ? setInterval(lootAll, 250) : -1
    }

    // command
    try {
        const Command = require('command')
        const command = Command(d)
        command.add('loot', (arg) => {
            // toggle
            if (!arg) { enable = !enable; status() }
            // auto
            else if (arg === 'auto') {
                auto = !auto
                setup()
                send(`Auto loot ${auto ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')}` + `.`.clr('FFFFFF'))
            // status
            } else if (arg === 'status') status()
            else send(`Invalid argument.`.clr('FF0000'))
        })
        function send(msg) { command.message(`[auto-loot] : ` + [...arguments].join('\n\t - ')) }
        function status() { send(
            `Ranged loot ${enable ? 'enabled'.clr('56B4E9') : 'disabled'.clr('E69F00')}` + `.`.clr('FFFFFF'),
            `Auto loot : ${auto ? 'enabled' : 'disabled'}`) 
        }
	} catch (e) { console.log(`[ERROR] -- auto-loot module --`) }
    
}

// credit : https://github.com/Some-AV-Popo
String.prototype.clr = function (hexColor) { return `<font color="#${hexColor}">${this}</font>` }
