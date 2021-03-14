import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI from '/modules/mmi/scripts/main.js';

// import * as helpers from '../helpers/helpers.js';
// import * as CardFactory from './CardFactory.js';

const convert = string => {
	if(!Array.isArray(string)) {
		return MMI.lineBreak(string);
	}
	else return string;
}

export const sourceKeys = {
	direct: [ 'title', 'isActive', 'author', 'cards' ],
	custom: [  ],
	fix: [ '_id' ]
	// all: [ ...this.direct, ...this.custom, ...this.fix ]
};

// export const getSource = async (sourceId = null) => {
// 	const result = await helpers.getSetting('decks');
// 	if(sourceId) return result.find(source => source._id === sourceId)
// 	else return result;
// }
// export const getActive = async () => {
// 	const result = await getSource();
// 	return result.find(source => source.isActive);
// }
// export const updateSource  = async (data) => {
// 	await helpers.updateSetting('decks', data);
// }

export const create = async ({ title = '', isActive = false, author = '', cards = [] } = {}) => {
	const newSource = {
		_id: randomID(16),
		title,
		isActive,
		author,
		cards
	}

	newSource.cards = newSource.cards.map(card => {
		return {
			...card,
			title: convert(card.title),
			subtitle: convert(card.subtitle)
		}
	})
	
	await MMI.setSources([
		...MMI.sources,
		newSource
	])
	
	return newSource;
}

export const removeSource = async (sourceId) => {
	let sources = MMI.sources;
	await MMI.setSources(sources.filter(source => source._id != sourceId));
	return MMI.sources;
}

export const update = async (sourceId, data, hookEmitter = null) => {
	const toUpdate = Object.keys(data).filter(key => sourceKeys.direct.includes(key));
	const update = toUpdate.reduce(function(map, key) {
		if(key === 'cards') map.cards = data.cards.map(card => {
			return {
				...card,
				title: convert(card.title),
				subtitle: convert(card.subtitle)
			}
		});
		else map[key] = data[key];
		return map;
	}, {})

	await MMI.setSource(sourceId, {
		...MMI.getSource(sourceId),
		...update
	}, hookEmitter);
	
	return MMI.getSource(sourceId)
}

export const changeActive = async (sourceId) => {
	const active = MMI.activeSource ? { ...MMI.activeSource, isActive: false } : false;
	const newActive = { ...MMI.getSource(sourceId), isActive: true };

	if(active) active.cards = active.cards.map(card => {
		return { ...card, owner: '' }
	})

	newActive.cards = newActive.cards.map(card => {
		return { ...card, owner: '' }
	})

	if(active) await MMI.setSource(active._id, active);
	await MMI.setSource(newActive._id, newActive);

	return newActive;
}

export const getCard = (sourceId, cardId) => {
	return MMI.getSource(sourceId).cards.find(card => card._id === cardId);
}

export const addCard = async (sourceId, newCard) => {
	const source = MMI.getSource(sourceId);
	
	await update(sourceId, { cards: [ newCard, ...source.cards ]});

	return MMI.getSource(sourceId).cards.find(card => card._id === newCard._id);
}

export const removeCard = async (sourceId, cardId) => {
	let source = MMI.getSource(sourceId);

	await update(sourceId, { cards: source.cards.filter(card => card._id != cardId) });

	return MMI.getSource(sourceId);
}

// export const getCards = async (parent) => {
// 	const source = await getSource(parent);
// 	return source.cards;
// }

// export const getCard = async (parent, cardId) => {
// 	const cards = await getCards(parent);
// 	return cards.find(card => card._id === cardId);
// }



/*
*	
*	Card Factory
*	
*/
const cardKeys = {
	direct: [ 'title', 'subtitle', 'description', 'include', 'cost', 'duration', 'owner', 'image' ],
	custom: [  ],
	fix: [ '_id' ]
	// all: [ ...cardKeys.direct, ...cardKeys.custom, ...cardKeys.fix ]
};

export const createCard = async ({ title = '', subtitle = '', description = '', include = true, cost = ['', 'Free Action'], duration = ['', 'Instantaneous'], image = '' } = {}, parent = null) => {
	const newCard = {
		_id: randomID(16),
		title,
		subtitle,
		description,
		include,
		cost,
		duration,
		owner: '',
		image
	}

	let result = false;

	if(parent) result = await addCard(parent, newCard);
	
	return result || false;
}

export const awardCard = async (cardId, newOwner, offer = null, hookEmitter = null) => {
	hookEmitter = hookEmitter || { sender: game.user._id, change: 'awardCard', offer, cardId };
	const source = MMI.activeSource;

	await update(source._id, { cards: source.cards.map(card => {
		if(card._id === cardId) return {
			...card,
			owner: newOwner
		}
		else return card;
	})}, hookEmitter)

	return getCard(source._id, cardId);
}

export const useCard = async (cardId) => {
	const res = await awardCard(cardId, '', null, { sender: game.user._id, change: 'useCard', cardId } )
	return res;
}