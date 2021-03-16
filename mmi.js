import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI, { setup, createView, multipleChoice, handleHook } from '/modules/mmi/scripts/main.js';
import createUI from '/modules/mmi/scripts/config/create-ui.js';

import migrate from '/modules/mmi/scripts/modules/migrate.js';
import VersionApplication from '/modules/mmi/scripts/apps/VersionApplication.js';

import CardPermissionApplication from '/modules/mmi/scripts/apps/CardPermissionApplication.js';

Hooks.once('init', async () => {
	setup.registerSettings();
	
	setup.registerSockets();
	
	Handlebars.registerPartial('editPartial', await getTemplate('modules/mmi/templates/edit-partial.html'));
});

Hooks.once('ready', async () => {
	console.log(`Mildly Magical Inspiration | Version ${ MMI.version }`);

	const queue = MMI.checkQueue(game.user._id);
	if(queue?.length) {
		let multipleOpen = false;
		for (const q of queue) {
			switch (q.type) {
				case 'multipleChoice':
					if(!multipleOpen) {
						multipleOpen = true;
						multipleChoice(q.offer);
					}
					break;
			
				default:
					break;
			}
		}
	}
	MMI.updateButtonValue();

	if(game.user.role === 4 && (Object.keys(MMI.permissions).length === 0 || (!MMI.permissions.hasOwnProperty('haveCards') || !MMI.permissions.hasOwnProperty('viewDeck') || !MMI.permissions.hasOwnProperty('viewPlayerHands')))) {
		ui.notifications.error(`<b>Mildly Magical Inspiration:</b> Update your players' permissions to match the new system!`)
		new CardPermissionApplication().render(true);
	}

	if(game.user.role === 4 && (MMI.version != '2.0.0' || MMI.sources.length === 0 || MMI.requireMigration)) {
		if(MMI.version != '2.0.0') MMI.version = '2.0.0';

		if(MMI.requireMigration) {
			// migrate to new version if previously used old version of the module
			await migrate();
		}

		new VersionApplication({
			width: 400,
			height: 600,
			popOut: true,
			minimizable: false,
			id: `mmi-version-update`,
			title: `Mildly Magical Inspiration - Version ${ MMI.version }`,
			template: DEFAULTS.templatePath + '/version.html',
			version: MMI.version
		}).render(true);
	}
});

Hooks.once('renderPlayerList', (app, html, data) => {
	game.MMI = {}
	createUI(html);
});

Hooks.on('changedMMISetting', (hookEmitter) => {
	if(handleHook.hasOwnProperty(hookEmitter.change)) handleHook[hookEmitter.change](hookEmitter);
	else console.log(hookEmitter)
})