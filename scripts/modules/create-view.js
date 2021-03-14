import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { Combobox, exportSource, SourceFactory } from '/modules/mmi/scripts/main.js';

import CardViewerApplication from '/modules/mmi/scripts/apps/CardViewerApplication.js';
/*
* Create UI for viewing cards
* Supports the following keys and values:
* 
* {String} type					Switch between 'preview', 'single', 'gamemaster', 'award' View Mode
* {Object} options				The data handed over for viewing cards, changes structure on different types
*
*/
export default async (type = 'single', options = {}) => {
	let object = [];
	let title = '';
	options.render = 'render' in options ? options.render : true;

	switch(type) {
		case 'award':
			title = 'Card Choice'
			const cards = MMI.activeDeck.filter(card => options.offer.includes(card._id)).map((card, key) => {
				return {
					...card,
					title: card.title.join('<br />'),
					subtitle: card.subtitle.join('<br />'),
					cost: card.cost.join(' '),
					duration: card.duration.join(' '),
					count: key + 1
				}
			})
			
			object.push({
				userId: options.userId,
				cards: cards.length,
				controls: cards.length > 1,
				cardData: cards,
				ui: [
					{
						dataAction: 'choose-card',
						icon: '',
						label: 'Choose this Card!'
					}
				]
			});
			break;
			
		case 'preview':
			title = `${ options.cardData.title.join(' ') } - Card Preview`;
			
			object.push({
				userId: '',
				preview: true,
				cards: 1,
				controls: false,
				cardData: [ { 
					...options.cardData,
					title: options.cardData.title.join('<br />'),
					subtitle: options.cardData.subtitle.join('<br />'),
					cost: options.cardData.cost.join(' '),
					duration: options.cardData.duration.join(' ')
				} ],
				ui: []
			});
			break;
		
		case 'single':
			const userCards = MMI.activeDeck.filter(card => card.owner === options.userId)
			const user = game.users.get(options.userId);
			title = `Player Hand`;
			
			object.push({
				userId: user._id,
				username: user.name,
				cards: userCards.length,
				controls: userCards.length > 1,
				cardData: userCards.map((card, key) => {
					return {
						...card,
						title: card.title.join('<br />'),
						subtitle: card.subtitle.join('<br />'),
						cost: card.cost.join(' '),
						duration: card.duration.join(' '),
						count: key + 1
					}
				}),
				ui: [
					{
						dataAction: 'show-card',
						icon: '',
						label: 'Show Card'
					},
					{
						dataAction: 'move-card',
						icon: '',
						label: 'Pass Card'
					},
					{
						dataAction: 'use-card',
						icon: '',
						label: 'Use Card'
					}
				]
			});
			break;
	
		case 'fullDeck':
			const allCards = MMI.activeDeck;
			title = `All Cards`;
			
			object.push({
				userId: '',
				// preview: true,
				cards: MMI.activeDeck.length,
				controls: MMI.activeDeck.length > 1,
				cardData: MMI.activeDeck.map((card, key) => {
					return {
						...card,
						title: card.title.join('<br />'),
						subtitle: card.subtitle.join('<br />'),
						cost: card.cost.join(' '),
						duration: card.duration.join(' '),
						count: key + 1
					}
				}),
				ui: []
			});
			break;
		
		case 'playerHands':
			title = `Player Hands`;
			
			const players = game.users.filter(user => MMI.haveCards[user._id] && user._id != game.user._id)
			for(const user of players) {
				let cardData = MMI.activeDeck.filter(card => card.owner === user._id).map((card, key) => {
					return {
						...card,
						title: card.title.join('<br />'),
						subtitle: card.subtitle.join('<br />'),
						cost: card.cost.join(' '),
						duration: card.duration.join(' '),
						count: key + 1
					}
				});
				
				object.push({
					userId: user._id,
					username: user.name,
					cards: cardData.length,
					controls: cardData.length > 1,
					cardData: cardData,
					ui: []
				});
			}
			break;
		
		case 'gamemaster':
			title = `Player Hands (Gamemaster View)`;
			
			const users = game.users.filter(user => MMI.haveCards[user._id])
			for(const user of users) {
				let cardData = MMI.activeDeck.filter(card => card.owner === user._id).map((card, key) => {
					return {
						...card,
						title: card.title.join('<br />'),
						subtitle: card.subtitle.join('<br />'),
						cost: card.cost.join(' '),
						duration: card.duration.join(' '),
						count: key + 1
					}
				});
				
				object.push({
					userId: user._id,
					username: user.name,
					cards: cardData.length,
					controls: cardData.length > 1,
					cardData: cardData,
					ui: [
						{
							dataAction: 'show-card',
							icon: '',
							label: 'Show Card'
						},
						{
							dataAction: 'move-card',
							icon: '',
							label: 'Pass Card'
						},
						{
							dataAction: 'return-card',
							icon: '',
							label: 'Take Card'
						}
					]
				});
			}
			break;
	}
	if(object.length > 0) {
		let windowHeight;
		switch(type) {
			case 'preview':
			case 'fullDeck':
				windowHeight = 550;
				break;

			case 'playerHands':
				windowHeight = 577;
				break;
				
			case 'award':
			case 'single':
				windowHeight = 582;
				break;
			
			case 'gamemaster':
				windowHeight = 609;
				break;
		}
		
		const cardViewer = new CardViewerApplication({
			width: 800,
			height: windowHeight,
			popOut: true,
			minimizable: true,
			id: `${type}UI`,
			classes: [ 'card-viewer' ],
			title: `Mildly Magical Inspiration - ${ title }`,
			template: DEFAULTS.templatePath + '/card-view.html',
			type,
			focus: options.hasOwnProperty('focus') ? options.focus : null,
			object,
			...type === 'preview' || type === 'fullDeck' ? {
				id: `previewUI`,
				sourceId: options.sourceId
			}
				: type === 'gamemaster' || type === 'playerHands' ? {
					tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: "userHand-1234"}]
				} : type === 'award' ? {
						offer: options.offer
					} : { }
		});

		// render: false
		if((type != 'preview') && !options.hasOwnProperty('focus')) {
			let isOpen = false;
			Object.keys(ui.windows).forEach(key => {
				if(ui.windows[key].options.id === `${ type }UI`) {
					if(options.render) {
						isOpen = true;
						ui.windows[key].close();
					}
				}
			})
			if(!isOpen) cardViewer.render(true);
		}
		else cardViewer.render(true);
	}
}