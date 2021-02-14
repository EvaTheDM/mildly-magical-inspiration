import * as defaults from '../defaults.js';
import CardViewerApplication from '../classes/CardViewerApplication.js';
import {
	getModifiedCard,
	getModifiedDeck
} from './helpers.js';
/*
* Create UI for viewing cards
* Supports the following keys and values:
* 
* {String} type					Switch between 'preview', 'single', 'gamemaster', 'award' View Mode
* {Object} options				The data handed over for viewing cards, changes structure on different types
*
*/
export default (type = 'single', options = {}) => {
	let object = [];
	let title = '';
	switch(type) {
		case 'award':
			const chooseDeck = game.settings.get(defaults.MODULE, 'deck').filter(card => options.cards.includes(card._id)).map(card => {
				return getModifiedCard(card._id);
			});
			title = game.i18n.localize("MMI.receive_card");
			
			object.push({
				userId: options.userId,
				cards: options.cards.length,
				controls: options.cards.length > 1,
				cardData: options.cards.length > 0 ? chooseDeck.map((c, k) => {
					return {
						...c,
						count: k+1
					}
				}) : [],
				ui: [
					{
						dataAction: 'choose-card',
						icon: '',
						label: game.i18n.localize("MMI.choose_card")
					}
				]
			});
			break;
			
		case 'preview':
			const card = getModifiedCard(options.cardId);
			title = game.i18n.localize("MMI.card_preview");
			
			object.push({
				userId: '',
				preview: true,
				cards: 1,
				controls: false,
				cardData: [ card ],
				ui: []
			});
			break;
		
		case 'single':
			const user = game.users.get(options.userId);
			const userCards = user.getFlag(defaults.MODULE, 'cards');
			title = game.i18n.localize("MMI.player_hand");
			
			object.push({
				userId: user._id,
				username: user.name,
				cards: userCards.length,
				controls: userCards.length > 1,
				cardData: userCards.length > 0 ? getModifiedDeck(game.user._id).map((c, k) => {
					return {
						...c,
						count: k+1
					}
				}) : [],
				ui: [
					{
						dataAction: 'show-card',
						icon: '',
						label: game.i18n.localize("MMI.show_card")
					},
					{
						dataAction: 'move-card',
						icon: '',
						label: game.i18n.localize("MMI.move_card_button")
					},
					{
						dataAction: 'use-card',
						icon: '',
						label: game.i18n.localize("MMI.use_card_button")
					}
				]
			});
			break;
		
		case 'gamemaster':
			title = game.i18n.localize("MMI.player_hands") + ' - ' + game.i18n.localize("MMI.gamemaster_view");
			
			object = game.users.filter(user => user.role <= game.settings.get(defaults.MODULE, 'award-role')).map(user => {
				let cards = 0;
				let cardData = [];
				const userCards = user.getFlag(defaults.MODULE,'cards');
				
				if(userCards && userCards.length > 0) {
					cards = userCards.length;
					cardData = getModifiedDeck(user._id).map((c, k) => {
						return {
							...c,
							count: k+1
						}
					});
				}
				
				return {
					userId: user._id,
					username: user.name,
					cards: cards,
					controls: cards > 1,
					cardData: cardData,
					ui: [
						{
							dataAction: 'show-card',
							icon: '',
							label: game.i18n.localize("MMI.show_card")
						},
						{
							dataAction: 'move-card',
							icon: '',
							label: game.i18n.localize("MMI.move_card_button")
						},
						{
							dataAction: 'return-card',
							icon: '',
							label: game.i18n.localize("MMI.return_card_button")
						}
					]
				}
			});
			break;
	}
	
	if(object.length > 0) {
		let windowHeight;
		switch(type) {
			case 'preview':
				windowHeight = 546;
				break;
				
			case 'award':
			case 'single':
				windowHeight = 578;
				break;
			
			case 'gamemaster':
				windowHeight = 609;
				break;
		}
		const applOptions = {
			width: 800,
			height: windowHeight,
			popOut: true,
			minimizable: true,
			id: `${type}UI`,
			title: game.i18n.localize("MMI.title_full") + ' - ' + title,
			template: defaults.TEMPLATE_PATH + '/card-view.html',
			object
		}
		const classOptions = type === 'preview' ? {
			classes: [ options.cardId ]
		} : { };
		const tabOptions = type === 'gamemaster' ? {
			tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: "userHand-1234"}]
		} : { };
		
		const cardViewer = new CardViewerApplication({
			...applOptions,
			...tabOptions
		});
		
		if(type != 'preview') {
			let isOpen = false;
			Object.keys(ui.windows).forEach(key => {
				if(ui.windows[key].options.id === `${type}UI`) {
					isOpen = true;
					ui.windows[key].close();
				}
			})
			if(!isOpen) cardViewer.render(true);
		}
		else cardViewer.render(true);
	}
}