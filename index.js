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
]

module.exports = function AutoLoot(dispatch) {

    let auto = true,
        enable = true,
        location = 0,
        mounted = false

    let loot = {}

    var loop = null
    
    // code
    dispatch.hook('S_LOGIN', (event) => { setup() })
    dispatch.hook('S_LOAD_TOPO', (event) => { 
        loot = {},
        mounted = false
    })
    dispatch.hook('C_PLAYER_LOCATION', (event) => { location = event })

    // mount condition
    dispatch.hook('S_MOUNT_VEHICLE', (event) => { mounted = true })
    dispatch.hook('S_UNMOUNT_VEHICLE', (event) => { mounted = false })

    // collect items in set
    dispatch.hook('S_SPAWN_DROPITEM', (event) => {
        if (!(blacklist.includes(event.item))) loot[event.id] = event
    }) 
    
    // remove despawned items in set
    dispatch.hook('S_DESPAWN_DROPITEM', (event) => {
        if (event.id in loot) delete loot[event.id]
    })

    /* // credit : Alejandro Ojeda (Github : alexoj)
    dispatch.hook('S_SYSTEM_MESSAGE_LOOT_ITEM', (event) => {
        if (event.message === '@41') return false
    }) */

    // K TERA : 'That isn't yours.' message
    dispatch.hook('S_SYSTEM_MESSAGE', (event) => {
        if (event.message === '@41') return false
    })

    // for when auto is disabled, attempt to loot items nearby (ranged)
    dispatch.hook('C_TRY_LOOT_DROPITEM', (event) => { lootAll() })

    // helper
    function lootAll() {
        if (!enable) return
        if (mounted) return
        for (let item in loot) {
            if (location) {
                if (Math.abs(loot[item].x - location.x) < 120 && Math.abs(loot[item].y - location.y) < 120) {
                    dispatch.toServer('C_TRY_LOOT_DROPITEM', {
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
        const command = Command(dispatch)
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
