import MMI from '/modules/mmi/scripts/main.js';

const exportSource = (sourceId = false) => {
    if(sourceId) {
        const selected = MMI.getSource(sourceId);
        const exportData = {
            ...Object.keys(selected).filter(f => f != 'cards').reduce((map, obj) => {
                if(obj != '_id' && obj != 'isActive') {
                    map[obj] = selected[obj];
                }
                return map
            }, {}),
            cards: selected.cards.map(card => {
                const cardKeys = Object.keys(card);
                return cardKeys.reduce((map, obj) => {
                    if(obj != '_id' && obj != 'owner') {
                        map[obj] = card[obj];
                    }
                    return map;
                }, {})
            })
        };
        
        const timestamp = new Date();
        function leadingZero(str) {
            return ('0' + str).slice(-2)
        }
        
        const fileName = `${ selected.title }-${ timestamp.getUTCFullYear().toString()}-${leadingZero(timestamp.getUTCMonth())}-${leadingZero(timestamp.getUTCDate())}-${leadingZero(timestamp.getUTCHours())}-${leadingZero(timestamp.getUTCMinutes())}.json`;
        
        saveDataToFile(JSON.stringify(exportData, null, 2), 'json', fileName);
    }
}

export default exportSource;