import * as defaults from '../defaults.js';
import * as deckhelpers from '../helpers/DeckConfigHelpers.js';
import * as helpers from '../helpers/SourceConfigHelpers.js';

/**
 * Form application to configure settings of the Deck.
 */
export default class SourceConfigApplication extends FormApplication {
	constructor(object={}, options={}) {
		super(object);
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: game.i18n.localize("MMI.config_title"),
			id: "source-config",
			template: './' + defaults.TEMPLATE_PATH + '/source-config.html',
			width: 800,
			height: "auto",
			closeOnSubmit: false,
			submitOnChange: false
		})
	}
	
	getData(options) {
		return mergeObject(super.getData().object, {
			sources: game.settings.get(defaults.MODULE, 'sources')
		});
	}
	
	activateListeners(html) {
		super.activateListeners(html);
		
		html.find('a#add-new').on('click', () => this.addSource);
		
		html.find('a.source-control').each((key, button) => {
			if(button.dataset.action === 'add') button.addEventListener('click', () => this.sourceDialog({ title: false, jsonData: false, id: randomID(16)}));
			if(button.dataset.action === 'edit') button.addEventListener('click', () => {
				const source = game.settings.get(defaults.MODULE, 'sources').find(source => source._id === button.id);
				this.sourceDialog({ title: source.title, jsonData: source.cards, id: source._id});
			});
			if(button.dataset.action === 'delete') button.addEventListener('click', () => this.deleteSource(button.id));
		});
	}
	
	sourceDialog({ title, jsonData, id}) {
		let addButtons = {};
		if(title) addButtons.two = {
			icon: '<i class="fas fa-file-download"></i>',
			label: game.i18n.localize("MMI.source_export"),
			callback: () => {
				const form = $('div#edit-source-form')
				deckhelpers.export(form.data('sourceid'))
			}
		}
		
		let d = new Dialog({
			title: game.i18n.localize("MMI.title_full") + ' - ' + game.i18n.localize("MMI.edit_source"),
			content: `
			${ title ? `<p>${ game.i18n.localize("MMI.selected_source") }: <em>${ title }</em></p>` : '' }
			<div data-sourceid="${ id }" id="edit-source-form">
				<div class="form-group">
					<label>${ game.i18n.localize("MMI.source_label") }:</label>
					<input type="text" class="input" name="title" placeholder="${ game.i18n.localize("MMI.source_label") }" value="${ title ? title : '' }" style="flex: 15;" />
				</div>
				<div class="form-group">
					<label>${ game.i18n.localize("MMI.source_json_data") }:</label>
					<div class="flexcol">
						${ title ? '' : `<input type="file" name="jsonDataFile" accept=".csv, .json">` }
						<textarea rows="10" class="input" name="jsonData" placeholder="${ game.i18n.localize("MMI.source_json_data") }" style="flex: 15;">${ jsonData ? JSON.stringify(jsonData.map(card => {
							const keys = Object.keys(card);
							const req = ['subtitle', 'title'];
							const opt = ['cost', 'description', 'duration', 'include'];
							let c = {};
							keys.filter(key => req.includes(key) || opt.includes(key)).map(key => {
								c[key] = card[key]
							})
							return c
						}), null, 2) : '' }</textarea>
					</div>
				</div>
			</div>
			`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: title ? game.i18n.localize("MMI.source_update") : game.i18n.localize("MMI.source_add"),
					callback: async () => {
						const form = $('div#edit-source-form')
						const formData = {
							_id: form.data('sourceid'),
							title: form.find('input[name=title]').val()
						}
						
						let errors = [];
						let e
						let json;
						
						if(form.find('input[name=jsonDataFile]').length) {
							if(form.find('input[name=jsonDataFile]').prop('files').length > 0) {
								const fileData = form.find('input[name=jsonDataFile]').prop('files')[0];
								const input = await readTextFromFile(fileData);
								if(fileData.name.slice(-4) === '.csv') {
									json = helpers.csvToJson(input);
								} else json = input;
							}
						}
						else json = form.find('textarea[name=jsonData]').val();
						
						if(!formData.title) {
							e = 'Please enter a title for your new deck!'
							if(!errors.includes(e)) errors.push(e);
						}
						else if(helpers.checkJSON(json)) {
							const valJSON = JSON.parse(json);
							
							if(!Array.isArray(valJSON)) {
								e = 'Your JSON-Data doesn not have the correct format!'
								if(!errors.includes(e)) errors.push(e);
							}
							else {
								formData.cards = valJSON.map(card => {
									const keys = Object.keys(card);
									const req = ['subtitle', 'title']
									const opt = ['cost', 'description', 'duration', 'include']
									
									if(req.every(i => keys.includes(i))) {
										const n = keys.filter(key => req.includes(key) || opt.includes(key)).map(key => {
											if(key === 'cost' || key === 'duration') {
												if(!Array.isArray(card[key])) {
													e = 'Cost/Duration are not valid arrays!';
													if(!errors.includes(e)) errors.push(e);
													return false;
												}
											}
											return { [key]: card[key] }
										}).reduce((acc, cur) => {
											return Object.assign(acc, cur);
										}, {});
										
										opt.forEach(opt => {
											if(!keys.includes(opt)) {
												if(opt === 'include') n[opt] = true;
												if(opt === 'cost') n[opt] = ['', 'Free Action'];
												if(opt === 'duration') n[opt] = ['', 'Instantaneous'];
												if(opt === 'description') n[opt] = '';
											}
										})
										
										n._id = randomID(16);
										n.owner = '';
										return n
									} else {
										e = 'Cards don\'t include all required keys!';
										if(!errors.includes(e)) errors.push(e);
										return false
									}
								});
								
								if(errors.length === 0) {
									let allSources = game.settings.get(defaults.MODULE, 'sources');
									if(title) allSources = allSources.map(source => {
										if(source._id === formData._id) return formData;
										else return source;
									});
									else allSources.push(formData);
									game.settings.set(defaults.MODULE, 'sources', allSources);
								}
							}
						} else {
							e = 'You didn\'t enter valid JSON data!';
							if(!errors.includes(e)) errors.push(e);
						}
						errors.forEach(err => ui.notifications.error(err));
					}
				},
				...addButtons,
				three: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize("MMI.cancel_button"),
					callback: () => this.render(true)
				}
			},
			default: "three",
			render: html => {
				html.find('div#edit-source-form input[name=jsonDataFile]').on('change', (event) => {
					//prop('files')[0].name
					let fileName = event.target.files[0].name;
					if(fileName.slice(-4) === '.csv') fileName = fileName.slice(0,-4);
					else fileName = fileName.slice(0, -5)
					const titleInput = html.find('div#edit-source-form input[name=title]')
					if(!titleInput.val()) titleInput.val(fileName);
				});
			}
		}, {
			width: 800
		});
		d.render(true);
		this.close();
	}
	
	deleteSource(sourceId) {
		let d = new Dialog({
			title: game.i18n.localize("MMI.title_full") + ' - ' + game.i18n.localize("MMI.delete_source"),
			content: `<p>${ game.i18n.localize("MMI.delete_question") } <em>${ game.settings.get(defaults.MODULE, 'sources').find(source => source._id === sourceId).title }</em>?</p>`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("MMI.delete_source"),
					callback: () => {
						game.settings.set(defaults.MODULE, 'sources', game.settings.get(defaults.MODULE, 'sources').filter(source => source._id != sourceId))
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
	
	async _updateObject(event, formData) {
		
	}
	
	close(options){
		super.close(options);
		
		//
	}
}