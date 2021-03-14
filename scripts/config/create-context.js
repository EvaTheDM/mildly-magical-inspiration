import MMI, { SourceFactory, createView } from '/modules/mmi/scripts/main.js';

import SourceConfigApplication from '/modules/mmi/scripts/apps/SourceConfigApplication.js';
import DeckConfigApplication from '/modules/mmi/scripts/apps/DeckConfigApplication.js';

const buildMenuItems = (data) => {
	return data.map(item => {
		return {
			name: item.label,
			icon: `<i class="fas ${item.icon}"></i>`,
			condition: item.show,
			callback: item.callback
		}
	});
}

export const makeMenuItems = () => {
	let show = false;
	let showDeck = false;
	
	if(game.user.role === 4 && MMI.activeSource && MMI.activeDeck.length > 0) show = true;
	if(game.user.role === 4 && MMI.activeSource) showDeck = true;

	return buildMenuItems([
		{
			label: 'Deck Config',
			icon: 'fa-cogs',
			show: showDeck,
			callback: () => new DeckConfigApplication().render(true)
		},
		{
			label: 'Source Config',
			icon: 'fa-cogs',
			show: game.user.role === 4,
			callback: () => new SourceConfigApplication().render(true)
		},
		{
			label: 'View Deck',
			icon: 'fa-inbox',
			show: (MMI.activeSource && MMI.activeDeck.length > 0) ? game.user.role === 4 ? true : MMI.viewDeck[game.user._id] ?? false : false,
			callback: () => createView({ type: 'fullDeck' })
		},
		{
			label: 'Player Hands',
			icon: 'fa-inbox',
			show: (MMI.activeSource && MMI.activeDeck.length > 0) ? MMI.viewPlayerHands[game.user._id] ?? false : false,
			callback: () => createView({ type: 'playerHands' })
		},
		{
			label: 'Award Card',
			icon: 'fa-user-check',
			show,
			callback: () => {
				MMI.makeDialog({
					title: `Award Card`,
					content: `<p>Choose a player to award a card to!</p>`,
					form: {
						name: 'award-player',
						type: 'select',
						options: [
							{ value: '', label: 'Choose a Player' },
							...game.users.filter(user => MMI.haveCards[user._id]).map(user => {
								return { value: user._id, label: `${ user.name }${ user.active ? ` (Online)` : '' }`, disabled: !MMI.checkHandSize(user._id) }
							})
						]
					},
					buttons: {
						award: {
							icon: 'fa-check',
							label: 'Award Card',
							callback: async html => {
								const currentOffer = game.users.map(user => {
									return MMI.checkQueue(user._id)?.filter(q => q.type === 'multipleChoice').reduce((obj, map) => {
										return obj.concat(map.offer);
									}, []) || [];
								}).reduce((obj, map) => {
									return obj.concat(map);
								}, []);

								const newUser = html.find('select[name="award-player"]').val();
								const available = MMI.activeDeck.filter(card => card.include && card.owner === '' && !currentOffer.includes(card._id))
								const offer = [];

								for (let i = 0; i < MMI.randomSize; i++) {
									if(available.length === 0) break;
									const rn = Math.floor((Math.random() * available.length));
									offer.push(available[rn]._id);
									available.splice(rn, 1);
								}

								if(offer.length === 1) {
									await SourceFactory.awardCard(offer[0], newUser)
									if(game.users.get(newUser).active) MMI.socket('openHand', { userId: newUser, opt: { render: false, focusCard: offer[0] } })
									ui.notifications.info(MMI.awardNotification(newUser, offer[0], false));
								}
								else if(offer.length > 1) {
									await MMI.addToQueue({ type: 'multipleChoice', offer }, newUser);
									if(game.users.get(newUser).active) MMI.socket('multipleChoice', { userId: newUser, offer });
								}
							}
						}
					},
					render: html => { MMI.disableOnEmpty({ target: html.find('button.award'), operator: html.find('select[name="award-player"]') }) }
				})
			}
		},
		{
			label: 'Recall Cards',
			icon: 'fa-undo-alt',
			show,
			callback: () => {
				MMI.makeDialog({
					title: `Recall Cards`,
					content: `<p>Are you sure you want to recall all cards back into the deck?</p>`,
					buttons: {
						award: {
							icon: 'fa-check',
							label: 'Recall Cards',
							callback: async () => {
								await MMI.recallCards()
								ui.notifications.info('Mildly Magical Inspiration: All cards were recalled back into the deck successfully!');
							}
						}
					}
				})
			}
		}
	]);
}

export default () => {
	const menuItems = makeMenuItems();

	game.MMI.context = new ContextMenu($('div#inspiration-deck-button'), '.action-link', menuItems);
};