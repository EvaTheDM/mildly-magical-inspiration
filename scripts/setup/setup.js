import * as defaults from '../defaults.js';
import * as helpers from '../helpers/SourceConfigHelpers.js';

export default () => {
	let d = new Dialog({
		title: game.i18n.localize("MMI.title_full") + " - " + game.i18n.localize("MMI.first_setup"),
		content: `
		<form id="inspirationdeck-setup" autocomplete="off" onsubmit="event.preventDefault();" style="height: 100%;" class="flexcol">
			<p>${ game.i18n.localize("MMI.welcome_note") }</p>
			<div id="upload-fields" style="flex: 50;">
				<b>${ game.i18n.localize("MMI.source_files") }:</b>
				<div class="form-group">
					<label><em>(Source)</em></label>
					<input type="file" name="jsonDataFile" accept=".csv, .json">
				</div>
			</div>
			<div class="form-group">
				<label>Load as Deck:</label>
				<select name="source-deck">
					<option value="">None</option>
				</select>
			</div>
		</form>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: game.i18n.localize("MMI.begin_setup"),
				callback: async () => {
					const form = $('#inspirationdeck-setup form');
					const files = form.find('input[name=jsonDataFile]');
					const select = form.find('select[name=source-deck]');
					
					let errors = [];
					let e;
					let json = [];
					const formData = [];
					let deckId;
					let allSources = await game.settings.get(defaults.MODULE, 'sources');
					for(let i = 0; i < files.length - 1; i++) {
						const fileData = files[i].files[0];
						
						formData.push({
							_id: randomID(16)
						});
						const input = await readTextFromFile(fileData);
						if(fileData.name == select.val()) deckId = formData[i]._id;
						if(fileData.name.slice(-4) === '.csv') {
							json.push(helpers.csvToJson(input));
							formData[i].title = fileData.name.slice(0,-4);
						}
						else {
							json.push(input);
							formData[i].title = fileData.name.slice(0,-5);
						}
						
						if(helpers.checkJSON(json[i])) {
							const valJSON = JSON.parse(json[i]);
							
							if(!Array.isArray(valJSON)) {
								e = 'Your JSON-Data doesn not have the correct format!'
								if(!errors.includes(e)) errors.push(e);
							}
							else {
								formData[i].cards = valJSON.map(card => {
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
								
								if(errors.length === 0) allSources.push(formData[i]);
							}
						} else {
							e = 'You didn\'t enter valid JSON data!';
							if(!errors.includes(e)) errors.push(e);
						}
					}
					if(errors.length === 0) {
						await game.settings.set(defaults.MODULE, 'sources', allSources);
						await game.settings.set(defaults.MODULE, 'deck', game.settings.get(defaults.MODULE, 'sources').find(source => source._id === deckId).cards);
						ui.notifications.info(`<b>${ game.i18n.localize("MMI.title_full") }: ${ game.i18n.localize("MMI.setup_success") }</b>`);
					}
					errors.forEach(err => ui.notifications.error(err));
				}
			}
		},
		render: html => {
			html[0].style.flex = 50;
			const button = $('#inspirationdeck-setup .dialog-buttons button.one');
			button.prop('disabled', true);
			html.find('form').on('change','input[type=file]', async (input) => {
				const target = input.currentTarget;
				const label = target.previousElementSibling;
				const fileData = target.files[0];
				const fileContent = await readTextFromFile(fileData)
				label.innerText = fileData.name;
				
				button.prop('disabled', false);
				
				const newInput = $('<div class="form-group"><label><em>(Source)</em></label><input type="file" name="jsonDataFile" accept=".csv, .json"></div>');
				html.find('#upload-fields').append(newInput);
				
				const select = html.find('form select[name=source-deck]')
				const newItem = $('<option>' + fileData.name + '</option>');
				select.append(newItem);
			});
		}
	}, {
		id: 'inspirationdeck-setup',
		width: 800,
		height: 600
	});
	d.render(true);
}