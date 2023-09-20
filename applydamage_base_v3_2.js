/*
Lancer Apply Damage Macro
Written by StarsofCarcosa#0440

REQUIRES WARPGATE TO FUNCTION.
(Possibly also Math.js.)

Select (not target) any number of tokens and run the macro, which will bring up a small menu. Enter unmodified damage, check Resistance box if appropriate, and select damage type.

Kinetic/Energy/Explosive damage is all handled the same at the moment; tokens will take damage, accounting for armor.

Burn will pierce armor and also increment the Burn value.

Heat simply increments heat.


The GM recieves a whisper updating them on changed values, so it is easy to check that everything is correct and to revert damage done if necessary. You can disable this function by commenting out the chat code, near the bottom. The user of the macro will also recieve a UI notification containing the same info.

V2: Now accounts for overshield.

V3: some fixes


*/

const results = await warpgate.menu({
  inputs: [{
    label: 'Damage',
    type: 'number',
    options: typeof args != 'undefined' && typeof args[0] == "number" ? args[0] : null 
    //okay so here's a sneaky bit of code- this means that if you call the Apply Damage macro from a separate macro, you can pass in an argument to set the default damage value! Otherwise it's empty, for easy entry.
  },{
    label: 'Resistance',
    type: 'checkbox',
    options: false, 
    value: true  
  },{
    label: 'Exposed',
    type: 'checkbox',
    options: false, 
    value: true 
  },{
    label: 'Armor Piercing',
    type: 'checkbox',
    options: false, 
    value: true  
  }],
  buttons: [{
    label: '<img id=1 src=systems/lancer/assets/icons/damage_kinetic.svg width="80px"> </br> Kinetic',
    value: 1
  }, {
    label: '<img id=2 src=systems/lancer/assets/icons/damage_energy.svg width="80px"> </br> Energy',
    value: 1
  }, {
    label: '<img id=3 src=systems/lancer/assets/icons/damage_explosive.svg width="80px"> </br> Explosive',
    value: 1
  }, {
    label: '<img id=4 src=systems/lancer/assets/icons/damage_burn.svg width="80px"> </br> Burn',
    value: 4
  },{
    label: '<img id=5 src=systems/lancer/assets/icons/damage_heat.svg width="80px"> </br> Heat',
    value: 5
  }]
}, {
  title: 'Set Options',
  render: (...args) => { console.log(...args); }, //run code when rendering it
  close: (resolve, ...args) => {resolve(false)}, //run code when closing it
  options: {
    width: '100px',
    height: '100%',    
  }
})
if (!results) {
    console.log("canceled damage application");
    return;
}
console.log(results)

let selectedTokens = canvas.tokens.controlled;

let resistDmg = false;
let exposed = false;
let armorPiercing = false;
let damage = results.inputs[0];
if(!isNaN(damage)){ 
    if(typeof results.inputs[1] === 'string' || results.inputs[1]){ //this code causes me pain
        resistDmg = true;
    }
    if(typeof results.inputs[2] === 'string' || results.inputs[2]){
        exposed = true;
    }
    if(typeof results.inputs[3] === 'string' || results.inputs[3]){
        armorPiercing = true;
    }
    
    selectedTokens.forEach(token => {
        
        let name = token.name;
        let armor = token.actor.system.derived.armor;
        let hp = token.actor.system.hp;
        let heat = token.actor.system.heat;
        let burn = token.actor.system.burn;
        let overshield = token.actor.system.overshield;
        let output = ""
        
        // BASIC DAMAGE HANDLING
        if(results.buttons == 1){
            //use a new variable here so that it doesn't actually alter damage for the other parts of the loop.
            let tempdamage = damage;
            
            //if exposed, double damage.
            if(exposed){
                tempdamage = tempdamage * 2;
            }
            
            
            //if not armorpiercing, factor in armor.
            if(!armorPiercing){
                tempdamage = Math.max(tempdamage - armor, 0); //subtract armor
            }
            
            //if resistance, halve damage, rounding up.
            // order matters, of course- lancer is Exposed -> armor -> resistance.
            if(resistDmg){
                tempdamage = Math.ceil(tempdamage/2) 
            }
            if(overshield > 0 && overshield >= tempdamage){ 
                //case 1 - has overshield, damage doesn't break shield
                token.actor.update({"system.overshield": overshield - tempdamage});
                
                
                output = name + " has taken " + tempdamage + " damage (armor: " + armor + "), which was entirely absorbed by Overshield, leaving " + (overshield - tempdamage) + " overshield remaining.";
                tempdamage = 0;
                
            }else if(overshield > 0 && overshield < tempdamage){
                //case 2: has overshield, damage breaks overshield and deals real damage
                token.actor.update({"system.overshield": 0});
                
                output = name + " has taken " + tempdamage + " damage (armor: " + armor + "), which overwhelms their overshield and deals " + (tempdamage - overshield) + " true damage, leaving them at " + (hp - (tempdamage - overshield)) + " hp.";
                tempdamage = tempdamage - overshield;
                
            }else if(hp - tempdamage > 0){
                // case 3: no overshield, and no structure
                output = name + " has taken " + tempdamage + " damage (armor: " + armor + ") and has " + (hp - tempdamage) + " hp remaining.";
            }else{
                //case 4: no overshield and got structured.
                // I might remove the structure notification. It's not super useful, the system should already handle that.
                output = name + " has taken " + tempdamage + " damage (armor: " + armor + ") and has structured, leaving " + (hp - tempdamage) + " hp remaining.";
            }
            
            
            //look this isn't exactly an elegant method, but I'm not doing a full notification refactor right now. 
            if(resistDmg){ 
                output = output + "</br> [Resistance (x1/2)]"
            }
            
            if(exposed){ 
                output = output + "</br> [Exposed (x2)]"
            }
            
            if(armorPiercing){ 
                output = output + "</br> [Armor piercing]"
            }
            
            token.actor.update({"system.hp": hp - tempdamage});
            
            
        }else if(results.buttons == 4){
            // BURN HANDLING
            let tempdamage = damage; //pierces armor.
            
            let burndamage = damage;
            // unfortunately there's a bit of complexity here. Tempdamage is the 'current running total' of damage, i.e after resistance and overshield reductions. But the amount of burn you gain shouldn't count overshield, so we need a second variable to track it- hence burn damage.
            
            // burn can be resisted
            if(resistDmg){
                tempdamage = Math.ceil(tempdamage/2)
            }
            
            burndamage = tempdamage; 
            
            
            
            if(overshield >= 0 && overshield > tempdamage){
                token.actor.update({"system.overshield": overshield - tempdamage});
                output = name + " has taken " + burndamage + " burn, which was entirely absorbed by their overshield, leaving " + (overshield - burndamage) + " overshield remaining. They still catch on fire.";
                
                tempdamage = 0;
                
            }else if(overshield > 0 && overshield < tempdamage){
                token.actor.update({"system.overshield": 0});
                tempdamage = tempdamage - overshield;
                output = name + " has taken " + burndamage + " burn, which overwhelms their overshield, dealing " + tempdamage + " true damage and setting them on fire. They are left at " + (hp - tempdamage) + " hp.";
                
            }else if(hp - damage <= 0){
                output = name + " has taken " + burndamage + " burn and is now on fire, and has been structured. (ouch.)";
            }else{
                output = name + " has taken " + burndamage + " burn and is now on fire, leaving them at " + (hp - burndamage) + " hp.";
            }
            token.actor.update({"system.hp": hp - tempdamage, "system.burn": burn + burndamage}); //hp damage taken might be reduced by overshield, but burn gained is not.
            
        }else if(results.buttons == 5){
            // HEAT HANDLING
            let tempdamage = damage; 
            // I suppose heat can be resisted too.
            if(resistDmg){
                tempdamage = Math.ceil(tempdamage/2) 
            }
            
            token.actor.update({"system.heat": heat + tempdamage});
            if(heat + tempdamage > token.actor.system.derived.heat.max){
                output = name + " has taken " + tempdamage + " heat and has overheated! They are now at " + (heat + tempdamage) + " heat.";
            }else{
                output = name + " has taken " + tempdamage + " heat, and is now at " + (heat + tempdamage) + " heat.";
                
            }
        }
        
        ui.notifications.info(output);
        ChatMessage.create({ //comment this part out if you don't want stuff whispered to chat.
          content: output,
          whisper: ChatMessage.getWhisperRecipients("GM")
        });
        
        
    })
}else{
    ui.notifications.warn("No damage entered :(");
}