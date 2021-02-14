import * as defaults from './defaults.js';
import createView from './helpers/openView.js';
import createContext from './helpers/createContext.js';
import DeckConfigApplication from './classes/DeckConfigApplication.js';

export default (html) => {
	const wrapper = $(`<div id="inspiration-deck-button" class="app"></div>`);
	html.after(wrapper);
	
	const cardBack = game.settings.get(defaults.MODULE, 'card-back');
	
	const button = $(`
	<a class="action-link">
		<div class="player-card-number"></div>
		<img src="${ cardBack }">
	</a>
	`);
	
	wrapper.append(button);
	
	button.on('click', () => {
		if(game.settings.get(defaults.MODULE, 'deck').length === 0) new DeckConfigApplication().render(true);
		else if(game.user.role <= game.settings.get(defaults.MODULE, 'award-role')) createView('single', { userId: game.user._id })
		else if(game.user.role === 4) createView('gamemaster');
	});
	
	createContext();
};