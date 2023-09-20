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


*/

let damageArray = [];
for(let i = -1; i >= -3; i--){
    let message = [...game.messages].at(i);
    if(typeof message.flags.lancer != 'undefined' && typeof message.flags.lancer.attackData != 'undefined'){
        // i.e "this is a WEAPON card". Conveniently, invade cards don't have this flag. 
        
        
        let rollData = message.rolls[0].terms[0];
        let terms = rollData.terms; //all the formulae.
        let results = rollData.results; // all the RESULTS.
        
        
        for(let i = 0; i < terms.length; i++){
            let t = terms[i];
            if(t.indexOf('1d20') == -1){ // i.e this is NOT AN ATTACK ROLL
                damageArray.push(parseInt(results[i].result));
                //ui.notifications.info(results[i].result)
            }
        }
        
        if(damageArray.length > 0){
            
            let attackingToken = game.actors.get(message.flags.lancer.attackData.origin)
            if(typeof attackingToken != 'undefined'){
                ui.notifications.info("Extracted damage values from " + attackingToken.name + "\'s last attack.")
            }
            damageArray.forEach(dmg => game.macros.getName('Apply Damage').execute(dmg)) //change name of macro here, if necessary.
            break;
        }
        
        
    }
}