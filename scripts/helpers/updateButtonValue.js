import * as defaults from '../defaults.js';

export default async () => {
	const buttonNumber = $('div#inspiration-deck-button div.player-card-number').first();
	let cardAmount;
	if(game.user.role <= game.settings.get(defaults.MODULE, 'award-role')) {
		if(!game.user.getFlag(defaults.MODULE, 'cards')) await game.user.setFlag(defaults.MODULE, 'cards', []);
		cardAmount = game.user.getFlag(defaults.MODULE, 'cards').length.toString();
	}
	else cardAmount = game.settings.get(defaults.MODULE, 'deck').filter(card => !card.owner).length.toString();
	
	if(typeof cardAmount === 'string' || cardAmount instanceof String) buttonNumber.text(cardAmount) 
	else buttonNumber.hide();
}