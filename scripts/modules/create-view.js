import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI from '/modules/mmi/scripts/main.js';

import CardViewerApplication from '/modules/mmi/scripts/apps/CardViewerApplication.js';

const getWindowHeight = (type) => {
	switch (type) {
		case 'preview':
		case 'fullDeck':
			return 550;

		case 'playerHands':
			return 577;
			
		case 'award':
		case 'single':
			return 582;
		
		case 'gamemaster':
			return 609;
	}
	return 'auto';
}

const getRenderOptions = (type) => {
	const def = {
		render: true, // renders the current application only if it isn't already open, else closes it
		focusCard: null, // set an id to change which card to show to the user
		focusUser: null, // set an id to change which user to focus on, overwritten by focusCard if multiple tabs exist
	}

	switch (type) {
		case 'preview':
			return {
				...def,
				render: false
			}
	
		default:
			return def
	}
}

const defaultOptions = ({ type }) => {
	return {
		app: {
			id: `${ type }UI`,
			width: 800,
			height: getWindowHeight(type),
			popOut: true,
			minimizable: true,
			classes: [ 'card-viewer' ],
			title: 'Mildly Magical Inspiration',
			template: DEFAULTS.templatePath + '/card-view.html'
		},
		...getRenderOptions(type)
	}
}

/*
* Create UI for viewing cards
* Supports the following keys and values:
* 
* {String} type					Switch between 'preview', 'single', 'gamemaster', 'award' View Mode
* {Object} data					The data handed over for viewing cards, changes structure on different types
*
*/
export default async ({ type = 'single', data = {} }, options = {}) => {
	// let object = [];
	// let title = '';
	// data.render = 'render' in data ? data.render : true;
	options = {
		...defaultOptions({ type }),
		...options
	}

	// switch(type) {
	// 	case 'award':
	// 		title = 'Card Choice'
	// 		const cards = MMI.activeDeck.filter(card => data.offer.includes(card._id)).map((card, key) => {
	// 			return {
	// 				...card,
	// 				title: card.title.join('<br />'),
	// 				subtitle: card.subtitle.join('<br />'),
	// 				cost: card.cost.join(' '),
	// 				duration: card.duration.join(' '),
	// 				count: key + 1
	// 			}
	// 		})
			
	// 		object.push({
	// 			userId: data.userId,
	// 			cards: cards.length,
	// 			controls: cards.length > 1,
	// 			cardData: cards,
	// 			ui: [
	// 				{
	// 					dataAction: 'choose-card',
	// 					icon: '',
	// 					label: 'Choose this Card!'
	// 				}
	// 			]
	// 		});
	// 		break;
			
	// 	case 'preview':
	// 		title = `${ data.cardData.title.join(' ') } - Card Preview`;
			
	// 		object.push({
	// 			userId: '',
	// 			preview: true,
	// 			cards: 1,
	// 			controls: false,
	// 			cardData: [ { 
	// 				...data.cardData,
	// 				title: data.cardData.title.join('<br />'),
	// 				subtitle: data.cardData.subtitle.join('<br />'),
	// 				cost: data.cardData.cost.join(' '),
	// 				duration: data.cardData.duration.join(' ')
	// 			} ],
	// 			ui: []
	// 		});
	// 		break;
		
	// 	case 'single':
	// 		const userCards = MMI.activeDeck.filter(card => card.owner === data.userId)
	// 		const user = game.users.get(data.userId);
	// 		title = `Player Hand`;
			
	// 		object.push({
	// 			userId: user._id,
	// 			username: user.name,
	// 			cards: userCards.length,
	// 			controls: userCards.length > 1,
	// 			cardData: userCards.map((card, key) => {
	// 				return {
	// 					...card,
	// 					title: card.title.join('<br />'),
	// 					subtitle: card.subtitle.join('<br />'),
	// 					cost: card.cost.join(' '),
	// 					duration: card.duration.join(' '),
	// 					count: key + 1
	// 				}
	// 			}),
	// 			ui: [
	// 				{
	// 					dataAction: 'show-card',
	// 					icon: '',
	// 					label: 'Show Card'
	// 				},
	// 				{
	// 					dataAction: 'move-card',
	// 					icon: '',
	// 					label: 'Pass Card'
	// 				},
	// 				{
	// 					dataAction: 'use-card',
	// 					icon: '',
	// 					label: 'Use Card'
	// 				}
	// 			]
	// 		});
	// 		break;
	
	// 	case 'fullDeck':
	// 		const allCards = MMI.activeDeck;
	// 		title = `All Cards`;
			
	// 		object.push({
	// 			userId: '',
	// 			// preview: true,
	// 			cards: MMI.activeDeck.length,
	// 			controls: MMI.activeDeck.length > 1,
	// 			cardData: MMI.activeDeck.map((card, key) => {
	// 				return {
	// 					...card,
	// 					title: card.title.join('<br />'),
	// 					subtitle: card.subtitle.join('<br />'),
	// 					cost: card.cost.join(' '),
	// 					duration: card.duration.join(' '),
	// 					count: key + 1
	// 				}
	// 			}),
	// 			ui: []
	// 		});
	// 		break;
		
	// 	case 'playerHands':
	// 		title = `Player Hands`;
			
	// 		const players = game.users.filter(user => MMI.haveCards[user._id] && user._id != game.user._id)
	// 		for(const user of players) {
	// 			let cardData = MMI.activeDeck.filter(card => card.owner === user._id).map((card, key) => {
	// 				return {
	// 					...card,
	// 					title: card.title.join('<br />'),
	// 					subtitle: card.subtitle.join('<br />'),
	// 					cost: card.cost.join(' '),
	// 					duration: card.duration.join(' '),
	// 					count: key + 1
	// 				}
	// 			});
				
	// 			object.push({
	// 				userId: user._id,
	// 				username: user.name,
	// 				cards: cardData.length,
	// 				controls: cardData.length > 1,
	// 				cardData: cardData,
	// 				ui: []
	// 			});
	// 		}
	// 		break;
		
	// 	case 'gamemaster':
	// 		title = `Player Hands (Gamemaster View)`;
			
	// 		const users = game.users.filter(user => MMI.haveCards[user._id])
	// 		for(const user of users) {
	// 			let cardData = MMI.activeDeck.filter(card => card.owner === user._id).map((card, key) => {
	// 				return {
	// 					...card,
	// 					title: card.title.join('<br />'),
	// 					subtitle: card.subtitle.join('<br />'),
	// 					cost: card.cost.join(' '),
	// 					duration: card.duration.join(' '),
	// 					count: key + 1
	// 				}
	// 			});
				
	// 			object.push({
	// 				userId: user._id,
	// 				username: user.name,
	// 				cards: cardData.length,
	// 				controls: cardData.length > 1,
	// 				cardData: cardData,
	// 				ui: [
	// 					{
	// 						dataAction: 'show-card',
	// 						icon: '',
	// 						label: 'Show Card'
	// 					},
	// 					{
	// 						dataAction: 'move-card',
	// 						icon: '',
	// 						label: 'Pass Card'
	// 					},
	// 					{
	// 						dataAction: 'return-card',
	// 						icon: '',
	// 						label: 'Take Card'
	// 					}
	// 				]
	// 			});
	// 		}
	// 		break;
	// }
	// if(object.length > 0) {
		
	const cardViewer = new CardViewerApplication({
		...options.app,
		title: `${ options.app.title } - Replace`,
		focusCard: options.focusCard,
		focusUser: options.focusUser,
		data,
		type,
		...type === 'gamemaster' || type === 'playerHands' ? { tabs: [{navSelector: ".tabs", contentSelector: ".content", initial: "userHand-1234"}] } : {}
		// ...type === 'preview' || type === 'fullDeck' ? {
		// 	sourceId: data.sourceId
		// }
		// 	} : type === 'award' ? {
		// 			offer: data.offer
		// 		} : { }
	});

	/*
	* Rendering
	* Additionally to data parameters additional parameters may be handed over to change the rendering behaviour
	* A rerender is forced when render is set to false, or when focusCard or focusUser is not null
	*/
	if(options.render && options.focusCard === null && options.focusUser === null) {
		// Check if is open, if it is close, else open it!
		let isOpen = false;
		Object.keys(ui.windows).forEach(key => {
			if(ui.windows[key].constructor.name === 'CardViewerApplication' && ui.windows[key].options.id === `${ type }UI`) {
				isOpen = true;
				ui.windows[key].close();
			}
		})
		if(!isOpen) cardViewer.render(true);
	}
	else cardViewer.render(true);
	// }
}