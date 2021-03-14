import DEFAULTS from '/modules/mmi/scripts/defaults.js';
import MMI from '/modules/mmi/scripts/main.js';

import SourceConfigApplication from '/modules/mmi/scripts/apps/SourceConfigApplication.js';

export default class VersionApplication extends Application {
	constructor(options={}) {
		super(options);
	}
	
	getData(options={}) {
		return {
			version: MMI.version,
            changelog: [
                {
                    version: '2.0.0',
                    description: `
                    As you may have noticed by the version number, this
                    version marks a big jump in the development of
                    <em>Mildly Magical Inspiration</em>. With this new
                    version the internal structure as well as functionality
                    has been rewritten, renewed and just in general been
                    completely overworked.<br />
                    Future updates should at least for the next couple ones,
                    be much smaller and more focused on bug hunting as well
                    as adding features requested by the community.<br />
                    With this version the module also finally comes with a
                    default deck. For now it is necessary to download and
                    import the default deck yourself. You can find the file
                    <a href="https://github.com" target="_blank">here</a>.
                    `,
                    changes: [
                        `<b>Internal Structure Changes.</b> The modules has completely changed the way it handles its sources and the currently active deck, as well as how to assign cards to players. As such the previous version isn't compatible with the current one, though an automated migration process has been included with this version to assure that no data is getting lost when updating.`,
                        `<b>Real Time Settings Update.</b> Changes such as the module not having any sources, no active sources or the like are immediately represented both in the context menu as well as in the game settings. Previously a reload was required for the module to function properly when it was first set up.`,
                        `<b>Changes to Player/Cost/Duration Selection.</b> The three inputs for player, cost and duration selection have been changed to become more modular and easy to maintain, now consisting of a module like implementation making it more easy to use in the code. For users they now appear as comboboxes, mixing the functionality of a text input with the usefulness of a dropdown field.`,
                        `<b>Added Filter Options.</b> The filter options now include a toggle between <i>Show All</i>, <i>Show only Included</i> and <i>Show only Excluded</i>. Each of these toggles functions in addition to the search bar and the toggles for player owned and unowned cards, meaning you can mix and match your filters to whatever suits you best.`,
                        `<b>Card Description Markdown.</b> The card description field now accepts simple markdown. For the full list of available markdown please visit the github wiki of the module!`,
                        `<b>Card Description Player View.</b> When a player views a card that has a description attached to it, they now see a small <i class="fas fa-info-circle"></i>-button in the top right corner of the card. Upon hovering or clicking the button, they can now view the description.`,
                        `<b>Descriptions in Chat.</b> The card descriptions are now shown properly in the chat including line breaks. Not much else to say here.`,
                        `<b>Active Source Selection.</b> Sources and decks are now fully connected, meaning that when you wish to change the deck that is currently being used you simply click the <b>Switch Active</b> or <b>Make Active</b> button in the edit screen of the source you wish to make active (or in that of the one that is currently active). These changes automaticall recall all cards from players!`,
                        `<b>Card Controlls.</b> The card control buttons (accessible from the player view) have been partially renamed to hopefully make them more self explenatory.`,
                        `<b>Offline Functionality.</b> When a player is offline while the gamemaster awards them a card, the cards that are picked at random are saved and put into a queue that the respective player side checks when logging in, receiving the card when they next log in (as long as a Gamemaster is logged in). When the Gamemaster is offline and players try to use the card control buttons they get a warning that they can't do that while the Gamemaster isn't online.`,
                        `<b>Advanced Permission Settings.</b> Gamemasters can now assign more advanced permissions to each player in the game (as long as they are not a gamemaster). These permissions currently include being allowed to have cards, being allowed to view other's hands and being allowed to view the full deck.`,
                        `<b>Restructure of Card View.</b> The cards were originally designed to be used as svg-files. Since that functionality hasn't proven useful it has been removed. Cards are now structured as normal html and rendered appropriately with css.`,
                        `<b>Usage of SCSS.</b> The module now uses SCSS instead of normal CSS to style itself. This will be useful especially during future adding of functionality.`
                    ]
                }
            ]
		};
	}
	
	activateListeners(html) {
		super.activateListeners(html);

        html.on('click', 'button', () => {
            if(MMI.activeDeck.length === 0) new SourceConfigApplication().render(true);
            this.close()
        })
	}
}