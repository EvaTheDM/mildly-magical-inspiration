import * as defaults from '../defaults.js';
import DeckConfigApplication from '../classes/DeckConfigApplication.js';
import * as deckConfig from './DeckConfigHelpers.js';

export default () => {
	if(game.user.role === 4) {
		const menuItems = [
			{
				name: game.i18n.localize("MMI.context_config_menu"),
				icon: '<i class="fas fa-cogs"></i>',
				condition: true,
				callback: () => new DeckConfigApplication().render(true)
			},
			{
				name: game.i18n.localize("MMI.context_award_card"),
				icon: '<i class="fas fa-user-check"></i>',
				condition: game.settings.get(defaults.MODULE, 'deck').length > 0,
				callback: () => {
					let d = new Dialog({
						title: game.i18n.localize("MMI.title_full") + " - " + game.i18n.localize("MMI.context_award_card"),
						content: `
							<p>Choose a player to award a card to:</p>
							<form id="player-award-card" style="margin-bottom: 10px;">
								<select name="player" style="width: 100%;">
									<option value="">None</option>
									${ game.users.filter(user => user.role <= game.settings.get(defaults.MODULE, 'award-role') && (user.getFlag(defaults.MODULE, 'cards') && user.getFlag(defaults.MODULE, 'cards').length < game.settings.get(defaults.MODULE, 'hand-size') || !user.getFlag(defaults.MODULE, 'cards'))).map(user => `<option value="${user._id}">${user.name}</option>`) }
								</select>
							</form>
							`,
						buttons: {
							one: {
								icon: '<i class="fas fa-check"></i>',
								label: game.i18n.localize("MMI.context_award_card"),
								callback: () => {
									const chosenPlayer = $('form#player-award-card select[name=player]').val();
									
									const maxHand = game.settings.get(defaults.MODULE, 'hand-size');
									const rnSize = game.settings.get(defaults.MODULE, 'random-size');
									const deck = game.settings.get(defaults.MODULE, 'deck').filter(card => card.include && card.owner === '');
									const currentHand = game.users.get(chosenPlayer).getFlag(defaults.MODULE, 'cards');
									
									if(deck.length === 0) ui.notifications.error(`<b>${game.i18n.localize("MMI.title_full")}:</b> ${ game.i18n.localize("MMI.all_cards_players") }`);
									else {
										let rnCards = [];
										for(let i = 0; i < rnSize; i++) {
											if(deck.length === 0) break;
											const rnChoice = Math.floor(Math.random() * deck.length);
											rnCards.push(deck[rnChoice]._id);
											deck.splice(rnChoice, 1);
										}
										if(game.users.find(user => user.active && user._id === chosenPlayer)) {
											if(rnCards.length === 1) deckConfig.changePlayerOwner(rnCards[0], chosenPlayer, true);
											else game.socket.emit('module.' + defaults.MODULE, {
												operation: 'handout',
												data: {
													user: chosenPlayer,
													cards: rnCards
												}
											});
										}
										else game.users.get(chosenPlayer).setFlag(defaults.MODULE, 'choice', rnCards)
									}
								}
							},
							two: {
								icon: '<i class="fas fa-times"></i>',
								label: game.i18n.localize("MMI.cancel_button")
							}
						},
						default: "two"
					});
					d.render(true);
				}
			},
			{
				name: game.i18n.localize("MMI.context_recall_cards"),
				icon: '<i class="fas fa-undo-alt"></i>',
				condition: game.settings.get(defaults.MODULE, 'deck').length > 0,
				callback: () => {
					let d = new Dialog({
						title: game.i18n.localize("MMI.title_full") + " - " + game.i18n.localize("MMI.context_recall_cards"),
						content: `<p>${ game.i18n.localize("MMI.recall_note") }</p>`,
						buttons: {
							one: {
								icon: '<i class="fas fa-check"></i>',
								label: game.i18n.localize("MMI.context_recall_cards"),
								callback: () => {
									game.users.forEach(user => {
										user.setFlag(defaults.MODULE, 'cards', []);
									});
									game.settings.set(defaults.MODULE, 'deck', game.settings.get(defaults.MODULE,'deck').map(card => {
										return {
											...card,
											owner: ''
										}
									}));
								}
							},
							two: {
								icon: '<i class="fas fa-times"></i>',
								label: game.i18n.localize("MMI.cancel_button")
							}
						},
						default: "two"
					});
					d.render(true);
				}
			},
			{
				name: game.i18n.localize("MMI.context_reset_deck"),
				icon: '<i class="fas fa-fast-backward"></i>',
				condition: game.settings.get(defaults.MODULE, 'sources').length > 0,
				callback: () => new DeckConfigApplication().resetDeck()
			}
		];
		new ContextMenu($( "div#inspiration-deck-button" ), '.action-link', menuItems);
	}
};