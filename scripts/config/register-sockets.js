import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { createView, multipleChoice } from '/modules/mmi/scripts/main.js';

export default function () {
	game.socket.on('module.' + DEFAULTS.module, async ({operation, data}) => {
		switch(operation) {
			case 'openHand':
				if(data.userId === game.user._id) {
					const dat = { userId: game.user._id };
					if(data.hasOwnProperty('focus')) dat.focus = data.focus;
					createView('single', dat)
				}
				break;
			case 'multipleChoice':
				if(data.userId === game.user._id) multipleChoice(data.offer);
				break;
			case 'setSetting':
				MMI.pushGamemasterSetting(data.setting, data.data, data.hookEmitter);
				break;
			case 'sendNotification':
				if(game.user._id === data.recipient) ui.notifications.info(data.message);
				break;
			case 'showCard':
				if(data.users.includes(game.user._id)) createView('preview', { cardData: MMI.activeDeck.find(card => card._id === data.cardId) })
				break;
		}
	});
}