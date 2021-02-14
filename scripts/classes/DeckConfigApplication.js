import * as moddefaults from '../defaults.js';
import { getModifiedDeck, getOptions, getModifiedCard } from '../helpers/helpers.js';
import * as helpers from '../helpers/DeckConfigHelpers.js';
import createView from '../helpers/openView.js';
/**
 * Form application to configure settings of the Deck.
 */
export default class DeckConfigApplication extends FormApplication {
	constructor(object={}, options={}) {
		super(object);
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: game.i18n.localize("MMI.config_title"),
			id: "deck-config",
			template: './' + moddefaults.TEMPLATE_PATH + '/deck-config.html',
			width: 800,
			height: "auto",
			closeOnSubmit: false,
			submitOnChange: true
		})
	}
	
	getData(options) {
		return mergeObject(super.getData().object, {
			count: {
				all: game.settings.get(moddefaults.MODULE, 'deck').length,
				owned: game.settings.get(moddefaults.MODULE, 'deck').filter(card => card.owner).length,
				available: game.settings.get(moddefaults.MODULE, 'deck').filter(card => !card.owner).length
			},
			deck: game.settings.get(moddefaults.MODULE, 'deck'),
			players: game.users.filter(user => user.role < 4).reduce((map, obj) => {
				map[obj._id] = obj.name
				return map;
			}, {})
		});
	}
	
	activateListeners(html, first = true) {
		super.activateListeners(html);
		
		if(first) {
			html.find('nav.list-filters input[name=search]').on('input', event => this.filterCards(event.target.value, html));
			html.find('nav.list-filters a.add').on('click', () => this.addNewCard(html));
			
			html.find('nav.list-filters a.filter').each((key, button) => {
				button.addEventListener('click', () => this.filterCards(button, html, true));
			});
			
			html.find('button[name=export]').on('click', event => helpers.exportDeck());
			
			html.find('button[name=reset]').on('click', event => this.resetDeck());
		}
		
		this.updateSelect('cost');
		this.updateSelect('duration');
		
		let ranFocusOut = false;
		
		$('div.select-wrapper').each((index, el) => {
			const parent = '#' + el.id;
			$(parent).find('a.select-dropdown')
				.on('mousedown', () => {
					ranFocusOut = false;
				})
				.on('click', (event) => {
					if(!ranFocusOut) $(parent).find('input.select-listInput').focus();
				});
			
			$(parent).find('input.select-listInput')
				.on('focus', (input) => {
					this.searchSelect(input);
					$(parent).find('.select-inputWrapper').css('border-radius', '3px 3px 0 0')
					$(parent).find('input.select-listInput').css('border-radius', '3px 3px 0 0')
					$(parent).find('ul.custom-select').slideDown('fast');
				})
				.on('focusout', () => {
					ranFocusOut = true;
					$(parent).find('ul.custom-select').slideUp('fast', () => {
						$(parent).find('.select-inputWrapper').css('border-radius', '3px')
						$(parent).find('input.select-listInput').css('border-radius', '3px')
					})
				});
			
			$(parent).find('ul.custom-select').on('mousedown', 'li', (event) => {
				const [type, x, cardId] = event.delegateTarget.id.split('.');
				$(parent).find('input.select-listInput[name="deck.' + cardId + '.' + type + '[1]"]').val(event.target.innerText);
				this.updateTextFields(cardId, type + '[1]', event.target.innerText, html)
			});
		});
		
		html.find('a.toggle-card').each((key, button) => {
			if(!button.dataset.event) {
				button.parentElement.addEventListener('click', () => this.toggleCard(html, button.id, button));
				button.dataset.event = 'true';
			}
		});
		
		html.find('a.card-control').each((key, button) => {
			if(button.dataset.action === 'preview' && !button.dataset.event) {
				button.addEventListener('click', () => createView('preview', { cardId: button.id }));
				button.dataset.event = 'true';
			}
			if(button.dataset.action === 'delete' && !button.dataset.event) {
				button.addEventListener('click', () => this.deleteCard(button.id));
				button.dataset.event = 'true';
			}
		});
		
		html.find('input[type=text][name!=search],[type=number]').each((key, input) => {
			if(!input.dataset.event) {
				input.addEventListener('input', () => {
					this.updateTextFields(input.name.split(".")[1], input.name.split(".")[2], input.value, html)
				});
				input.dataset.event = 'true';
			}
		});
		
		html.find('textarea').each((key, input) => {
			if(input.name.split(".")[2] === 'subtitle' || input.name.split(".")[2] === 'title') input.style.height = ((16 * input.value.split(/\r?\n/g).length) + 10) + 'px';
			if(!input.dataset.event) {
				input.addEventListener('input', () => {
					if(input.name.split(".")[2] === 'subtitle' || input.name.split(".")[2] === 'title') input.style.height = ((16 * input.value.split(/\r?\n/g).length) + 10) + 'px';
					this.updateTextFields(input.name.split(".")[1], input.name.split(".")[2], input.value, html)
				});
				input.dataset.event = 'true';
			}
		});
	}
	
	searchSelect(input) {
		const target = input instanceof jQuery ? input.val() : input.target.value;
		let li = $('ul.custom-select li')
		
		for (let i = 0; i < li.length; i++) {
			if (li[i].textContent.toUpperCase().indexOf(target.toUpperCase()) > -1) {
				li[i].style.display = "";
			} else {
				li[i].style.display = "none";
			}
		}
	}
	
	updateSelect(type) {
		const html = $('div#deck-config form');
		const ul = html.find('ul.custom-select.' + type);
		const defaults = {
			cost: [
				'Action',
				'Bonus Action',
				'Reaction'
			],
			duration: [
				'Instantaneous',
				'Round',
				'Rounds',
				'Minute',
				'Minutes',
				'Hours',
				'Days'
			]
		};
		const added = game.settings.get(moddefaults.MODULE, 'deck').map(card => {
			return card[type][1];
		}).filter(value => value);
		
		const newValues = [...new Set(defaults[type].concat(added))].sort();
		
		ul.each((index, el) => {
			let thUL = $(el);
			const cardId = thUL.prop('id').split('.')[2];
			const input = html.find('input[name="deck.' + cardId + '.' + type + '[1]"]');
			for(let i = 0; i < newValues.length; i++) {
				let newEl = $('<li></li>');
				newEl.data('select-id', cardId);
				newEl.text(newValues[i]);
				
				if(i === 0) thUL.empty();
				thUL.append(newEl);
			}
		});
	}
	
	updatePlayerNumbers() {
		const html = $('#deck-config section.window-content');
		html.find('nav.list-filters a.filter span').each((key, counter) => {
			if(counter.classList.contains('count-owned')) counter.innerText = game.settings.get(moddefaults.MODULE, 'deck').filter(card => card.owner).length;
			if(counter.classList.contains('count-available')) counter.innerText = game.settings.get(moddefaults.MODULE, 'deck').filter(card => !card.owner).length;
		});
		const activeFilter = html.find('nav.list-filters a.filter.active')[0];
		if(activeFilter.dataset.filter != 'all') this.filterCards(activeFilter, html, true);
	}
	
	toggleCard(html, cardId, button) {
		html.find('li#' + cardId + ' div.card-details').toggle();
		button.children[0].classList.toggle("fa-angle-down");
		button.children[0].classList.toggle("fa-angle-up");
	}
	
	updateTextFields(cardId, key, value, html) {
		this.submit();
		if(key === 'title') {
			html.find(`label#${ cardId }.header-title`)[0].innerText = value.split(/\r?\n/g).join(' ');
		}
	}
	
	filterCards(filter, html, toggleOwner = false) {
		let li, i, card
		const { deck } = this.getData();
		li = html.find('li.card');
		
		for (i = 0; i < li.length; i++) {
			card = deck.find(card => card._id === li[i].id);
			if(toggleOwner) {
				html.find('nav.list-filters a.filter').each((key, button) => {
					button.classList.remove('active');
				});
				switch(filter.dataset.filter) {
					case 'all':
						li[i].style.display = "";
						break;
					
					case 'owned':
						if(card.owner) li[i].style.display = "";
						else li[i].style.display = "none";
						break;
					
					case 'available':
						if(!card.owner) li[i].style.display = "";
						else li[i].style.display = "none";
						break;
				}
				filter.classList.add('active');
			}
			else {
				if (card.title.toUpperCase().indexOf(filter.toUpperCase()) > -1 ||
					card.subtitle.toUpperCase().indexOf(filter.toUpperCase()) > -1 ||
					card.description.toUpperCase().indexOf(filter.toUpperCase()) > -1 ||
					card.cost[1].toUpperCase().indexOf(filter.toUpperCase()) > -1 ||
					card.duration[1].toUpperCase().indexOf(filter.toUpperCase()) > -1) {
					li[i].style.display = "";
				} else {
					li[i].style.display = "none";
				}
			}
		}
	}
	
	async addNewCard(html) {
		const newId = randomID(16);
		const { activationCost, effectDuration } = this.getData();
		const currentArray = game.settings.get(moddefaults.MODULE,'deck');
		const newArray = [
			{
				_id: newId,
				title: '',
				subtitle: '',
				description: '',
				cost: ['', 0],
				duration: ['', 0],
				include: true
			},
			...currentArray
		];
		await game.settings.set(moddefaults.MODULE, 'deck', newArray);
		
		const form = helpers.cardItem(newId, activationCost, effectDuration);
		html.find('ul.card-list').prepend(form);
		this.activateListeners(html, false);
	}
	
	deleteCard(cardId) {
		const card = getModifiedCard(cardId);
		
		let d = new Dialog({
			title: game.i18n.localize("MMI.title_full") + ' - ' + game.i18n.localize("MMI.delete_card"),
			content: `<p>${ game.i18n.localize("MMI.delete_question") } <em>${ card.title }</em>?</p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("MMI.delete_card"),
					callback: () => {
						helpers.changePlayerOwner(cardId);
						game.settings.set(moddefaults.MODULE, 'deck', game.settings.get(moddefaults.MODULE, 'deck').filter(card => card._id != cardId))
					}
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize("MMI.cancel_button"),
					callback: () => this.render(true)
				}
			},
			default: "two"
		});
		d.render(true);
		this.close();
	}
	
	resetDeck() {
		let d = new Dialog({
			title: game.i18n.localize("MMI.title_full") + ' - ' + game.i18n.localize("MMI.load_deck"),
			content: `
			<p class="notes">${ game.i18n.localize("MMI.load_note") }</p>
			<label style="padding-top: 10px;">${ game.i18n.localize("MMI.load_available") }:</label>
			<select class="player-select" name="deckReset" style="margin-bottom: 10px;">
				${ game.settings.get(moddefaults.MODULE, 'sources').map((source, key) => {
					return `<option value="${key}">${source.title}</option>`
				}).join('') }
			</select>
			`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("MMI.load_replacement"),
					callback: () => {
						game.users.forEach(user => {
							user.setFlag(moddefaults.MODULE,'cards', []);
						});
						game.settings.set(moddefaults.MODULE, 'deck', game.settings.get(moddefaults.MODULE, 'sources')[Number.parseInt($('select[name=deckReset]').val())].cards);
					}
				},
				two: {
					icon: '<i class="fas fa-plus"></i>',
					label: game.i18n.localize("MMI.load_additive"),
					callback: () => {
						const current = game.settings.get(moddefaults.MODULE, 'deck');
						const newCards = game.settings.get(moddefaults.MODULE, 'sources')[Number.parseInt($('select[name=deckReset]').val())].cards;
						game.settings.set(moddefaults.MODULE, 'deck', [
							...current,
							...newCards
						]);
					}
				},
				three: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize("MMI.cancel_button")
				}
			},
			default: "three"
		}, {
			width: 500
		});
		d.render(true);
		this.close();
	}
	
	async _updateObject(event, formData) {
		const keys = Object.keys(formData).filter(f => f != 'search');
		let nObj = [];
		
		function doesCardExist(cardId, myArray) {
			for (var i=0; i < myArray.length; i++) {
				if (myArray[i]._id === cardId) return myArray[i];
			}
		}
		
		for (const key of keys) {
			const s = key.split('.');
			if(doesCardExist(s[1], nObj)) {
				const i = Object.keys(nObj).find(key => nObj[key]._id === s[1]);
				
				if(!nObj[i].cost) nObj[i].cost = [];
				if(!nObj[i].duration) nObj[i].duration = [];
				
				if(s[2] === 'cost[0]' || s[2] === 'cost[1]') nObj[i].cost.push(formData[key]);
				else if(s[2] === 'duration[0]' || s[2] === 'duration[1]') nObj[i].duration.push(formData[key]);
				else if(s[2] === 'owner') {
					await helpers.changePlayerOwner(s[1], formData[key]);
					nObj[i][s[2]] = formData[key];
				}
				else nObj[i][s[2]] = formData[key];
			}
			else {
				if(s[2] != '_id') nObj.push({
					'_id': s[1],
					[s[2]]: formData[key]
				});
				else nObj.push({
					'_id': s[1]
				});
			}
		};
		await game.settings.set(moddefaults.MODULE, 'deck', nObj);
		if(event.type === 'submit') {
			const cardId = $(event.explicitOriginalTarget).data('select-id');
			const type = $(event.explicitOriginalTarget).data('select-type');
			if(cardId && type) {
				if(type === 'cost' || type === 'duration') this.updateSelect(type);
				this.searchSelect($('input.select-listInput[name="deck.' + cardId +'.' + type +'[1]"]'));
			}
		}
		this.updatePlayerNumbers();
	}
	
	close(options){
		super.close(options);
		
		//
	}
}