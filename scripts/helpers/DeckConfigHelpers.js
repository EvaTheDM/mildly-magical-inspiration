import * as defaults from '../defaults.js';
export const cardItem = (newId, activationCost, effectDuration) => $(`<li class="card flexcol" id="${ newId }">
	<header class="table-header flexrow">
		<div class="flexrow" style="flex: 15;">
			<a class="toggle-card" id="${ newId }"><i class="fas fa-angle-down"></i></a>
			<label id="${ newId }" class="header-title" style="flex: 20;"><em>Unnamed New Card</em></label>
			<input type="hidden" name="deck.${ newId }._id" value="${ newId }">
		</div>
		<div class="card-controls flexrow">
			<label><a class="card-control" id="${ newId }" data-action="preview"><i class="fas fa-search"></i></a></label>
			<label><a class="card-control" id="${ newId }" data-action="delete"><i class="fas fa-times"></i></a></label>
		</div>
	</header>
	
	<div class="card-details">
		<div class="form-group">
			<label>Title:</label>
			<input type="text" name="deck.${ newId }.title" placeholder="Title">
		</div>
		
		<div class="form-group">
			<label>Subtitle:</label>
			<textarea name="deck.${ newId }.subtitle" rows="3" placeholder="Subtitle"></textarea>
		</div>
		
		<div class="form-group">
			<label>Include in Deck?:</label>
			<input type="checkbox" name="deck.${ newId }.include" checked="" />
		</div>
		
		<div class="form-group">
			<label>Currently Owned by:</label>
			<select class="player-select" name="deck.${ newId }.owner">
				<option value="">None</option>
				${ game.users.filter(user => user.role <= game.settings.get(defaults.MODULE, 'award-role')).map(user => {
					return `<option value="${user._id}">${user.name}</option>`;
				}) }
			</select>
		</div>
		
		<div class="form-group form-group">
			<label>Activation Cost:</label>
			<div class="flexrow">
				<input type="number" name="deck.${ newId }.cost[0]" value="" placeholder="" style="max-width: 30px; margin-right: 3px;" />
				<div class="select-wrapper" id="costWrapper-${ newId }" data-select-id="${ newId }" data-select-type="cost">
					<div class="select-inputWrapper flexrow" data-select-id="${ newId }" data-select-type="cost">
						<input type="text" class="select-listInput" data-select-id="${ newId }" data-select-type="cost" name="deck.${ newId }.cost[1]" value="Free Action" />
						<a class="select-dropdown" id="activatedrop-1"><i class="fas fa-sort-down"></i></a>
					</div>
					<div class="select-selectWrapper" data-select-id="${ newId }" data-select-type="cost">
						<ul class="custom-select cost" id="cost.select.${ newId }" style="display: none;"></ul>
					</div>
				</div>
			</div>
		</div>
		
		<div class="form-group form-group">
			<label>Duration:</label>
			<div class="flexrow">
				<input type="number" name="deck.${ newId }.duration[0]" value="" placeholder="" style="max-width: 30px; margin-right: 3px;" />
				<div class="select-wrapper" id="durationWrapper-${ newId }" data-select-id="${ newId }" data-select-type="duration">
					<div class="select-inputWrapper flexrow" data-select-id="${ newId }" data-select-type="duration">
						<input type="text" class="select-listInput" name="deck.${ newId }.duration[1]" value="Instantaneous" data-select-id="${ newId }" data-select-type="duration" />
						<a class="select-dropdown" id="activatedrop-1"><i class="fas fa-sort-down"></i></a>
					</div>
					<div class="select-selectWrapper" data-select-id="${ newId }" data-select-type="duration">
						<ul class="custom-select duration" id="duration.select.${ newId }" style="display: none;"></ul>
					</div>
				</div>
			</div>
		</div>
		
		<div class="form-group stacked">
			<label>Description:</label>
			<textarea name="deck.${ newId }.description" rows="6" placeholder="Description"></textarea>
		</div>
	</div>
</li>`);

export const exportDeck = (sourceId = false) => {
	const timestamp = new Date();
	function leadingZero(str) {
		return ('0' + str).slice(-2)
	}
	
	const fileName = `InspirationDeck-Export-${ timestamp.getUTCFullYear().toString() + '-' +
		leadingZero(timestamp.getUTCMonth()) + '-' +
		leadingZero(timestamp.getUTCDate()) + '-' +
		leadingZero(timestamp.getUTCHours()) + '-' +
		leadingZero(timestamp.getUTCMinutes()) + '-' +
		leadingZero(timestamp.getUTCSeconds())
	}.json`;
	
	const deck = !sourceId ? game.settings.get(defaults.MODULE, 'deck') : game.settings.get(defaults.MODULE, 'sources').find(source => source._id === sourceId);
	
	saveDataToFile(JSON.stringify(deck.map(card => {
		const keys = Object.keys(card);
		const req = ['subtitle', 'title'];
		const opt = ['cost', 'description', 'duration', 'include'];
		let c = {};
		keys.filter(key => req.includes(key) || opt.includes(key)).map(key => {
			c[key] = card[key]
		})
		return c
	}), null, 2), 'json', fileName)
}

export const setNewPlayerOwner = async (cardId, ownerId, updateDeck = false, openHand = false) => {
	const deck = game.settings.get(defaults.MODULE, 'deck');
	const card = deck.find(card => card._id === cardId);
	
	const newOwner = game.users.get(ownerId);
	const oldCards = newOwner.getFlag(defaults.MODULE,'cards');
	const newCards = Array.isArray(oldCards) ? [ ...oldCards, cardId ] : [ cardId ];
	
	await newOwner.setFlag(defaults.MODULE,'cards', newCards);
	
	if(updateDeck) {
		await game.settings.set(defaults.MODULE, 'deck', game.settings.get(defaults.MODULE, 'deck').map(card => {
			if(card._id === cardId) return {
				...card,
				owner: ownerId
			}
			return card
		}));
	}
	
	if(openHand) game.socket.emit('module.' + defaults.MODULE, {
		operation: 'openHand',
		data: {
			userId: ownerId
		}
	});
}

export const changePlayerOwner = async (cardId, newOwner = '', updateDeck = false, openHand = false) => {
	if(game.user.role === 4) {
		const deck = game.settings.get(defaults.MODULE, 'deck');
		const card = deck.find(card => card._id === cardId);
		
		if(card.owner && card.owner != newOwner) {
			const curOwner = game.users.get(card.owner);
			if(curOwner) await curOwner.setFlag(defaults.MODULE,'cards', curOwner.getFlag(defaults.MODULE,'cards').filter(card => card != cardId));
			if(updateDeck) {
				await game.settings.set(defaults.MODULE, 'deck', game.settings.get(defaults.MODULE, 'deck').map(card => {
					if(card._id === cardId) return {
						...card,
						owner: ''
					}
					return card
				}));
			}
		}
		if(newOwner) setNewPlayerOwner(cardId, newOwner, updateDeck, openHand);
		else if(openHand) game.socket.emit('module.' + defaults.MODULE, {
		operation: 'openHand',
		data: {
			userId: card.owner
		}
	});
	}
	else game.socket.emit('module.' + defaults.MODULE, {
		operation: 'changeCardOwner',
		data: {
			userId: newOwner,
			cardId: cardId,
			openHand: openHand
		}
	});
}