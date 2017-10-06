// OPCODE REQUIRED : 
// - C_PLAYER_LOCATION
// - C_TRY_LOOT_DROPITEM
// - S_DESPAWN_DROPITEM
// - S_LOGIN
// - S_LOAD_TOPO
// - S_MOUNT_VEHICLE
// - S_SPAWN_DROPITEM
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
        location,
        mounted

    let loot = {}

    var loop = null

    // command
    try {
        const Command = require('command')
        const command = Command(dispatch)
        command.add('loot', (arg) => {
            // toggle
            if (arg === undefined) {
                enable = !enable
                send(`[auto-loot] : Ranged ${enable ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}.`)
            // auto
            } else if (arg == 'auto') {
                auto = !auto
                setup()
                send(`[auto-loot] : Auto ${auto ? '<font color="#56B4E9">enabled</font>' : '<font color="#E69F00">disabled</font>'}.`)
            } else if (arg) {
                send(`[auto-loot] : <font color="#FF0000">Invalid argument.</font>`)
            }
        })
        function send(msg) {
            command.message(`<font color="#FFFFFF">` + msg + `</font>`)
        }
	} catch (e) {
		console.log(`[ERROR] -- auto-loot module --`)
	}
    
    // code
    dispatch.hook('S_LOGIN', (event) => { setup() })
    dispatch.hook('S_LOAD_TOPO', 1, (event) => { 
        loot = {},
        mounted = false
    })
    dispatch.hook('C_PLAYER_LOCATION', 1, (event) => { location = event })

    dispatch.hook('S_MOUNT_VEHICLE', (event) => { mounted = true })
    dispatch.hook('S_UNMOUNT_VEHICLE', (event) => { mounted = false })

    dispatch.hook('S_SPAWN_DROPITEM', 1, (event) => {
        if (!(blacklist.indexOf(event.item) > -1)) loot[event.id.toString()] = event
    }) 
    
    dispatch.hook('S_DESPAWN_DROPITEM', 1, (event) => {
        if (event.id.toString() in loot) delete loot[event.id.toString()]
    })

    // credit : Alejandro Ojeda (Github : alexoj)
    dispatch.hook('S_SYSTEM_MESSAGE_LOOT_ITEM', (event) => {
        if (event.message === '@41') return false
    })

    // for when auto is disabled
    dispatch.hook('C_TRY_LOOT_DROPITEM', 1, (event) => { lootAll() })

    function lootAll() {
        if (!enable) return
        if (mounted) return
        for (let item in loot) {
            if (location) {
                if (Math.abs(loot[item].x - location.x1) < 120 && Math.abs(loot[item].y - location.y1) < 120) {
                    dispatch.toServer('C_TRY_LOOT_DROPITEM', 1, {
                        id: loot[item].id
                    })
                }
            }
        }
    }

    // helper
    function setup() {
        clearInterval(loop)
        loop = auto ? setInterval(lootAll, 250) : null
    }

}

