import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { Combobox, exportSource, SourceFactory, createView } from '/modules/mmi/scripts/main.js';

/**
 * Form application to configure settings of the Deck.
 */
export default class DeckConfigApplication extends FormApplication {
	constructor(object={}, options={}) {
		super(object);
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: 'Mildly Magical Inspiration - Replace',
			id: "deck-config",
			template: './' + DEFAULTS.templatePath + '/deck-config.html',
			width: 800,
			height: 600,
			closeOnSubmit: false
		})
	}
	
	getData(options) {
		let obj;
		if('sourceId' in this.object) obj = MMI.getSource(this.object.sourceId);
		else obj = MMI.activeSource;

		obj.cards = obj.cards.map(card => {
			const title = card.title.join('\n');
			const subtitle = card.subtitle.join('\n');
			return {
				...card,
				title,
				subtitle,
				description: card.description.replace(/\n/g, '\n')
			}
		})

		return mergeObject(super.getData().object, obj);
	}
	
	async activateListeners(html) {
		super.activateListeners(html);

		const data = await this.getData();

		const header = html.parents('#deck-config').find('header h4');
		const replacer = data.isActive ? 'Active Source' : data.title;

		header.text(header.text().replace('Replace', replacer));

		if(this.object.hasOwnProperty('focus')) this.toggleCard(this.object.focus, 'show')

		if(data.cards.length === 0) {
			html.find('div#no-cards').removeClass('hide')
			html.find('ul.card-list').hide()
		}

		html
			.on('input', 'input[name!=search]:not(.select-listInput),textarea', (event) => { this.submit() })
			.on('click', 'button[name=export]', () => { exportSource(data._id) })
			.on('click', 'button[name=reset]', event => {
				if(data.isActive) this.replaceActive();
				else this.makeActive(data._id)
			});

		this.updateCardCount();
		if(data.isActive) {
			html.find('ul.card-list').addClass('active');
			html.find('div#no-cards').addClass('active');
			html.find('button[name=reset] label').text('Switch Active')
		}
		else {
			html.find('ul.card-list').removeClass('active');
			html.find('div#no-cards').removeClass('active');
			html.find('button[name=reset] label').text('Make Active')
		}

		html.find('nav.list-filters')
			.on('click', 'a.add', () => { this.addNewCard(html) })
			.on('input', 'input[name=search]', event => { this.filterCards(event.target.value, data, html) })
			.on('click', 'a.filter', event => { this.filterCards(event.target, data, html) })

		html.find('ul.card-list')
			.on('click', 'a.toggle-card', (event) => { this.toggleCard($(event.target).parents('li.card').prop('id')) })
			.on('click', 'a.card-control[data-action=preview]', (event) => { createView({ type: 'preview', data: { sourceId: data._id, cardId: event.target.parentNode.id } }) })
			.on('click', 'a.card-control[data-action=delete]', (event) => { this.deleteCard(event.target.parentNode.id) })
			.on('input', 'textarea[name$=".title"]', (event) => { this.updateCardTitle(event.target) })
			.on('input', 'textarea[data-resize="true"]', (event) => { this.resizeTextarea($(event.target)) });

		html.find('textarea[data-resize="true"]').each((key, input) => {
			this.resizeTextarea($(input))
			$(input).val($(input).val().replace(/\t/g, ''))
		});
		html.find('textarea:not([data-resize="true"])').each((key, input) => { $(input).val($(input).val().replace(/\t/g, '')) });

		html.find('.combobox').each(async (key, el) => {
			const id = $(el).prop('id');
			const type = duplicate(id).replace('[1]', '').split('.').find(t => t === 'owner' || t === 'cost' || t === 'duration')
			const cardData = MMI.getSource(this.getData()._id).cards.find(card => card._id === $(el).prop('id').split('.')[1]);
			let cbOptions;

			switch (type) {
				case 'owner':
					cbOptions = {
						items: [
							{ label: 'None', value: '' },
							...game.users.filter(user => MMI.haveCards[user._id]).map(user => { return { label: user.name, value: user._id } })
						],
						value: cardData.owner,
						restricted: true,
						hooksOnFocusOut: 'ownerFocusOut'
					}		
					break;
				
				case 'cost':
				case 'duration':
					cbOptions = {
						items: this.getDefaults(type),
						value: cardData[type][1],
						showEmpty: false,
						hooksOnInput: 'cdOnInput',
						hooksOnMouseDown: 'cdOnInput'
					}
					break;
			}

			if((type === 'owner' && this.getData().isActive) || type === 'cost' || type === 'duration') await Combobox({
				parent: `#${ this.options.id } section.window-content`,
				id,
				...cbOptions
			});
		})

		Hooks.on('ownerFocusOut', async () => {
			await this.submit();
			
			this.updateCardCount();
		})

		Hooks.on('cdOnInput', async (combobox, updateItems) => {
			const type = combobox.prop('id').replace('[1]', '').split('.').pop();
			await this.submit();
			
			updateItems(this.getDefaults(type));
		})
	}

	getDefaults(type) {
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

		const custom = MMI.getSource(this.getData()._id).cards.map(card => { return card[type][1] });

		return [...new Set([...defaults[type], ...custom])].sort();
	}

	replaceActive() {
		const sources = MMI.sources;
		const curent = MMI.getSource(this.getData()._id);

		MMI.makeDialog({
			title: `Change Active Source`,
			content: `
			<p class="notes">Change the active deck? <b>WARNING:</b> This will recall all cards from your player's hands!</p>
			`,
			form: {
				name: 'source-choices',
				type: 'select',
				options: sources.filter(source => source._id != curent._id && source.cards.length > 0).map(source => {
					return { value: source._id, label: source.title };
				})
			},
			buttons: {
				choose: {
					icon: 'fa-check',
					label: 'Make Active Source',
					callback: async () => {
						// await SourceFactory.changeActive($('select[name="source-choices"]').val());
						// for (const user of game.users) {
						// 	MMI.clearQueue('multipleChoice', user._id)
						// }
						// new DeckConfigApplication().render(true);
						// Hooks.call('rerenderSourceConfig')
						this.activateSource($('select[name="source-choices"]').val());
					}
				}
			}
		})
	}
	
	async makeActive(newActive) {
		MMI.makeDialog({
			title: `Make Active Source`,
			content: `
			<div style="height: 100px; padding-top: 10px; padding-bottom: 10px;">
			<p class="notes">Make this the active source/deck?</p>
			<p class="notes"><b>WARNING:</b> This will recall all cards from your player's hands!</p>
			</div>
			`,
			buttons: {
				choose: {
					icon: 'fa-check',
					label: 'Make Active Source',
					callback: async () => {
						// await SourceFactory.changeActive(newActive);
						// new DeckConfigApplication().render(true);
						// Hooks.call('rerenderSourceConfig')
						this.activateSource(newActive);
					}
				}
			}
		})
	}

	async activateSource(newSourceId) {
		await SourceFactory.changeActive(newSourceId);
		for (const user of game.users) {
			await MMI.clearQueue('multipleChoice', user._id)
		}
		return true;
	}

	async filterCards(filter, data, html) {
		let li, i, card
		const source = this.getData();
		
		const swArr = [ { text: 'Show All', filter: 'default'}, { text: 'Included Only', filter: 'true'}, { text: 'Excluded Only', filter: 'false'} ];
		li = html.find('li.card');
		li.each((key, card) => {
			this.toggleCard(card.id, 'hide')
		});
		
		if(filter.tagName) {
			if(filter.classList.contains('switch')) {
				const switchButton = html.find('nav.list-filters a.switch');
				switch(switchButton.data('filter')) {
					case 'default':
						switchButton.text(swArr[1].text);
						switchButton.data('filter', swArr[1].filter);
						break;
					
					case 'true':
						switchButton.text(swArr[2].text);
						switchButton.data('filter', swArr[2].filter);
						break;
					
					case 'false':
						switchButton.text(swArr[0].text);
						switchButton.data('filter', swArr[0].filter);
						break;
				}
			}
			else {
				html.find('nav.list-filters a.filter:not(.switch)').each((key, button) => {
					button.classList.remove('active');
				});
				filter.classList.add('active');
			}
		}
		
		const activeFilter = {
			include: html.find('nav.list-filters a.switch').data('filter'),
			owner: html.find('nav.list-filters a.filter.active:not(.switch)').data('filter'),
			search: html.find('nav.list-filters input').val()
		}
		
		const filterThis = (card) => {
			let show = true;
			
			if(activeFilter.include === 'true' && !card.include) show = false;
			else if(activeFilter.include === 'false' && card.include) show = false;
			
			if(activeFilter.owner === 'owned' && !card.owner) show = false;
			else if(activeFilter.owner === 'available' && card.owner) show = false;

			if (card.title.toUpperCase().indexOf(activeFilter.search.toUpperCase()) > -1 ||
				card.subtitle.toUpperCase().indexOf(activeFilter.search.toUpperCase()) > -1 ||
				card.description.toUpperCase().indexOf(activeFilter.search.toUpperCase()) > -1 ||
				card.cost[1].toUpperCase().indexOf(activeFilter.search.toUpperCase()) > -1 ||
				card.duration[1].toUpperCase().indexOf(activeFilter.search.toUpperCase()) > -1
			) {}
			else show = false;
			
			return show;
		}
		
		const filterNot = (card) => {
			return !filterThis(card);
		}
		
		const cards = {
			show: source.cards.filter(filterThis),
			hide: source.cards.filter(filterNot)
		};
		
		cards.show.forEach(card => html.find(`li#${card._id}.card`).show());
		cards.hide.forEach(card => html.find(`li#${card._id}.card`).hide());
		
		const noCards = (state) => {
			const ul = html.find('ul.card-list');
			const no = html.find('div#no-cards');
			const op = state === 'show' ? 'hide' : 'show';
			
			ul[op]();
			switch(state) {
				case 'show':
					no.removeClass('hide');
					break;
					
				case 'hide':
					no.addClass('hide');
					break;
			}
		}
		
		if(cards.show.length === 0) noCards('show');
		else noCards('hide');
	}

	updateCardCount() {
		const cards = MMI.getSource(this.getData()._id).cards;
		const html = $('#deck-config section.window-content');
		html.find('nav.list-filters a.filter:not(.switch) span').each((key, counter) => {
			const filter = $(counter).parent('a').data('filter');
			const c = $(counter);
			
			switch(filter) {
				case 'all':
					c.text(cards.length)
					break;
				
				case 'owned':
					c.text(cards.filter(card => card.owner).length)
					break;
				
				case 'available':
					c.text(cards.filter(card => !card.owner).length)
					break;
			}
		});
	}
	
	toggleCard(cardId, fixed = 'toggle') {
		const html = $(`#${ this.options.id }`);
		if(cardId) {
			const cardDetails = html.find(`li#${ cardId } div.card-details`)
			const button = html.find(`li#${ cardId } a.toggle-card i`)
			
			switch(fixed) {
				case 'hide':
					cardDetails.hide();
					button.removeClass('fa-angle-down');
					button.addClass('fa-angle-up');
					break;
				
				case 'show':
					cardDetails.show();
					button.removeClass('fa-angle-up');
					button.addClass('fa-angle-down');
					break;
				
				default:
					cardDetails.toggle();
					button.toggleClass("fa-angle-down");
					button.toggleClass("fa-angle-up");
					break;
			}
		}
	}

	resizeTextarea(input) {
		const lines = input.val().split(/\r?\n/g);
		input.css('height', `${(16 * lines.length) + 10}px`);
	}
	
	updateCardTitle(input) {
		const value = $(input).val();
		const unnamed = $('<em>Unnamed Card</em>');
		const header = $(input).parents('li.card').find('label.header-title');
		
		header.text(value);
		if(!value) header.append(unnamed);
	}

	async addNewCard(html) {
		const data = await this.getData();
		const card = await SourceFactory.createCard({}, data._id);
		new DeckConfigApplication({ sourceId: data._id, focus: card._id }).render(true);
	}
	
	async deleteCard(cardId) {
		const data = await this.getData();
		const card = SourceFactory.getCard(data._id, cardId);
		
		MMI.makeDialog({
			title: `Delete Card: "${ card.title.join(' ') }"`,
			content: `<p>Are you sure you want to delete the card <em>${ card.title.join(' ') || 'Unnamed Card' }</em>? This cannot be reversed!</p>`,
			buttons: {
				choose: {
					icon: 'fa-check',
					label: 'Delete Card',
					callback: async () => {
						const source = await SourceFactory.removeCard(data._id, cardId)
						new DeckConfigApplication({ sourceId: data._id }).render(true);
					}
				}
			}
		})
	}
	
	async _updateObject(event, formData) {
		const keys = Object.keys(duplicate(formData)).filter(key => key != 'search')
		let result = { cards: [] };
		let sourceId;

		for (const field of keys) {
			const fieldData = field.split('.');
			const value = duplicate(formData[field]);
			const key = fieldData.pop();
			const id = fieldData.pop();
			const type = fieldData[0];

			switch (type) {
				case 'source':
					sourceId = sourceId || id
					if(key === 'isActive') result[key] = value === 'false' ? false : true;
					else result[key] = value
					break;
					
					case 'cards':
					if(!(result.cards.find(card => card._id === id))) result.cards.push({ _id: id })
					if(key.includes('[0]') || key.includes('[1]')) result.cards.find(card => card._id === id)[key.replace(/\[[0-9]\]/g, '')] = [ formData[`${ type }.${ id }.${ key.replace(/\[[0-9]\]/g, '') }[0]`], formData[`${ type }.${ id }.${ key.replace(/\[[0-9]\]/g, '') }[1]`]]
					else result.cards.find(card => card._id === id)[key] = value
					break;
			}
		}

		await SourceFactory.update(sourceId, result)
	}
}