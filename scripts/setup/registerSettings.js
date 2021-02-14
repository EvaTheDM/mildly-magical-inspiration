import * as defaults from '../defaults.js';
import { getModifiedDeck, getOptions, getModifiedCard } from '../helpers/helpers.js';
import updateButtonValue from '../helpers/updateButtonValue.js';
import CardViewerApplication from '../classes/CardViewerApplication.js';
import DeckConfigApplication from '../classes/DeckConfigApplication.js';
import SourceConfigApplication from '../classes/SourceConfigApplication.js';

export default async function () {
	game.settings.registerMenu(defaults.MODULE, "sourceConfig", {
		name: game.i18n.localize("MMI.settings_source_name"),
		label: game.i18n.localize("MMI.settings_source_label"),
		icon: "fas fa-cogs",
		type: SourceConfigApplication,
		restricted: true
	});

	// Save Deck as Setting piece
	game.settings.register(defaults.MODULE, 'deck', {
		scope: 'world',
		config: false,
		default: [],
		onChange: value => {
			console.log('Inspirationdeck | Deck changed');
			updateButtonValue();
		}
	});

	// Save Deck as Setting piece
	game.settings.register(defaults.MODULE, 'sources', {
		scope: 'world',
		config: false,
		default: [],
		onChange: value => {
			console.log('Sources changed');
		}
	});
	
	// Create Setting for the maximum role a user can have to receive cards
	game.settings.register(defaults.MODULE, 'award-role', {
		name: game.i18n.localize("MMI.settings_award_name"),
		hint: game.i18n.localize("MMI.settings_award_hint"),
		scope: 'world',
		config: true,
		isSelect: true,
		type: Number,
		choices: defaults.USER_ROLE_CHOICES,
		default: 3,
		onChange: value => {}
	});
	
	// Create Setting for Maximum Hand Size of Players
	game.settings.register(defaults.MODULE, 'hand-size', {
		name: game.i18n.localize("MMI.settings_hand_name"),
		hint: game.i18n.localize("MMI.settings_hand_hint"),
		scope: 'world',
		config: true,
		type: Number,
		range: {
			min: 1,
			max: game.settings.get(defaults.MODULE,'deck').length,
			step: 1
		},
		default: 1,
		onChange: value => {}
	});
	
	// Create Setting for the number of cards that are shown to the player
	game.settings.register(defaults.MODULE, 'random-size', {
		name: game.i18n.localize("MMI.settings_random_name"),
		hint: game.i18n.localize("MMI.settings_random_hint"),
		scope: 'world',
		config: true,
		type: Number,
		range: {
			min: 1,
			max: game.settings.get(defaults.MODULE,'deck').length,
			step: 1
		},
		default: 1,
		onChange: value => {}
	});
	
	// Create Setting for switching between front and back view of cards
	game.settings.register(defaults.MODULE, 'open-choice', {
		name: game.i18n.localize("MMI.settings_open_name"),
		hint: game.i18n.localize("MMI.settings_open_hint"),
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		onChange: value => {}
	});
	
	// Create Setting for choosing card front
	game.settings.register(defaults.MODULE, 'card-front', {
		name: game.i18n.localize("MMI.settings_cfront_name"),
		hint: game.i18n.localize("MMI.settings_cfront_hint"),
		scope: 'world',
		config: true,
		type: String,
		default: defaults.IMG_PATH + '/front.webp',
		onChange: value => {}
	});
	
	// Create Setting for choosing card front
	game.settings.register(defaults.MODULE, 'card-back', {
		name: game.i18n.localize("MMI.settings_cback_name"),
		hint: game.i18n.localize("MMI.settings_cback_hint"),
		scope: 'world',
		config: true,
		type: String,
		default: defaults.IMG_PATH + '/back.webp',
		onChange: value => {}
	});
	
	game.settings.registerMenu(defaults.MODULE, "deckConfig", {
		name: game.i18n.localize("MMI.config_name"),
		label: game.i18n.localize("MMI.config_label"),
		icon: "fas fa-cogs",
		type: DeckConfigApplication,
		restricted: true
	});
}