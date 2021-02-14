import * as defaults from '../defaults.js';
export const getOptions = (type) => {
	let defaults = [];
	let returnVal = [];
	switch(type) {
		case 'activationCost':
			defaults = [
				'Free Action',
				'Action',
				'Bonus Action',
				'Reaction'
			];
			returnVal = game.settings.get(defaults.MODULE, 'deck').map(c => {
				return c.cost[1]
			});
			return [...new Set(...[...defaults, ...returnVal].sort())];
			
		case 'effectDuration':
			defaults = [
				'Instantaneous',
				'Round',
				'Rounds'
			];
			returnVal = game.settings.get(defaults.MODULE, 'deck').map(c => {
				return c.duration[1]
			});
			return [...new Set(...[...defaults, ...returnVal].sort())];
			
	}
}

export const lineBreak = (lineString, cutOff = 50) => {
	if(!Number.isInteger(cutOff)) {
		switch(cutOff) {
			case 'subtitle':
				cutOff = 80;
				break;
				
			case 'title':
				cutOff = 35;
				break;
				
			default:
				cutOff = 50;
				break;
		}
	}
	
	// Check for Custom Line-Breaks
	const cusWordArr = lineString.split(/\r?\n/g);
	if(cusWordArr.length > 1) return cusWordArr;
	else {
		const lineArr = [''];
		if(lineString.length > cutOff) {
			const wordArr = lineString.split(' ');
			wordArr.forEach(word => {
				if((lineArr[lineArr.length - 1].length + 1 + word.length) > cutOff) {
					lineArr.push(word);
				}
				else if(lineArr[lineArr.length - 1].length > 0) lineArr[lineArr.length - 1] = lineArr[lineArr.length - 1] + ' ' + word;
				else lineArr[lineArr.length - 1] = word;
			});
		}
		else lineArr[0] = lineString;
		return lineArr;
	}
}

export const getModifiedCard = (cardId) => {
	const modCard = game.settings.get(defaults.MODULE, 'deck').filter(card => card._id === cardId)[0];
	
	modCard.title = lineBreak(modCard.title, 'title');
	modCard.subtitle = lineBreak(modCard.subtitle, 'subtitle');
	
	modCard.cost = modCard.cost.join(' ');
	modCard.duration = modCard.duration.join(' ');
	
	return modCard;
}

export const getPlayerHand = (playerId) => {
	const deck = game.settings.get(defaults.MODULE, 'deck');
	const cardIds = game.users.get(playerId).getFlag(defaults.MODULE, 'cards');
	
	return deck.filter(card => cardIds.includes(card._id));
}

export const getModifiedDeck = (playerId) => {
	const deck = playerId ? getPlayerHand(playerId) : game.settings.get(defaults.MODULE, 'deck');
	
	if(deck.length === 0) {
		//ui.notifications.info(`<b>Deck of Dirty Tricks:</b> Your hand is currently empty! Go and earn some more cards!`);
	}
	else {
		return deck.map(obj => {
			return getModifiedCard(obj._id);
		});
	}
	
	return false;
}