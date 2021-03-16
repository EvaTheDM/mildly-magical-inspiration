const lineBreak = (lineString, cutOff) => {
    if(!Number.isInteger(cutOff)) {
        switch(cutOff) {
            case 'subtitle':
                cutOff = 80;
                break;
                
            case 'title':
                cutOff = 35;
                break;
                
            default:
                cutOff = 50;
                break;
        }
    }
    
    // Check for Custom Line-Breaks
    const cusWordArr = lineString.replace('\n', '\\n\\').split('\\n\\');
    if(cusWordArr.length > 1) return cusWordArr;
    else {
        const lineArr = [''];
        if(lineString.length > cutOff) {
            const wordArr = lineString.split(' ');
            wordArr.forEach(word => {
                if((lineArr[lineArr.length - 1].length + 1 + word.length) > cutOff) {
                    lineArr.push(word);
                }
                else if(lineArr[lineArr.length - 1].length > 0) lineArr[lineArr.length - 1] = lineArr[lineArr.length - 1] + ' ' + word;
                else lineArr[lineArr.length - 1] = word;
            });
        }
        else lineArr[0] = lineString;
        return lineArr;
    }
}

const convertCard = (card) => {
    let title = lineBreak(card.title, 'title');
    let subtitle = lineBreak(card.subtitle, 'subtitle');
    let cost = [ card.cost[0] === null ? '' : card.cost[0].toString(), card.cost[1] ];
    let duration = [ card.duration[0] === null ? '' : card.duration[0].toString(), card.duration[1] ];

    return {
        ...card,
        title,
        subtitle,
        cost,
        duration
    }
}

const migrate = async () => {
    if((game.settings.settings.has('mmi.sources') && game.settings.settings.has('mmi.deck') && game.settings.get('mmi', 'deck').length > 0) || game.settings.get('mmi', 'version') != '2.0.0') {
        const newSources = [
            ...game.settings.get('mmi', 'sources').map(source => {
                return {
                    ...source,
                    author: '',
                    isActive: false,
                    cards: source.cards.map(card => convertCard(card))
                }
            }),
            {
                author: game.user.name,
                cards: game.settings.get('mmi', 'deck').map(card => convertCard(card)),
                isActive: true,
                title: 'Currently Active Deck',
                _id: randomID(16)
            }
        ];

        await game.settings.set('mmi', 'sources', newSources);
    }
    await game.settings.set('mmi', 'requireMigration', false)
    ui.notifications.info(`<b>Mildly Magical Inspiration:</b> Migration to v.2.0.0 successful!`)
    return true;
}

export default migrate;