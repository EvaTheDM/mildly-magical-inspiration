import MMI, { createView, SourceFactory } from '/modules/mmi/scripts/main.js';

export default async (offer) => {
    if(MMI.openChoice) createView({ type: 'award', data: { offer }, options: { render: false } })
    else {
        await MMI.makeDialog({
        	title: `Card Choice`,
        	content: `<p>Take your pick!</p>`,
        	buttons: offer.reduce((map, obj) => {
                map[obj] = { icon: '', label: `<img src="${ MMI.cardBack }" />`, callback: () => {
                    if(game.users.filter(user => user.active && user.role === 4).length > 0) makeChoice(obj, game.user._id, offer)
                    else ui.notifications.error(`<b>Mildly Magical Inspiration:</b> You can't use this button while there is no Gamemaster logged in!`);
                }};
                return map;
            }, {}),
            def: offer[Math.floor(Math.random() * offer.length)]
        }, { id: 'multiple-choice', width: 500 })
    }
}

export const makeChoice = (cardId, userId, offer) => {
    SourceFactory.awardCard(cardId, userId, offer);
}