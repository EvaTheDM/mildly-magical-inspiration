import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI from '/modules/mmi/scripts/main.js';

import { makeMenuItems } from '/modules/mmi/scripts/config/create-context.js';

const registerDependant = (maxSize) => {
	if(!game.settings.settings.has(`${ MMI.module }.hand-size`)) {
		// Maximum hand size
		game.settings.register(DEFAULTS.module, 'hand-size', {
			name: 'Hand Size',
			hint: 'The maximum number of cards that can be held by a player at a time.',
			scope: 'world',
			config: true,
			type: Number,
			range: {
				min: 1,
				max: maxSize || 1,
				step: 1
			},
			default: 1,
			onChange: value => {}
		});
	}
	
	if(!game.settings.settings.has(`${ MMI.module }.random-size`)) {
		// Random size
		game.settings.register(DEFAULTS.module, 'random-size', {
			name: 'Random Size',
			hint: 'How many cards should be offered to a player when handing out cards. If this value is set to 1 the player doesn\'t get a choice.',
			scope: 'world',
			config: true,
			type: Number,
			range: {
				min: 1,
				max: maxSize || 1,
				step: 1
			},
			default: 1,
			onChange: value => {}
		});
	}
}

export default function () {
	game.settings.register(DEFAULTS.module, 'sources', {
		scope: 'world',
		config: false,
		default: [],
		onChange: value => {
			console.log('Inspirationdeck | Sources changed');
			if(game.user.role === 4 && game?.MMI?.context?.menuItems) game.MMI.context.menuItems = makeMenuItems();
			MMI.updateButtonValue();

			const deckL = value.find(source => source.isActive)?.cards.filter(card => card.include).length;
			if(deckL > 0) registerDependant(deckL)
			else {
				if(game.settings.settings.has(`${ DEFAULTS.module }.random-size`)) game.settings.settings.delete(`${ DEFAULTS.module }.random-size`)
				if(game.settings.settings.has(`${ DEFAULTS.module }.hand-size`)) game.settings.settings.delete(`${ DEFAULTS.module }.hand-size`)
			}
		}
	});

	// Hidden Version Setting
	game.settings.register(DEFAULTS.module, 'version', {
		scope: 'world',
		config: false,
		default: '2.0.0'
	});

	// Hidden on Offer Setting for offered cards
	game.settings.register(DEFAULTS.module, 'requireMigration', {
		scope: 'world',
		config: false,
		default: true
	});
	
	// Maximum role to receive cards
	game.settings.register(DEFAULTS.module, 'permissions', {
		scope: 'world',
		config: false,
		default: {},
		onChange: data => {
			Hooks.call('changedMMISetting', { change: 'permissionsUpdated', data });
		}
	});
	
	// Let Players see front when choosing
	game.settings.register(DEFAULTS.module, 'open-choice', {
		name: 'Reveal Cards before Choosing?',
		hint: 'Changes whether or not cards should show their fronts or backs when letting players pick cards.',
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		onChange: value => {}
	});
	
	// Card Front image
	game.settings.register(DEFAULTS.module, 'card-front', {
		name: 'Card Front',
		hint: 'Choose an image for the cards front that matches the dimensions of 900x570px',
		scope: 'world',
		config: true,
		type: String,
		default: DEFAULTS.imagePath + '/front.webp',
		onChange: value => {}
	});
	
	// Card Back image
	game.settings.register(DEFAULTS.module, 'card-back', {
		name: 'Card Back',
		hint: 'Choose an image that for the cards back matches the dimensions of 275x375px',
		scope: 'world',
		config: true,
		type: String,
		default: DEFAULTS.imagePath + '/back.webp',
		onChange: value => {}
	});
	
	const deckLength = MMI.activeDeck.filter(card => card.include).length;
	if(deckLength > 0) registerDependant(deckLength);
}