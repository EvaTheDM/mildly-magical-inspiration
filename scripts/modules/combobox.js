import DEFAULTS from '/modules/mmi/scripts/defaults.js';

const ComboboxFactory = async (options) => {
    if(!options.id) throw `Combobox requires 'id' for the combobox element!`;
    if(!options.items) throw `Combobox requires 'items' for the dropdown items!`;
    options.restricted = 'restricted' in options ? options.restricted : false;
    options.showEmpty = 'showEmpty' in options ? options.showEmpty : true;
    const parent = options.parent ? $(options.parent) : $('body');
    const wrapper = parent.find(`#${ options.id.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" ) }`);

    const label = options.restricted ? options.items.find(item => options.restricted && item.value === options.value).label : options.value;

    const comboHTML = await renderTemplate(`${DEFAULTS.templatePath}/combobox.html`, { id: options.id, value: options.value, label });
    
    wrapper.replaceWith(comboHTML);

    let ranFocusOut = false;

    const combobox = parent.find(`#${ options.id.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" ) }`);
    const input = combobox.find('input[type=text]');
    const hidden = combobox.find('input[type=hidden]');
    const itemList = combobox.find('ul.custom-select');

    let tempValue;

    combobox
        .on('input', 'input[type=text]', (event) => {
            if(options.restricted) {
                if(filterItems(false) === 0) invalid();
                else invalid(false);
            }
            else matchHidden();

            if(!options.restricted) filterItems()
            if(options.hooksOnInput) Hooks.call(options.hooksOnInput, combobox, updateItems, event);
        })
        .on('mousedown', 'a.select-dropdown', () => { ranFocusOut = false }
        )
        .on('click', 'a.select-dropdown', () => { if(!ranFocusOut) input.focus()
        })
        .on('focus', 'input[type=text]', () => {
            tempValue = input.val();
            if(!options.restricted) filterItems();
            combobox.find('.select-inputWrapper').css('border-radius', '3px 3px 0 0');
            input.css('border-radius', '3px 3px 0 0');
            itemList.slideDown('fast');
        })
        .on('focusout', 'input[type=text]', (event) => {
            ranFocusOut = true;
            if(options.restricted) {
                const listItems = []
                itemList.find('li').each((key, item) => {
                    listItems.push({ value: $(item).data('select-value'), label: $(item).text() });
                })
                input.val(listItems.find(item => searchCompare(item.label, input.val()) || searchCompare(item.value, input.val())).label);
                hidden.val(listItems.find(item => searchCompare(item.label, input.val()) || searchCompare(item.value, input.val())).value);
            }
            itemList.slideUp('fast', () => {
                combobox.find('.select-inputWrapper').css('border-radius', '3px');
                input.css('border-radius', '3px');
            });
            if(options.hooksOnFocusOut) Hooks.call(options.hooksOnFocusOut, combobox, updateItems, event);
        })
        .on('mousedown', 'ul.custom-select li', event => {
            input.val($(event.target).text())
            matchHidden($(event.target))
            if(options.hooksOnMouseDown) Hooks.call(options.hooksOnMouseDown, combobox, updateItems, event);
        })
        
        const updateItems = (items = options.items) => {
            itemList.empty();
            items.forEach(item => {
                const attr = {
                    'data-select-value': typeof item === 'object' && item !== null ? item.value : item
                };
                let newEl = $(`<li></li>`, attr);
                newEl.text(typeof item === 'object' && item !== null ? item.label : item)
                if((!options.showEmpty && newEl.text() != '') || options.showEmpty) itemList.append(newEl);
            })
            if(!options.restricted) filterItems(true)
        }

        const matchHidden = (target = false) => {
            if(options.restricted && target) hidden.val(target.data('select-value'))
            else if(!options.restricted) hidden.val(input.val());
        }
        
        const searchCompare = (string, filter) => {
            return filter ? string.toUpperCase().indexOf(filter.toUpperCase()) > -1 : true }

        const filterItems = (hide = true) => {
            let count = 0;
            itemList.find('li').each((index, el) => {
                if(searchCompare($(el).text(), input.val())) {
                    if(hide) $(el).show();
                    count++;
                }
                else {
                    if(hide) $(el).hide();
                }
            })
            return hide ? itemList.find('li:visible').length : count;
        }

        const invalid = (invalid = true) => {
            if(invalid) {
                input.css('background', '#fedee1')
                setTimeout(() => { input.css('background', 'rgba(0, 0, 0, 0.05)') }, 1000);
                input.val(tempValue);
            }
            else {
                input.css('background', 'rgba(0, 0, 0, 0.05)')
                tempValue = input.val();
            }
        }

        updateItems();

        return {
            combobox,
            updateItems
        }
    }
    
    export default ComboboxFactory;