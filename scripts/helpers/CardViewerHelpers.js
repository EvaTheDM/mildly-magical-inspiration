import * as defaults from '../defaults.js';
import { getModifiedCard } from './helpers.js';
import * as configHelpers from './DeckConfigHelpers.js';
import createView from './openView.js';

export const showCard = async (cardId, user) => {
	const card = getModifiedCard(cardId);
	let d = new Dialog({
		title: `${ game.i18n.localize("MMI.show_card") } "${ card.title.join(' ') }"`,
		content: `
		<p>${ game.i18n.localize("MMI.show_note") } "<em>${ card.title.join(' ') }</em>"!</p>
		<div class="flexrow">
			<div class="flexrow" style="min-width: 100%;">
				<input type="checkbox" name="show-all-players">
				<span style="align-self: center;">${ game.i18n.localize("MMI.show_all") }</span>
			</div>
			${ game.users.filter(user => user._id != game.user._id && user.active).map(user => {
			return `
			<div class="flexrow" style="min-width: 50%;">
				<input type="checkbox" name="show-players-select" value="${user._id}">
				<span style="align-self: center;">${user.name}</span>
			</div>`;
			}).join('') }
		</div>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: game.i18n.localize("MMI.show_card"),
				callback: () => {
					let users = [];
					$('input[name=show-players-select]:checked').each((i, input) => {
						users.push(input.value);
					});
						game.socket.emit('module.' + defaults.MODULE, {
							operation: 'showCard',
							data: {
								users: users,
								cardId: cardId
							}
						});
				}
			},
			two: {
				icon: '<i class="fas fa-times"></i>',
				label: game.i18n.localize("MMI.cancel_button")
			}
		},
		default: "two",
		render: html => {
			$('input[name=show-all-players]').prop('checked', true);
			$('input[name=show-players-select]').prop('checked', true).prop('disabled', true);
			
			$('input[name=show-all-players]').on('change', event => {
				if(event.target.checked) $('input[name=show-players-select]').prop('checked', true).prop('disabled', true);
				else $('input[name=show-players-select]').prop('checked', false).prop('disabled', false);
			});
		}
	});
	d.render(true);
}

export const useCard = async (cardId, user) => {
	const card = getModifiedCard(cardId);
	
	const options = {
		cardId: cardId,
		title: card.title.join(' '),
		subtitle: card.subtitle.join(' '),
		description: card.description,
		cost: card.cost,
		duration: card.duration
	};
	
	let message = ChatMessage.create({
		content: `
		<div class="dnd5e red-full chat-card">
			<div><div class="dnd5e chat-card item-card">
				<header class="card-header flexrow red-header" style="align-items: center;">
					<img src="systems/dnd5e/icons/items/inventory/parchment.jpg" title="${options.title}" width="36" height="36">
					<h3 class="item-name" style="line-height: 18px;">${options.title}</h3>
				</header>
			<div></div>
			
			<div class="card-content br-text">
				<p>${options.subtitle}</p>
			</div>
			
			${ options.description ? `
			<div class="card-content br-text">
				<p>${options.description}</p>
			</div>` : '' }
			
			<footer class="card-footer">
				<span>${options.cost}</span>
				<span>${options.duration}</span>
			</footer>
		</div>
		`
	});
	
	await configHelpers.changePlayerOwner(cardId, '', true, true);
}

export const moveCard = (cardId, user) => {
	const card = getModifiedCard(cardId);
	let d = new Dialog({
		title: user ? game.i18n.format("MMI.pass_card", { card: card.title.join(' ') }) : game.i18n.format("MMI.move_card", { card: card.title.join(' ') }),
		content: `
		<p>${ game.i18n.localize("MMI.new_owner_note") } "<em>${ card.title.join(' ') }</em>"!</p>
		<select id="pass-player-select" name="${cardId}" style="display: block; margin: 20px 0; width: 100%;">
			${ game.users.filter(user => user.role <= game.settings.get(defaults.MODULE, 'award-role') &&
				user._id != game.user._id &&
				((user.getFlag(defaults.MODULE, 'cards') &&
				user.getFlag(defaults.MODULE, 'cards').length < game.settings.get(defaults.MODULE, 'hand-size')) ||
				!user.getFlag(defaults.MODULE, 'cards'))
			).map(user => {
			return `<option value="${user._id}">${user.name}</option>`;
			} ) }
		</select>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: game.i18n.localize("MMI.confirm_button"),
				callback: () => {
					const newOwner = $('#pass-player-select').val();
					if(game.user.role === 4) {
						configHelpers.changePlayerOwner(cardId, newOwner, true);
					}
					else game.socket.emit('module.' + defaults.MODULE, {
						operation: 'changeCardOwner',
						data: {
							userId: newOwner,
							cardId: cardId
						}
					});
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
	
export const returnCard = (cardId) => {
	const card = getModifiedCard(cardId);
	
	let d = new Dialog({
		title: `${ game.i18n.localize("MMI.return") } "${ card.title.join(' ') }"`,
		content: `<p>${ game.i18n.format("MMI.return_note", { card: card.title.join(' ') }) }</p>`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: game.i18n.localize("MMI.confirm_button"),
				callback: () => {
					const deck = game.settings.get(defaults.MODULE, 'deck').map(c => {
						if(c._id === cardId) {
							return {
								...c,
								owner: ''
							}
						}
						return c
					});
					game.users.get(card.owner).setFlag(defaults.MODULE, 'cards', game.users.get(card.owner).getFlag(defaults.MODULE, 'cards').filter(c => c != cardId))
					game.settings.set(defaults.MODULE, 'deck', deck);
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