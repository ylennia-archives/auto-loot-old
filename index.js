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

// Version 1.3 r:02

const blacklist = [
    8000, // Rejuvenation Mote
    8001, // HP Recovery Mote
    8002, // MP Replenishment Mote
    8005, // Healing Mote
    8018, // Arun's Vitae XI Mote
    8023, // Arun's Tear Mote
    8025, // Keening Dawn Mote
    139113, // 행운의 상자 (kTERA)
    166718, // 행운의 상자 (kTERA)
    213026, // 행운의 상자 (kTERA)
    7214, // 부활 주문서 Scroll of Resurrection
]

module.exports = function AutoLoot(d) {

    let auto = true,
        enable = true,
        location = 0,
        mounted = false

    let loot = {}

    var loop = null
    
    // code
    d.hook('S_LOGIN', () => { setup() })
    d.hook('S_LOAD_TOPO', () => { 
        loot = {},
        mounted = false
    })
    d.hook('C_PLAYER_LOCATION', (e) => { location = e })

    // mount condition
    d.hook('S_MOUNT_VEHICLE', () => { mounted = true })
    d.hook('S_UNMOUNT_VEHICLE', () => { mounted = false })

    // collect items in set
    d.hook('S_SPAWN_DROPITEM', (e) => {
        if (!(blacklist.includes(e.item))) loot[e.id] = e
    }) 
    
    // remove despawned items in set
    d.hook('S_DESPAWN_DROPITEM', (e) => {
        if (e.id in loot) delete loot[e.id]
    })

    // K TERA : 'That isn't yours.' message
    d.hook('S_SYSTEM_MESSAGE', (e) => {
        if (e.message === '@41') return false
    })

    // for when auto is disabled, attempt to loot items nearby (ranged)
    d.hook('C_TRY_LOOT_DROPITEM', () => { lootAll() })

    // helper
    function lootAll() {
        if (!enable) return
        if (mounted) return
        for (let item in loot) {
            if (location) {
                if (Math.abs(loot[item].x - location.x) < 120 && Math.abs(loot[item].y - location.y) < 120) {
                    d.toServer('C_TRY_LOOT_DROPITEM', {
                        id: loot[item].id
                    })
                }
            }
        }
    }

    function setup() {
        clearInterval(loop)
        loop = auto ? setInterval(lootAll, 250) : null
    }

    // command
    try {
        const Command = require('command')
        const command = Command(d)
        command.add('loot', (arg) => {
            // toggle
            if (arg === undefined) {
                enable = !enable
                send(`Ranged ${enable ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
            // auto
            } else if (arg === 'auto') {
                auto = !auto
                setup()
                send(`Auto ${auto ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}<font>.</font>`)
            // status
            } else if (arg === 'status') {
                send(`Status : ${enable ? 'On' : 'Off'}
                    <br> - Auto : ${auto}`)
            } else if (arg) {
                send(`<font color="#FF0000">Invalid argument.</font>`)
            }
        })
        function send(msg) {
            command.message(`[auto-loot] : ` + msg)
        }
	} catch (e) {
		console.log(`[ERROR] -- auto-loot module --`)
    }
    
}
