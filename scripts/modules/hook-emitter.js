import MMI, { SourceFactory } from '/modules/mmi/scripts/main.js';
import DEFAULTS from '/modules/mmi/scripts/defaults.js';

import CardViewerApplication from '/modules/mmi/scripts/apps/CardViewerApplication.js';
import DeckConfigApplication from '/modules/mmi/scripts/apps/DeckConfigApplication.js';
import SourceConfigApplication from '/modules/mmi/scripts/apps/SourceConfigApplication.js';

const _sendNotification = (msg, includeSelf = false) => {
    if(includeSelf) ui.notifications.info(msg)
    game.users.forEach(user => {
        MMI.socket('sendNotification', { recipient: user._id, message: msg })
    });
}

const apps = ui.windows;
const _checkWindows = (callback = () => {}) => {
    const constructors = [ 'SourceConfigApplication', 'DeckConfigApplication', 'CardViewerApplication' ];

    Object.keys(apps).filter(id => constructors.includes(apps[id].constructor.name)).forEach(callback)
}


export default {
    awardCard({ sender, cardId }) {
        MMI.socket('openHand', { userId: sender, opt: { render: false, focusCard: cardId } });
        ui.notifications.info(MMI.awardNotification(sender, cardId));
    },
    
    async useCard({ sender, cardId }) {
        const cardData = MMI.getCardData(cardId);
    
        const html = await renderTemplate(`${DEFAULTS.templatePath}/partials/chat-message.html`, {
            title: cardData.title.join(' '),
            subtitle: cardData.subtitle.join(' '),
            description: MMI.formatDescription(cardData.description),
            cost: cardData.cost.join(' '),
            duration: cardData.duration.join(' ')
        });
    
        MMI.socket('openHand', { userId: sender, opt: { render: false } });
    
        _sendNotification(`<b>Mildly Magical Inspiration:</b> ${ game.users.get(sender).name } used the card ${cardData.title.join(' ')}`, true);
    
        ChatMessage.create({
            content: html
        })
    },

    passCard({ sender, newOwner, cardId }) {
        const cardData = MMI.getCardData(cardId);
        MMI.socket('openHand', { userId: sender, opt: { render: false } });
        MMI.socket('openHand', { userId: newOwner, opt: { render: false, focusCard: cardId } });
    
        _sendNotification(`<b>Mildly Magical Inspiration:</b> <em>${ game.users.get(sender).name }</em> passed the card <em>${cardData.title.join(' ')}</em> to <em>${ game.users.get(newOwner).name }</em>`, true)
    },

    changeActive({ change }) {
        
        // When the active Source is being changed then rerender all opened Source Config and Deck Config Applications and close all Card Viewer Applications
        const fn = id => {
            switch (apps[id].constructor.name) {
                case 'SourceConfigApplication':
                case 'DeckConfigApplication':
                    apps[id].render(true);
                    break;
                
                case 'CardViewerApplication':
                    apps[id].close()
                    break;
            }
        }
    
        if(change === 'changeActiveSocket') _checkWindows(fn);
        else {
            _checkWindows(fn);
            MMI.socket('triggerHook', { change: 'changeActiveSocket' });
        }
    },
    
    changeActiveSocket(hookEmitter) { this.changeActive(hookEmitter) },

    removeSource() {
        _checkWindows(id => {
            if(apps[id].constructor.name === 'SourceConfigApplication') apps[id].render(true);
        })
    },

    createSource() {
        _checkWindows(id => {
            if(apps[id].constructor.name === 'SourceConfigApplication') apps[id].render(true);
        })
    },

    updateSource(hookEmitter) {
        let { data, sourceChanges } = hookEmitter;
        _checkWindows(id => {
            if(data.sourceId === MMI.activeSource._id) {
                switch (apps[id].constructor.name) {
                    case 'CardViewerApplication':
                        switch (apps[id].options.type) {
                            case 'gamemaster':
                                if(sourceChanges.cards?.length > 0 && MMI.activeDeck.filter(card => sourceChanges.cards.includes(card._id) && card.owner != '').length > 0) apps[id].render(true);
                                break;

                            case 'playerHands':
                                if(sourceChanges.cards?.length > 0 && MMI.activeDeck.filter(card => sourceChanges.cards.includes(card._id) && card.owner != '' && card.owner != game.user._id).length > 0) apps[id].render(true);
                                break;
                            
                            case 'fullDeck':
                                const visibleCard = apps[id]._element.find('div.hand-wrapper .card-wrapper:not([id=""]):visible').prop('id');
                                apps[id].render(true);
                                setTimeout(function(){ apps[id].switchCard({html: apps[id]._element, nextCardId: visibleCard }) }, 10);
                                break;
                            
                            case 'preview':
                                if(sourceChanges.cards?.includes(apps[id].options.data.cardId)) apps[id].render(true);
                                break;
                            
                            case 'single':
                                if(MMI.activeDeck.filter(card => sourceChanges.cards?.includes(card._id) && card.owner === apps[id].options.data.userId).length > 0) {
                                    const card = apps[id]._element.find('.card-wrapper:not([id=""]):visible').prop('id');
                                    apps[id].render(true);
                                    setTimeout(function(){ apps[id].switchCard({html: apps[id]._element, nextCardId: card }) }, 10);
                                }
                                break;
                        
                            default:
                                break;
                        }
                        break;
                }
            }
            if(apps[id].constructor.name === 'SourceConfigApplication') apps[id].render(true);
        })
        if(game.user.role === 4) MMI.socket('triggerHook', hookEmitter)
    },

    async permissionsUpdated(hookEmitter) {
        let { data } = hookEmitter;
        if(game.user.role === 4) {
            let removeUsers = [];
            for (const user in data.haveCards) {
                if(!data.haveCards[user]) removeUsers.push(user)
            }

            let newCards = MMI.activeDeck;
            for (let i = 0; i < newCards.length; i++) {
                const card = newCards[i];
                if(removeUsers.includes(card.owner)) newCards[i].owner = '';
                
            }

            await SourceFactory.update(MMI.activeSource._id, { cards: newCards })
        }
    }
}