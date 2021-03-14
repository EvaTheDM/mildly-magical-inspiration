import DEFAULTS from '/modules/mmi/scripts/defaults.js';

import Combobox from '/modules/mmi/scripts/modules/combobox.js';

import validate from '/modules/mmi/scripts/modules/validator.js';
import * as SourceFactory from '/modules/mmi/scripts/modules/source-factory.js';
import exportSource from '/modules/mmi/scripts/modules/export.js';
import createView from '/modules/mmi/scripts/modules/create-view.js';
import updateButtonValue from '/modules/mmi/scripts/modules/button-update.js';
import Dialogs from '/modules/mmi/scripts/modules/dialogs.js';
import multipleChoice, { makeChoice } from '/modules/mmi/scripts/modules/multiple-choice.js';
import * as handleHook from '/modules/mmi/scripts/modules/hook-emitter.js';

import registerSettings from '/modules/mmi/scripts/config/register-settings.js';
import registerSockets from '/modules/mmi/scripts/config/register-sockets.js';

import SourceConfigApplication from '/modules/mmi/scripts/apps/SourceConfigApplication.js';
import CardPermissionApplication from '/modules/mmi/scripts/apps/CardPermissionApplication.js';


// Private Functions, can't be directly accessed through modules accessing this file
const _getSetting = (setting) => { return duplicate(game.settings.get(DEFAULTS.module, setting)) }

const _getFlag = (userId, key) => {
    const flag = game.users.get(userId).getFlag(DEFAULTS.module, key);
    if(flag) return duplicate(flag);
    else return undefined;
}

const _setFlag = async (userId, key, data) => {
    const user = game.users.get(userId);

    if(user._id === game.user._id) await user.setFlag(DEFAULTS.module, key, data);
    else if(game.user.role === 4) await user.setFlag(DEFAULTS.module, key, data);

    return true;
}

const _setSetting = async (setting, data, hookEmitter = null) => {
    if(game.user.role === 4) {
        await game.settings.set(DEFAULTS.module, setting, data);
        if(hookEmitter) {
            Hooks.call('mmiSettingChanged', hookEmitter);
            if(hookEmitter.change === 'awardCard') MMI.removeFromQueue('multipleChoice', hookEmitter.sender, hookEmitter.offer);
        }
    }
    else MMI.socket('setSetting', { setting, data, hookEmitter})
    return true;
}

const _queueUp = async (data, userId = game.user._id) => {
    const queue = _getFlag(userId, 'queue') || [];
    queue.push(data);

    await _setFlag(userId, 'queue', queue);

    return true;
}

const _queueDown = async (type, userId = game.user._id, data = null) => {
    const queue = _getFlag(userId, 'queue') || [];
    let filter = q => { return q.type != type };
    if(data) {
        switch (type) {
            case 'multipleChoice':
                filter = q => { return q.type != type || !_arraysMatch(q.offer, data) }
                break;
        }
    }
    await _setFlag(userId, 'queue', queue.filter(filter));
    return true;
}

const _arraysMatch = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
};


// Public Functions for export
const MMI = {
    async pushGamemasterSetting(setting, data, hookEmitter = null) { await _setSetting(setting, data, hookEmitter) },

    get sources () { return _getSetting('sources') },
    get activeSource() { return this.sources.find(source => source.isActive) || false },
    get activeDeck() { return this.activeSource.cards || [] },
    get version() { return _getSetting('version') },
    get requireMigration() { return _getSetting('requireMigration') },
    get permissions() { return _getSetting('permissions') },
    get handSize() { return _getSetting('hand-size') },
    get randomSize() { return _getSetting('random-size') },
    get openChoice() { return _getSetting('open-choice') },
    get cardFront() { return _getSetting('card-front') },
    get cardBack() { return _getSetting('card-back') },

    get haveCards() { return this.permissions.haveCards || game.users.filter(user => user.role < 4).reduce((obj, map) => {
        obj[map._id] = true;
        return obj;
    }, {}) },

    get viewDeck() { return this.permissions.viewDeck || game.users.filter(user => user.role < 4).reduce((obj, map) => {
        obj[map._id] = false;
        return obj;
    }, {}) },

    get viewPlayerHands() { return this.permissions.viewPlayerHands || game.users.filter(user => user.role < 4).reduce((obj, map) => {
        obj[map._id] = false;
        return obj;
    }, {}) },

    set version(newVersion) { return _setSetting('version', newVersion) },
    set permissions(value) { return _setSetting('permissions', value) },

    getPlayerHand(userId) {
        return this.activeDeck.filter(card => card.owner === userId)
    },

    getSource (sourceId) { return this.sources.find(source => source._id === sourceId) },

    getCardData (cardId) { return this.activeDeck.find(card => card._id === cardId) },

    async setSources (data) {
        await _setSetting('sources', data);
        return this.sources;
    },

    async setSource (sourceId, data, hookEmitter = null) {
        const newSources = this.sources.map(source => {
            if(source._id === sourceId) return data;
            else return source;
        })
        await _setSetting('sources', newSources, hookEmitter);
        return this.getSource(sourceId);
    },

    async addToQueue(data, userId = null) { await _queueUp(data, userId) },

    async removeFromQueue(type, userId = null, data = null) { await _queueDown(type, userId, data) },

    async recallCards() {
        const recall = this.activeSource;
        recall.cards = recall.cards.map(card => {
            return { ...card, owner: '' }
        })

        await this.setSource(recall._id, recall);

        return true;
    },

    checkQueue(userId) { return _getFlag(userId, 'queue') },

    modifyCard (cardData)  {
        cardData.title = lineBreak(cardData.title, 'title');
        cardData.subtitle = lineBreak(cardData.subtitle, 'subtitle');
        
        cardData.cost = cardData.cost.join(' ');
        cardData.duration = cardData.duration.join(' ');

        return cardData;
    },

    checkHandSize(userId) {
        const queueLength = MMI.checkQueue(userId)?.filter(q => q.type === 'multipleChoice')?.length || 0;
        const ownedLength = MMI.activeDeck.filter(card => card.owner === userId).length;
        return (queueLength + ownedLength) < MMI.handSize;
    },

    lineBreak(lineString, cutOff) {
        return lineString.split(/\r?\n/g);
    },

    socket(operation, data) {
        game.socket.emit('module.' + DEFAULTS.module, {
            operation,
            data
        });
        return true;
    },

    awardNotification(userId, cardId, choice = true) {
        return `<b>Mildly Magical Inspiration:</b> <em>${ game.users.get(userId).name }</em> ${ choice ? 'chose' : 'received' } the card <em>${ MMI.activeDeck.find(card => card._id === cardId).title.join(' ') }</em>`
    },

    formatDescription(des) {
		return des
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\~\~(.*)\~\~/gim, '<strike>$1</strike>')
            .replace(/(?:(\*+ [\s\S]*?)\n{2})|(?:(\*+ [\s\S]*?))$/gi, '<ul>$1$2\n</ul>\n')
            .replace(/\* (.*)(\n|$)/gim, '<li>$1</li>')
            .replace(/\n/gi, '<br />');
    },

    updateButtonValue,

    ...Dialogs
}

export default MMI;



const setup = {
    registerSettings() {
        game.settings.registerMenu(DEFAULTS.module, 'sourceConfig', {
            name: 'Sources',
            label: 'Source Configuration',
            icon: 'fas fa-cogs',
            type: SourceConfigApplication,
            restricted: true
        });
        game.settings.registerMenu(DEFAULTS.module, 'permissionsConfig', {
            name: 'Permissions',
            label: 'Advanced Permissions',
            icon: 'fas fa-cogs',
            type: CardPermissionApplication,
            restricted: true
        });
        registerSettings();
    },
    registerSockets
}

export {
    validate,
    setup,
    SourceFactory,
    Combobox,
    exportSource,
    createView,
    multipleChoice,
    makeChoice,
    handleHook
};