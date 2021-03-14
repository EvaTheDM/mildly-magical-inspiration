const button = ([ icon, label, callback ]) => {
    return {
        icon: `<i class="fas ${ icon }"></i>`,
        label,
        callback
    }
}

const makeButtons = (data, cancel = false) => {
    const result = {};

    const keys = Object.keys(data);
    keys.forEach(key => {
        const { icon, label, callback } = data[key];

        result[key] = {
            icon: icon ? `<i class="fas ${ icon }"></i>` : '',
            label,
            callback
        }
    })

    if(cancel) result.cancel = button(['fa-times', 'Cancel'])

    return result;
}

const makeSelect = (name, options) => {
    return `<select name="${ name }" style="width: 100%;">
        ${ options.map(op => {
            return `<option value="${ op.value}"${ op?.disabled ? ` disabled` : '' }>${ op.label }</option>`
        }).join('') }
    </select>`;
}

const makeInput = (name, type, options, data) => {
    return `<input type="${ type }" name="${ name }"${ Object.keys(options).map(key => ` ${ key }="${ options[key] }"` ).join('') }${ Object.keys(data).map(key => ` data-${ key }="${ data[key] }"` ).join('') } />`;
}

const makeForm = ({ name = '', type = '', options = [], data = [] } = {}) => {
    switch (type) {
        case 'select':
            return makeSelect(name, options)
            
        case 'file':
            return makeInput(name, type, options, data)
    
        default:
            return false
    }
}

const makeDialog = async ({ title = '', content = '', template = null, form = {}, buttons = {}, def = 'cancel', render = () => {}, close = () => {} } = {}, options = {}) => {
    let dialogContent;
    if(template) dialogContent = template;
    else {
        let formField;
        if(form) formField = makeForm(form);

        dialogContent = `${ content }${ formField ? `<div style="padding-top: 20px; padding-bottom: 20px;">${ formField }` : `` }</div>`;
    }

    const d = await new Dialog({
        title: `Mildly Magical Inspiration - ${ title }`,
        content: dialogContent,
        buttons: Object.keys(buttons).length > 0 ? makeButtons(buttons, def === 'cancel' ? true : false) : [],
        default: def,
        render,
        close
    }, options)
    d.render(true);
    return d;
}

const isEmpty = (el) => {
    const type = el.prop('type');
    switch (type) {
        case 'select-one':
            if(el.val() === '') return true;
            else return false;
    
        case 'file':
            if(el.prop('files').length <= 0) return true;
            else return false;

        default:
            return false;
    }
}

const disableOnEmpty = ({ target, operator }) => {
    target.prop('disabled', true);

    operator.on('change', (e) => {
        if(!isEmpty($(e.target))) target.prop('disabled', false);
        else target.prop('disabled', true);
    })
}

export default {
    makeDialog,
    disableOnEmpty
}