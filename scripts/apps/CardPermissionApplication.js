import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI from '/modules/mmi/scripts/main.js';

/**
 * Form application to configure settings of the Deck.
 */
export default class CardPermissiongApplication extends FormApplication {
	constructor(object={}, options={}) {
		super(object);
	}
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			title: 'Mildly Magical Inspiration - Advanced User Permissions',
			id: "permissions-config",
			template: './' + DEFAULTS.templatePath + '/card-permissions.html',
			width: 800,
			closeOnSubmit: true
		})
	}
	
	getData(options) {
        const obj = {
            users: game.users.filter(user => user.role < 4).map(user => {
                return {
                    _id: user._id,
                    name: user.name,
                    permissions: {
                        haveCards: MMI.permissions?.haveCards?.[user._id] ?? true,
                        viewPlayerHands: MMI.permissions?.viewPlayerHands?.[user._id] ?? false,
                        viewDeck: MMI.permissions?.viewDeck?.[user._id] ?? false
                    }
                }
            })
        }

		return mergeObject(super.getData().object, obj);
	}
	
	async activateListeners(html) {
        super.activateListeners(html);
	}
	
	async _updateObject(event, formData) {
        const newPermissions = {}
        Object.keys(formData).forEach(field => {
            const [ type, userId ] = field.split('.');
            if(!newPermissions.hasOwnProperty(type)) newPermissions[type] = { [userId]: formData[field] };
            else newPermissions[type][userId] = formData[field];
        })

        MMI.permissions = newPermissions;
	}
}