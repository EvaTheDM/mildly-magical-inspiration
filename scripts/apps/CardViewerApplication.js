import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { createView, SourceFactory, makeChoice } from '/modules/mmi/scripts/main.js';

export default class CardViewerApplication extends Application {
	constructor(options={}) {
		super(options);
	}

	makeUI(buttons = []) {
		return buttons.map(btn => {
			let [ label = '', dataAction = '', icon = '' ] = btn.split('.');
			icon = icon != '' ? `<i class="fas ${ icon }"></i>` : '';
			return {
				dataAction,
				icon,
				label
			}
		})
	}
	
	createData(type, options) {
		let cardData;
		const convertCard = (cardData) => {
			return {
				title: cardData.title.join('<br />'),
				subtitle: cardData.subtitle.join('<br />'),
				cost: cardData.cost.join(' '),
				duration: cardData.duration.join(' ')
			}
		}

		const makeObject = ({ cards, userId = '', username = '', ui = null, ...rest}) => {
			return {
				userId,
				username,
				cards: cards.length,
				controls: cards.length > 1,
				cardData: cards,
				ui: ui != null ? this.makeUI(ui) : [],
				...rest
			}
		}

		switch (type) {
			case 'gamemaster':
				// Doesn't receive any options for creating Data
				return {
					title: `Player Hands (Gamemaster View)`,
					data: game.users.filter(user => MMI.haveCards[user._id]).map(user => {
						cardData = MMI.activeDeck.filter(card => card.owner === user._id).map((card, key) => {
							return {
								...card,
								...convertCard(card),
								count: key + 1
							}
						});

						return makeObject({
							userId: user._id,
							username: user.name,
							cards: cardData,
							ui: [ 'Show Card.show-card', 'Pass Card.move-card', 'Take Card.return-card' ]
						})
					})
				}
			
			case 'preview':
				// receives two parameters, sourceId and cardId, which are both strings

				cardData = MMI.getSource(options.sourceId).cards.find(card => card._id === options.cardId);
				return {
					title: `${ cardData.title.join(' ') }`,
					data: [
						makeObject({
							cards: [{
								...cardData,
								...convertCard(cardData)
							}],
							preview: true
						})
					]
				}
			
			case 'fullDeck':
				// doesn't receive any options
				return {
					title: `All Cards`,
					data: [
						makeObject({
							cards: MMI.activeDeck.map((card, key) => {
								return {
									...card,
									...convertCard(card),
									count: key +1
								}
							})
						})
					]
				}
			
			case 'playerHands':
				// doesn't receive any options
				return {
					title: `Player Hands`,
					data: game.users.filter(user => MMI.haveCards[user._id] && user._id != game.user._id).map(user => {
						cardData = MMI.activeDeck.filter(card => card.owner === user._id).map((card, key) => {
							return {
								...card,
								...convertCard(card),
								count: key + 1
							}
						});

						return makeObject({
							userId: user._id,
							username: user.name,
							cards: cardData
						})
					})
				}
			
			case 'single':
				// receives a single parameter, userId
				return {
					title: `Player Hand`,
					data: [
						makeObject({
							userId: options.userId,
							username: game.users.get(options.userId).name,
							cards: MMI.activeDeck.filter(card => card.owner === options.userId).map((card, key) => {
								return {
									...card,
									...convertCard(card),
									count: key + 1
								}
							}),
							ui: [ 'Show Card.show-card', 'Pass Card.move-card', 'Use Card.use-card' ]
						})
					]
				}
			
			case 'award':
				// receives a single parameter, offer
				return {
					title: `Card Choice`,
					data: [
						makeObject({
							userId: game.user._id,
							cards: MMI.activeDeck.filter(card => options.offer.includes(card._id)).map((card, key) => {
								return {
									...card,
									...convertCard(card),
									count: key + 1
								}
							}),
							ui: [ 'Choose this Card!.choose-card' ]
						})
					]
				}

			default:
				return {}
		}
	}

	getData(options={}) {
		return {
			title: '',
			...this.createData(this.options.type, this.options.data),
			tabs: this.options.tabs.length,
			cardFront: MMI.cardFront
		};
	}
	
	activateListeners(html) {
		super.activateListeners(html);

		const title = html.parent().siblings('header').find('h4')
		title.text(title.text().replace('Replace', this.getData().title))
		
		if(this.options.focusCard === null && this.options.focusUser != null) this._tabs[0].activate(`userHand-${ this.options.focusUser }`, false);
		html.find('div.hand-wrapper').each((wrKey, wrapper) => {
			wrapper = $(wrapper);
			const ids = []
			wrapper.find('.card-wrapper:not([id=""])').each((k, c) => { ids.push($(c).prop('id')) })

			wrapper.find('.card-wrapper:not([id=""])').each(async (key, card) => {
				card = $(card);

				const source = this.options.data.sourceId ? MMI.getSource(this.options.data.sourceId).cards : MMI.activeDeck
				const cardData = source.find(c => c._id === card.prop('id'));
				if(card.prop('id')) {
					if(this.options.focusCard === card.prop('id')) {
						this?._tabs[0]?.activate(wrapper.data('tab'), false);
					}
					if(card.prop('id') === this.options.focusCard || (this.options.focusCard === null && key === 0)) card.show()
					if(cardData.description) {
						const des = await renderTemplate(`${DEFAULTS.templatePath}/partials/card-description.html`, { description: MMI.formatDescription(cardData.description) });
						// const b = $('<i class="fas fa-info-circle description-button"></i>');
						card.find('.card-wording').append(des);
						card.find('.description-button').on('click', () => {
							MMI.makeDialog({
								title: `Card Description: ${ cardData.title.join(' ') }`,
								content: `
									<p><strong>Card Description:</strong></p>
									${ MMI.formatDescription(cardData.description) }
								`
							})
						})
					}

					card.find('.card-switch').each((sKey, button) => {
						button = $(button)
						const direction = button.data('direction');
						const key = parseInt(button.data('current'));
						const maxKey = card.siblings().length;

						if(key === 0 && direction === 'prev') button.addClass('disabled');
						else if(key === maxKey && direction === 'next') button.addClass('disabled');
						else {
							button.removeClass('disabled');
							button.on('click', () => { this.switchCard({html, direction }) })
						}
					})
				}
			})

			if(this.getData().data[0].cards > 10) wrapper.find('.current-card-counter').each((key, cur) => {
				const original = $(cur).text();
				const curId = $(cur).prop('id');
				const input = $(`<input type="number" class="card-nav" value="${original}" id="${curId}" />`)
				$(cur).replaceWith(input);
				input
					.on('change', e => {
						const newCard = $(e.target).val();
						this.switchCard({html, nextCardId: html.find('.card-nav').eq(newCard - 1).prop('id') })
						$(e.target).val(original)
					})
			})
		})
		
		html.find('button.card-control').each((key, button) => {
			button.addEventListener('click', async () => {
				if(game.users.filter(user => user.active && user.role === 4).length > 0) {
					switch(button.dataset.action) {
						case 'show-card':
							this.showCard(button.name, game.user._id);
							break;
							
						case 'pass-card':
						case 'move-card':
							this.moveCard(button.name);
							break;
							
						case 'use-card':
							this.useCard(button.name, game.user._id);
							break;
							
						case 'return-card':
							this.returnCard(button.name);
							break;
							
						case 'choose-card':
							this.close();
							makeChoice(button.name, game.user._id, this.options.offer)
							break;
					}
				}
				else {
					switch(button.dataset.action) {
						case 'show-card':
							this.showCard(button.name, game.user._id);
							break;
						
						default:
							ui.notifications.error(`<b>Mildly Magical Inspiration:</b> You can't use this button while there is no Gamemaster logged in!`);
							break;
					}
				}
			});
		});
	}
	
	switchCard({html, direction = 'next', nextCardId = null }) {
		const current = html.find('div.card-wrapper:not([id=""]):visible');
		const next = nextCardId != null ? html.find(`div#${ nextCardId }.card-wrapper`) : direction === 'prev' ? current.prev() : current.next();
		current.hide();
		next.show();
	}

	async showCard(cardId, userId) {
		const cardData = MMI.activeDeck.find(card => card._id === cardId);
		const users = game.users.filter(user => user._id != userId && user.active);
		const html = await renderTemplate(`${DEFAULTS.templatePath}/partials/show-card.html`, {
			title: cardData.title.join(' '),
			users: users.map(user => {
				return { _id: user._id, name: user.name}
			})
		});

		const selEvent = (sel, b = true) => {
			switch ($(sel).prop('name')) {
				case 'show-all-players':
					sel.prop('checked', b);
					break;
			
				case 'show-players-select':
					sel.prop('checked', b).prop('disabled', b);
					break;
			}
		}

		MMI.makeDialog({
			title: `Show Card "${ cardData.title.join(' ') }"`,
			template: html,
			buttons: {
				show: {
					icon: 'fa-check',
					label: 'Show Card',
					callback: () => {
						const users = [];
						$('input[name=show-players-select]:checked').each((i, input) => {
							users.push(input.value);
						});
						MMI.socket('showCard', { users, cardId, sourceId: MMI.activeSource._id })
					}
				}
			},
			render: () => {
				const all = $('input[name=show-all-players]');
				const players = $('input[name=show-players-select]');
				
				selEvent(all)
				selEvent(players)
				
				all.on('change', event => {
					if(event.target.checked) selEvent(players, true);
					else selEvent(players, false);
				});
			}
		})
	}
	
	async useCard(cardId) {
		await SourceFactory.useCard(cardId);
	}
	
	async moveCard(cardId) {
		const cardData = MMI.activeDeck.find(card => card._id === cardId);
		MMI.makeDialog({
			title: `Pass Card: "${ cardData.title.join(' ') }"`,
			content: `<p>Select the player who should receive "${ cardData.title.join(' ') }"!</p>`,
			form: {
				name: 'pass-player-select',
				type: 'select',
				options: [
					{ value: '', label: 'Choose a Player' },
					...game.users.filter(user => MMI.haveCards[user._id] && user._id != cardData.owner).map(user => {
						return { value: user._id, label: `${ user.name }${ user.active ? ` (Online)` : '' }`, disabled: !MMI.checkHandSize(user._id) }
					})
				]
			},
			buttons: {
				confirm: {
					icon: 'fa-check',
					label: 'Confirm',
					callback: async html => {
						const newOwner = html.find('select[name="pass-player-select"]').val();

						await SourceFactory.awardCard(cardId, newOwner, null, { sender: game.user._id, change: 'passCard', cardId, newOwner });
						if(game.user.role === 4) createView({ type: 'gamemaster' }, { render: false, focusUser: cardData.owner })
					}
				}
			},
			render: html => { MMI.disableOnEmpty({ target: html.find('button.confirm'), operator: html.find('select[name="pass-player-select"]') }) }
		})
	}
		
	async returnCard(cardId) {
		const cardData = MMI.activeDeck.find(card => card._id === cardId);
		
		MMI.makeDialog({
			title: `Retake Card: "${ cardData.title.join(' ') }"`,
			content: `<p>Return the card "<em>${ cardData.title.join(' ') }</em>" to the deck?</p>`,
			buttons: {
				show: {
					icon: 'fa-check',
					label: 'Confirm',
					callback: async () => {
						await SourceFactory.awardCard(cardId, '');
						createView({ type: 'gamemaster' }, { render: false, focusUser: cardData.owner })
					}
				}
			}
		})
	}
}