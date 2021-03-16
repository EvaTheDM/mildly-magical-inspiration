import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { createView } from '/modules/mmi/scripts/main.js';

import createContext from '/modules/mmi/scripts/config/create-context.js';

import SourceConfigApplication from '/modules/mmi/scripts/apps/SourceConfigApplication.js';
import DeckConfigApplication from '/modules/mmi/scripts/apps/DeckConfigApplication.js';

export default async (html) => {
	const MMMIui = await renderTemplate(`${DEFAULTS.templatePath}/ui-button.html`, { img: MMI.cardBack });
	html.after(MMMIui);
	
	$('#inspiration-deck-button div.action-link').on('click', () => {
		if(MMI.activeDeck.length === 0 && game.user.role === 4) {
			if(!MMI.activeSource) {
				ui.notifications.error(`<b>Mildly Magical Inspiraiton:</b> You currently don't have an active source selected! Please select or create one!`);
				new SourceConfigApplication().render(true);
			}
			else {
				ui.notifications.error(`<b>Mildly Magical Inspiraiton:</b> Your active source has no cards! Please create some!`);
				new DeckConfigApplication().render(true);
			}
		}
		else if(MMI.activeDeck.length === 0) ui.notifications.error(`<b>Mildly Magical Inspiration:</b> The Gamemaster hasn't selected an active source!`)
		else if(MMI.haveCards[game.user._id]) createView({ type: 'single', data: { userId: game.user._id } })
		else if(game.user.role === 4) createView({ type: 'gamemaster' });
	})
	
	createContext();
};