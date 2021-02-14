import * as defaults from '../defaults.js';
import * as deckConfig from './DeckConfigHelpers.js';
import createView from './openView.js';

export const handoutCard = (data) => {
	if(data.user === game.user._id) {
		if(game.settings.get(defaults.MODULE, 'open-choice')) {
			createView('award', {
				userId: data.user,
				cards: data.cards
			})
		}
		else {
			const cardBack = game.settings.get(defaults.MODULE, 'card-back');
			let buttons = {};
			data.cards.forEach(cardId => {
				buttons[cardId] = {
					label: `<img src="${cardBack}" />`,
					callback: () => {
						deckConfig.changePlayerOwner(cardId, data.user, true, true)
						game.socket.emit('module.' + defaults.MODULE, {
							operation: 'sendNotification',
							data: {
								recipient: game.users.find(user => user.role === 4)._id,
								sender: game.user._id,
								type: 'picked-card'
							}
						});
					}
				}
			});
			let d = new Dialog({
				title: game.i18n.localize("MMI.title_full") + " - " + game.i18n.localize("MMI.receive_card"),
				buttons: buttons
			});
			d.render(true);
		}
	}
}

export const changeCardOwner = async (data) => {
	if(game.user.role === 4) {
		await deckConfig.changePlayerOwner(data.cardId, data.userId, true, data.openHand);
	}
}

export const openHand = (data) => {
	if(game.user._id === data.userId) createView('single', { userId: data.userId });
}

export const showCard = (data) => {
	if(data.users.includes(game.user._id)) createView('preview', { cardId: data.cardId });
}

export const sendNotification = (data) => {
	const recipients = Array.isArray(data.recipient) ? data.recipient : [data.recipient];
	console.log(data);
	for(let i = 0; i < recipients.length; i++) {
		if(recipients[i] === game.user._id) {
			let msg;
			let type;
			const types = ['info', 'warn', 'error'];
			switch(data.type) {
				case 'picked-card':
					type = types[0];
					msg = `<b>${ game.i18n.localize("MMI.title_full") }:</b> ${ game.i18n.format("MMI.player_picked", { player: game.users.get(data.sender).name }) }!`;
					break;
			}
			ui.notifications[type](msg);
		}
	}
}