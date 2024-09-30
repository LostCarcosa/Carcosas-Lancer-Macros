/*
Lancer Apply Damage - Automated, Kind Of!

REQUIRES my Apply Damage macro (and requires it to be named 'Apply Damage'), plus Warpgate and Math.js.


This macro adds a little automation to my other macro- mostly it just saves you from having to enter DAMAGE yourself.

Specifically, running this macro does the following:
1. look through the last few (default: 3) chat messages, starting from the most recent, to find a Weapon card.
2. Once found, it digs through the weapon card and extracts the rolled damage values.
3. Passes said damage value to the Apply Damage macro, automatically filling out the default value as appropriate.

You still have to check for resistance and click the damage type.

TO-DO: pass damage type to the macro too. It won't actually save any steps, because damage type buttons double as confirmation, but I think it'd look nice.


CHANGELOG

v1.1: Compatibility for FoundryV11; thanks to Zenn. 
v1.2: now passes damage type to the apply damage macro; assuming you are using the most recent apply-damage macro, it should now color the correct damage type when passed to the apply-damage macro. useful for weapons that have multiple damage types.
Please use alongside applydamage_base_v3_4 or higher.
v1.3: updated to be compatible with damage macro v4.
*/

// Initialize damage array
let damageArray = [];

// Loop through the last few messages to find a weapon card
for (let i = -1; i >= -3; i--) {
    let message = [...game.messages].at(i);
    if (message?.flags.lancer?.attackData) {
        // This is a WEAPON card
        let content = message.content;
        let contentArray = content.split('\n');
        
        // Filter lines to find damage information
        contentArray = contentArray.filter(line => line.includes("lancer-dice-total major"));
        contentArray = contentArray.filter(line => line.includes("damage"));
        
        damageArray = contentArray.map(line => {
            let numMatch = line.match(/\d+/);
            let type = checkDamage(line);
            return {
                dmg: parseInt(numMatch ? numMatch[0] : 0),
                type: type || "unknown"
            };
        });
        
        // Check if damage values were found
        if (damageArray.length > 0) {
            let attackingToken = game.actors.get(message.flags.lancer.attackData.origin);
            if (attackingToken) {
                ui.notifications.info(`Extracted damage values from ${attackingToken.name}'s last attack.`);
            }
            
            // Execute Apply Damage macro with extracted values
            let applyDamageMacro = game.macros.getName('Apply Damage');
            if (applyDamageMacro) {
                damageArray.forEach(({ dmg, type }) => {
                    applyDamageMacro.execute({ dmg, type });
                });
            } else {
                ui.notifications.error("Macro 'Apply Damage' not found.");
            }
            break;
        }
    }
}

// Function to determine damage type
function checkDamage(line) {
    const damageTypes = ["energy", "explosive", "kinetic", "heat", "burn"];
    return damageTypes.find(type => line.includes(type)) || "unknown";
}