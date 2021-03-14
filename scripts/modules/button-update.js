import MMI from '/modules/mmi/scripts/main.js';

export default () => {
	const buttonNumber = $('div#inspiration-deck-button div.player-card-number').first();

    if(MMI.activeDeck.length > 0) {
        const handSize = MMI.haveCards[game.user._id] ? MMI.getPlayerHand(game.user._id).length : MMI.activeDeck.filter(card => card.include && card.owner === '').length;
        buttonNumber.text(handSize);
    }
    else buttonNumber.hide();
}