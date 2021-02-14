import * as defaults from '../defaults.js';
import { getModifiedCard } from '../helpers/helpers.js';
import * as helpers from '../helpers/CardViewerHelpers.js';
import * as deckHelpers from '../helpers/DeckConfigHelpers.js';
import createView from '../helpers/openView.js';

export default class CardViewerApplication extends Application {
	constructor(options={}) {
		super(options);
	}
	
	getData(options={}) {
		return {
			tabs: this.options.tabs.length,
			data: this.options.object,
			cardFront: game.settings.get(defaults.MODULE, 'card-front')
		};
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		
		html.find('div.hand-wrapper').each((key, hand) => {
			const userId = hand.userId;
			
			Object.keys(hand.children).forEach(cKey => {
				const card = hand.children[cKey];
				if(card.id != '') {
					if(cKey == 0) card.style.display = '';
					html.find('a#' + card.id + '.card-switch').each((sKey, button) => {
						if(button.dataset.current == 0 && button.classList.contains('left')) button.classList.add('disabled');
						else if(button.dataset.current == (hand.children.length - 1) && button.classList.contains('right')) button.classList.add('disabled');
						else {
							button.classList.remove('disabled');
							button.addEventListener('click', () => {
								this.switchCard(html, Object.keys(hand.children).map(c => {
									return hand.children[c].id
								}).filter(c => c), cKey, button.classList)
							});
						}
					});
				}
			});
		});
		
		html.find('button.card-control').each((key, button) => {
			button.addEventListener('click', async () => {
				if(game.users.filter(user => user.active).find(user => user.role === 4)) {
					switch(button.dataset.action) {
						case 'show-card':
							helpers.showCard(button.name, game.user._id);
							break;
							
						case 'pass-card':
							helpers.moveCard(button.name, game.user._id);
							this.close();
							break;
							
						case 'use-card':
							this.close();
							helpers.useCard(button.name, game.user._id);
							break;
							
						case 'move-card':
							helpers.moveCard(button.name);
							this.close();
							break;
							
						case 'return-card':
							helpers.returnCard(button.name);
							this.close();
							break;
							
						case 'choose-card':
							this.close();
							await deckHelpers.changePlayerOwner(button.name, game.user._id, true, true);
							game.socket.emit('module.' + defaults.MODULE, {
								operation: 'sendNotification',
								data: {
									recipient: game.users.find(user => user.role === 4)._id,
									sender: game.user._id,
									type: 'picked-card'
								}
							});
							break;
					}
				}
				else {
					switch(button.dataset.action) {
						case 'show-card':
							helpers.showCard(button.name, game.user._id);
							break;
						
						default:
							ui.notifications.error(`<b>${ game.i18n.localize("MMI.title_full") }:</b> ${ game.i18n.localize("MMI.gamemaster_error")}`);
							break;
					}
				}
			});
		});
	}
	
	switchCard(html, cardIds, current, buttonClasses) {
		const currentId = cardIds[current];
		const nextId = cardIds[Math.min(Math.max(parseInt(buttonClasses.contains('left') ? current - 1 : current + 1), 0), cardIds.length - 1)];
		
		html.find('div#' + currentId + '.card-wrapper')[0].style.display = 'none';
		html.find('div#' + nextId + '.card-wrapper')[0].style.display = '';
	}
	
	close(options){
		super.close(options);
	}
}