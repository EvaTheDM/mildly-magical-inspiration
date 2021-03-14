import MMI from '/modules/mmi/scripts/main.js';
import DEFAULTS from '/modules/mmi/scripts/defaults.js';

const _sendNotification = (msg, includeSelf = false) => {
    if(includeSelf) ui.notifications.info(msg)
    game.users.forEach(user => {
        MMI.socket('sendNotification', { recipient: user._id, message: msg })
    });
}

const awardCard = ({ sender, cardId }) => {
    MMI.socket('openHand', { userId: sender, opt: { render: false, focusCard: cardId } });
    ui.notifications.info(MMI.awardNotification(sender, cardId));
}

const useCard = async ({ sender, cardId }) => {
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
}

const passCard = ({ sender, newOwner, cardId }) => {
    console.log('Passing')
    const cardData = MMI.getCardData(cardId);
    MMI.socket('openHand', { userId: sender, opt: { render: false } });
    MMI.socket('openHand', { userId: newOwner, opt: { render: false, focusCard: cardId } });

    _sendNotification(`<b>Mildly Magical Inspiration:</b> <em>${ game.users.get(sender).name }</em> passed the card <em>${cardData.title.join(' ')}</em> to <em>${ game.users.get(newOwner).name }</em>`, true)
}

export {
    awardCard,
    useCard,
    passCard
}