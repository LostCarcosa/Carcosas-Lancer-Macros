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

v1.1: Compatiability for FoundryV11; thanks to Zenn. 
v1.2: now passes damage type to the apply damage macro; assuming you are using the most recent apply-damage macro, it should now color the correct damage type when passed to the apply-damage macro. useful for weapons that have multiple damage types.
Please use alongside applydamage_base_v3_4 or higher.
*/

let damageArray = [];
for (let i = -1; i >= -3; i--) {
    let message = [...game.messages].at(i);
    if (typeof message.flags.lancer != 'undefined' && typeof message.flags.lancer.attackData != 'undefined') {
        // i.e "this is a WEAPON card". Conveniently, invade cards don't have this flag.


		let content = message.content;
		let contentArray = content.split('\n')
		//console.log(contentArray)
		contentArray = contentArray.filter((line) => line.includes("lancer-dice-total major"))
		contentArray = contentArray.filter((line) => line.includes("damage"))
		
		let damageArray = []
		const numreg = /\d+/;
	
		
		contentArray.forEach(line => {
			console.log(line)
			console.log(line.match(numreg)[0])
			damageArray.push([parseInt(line.match(numreg)[0]), checkDamage(line)]) //get damage number AND type
		})
		
		
		/*
        let rollData = message.rolls[0].terms[0];
        let terms = rollData.terms; // all the formulae.
        let results = rollData.results; // all the RESULTS.

        for (let j = 0; j < terms.length; j++) {
            let t = terms[j];
            if (t.indexOf('1d20') == -1) { // i.e this is NOT AN ATTACK ROLL
                damageArray.push(parseInt(results[j].result));
                // ui.notifications.info(results[j].result)
            }
        }
		*/
		console.log(damageArray)
        if (damageArray.length > 0) {
            let attackingToken = game.actors.get(message.flags.lancer.attackData.origin)
            if (typeof attackingToken != 'undefined') {
                ui.notifications.info("Extracted damage values from " + attackingToken.name + "\'s last attack.")
            }
            let applyDamageMacro = game.macros.getName('Apply Damage');
            if (applyDamageMacro) {
                damageArray.forEach(dmg => applyDamageMacro.execute({args: dmg}));
            } else {
                ui.notifications.error("Macro 'Apply Damage' not found.");
            }
            break;
        }
    }
}


function checkDamage(line){
	let damagetypes = ["energy", "explosive", "kinetic", "heat", "burn"]
	for(let type of damagetypes){
		if(line.includes(type)){
			return type
		}
	}
	
}