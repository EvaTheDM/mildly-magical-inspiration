import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { validate, SourceFactory } from '/modules/mmi/scripts/main.js';

import DeckConfigApplication from '/modules/mmi/scripts/apps/DeckConfigApplication.js';

/**
 * Form application to configure settings of the Deck.
 */
export default class SourceConfigApplication extends FormApplication {
	constructor(object={}, options={}) {
		super(object);
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: 'Mildly Magical Inspiration - Source Configuration',
			id: "source-config",
			template: './' + DEFAULTS.templatePath + '/source-config.html',
			width: 800,
			height: "auto",
			closeOnSubmit: false,
			submitOnChange: false
		})
	}
	
	getData(options) {
		return mergeObject(super.getData().object, {
			sources: MMI.sources
		});
	}
	
	async activateListeners(html) {
		super.activateListeners(html);

		html.on('click', 'a.source-control', async (event) => {
			const sourceId = $(event.target).parent().prop('id');
			const actionType = $(event.target).parents('a.source-control').data('action') || $(event.target).data('action');

			switch(actionType) {
				case 'add':
					this.addSource();
					break;
				
				case 'edit':
					this.openSource(sourceId);
					break;
				
				case 'delete':
					this.deleteSource(sourceId)
					break;
			}
		});

		this.markActive(html);
	}

	markActive(html) {
		const activeSource = html.find('ul.source-list li.isActive label');

		const newEl = $('<span></span>');
		newEl.css('font-weight', 'bold');
		newEl.css('font-style', 'italic');
		newEl.text(` (Curently Active)`);

		activeSource.append(newEl);
	}

	reloadApp() {
		new SourceConfigApplication().render(true);
	}
	
	addSource() {
		MMI.makeDialog({
			title: 'Add a new Source',
			content: `<p>To use a pre-existing source upload a source-file from your harddrive. The uploader only accepts JSON-files!</p>`,
			form: {
				name: 'MMI-NewSourceUpload',
				type: 'file',
				options: { accept: '.json' }
			},
			buttons: {
				fromFile: {
					icon: 'fa-file-import',
					label: 'Create Source from File',
					callback: async () => { this.createFromFile($('input[name=MMI-NewSourceUpload]').prop('files')[0]) }
				},
				newSource: {
					icon: 'fa-forward',
					label: 'Skip Uploader',
					callback: () => { this.createSource() }
				}
			},
			def: 'newSource',
			render: html => { MMI.disableOnEmpty({ target: html.find('button.fromFile'), operator: html.find('input[name="MMI-NewSourceUpload"]') }) }
		})
	}
	
	async createFromFile(fileData) {
		const fileName = fileData.name.split('.');
		fileName.pop();
		const fileContent = await readTextFromFile(fileData);
		
		let valJSON;
		if(validate.json(fileContent)) valJSON = JSON.parse(fileContent);
		const validated = validate.source(valJSON);
		
		if(validated) {
			if(!validated.title) validated.title = fileName.join(' ');
			this.createSource(validated);
		}
	}
	
	async createSource(data = { title: 'New Source' }) {
		const newSource = await SourceFactory.create(data);
		this.reloadApp();
		this.openSource(newSource._id);
	}
	
	openSource(sourceId) {
		new DeckConfigApplication({ sourceId }).render(true);
	}
	
	async deleteSource(sourceId) {
		const source = MMI.getSource(sourceId);
		MMI.makeDialog({
			title: `Delete Source: ${ source.title }`,
			content: `<p>Are you sure you want to delete the source <em>${ source.title }</em>?</p>`,
			buttons: {
				delete: {
					icon: 'fa-check',
					label: 'Delete Source',
					callback: async () => {
						await SourceFactory.removeSource(sourceId);
						this.reloadApp();
					}
				}
			}
		})
	}
	
	async _updateObject(event, formData) {
		//
	}
}

Hooks.on('rerenderSourceConfig', () => {
	Object.keys(ui.windows).forEach(key => {
		if(ui.windows[key] instanceof SourceConfigApplication) new SourceConfigApplication().render(true);
	})
})