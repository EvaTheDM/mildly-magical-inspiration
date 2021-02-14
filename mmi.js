import registerSettings from './scripts/setup/registerSettings.js';
import registerSockets from './scripts/setup/registerSockets.js';
import setupDeck from './scripts/setup/setup.js';
import createUI from './scripts/createUI.js';
import * as defaults from './scripts/defaults.js';
import updateButtonValue from './scripts/helpers/updateButtonValue.js';
import * as deckConfig from './scripts/helpers/DeckConfigHelpers.js';
import { handoutCard } from './scripts/helpers/socketHelpers.js';

Hooks.once('init', () => {
	registerSettings();
	
	registerSockets();
	
	Handlebars.registerHelper('concat', function() {
		var outStr = '';
		for(var arg in arguments){
			if(typeof arguments[arg]!='object'){
				outStr += arguments[arg];
			}
		}
		return outStr;
	});
});

Hooks.once('ready', async () => {
	updateButtonValue();
	
	if(game.user.role === 4 && (game.settings.get(defaults.MODULE, 'deck').length === 0 || game.settings.get(defaults.MODULE, 'sources').length === 0)) setupDeck();
	else if(game.user.getFlag(defaults.MODULE, 'choice') && game.user.getFlag(defaults.MODULE, 'choice').length > 0) {
		const rnCards = game.user.getFlag(defaults.MODULE, 'choice');
		if(rnCards.length === 1) deckConfig.changePlayerOwner(rnCards[0], game.user._id, true);
		else handoutCard({
				user: game.user._id,
				cards: rnCards
			})
		game.user.unsetFlag(defaults.MODULE, 'choice');
	}
});



Hooks.once('renderPlayerList', (app, html, data) => {
	createUI(html);
});