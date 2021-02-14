import * as defaults from '../defaults.js';
import {
	handoutCard,
	changeCardOwner,
	openHand,
	showCard,
	sendNotification
} from '../helpers/socketHelpers.js';

export default function () {
	game.socket.on('module.' + defaults.MODULE, ({operation, data}) => {
		switch(operation) {
			case 'handout':
				handoutCard(data);
				break;
			case 'changeCardOwner':
				changeCardOwner(data);
				break;
			case 'openHand':
				openHand(data);
				break;
			case 'showCard':
				showCard(data);
				break;
			case 'sendNotification':
				sendNotification(data);
				break;
		}
	});
}