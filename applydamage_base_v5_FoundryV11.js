/*
Lancer Apply Damage Macro
Written by StarsofCarcosa#0440
(Modified by AnatoleSerial, Zenn and tradiuz to work with Lancer system Version 2.2.4)

REQUIRES THE FOLLOWING MODULES TO FUNCTION:
- Math.js

Select (not target) any number of tokens and run the macro, which will bring up a small menu. Enter unmodified damage, check Resistance box if appropriate, and select damage type.

Kinetic/Energy/Explosive damage is all handled the same at the moment; tokens will take damage, accounting for armor.

Burn will pierce armor and also increment the Burn value.

Heat simply increments heat.


The GM recieves a whisper updating them on changed values, so it is easy to check that everything is correct and to revert damage done if necessary. You can disable this function by commenting out the chat code, near the bottom. The user of the macro will also recieve a UI notification containing the same info.

V2: Now accounts for overshield.

V3: some fixes

V3.3: Foundry V11 Compatiable (Thanks AnatoleSerial for doing the entire upgrade)

V3.4: Removed Warpgate dependency, now relies only on foundry dialog! (Thanks again to AnatoleSerial for handling the entire upgrade!)
    - additionally, some additional integration with the auto-damage macro has been added- will now color the appropriate damage type when using the auto-damage macro.
    
V3.4b: Added additional customization for damage types that may be sent from the Auto Apply Damage macro. Color codes and changes icon of damage button based on damage type.

V4: Remove exposed button and leverage the exposed status itself. 
 -  Swap to 'scope' from 'args'.  V11 fix.
 -  Convert to if/elif to switch/case statement.
 -  color enhancements if called with arguments

V5: Major overhaul to refactor things.
-   Moved the damage stuff to a function to better scope variables
-   Change from a large if/else if to single block (DRY)
-   Added Shredded calculations
-   Added vanishing buttons for non-applicable damage types when using the auto-damage macro and improved button styling.
*/

// This section handles integration with auto-apply damage macro.
let dmg = scope.dmg ?? 0;
let type = scope.type ?? null;
let defaultButtonStyle = "opacity:1"; // Default button style: fully opaque
let transparentButtonStyle = "opacity:0.1"; // Inactive button style: 10% opacity
let weaponButtonStyle = defaultButtonStyle; // Style for the weapon button
let burnButtonStyle = defaultButtonStyle; // Style for the burn button
let heatButtonStyle = defaultButtonStyle; // Style for the heat button
let weaponIconStyle = "color:white"; // Default weapon icon: white
let weaponIcon = "cci cci-reticule i--l"; // Default icon for weapon

// All button text will always be white
const buttonTextStyle = "color:white;";

// Adjust styles based on the damage type passed
if (type) {
    switch (type) {
        case 'kinetic':
            weaponIconStyle = "color:#616161;"; // Activated color for kinetic damage
            weaponIcon = "cci cci-kinetic i--l";
            burnButtonStyle = transparentButtonStyle; // Inactive buttons are 10% transparent
            heatButtonStyle = transparentButtonStyle;
            break;
        case 'energy':
            weaponIconStyle = "color:#2195ca;"; // Activated color for energy damage
            weaponIcon = "cci cci-energy i--l";
            burnButtonStyle = transparentButtonStyle;
            heatButtonStyle = transparentButtonStyle;
            break;
        case 'explosive':
            weaponIconStyle = "color:#fca017;"; // Activated color for explosive damage
            weaponIcon = "cci cci-explosive i--l";
            burnButtonStyle = transparentButtonStyle;
            heatButtonStyle = transparentButtonStyle;
            break;
        case 'burn':
            burnButtonStyle = defaultButtonStyle; // Burn button is fully visible
            weaponButtonStyle = transparentButtonStyle; // Inactive weapon button
            heatButtonStyle = transparentButtonStyle;
            weaponIcon = "cci cci-reticule i--l"; // Inactive icon is white
            break;
        case 'heat':
            heatButtonStyle = defaultButtonStyle; // Heat button is fully visible
            weaponButtonStyle = transparentButtonStyle; // Inactive weapon button
            burnButtonStyle = transparentButtonStyle;
            weaponIcon = "cci cci-reticule i--l"; // Inactive icon is white
            break;
    }
}

const htmlFormContent = `<form class="lancer accdiff window-content">
    <div class="flexrow lancer-border-primary" style="padding-bottom: 4px;">
        <div class="flexcol">
            <label class="container">
                <h3 class="lancer-border-primary">Damage</h3>
                <input type="number" value=${dmg} name="damage_amount" class="lancer-text-field grow"
                style="color:var(--color-text-dark-primary, black); text-align: center;"/>
            </label>
        </div>
        <div class="flexcol">
            <h3 class="lancer-border-primary">Modifiers</h3>
            <label class="container" style="order: 2;">
                <input type="checkbox" name="has_resistance">
                <span class="checkmark">Resistance</span>
            </label>
            <label class="container" style="order: 1;">
                <input type="checkbox" name="attack_is_piercing"> Armor Piercing
            </label>
        </div>
    </div>
    <div class="flexrow" style="padding-top: 4px;">
        <div class="flexcol">
            <button name="dmgType" value="Weapon" type="button" style="background-color: #333333; ${weaponButtonStyle}">
                <i class="${weaponIcon}" style="${weaponIconStyle}"></i></br>
                <span style="${buttonTextStyle}">Damage</span>
            </button>
        </div>
        <div class="flexcol">
            <button name="dmgType" value="Burn" type="button" style="background-color: #333333; ${burnButtonStyle}">
                <i class="cci cci-burn i--l" style="color:#ce871e;"></i></br>
                <span style="${buttonTextStyle}">Burn</span>
            </button>
        </div>
        <div class="flexcol">
            <button name="dmgType" value="Heat" type="button" style="background-color: #333333; ${heatButtonStyle}">
                <i class="cci cci-heat i--l" style="color:#e74210;"></i></br>
                <span style="${buttonTextStyle}">Heat</span>
            </button>
        </div>
    </div>
</form>`;



function handleButtonClick(html, event) {
    const targetElement = event.currentTarget;
    const presetType = targetElement.dataset?.preset;

    const formElement = $(targetElement).parents('form');
    const damage = parseInt(formElement?.find('[name="damage_amount"]').val());
    const resistDmg = formElement?.find('[name="has_resistance"]').prop("checked");
    const armorPiercing = formElement?.find('[name="attack_is_piercing"]').prop("checked");

    const selectedTokens = canvas.tokens.controlled;

    if (typeof damage !== "number") {
        return "Damage must be a number.";
    }

    const attackType = targetElement.value;

    if (!isNaN(damage) && damage > 0) {
        selectedTokens.forEach(token => {
            applyDamage(token, { damage, attackType, resistDmg, armorPiercing });
        });

        const formData = new FormDataExtended(html[0].querySelector('form')).object;
        ui.activeWindow.close();
        return formData;
    } else {
        ui.notifications.warn("Damage must be a positive number.");
        return "Damage must be a number.";
    }
    return null;
}

async function applyDamage(token, { damage, attackType, resistDmg, armorPiercing }) {
    let name = token.name;
    let exposed = token.actor.statuses.has("exposed");
    let shredded = token.actor.statuses.has("shredded");
    let armor = token.actor.system.armor;
    let hp = token.actor.system.hp.value;
    let heat = token.actor.system.heat.value;
    let burn = token.actor.system.burn;
    let overshield = token.actor.system.overshield.value;
    let tokenURL = token.actor.img;
    let overshieldRemain = 0;
    let effects = "";
    let dmgType = "";
    let newVal = 0;
    let remain = "HP";
    switch (attackType) {
        case 'Weapon':
            dmgType = "Damage";
            break;
        case 'Burn':
            dmgType = "Burn";
            break;
        case 'Heat':
            dmgType = "Heat";
            remain = "Heat"
            break;
    }
    let burnDamage =  attackType === "Burn" ? damage : 0;
    // order matters, of course- lancer is Exposed -> armor -> resistance.
    //if exposed, double damage if normal damage type
    if (exposed && dmgType === "Damage") {
        damage =  damage * 2 ;
        effects +=  `[Exposed (x2)] `;
    }
    //if not armorpiercing, factor in armor for normal damage types unless shredded
    if (!armorPiercing && !shredded && dmgType === "Damage") {
        damage = Math.max(damage - armor, 0); //subtract armor
        effects = effects + `[Armor: ${armor}] `;
    }
    //if resistance, halve damage, rounding up.
    damage = resistDmg && !shredded ? Math.ceil(damage / 2) : damage;
    // Heat doesn't impact OS
    if (dmgType !== "Heat" && overshield > 0) {
        overshieldRemain = overshield - damage >= 0 ? overshield - damage : 0;
        token.actor.update({ "system.overshield": overshieldRemain });
        effects += `[Overshield: ${overshield} -> ${overshieldRemain}] `;
        damage = damage - overshield > 0 ? damage - overshield : 0;
    }
    effects += resistDmg && !shredded ? `[Dmg Resist (x½)] ` : '';
    effects += shredded ? `[Shredded] ` : '';
    effects += armorPiercing ? `[Armor Piercing] ` : '';
    if (dmgType === "Heat") {
        effects += heat + damage >= token.actor.system.heat.max / 2 ? `[DANGER ZONE] ` : '';
        newVal = heat + damage;
        token.actor.update({ "system.heat.value": heat + damage });
    } else if (dmgType === "Burn") {
        effects += `[Burn: ${burnDamage}]`
        token.actor.update({ "system.hp.value": hp - damage, "system.burn": burn + burnDamage });
        newVal = hp - damage;
    } else {
        token.actor.update({ "system.hp.value": hp - damage });
        newVal = hp - damage;
    }
    let msgContent = `<div class="card clipped-bot" style="margin: 0px;">
        <div class="card clipped">
            <div class="lancer-mini-header" >// DAMAGE APPLIED //</div>
                <div class="lancer-hit">
                    <div>
                        <img class="lancer-hit-thumb" src="${tokenURL}" />
                    </div>
                    <div class="lancer-hit-text">${name}</span>
                        <span>${damage} ${dmgType}</span>
                        <span>(New Value: ${newVal} ${remain})</span>
                    </div>
                </div>
        </div>
        <div class="card clipped">
            <div class="lancer-mini-header">// DAMAGE MODS //</div>
            <span class="effect-text">${effects}</span>
        </div>
    </div>`
    ChatMessage.create({ //comment this part out if you don't want stuff whispered to chat.
        content: msgContent,
        whisper: ChatMessage.getWhisperRecipients("GM")
    });
}

async function promptForDamage() {
    return new Promise((resolve) => {
        const dialog = new Dialog({
            title: "Apply Damage to Selected Token",
            content: htmlFormContent,
            buttons: {},
            render: (html) => {
                html.on('click', 'button[name="dmgType"]', (event) => {
                    let clickResult = handleButtonClick(html, event);
                    if (clickResult === null) {
                        resolve(null);
                    } else if (typeof clickResult === "string") {
                        resolve(null);
                    } else {
                        resolve(clickResult);
                    }
                });
            },
            close: () => {
                resolve('User closed dialog without making a selection.');
            },
        });
        dialog.render(true);
    });
}

const damage = await promptForDamage();