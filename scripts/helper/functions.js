const { pi } = require('../account/data')

function getPiGroup(){
    piGroup = []
    for (var device of pi){
        if (piGroup.length == 0){
            piGroup.push({
                group: device.group,
                location: new Set([
                    device.location
                ])
            })
        } else {
            loop:
                {
                    for (var group of piGroup){
                        if (group.group == device.group){
                            group.location.add(device.location)
                            break loop
                        }
                    }
                    piGroup.push({
                        group: device.group,
                        location: new Set([
                            device.location
                        ])
                    })
                }
        }
    }
    return piGroup
}

module.exports = {
    getPiGroup: getPiGroup
}
