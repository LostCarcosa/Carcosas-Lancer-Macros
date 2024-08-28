/* 
Lancer - Quick Combat Builder V1.3
Written by StarsofCarcosa#0440
See https://github.com/LostCarcosa/Carcosas-Lancer-Macros for documentation and other macros

Prerequisites: May require Advanced Macros and Math.js. 

V11 Compatiable Version. Not compatiable with V10.

Tested on Foundry 11.315, Lancer 2.2.4


Functionality: Allows you to write down an enemy composition into a journal entry, then easily create the entire composition into a folder, including class/templates/optionals. Hopefully saves a decent amount of time with drag/dropping and hunting down optional features.


-----------------------------

V1.1: Added error handling for when the macro cannot find the asset directory so that it doesn't crash. (oops.)

V1.2: V11 Compatiability (which involves adapting to new compendium structure)

V1.3: Updated to work with Lancer 2.2.4 (in particular, fixed issue arising from a minor change in how lancer handles a specific piece of data)
------------------------------

HOW TO SET UP (First time)
1. Create a new journal called ENEMY COMP

2. This journal should have two pages: one should be called ENEMY COMP (again) while the other one is called ENEMY COMP SETTINGS. Capitalization matters.

3. Ensure that the ENEMY COMP SETTINGS page is set to use the TinyMCE text editor instead of Markdown; this is necessary to prevent filepaths from breaking. Copy paste the following in:

FOLDER: 
ASSETS: 
FACTION: 
FILE EXTENSION: 
TIER: 

4. Create a new macro, set it to script, and copy paste this entire thing in.

------------------------------

HOW TO USE

1. Write down your enemy composition into the ENEMY COMP page. Each line should define a single NPC type, formatted as "#x TEMPLATE TEMPLATE TEMPLATE CLASS (Optional, Optional, Optional, ...)

For example:
ELITE SCOUT (Expose Weakness)
VETERAN BOMBARD (Bunker Breakers, Flare Drone)
2x BARRICADE (Drag Down, Extrudite)
4x GRUNT RONIN

(technically speaking the '#x ' term is not necessary, and does nothing, but the code can automatically remove it for you.) Make sure each NPC is on a separate line. 

If you're running from a module, you can often just copy this from the pdf, though you will likely need to manually fix any formatting errors that arise due to pdf line breaks being weird.

The macro will DO ITS BEST to account for irregularities and small formatting typos, as well as capitalization inconsistencies. The closer you adhere to the format the safer it will be.



2. Configure the settings. 
Write into the ENEMY COMP SETTINGS journal page.

FOLDER: Mandatory. All created NPCs will be placed into this folder. If it doesn't exist, it will be created.
ASSETS: optional, see below
FACTION: optional, see below
FILE EXTENSION: optional, see below
TIER: Mandatory; pick the NPC's tier, and all created NPCs will be that tier.






Optional Fields: The ASSETS, FACTION, and FILE EXTENSION fields are only necessary if you want to take advantage of automatic token art assignment. (You still may want to put in a placeholder word, as the macro does expect text there.)

In order to use this, your tokens must be contained in a folder foundry can access, and each token must be named in the format FACTION_CLASS.EXTENSION.

For example, IPSN_ASSAULT.webp
Then: 
ASSETS should be the filepath to the containing folder. For forge users, this should be the FULL filepath, i.e "https://assets.forge-vtt.com/[USER ID]/assets/tokens/".
FACTION should be the faction of relevance.
FILE EXTENSION should be the extension used (probably .png or .webp). All tokens need to use the same extension (at least for now, I may swap to auto-detection later)



3. Run the macro

4. Check the journal entry- if the macro managed to catch any errors, it will have reported them in a LOG page.



------------------------------

KNOWN ISSUES

- Certain optionals are 'linked'- like Sniper's Defensive Grapple/Relocation- but there's no  obvious way for foundry to know that it should grab these as a package. Will consider.

- Healing Tier 2+ NPCs to max is currently broken- they will remain at their T1 max hp. 
	This seems to be a weird issue where the max hp updates too slowly?

- Veterancy feature is not properly handled; wrote some quick code for it but it doesn't seem to work.



------------------------------

TROUBLESHOOTING

See https://github.com/LostCarcosa/Carcosas-Lancer-Macros for general troubleshooting tips

If you run into issues, you can contact me via the discord thread; please provide lancer version, foundry version, the input into your ENEMY COMP journal, whatever the LOG page says after running, and whatever NPCs actually get created, if any.




*/


// DO NOT TOUCH ANYTHING BELOW HERE (unless you know what you're doing). 

// GLOBAL
// load the three important compendiums globally. this is so I only have to do it once.
ui.notifications.info("Loading Compendiums... please wait.");

let globalComp = game.packs.get("world.npc-items") //V11 now has all NPC things in a single compendium.
await globalComp.getDocuments()
let classNames = []
let classIds = []
let templateNames = []
let templateIds = []

let featureNames = []
let featureLids = []
let featureIds = []

for(let item of globalComp){
	if(item.type == "npc_class"){
		classNames.push(item.name)
		classIds.push(item.id)
	}else if(item.type == "npc_template"){
		templateNames.push(item.name)
		templateIds.push(item.id)
		
	}else if(item.type == "npc_feature"){
		featureNames.push(item.name)
		featureIds.push(item.id)
		featureLids.push(item.system.lid)
	}
	
}

/*
let templateComp = game.packs.get("world.npc_template")
await templateComp.getDocuments()
for(let item of templateComp){
	templateNames.push(item.name)
	templateIds.push(item.id)
	
}



let featureComp = game.packs.get("world.npc_feature")
await featureComp.getDocuments()

*/

let error = false //global variable to allow us to detect if any irregularities have occured.
let errorlog = -1;







// all functions below


async function createEncounter(){
	//empty function containing pseudocode for now.
	
	// 0. initialize error logging, pop up notification telling user not to muck with anything
	ui.notifications.info("Encounter creation is starting! Please do not mess with NPCs until concluded.");
	
	//1 . process journal to extract the relevant text
	let journal_arr = await processJournal()
	
	let settings_text = journal_arr[0]
	let npc_text = journal_arr[1]
	
	console.log("Journal Processed")
	
	// 2. process the settings text
	let settings_obj = await processSettings(settings_text);
	console.log("settings processed ")
	
	
	//3. process the npc text
	let npcs_obj = await processNPCs(npc_text, settings_obj); //settings are being passed in so I can build & store image filepaths
	console.log("npcs processed")
	
	// 4. create folder
	folderid = await validateFolder(settings_obj)
	
	// 5. create all NPCs
	await buildAllNPCs(npcs_obj, folderid)
	
	// 6. conclude error logging, notify user of completion.
	if(error){
		ui.notifications.warn("Encounter creation has finished! There may be issues detected; please check the LOG page in the journal for info.");
	}else{
		ui.notifications.info("Encounter creation has finished! No irregularites were detected.");
	}
}


function logError(message, target = ""){ 
	//message is the relevant message
	//target is whatever NPC is being currently worked on
	error = true;
	let msg = "<br><br>" + target + ": " + message
 	
	errorlog.update({"text.content": errorlog.text.content + msg})
}

async function createClassList(){ //I actually don't quite remember why I was doing this (instead of using the global classNames variable.) Will need to sort it out sometime.
	let classPack = game.packs.get("world.npc-items")
	await classPack.getDocuments()
		
	let list = Array.from(classPack.entries())
	let classList = []
	for(let i = 0; i < list.length; i++){
		
		if(list[i][1].type == "npc_class"){
			classList.push(list[i][1].name)
		}
	}
	return classList
}


async function createTemplateList(){
	let templatePack = game.packs.get("world.npc-items")
	await templatePack.getDocuments()

	let list = Array.from(templatePack.entries())
	let templateList = []
	for(let i = 0; i < list.length; i++){
		if(list[i][1].type == "npc_template"){
			templateList.push(list[i][1].name)
		}
	}
	return templateList
}


async function processJournal(){ //wip
	console.log("Initializing")
	let journal = game.journal.getName("ENEMY COMP");
	
	let jnpcs = journal.pages.getName("ENEMY COMP");
	let jsettings = journal.pages.getName("ENEMY COMP SETTINGS");
	let npc_text = cleanString(jnpcs.text.content)
	let settings_text = cleanString(jsettings.text.content)
	
	
	//console.log("Journal retrieved")
	//console.log("npc_text: " + npc_text)
	//console.log("settings_text: " + settings_text)
	
	console.log("main processing concluded successfully")
	
	//now set up the error reporting area
	
	if(journal.pages.getName("LOG") === undefined){
		await journal.createEmbeddedDocuments("JournalEntryPage", [{"name": "LOG", "text.content": ""}]) 
	}
	errorlog = journal.pages.getName("LOG") //global error log created
	errorlog.update({"text.content": errorlog.text.content + "<br> <b>-- ENEMY COMP CREATION ERROR LOG -- <b> <br>"}) //in case we run multiple things in a row- this will help delineate it.
	
	return [settings_text, npc_text]
	
	
	
	
	
	
	
	
}



//processes the settings page; fairly straightforward
async function processSettings(str){
	console.log(str)
	let arr = str.split("\n")
	//console.log("setting array " + arr);
	for(let i = 0; i < arr.length; i++){
		
		let tempstring = arr[i] //extract text for easier work
		//console.log("tempstring: " + tempstring)
		
		let ind = tempstring.indexOf(": ") // search out the ": " key to figure out WHERE we want to split this stuff. we're not using .split(": ") in case somebody has put a ": " into their folder filepath, like a maniac.
		
		arr[i] = [tempstring.substring(0, ind), tempstring.substr(ind + 2, tempstring.length)]
		
	}
	
	console.log("beep")
	
	//this line from foundry discord
	let file_list = await FilePicker.browse("data", arr[1][1]).then(picker => picker.files).catch((error) => { console.log("files not found")});
	//this is not totally necessary, but we use it to later check whether the image paths located are valid or not. 
	
	if(file_list === undefined){
		file_list = []; //i.e pretend it is just empty; later code will find no images and keep the default.
		logError("Asset directory not found, check file path")
	}
	console.log("file_list is " + file_list)
	
	let obj = {
		"folder": arr[0][1],
		"assets": arr[1][1],
		"faction": arr[2][1],
		"ext": arr[3][1],
		"tier": Number(arr[4][1]),
		"filelist": file_list
	}
	//console.log("settingfilelist " + obj.filelist);
	return obj;
}


//processes all NPCs- major step that references a lot of other functions
async function processNPCs(str, settings){
	// first, compile a list of all class names
	// as well as all template names
	
	
	// the string input will look something like:
	// '1x VETERAN COMMANDER DEMOLISHER (Kinetic Compensation, Legendary, Quick March)\n4x GRUNT RONIN\n1x SUPPORT (Latch Drone, Remote Reboot)\n1x PRIEST (Sanctuary)'
	
	let classList = await createClassList();
	let templateList = await createTemplateList();
	
	
	
	// set up the array
	let npc_array = []
	
	let npc_split = str.split("\n") //break apart the NPC string into lines. This is an Array.
	
	for(let i = 0; i < npc_split.length; i++){
		let result = processSingleNPC(npc_split[i], classList, templateList, settings);
		if(result == -1){
			// send a call to the Error Report function - to do later
		}else{
			npc_array.push(result)
		}
	}
	return npc_array
}


function processSingleNPC(npc_text, classList, templateList, settings){
	//at this point, npc_text will look something like
	// 1x VETERAN COMMANDER DEMOLISHER (Kinetic Compensation, Legendary, Quick March)
	
	// step 1 is to split it apart by optionals.
	//console.log("settings = " + settings)
	
	
	let ind = npc_text.indexOf("("); //it would be easier to use .split(), but we're doing a little bit of extra proofing to catch the edge case of "somebody put an extra ( in their optional list- which might actually happen with something like Veterancy (Hull).
	
	
	
	let ind2 = npc_text.lastIndexOf(")");
	
	
	if(ind == -1){
		ind = npc_text.length
	}
	
	let optionals = npc_text.substr(ind + 1, ind2-1)
	console.log(npc_text)
	console.log(ind)
	let npc = npc_text.substr(0, ind)
	
	let npc_obj = {};
	
	
	if(npc.substr(npc.length - 1, npc.length) == " "){ //trim trailing space, if applicable
		npc = npc.substr(0, npc.length - 1)
	}
	
	
	// if there's a "number of npc" indicator nub of the form [number]x (like 2x or 3x), trim it out. This isn't TECHNICALLY necessary- it'll get discarded later since the term won't correspond to a class or template- but it'll reduce unnecessary output to the error log. 
	let indx = npc.indexOf("x")
	let nub = npc.substr(0, indx)
	if(indx != -1 && !isNaN(nub)){ // can't believe this works tbh
		npc = npc.substr(indx + 1, npc.length)
	}
	
	if(npc.substr(0, 1) == " "){
		npc = npc.substr(1, npc.length)
	}
	
	
	//npc should now look like 
	// "VETERAN COMMANDER DEMOLISHER". This is essentially the NPC's name, so
	npc_obj.name = npc;
	
	//console.log("total classList is " + classList)
	//console.log("now processing " + npc)
	
	// first, process class
	let npcClass = extractClass(npc, classList) //this returns an array of the form [class, "remaining terms"], i.e in our running example it should return ["DEMOLISHER", "VETERAN COMMANDER"]
	
	
	
	
	//if no class was found, return a -1 and break via return, letting the outer function know that there was a failure
	if(npcClass == -1){
		// call error log function TODO
		logError("Error finding class", npc)
		return -1
		
	}
	
	
	let templates = npcClass[1]
	npcClass = npcClass[0]
	npc_obj.class = npcClass;  //class loaded
	
	//console.log("Class determined: " + npcClass)
	
	npc_obj.image = buildFilepath(npcClass, settings)
	
	
	
	// then, process template
	
	npcTemplates = extractTemplates(templates, templateList) //should return an array of templates like ["VETERAN", "COMMANDER"]. anything remaining at end is to be reported to error log, then discarded, so it's not necessary to include here.
	
	npc_obj.templates = npcTemplates
	//console.log("templates determined: " + npcTemplates)
	
	//finally, process optionals. this step is fairly easy because we're not doing verification yet, just splitting them up. We split by commas and do a little validation
	
	//optionals should look like "Kinetic Compensation, Legendary, Quick March" right now. (There might be a trailing right paren, but it should be cleaned out easily. Can't seem to get rid of it preemptively for unknown reasons.)
	npcOptionals = extractOptionals(optionals)
	npc_obj.optionals = npcOptionals
	//console.log("optionals determined: " + npcOptionals)
	
	
	// set tier
	npc_obj.tier = settings.tier;
	
	return npc_obj
	
}

function buildFilepath(npcClass, settings){
	//this takes the class name and builds an appropriate image filepath of the form "ASSETPATH/FACTION_CLASS.EXT"
	// this function is designed to ignore capitalization issues- i.e it will detect VSAF_ASSAULT.webp to match VSAF_Assault.webp, and locate the correct file.
	//this is so you don't have to precisely name your npc image files to correspond to exactly how the lcp authors capitalized their classes.
	//this may cause problems if you are somehow distinguishing multiple files via capitalization alone, but I consider that to be a bad idea to begin with.
	
	//console.log("settings = " + settings)
	//console.log("settings.filelist = " + settings.filelist)
	
	let filelist = settings.filelist
	let caps_filelist = arrayToUpperCase(filelist)
	
	
	let assetpath = settings.assets
	if(assetpath[assetpath.length-1] != "/"){
		assetpath = assetpath + "/"
	}
	
	let ext = settings.ext
	if(ext[0] != "."){
		ext = "." + ext
	}
	
	
	let filename = settings.faction + "_" + npcClass + ext
	let filepath = assetpath + filename
	
	
	
	//note what is done here- compare a fully capitalized filelist with the capitalized  filepath. If a match is found, then return the corresponding entry in the original filelist.
	let i = caps_filelist.indexOf(filepath.toUpperCase());
	if(i != -1){
		return filelist[i]  	
	}else{
		// ERROR REPORTING HERE
		return -1 // later- will interpret '-1' as 'do not set image', and allow foundry to assign it the default NPC icons from the inbuilt retrograde stash.
	}
}




function compareStringContents(str1, str2){ //compare two string while ignoring capitalization
	str1 = str1.toUpperCase();
	str2 = str2.toUpperCase();
	return str1 == str2;
}


function extractClass(npc, classList){
	//npc string looks like
	// "VETERAN COMMANDER DEMOLISHER"
	// at this point. 
	
	// the fact that a NPC class name could theoretically contain spaces makes this task a little annoying.
	
	// first, we process classList and replace any element that contains a Space with an array, split into words. i.e a class called "BIG IRON" would be reformatted to ["BIG", "IRON"]
	
	//then we split NPC into an npc_array (i.e ["VETERAN", "COMMANDER", "DEMOLISHER"]
	
	// then we iterate through classList, checking to see if the class is in the npc_array. if it is, record where it is, then keep going.
	// at the end, if multiple classes are detected, take the one with the highest index.
	
	// this is to account for weird homebrew nonsense- it is possible that homebrew A will add a class called PUPPETEER while homebrew B adds a template called PUPPETEER, and we would not want it to claim that a PUPPETEER SPITE was a PUPPETEER instead of a SPITE.

	//this is a real example- I'm pretty sure I have both a PUPPETEER class and PUPPETEER template loaded.
	
	// currently this script does not account for, say, classnames that contain each other- for example, it will not adequately handle if you have a class called "BIG IRON" and another class called "IRON". 
	
	let npc_split = npc.toUpperCase().split(" "); //make sure everything is upper case.
	
	
	let located = []
	let positions = []
	let numwords = []
	for(let i = 0; i < classList.length; i++){
		if(classList[i].indexOf(" ") != -1){
			classList[i] = classList[i].split(" ");
		}
		
		let currentclass = classList[i]
		
		if(typeof currentclass === 'string'){
			
			let ind = npc_split.lastIndexOf(currentclass.toUpperCase());
			if(ind != -1){
				positions.push(ind)
				numwords.push(1)
				located.push(currentclass)
			}
			
			
			
			
		}else{ //arraycase
			//let ind = npc_split.lastIndexOf(currentclass[0].toUpperCase());
			
			
			let ind = findLastIndexOfSubarray(arrayToUpperCase(npc_split), arrayToUpperCase(currentclass))
			
			/* outdated in favor of above handler function
			if(ind != -1){
				for(let j = 1; j < currentclass.length; j++){
					if(!compareStringContents(npc_split[ind + j], currentclass[j])){
						ind = -1;
						break;
					}
					
				}
			}
			*/
			
			if(ind != -1){
				positions.push(ind)
				numwords.push(currentclass.length)
				located.push(currentclass.join(" "))
				
			}
			
			
		}
		
		
		
	}
	
	//at this point we should have three arrays, assuming we initially inputted
	// "DEMOLISHER DEMOLISHER RAINMAKER BIG IRON
	// where we assume BIG IRON is some homebrew class
	// theoretically should have arrays
	// located: ["BIG IRON", "DEMOLISHER", "RAINMAKER"]
	// positions: [3, 1, 2]
	// numwords: [2, 1, 1]
	
	
	let max = Math.max(...positions)
	
	// this also doesn't account for the case where you have multiple things at the SAME position- like if you had the classes "BIG" and "BIG IRON". To account for that, we'd look for all instances of max, then find some way to choose one (probably by taking the one with the corresponding largest num[] element). 
	
	//which actually does occur; for example, the Enhanced Combat supplement as a Scout Craft npc, which clashes with Scout. But that's an optional objective so I'm going to put off dealing with it.
	
	let maxind = positions.indexOf(max);
	
	let nwords = numwords[maxind]
	let name = located[maxind]
	
	npc_split.splice(max, nwords);
	
	//console.log("located " + located)
	//console.log("positions " + positions)
	//console.log("max" + max)
	
	
	
	//note: one thing we did here, which is either very important or entirely worthless, is that we preserved the formal capitalization of the class name. LCPs are sometimes inconsistent in the capitalization- some format it as ASSAULT but some do Assault.
	// since we later have to lookup the class name in the compendium, we have kept the official capitalization. if the lookup is case-sensitive, this will save us some work later.
	//if not, oh well, doesn't hurt.
	return([name, npc_split.join(" ")]) 
}


function extractTemplates(templates, templateList){
	templates.replaceAll("  ", " "); //kill off any double spaces, just in case.
	templates = templates.split(" ")
	
	
	//in the extractClass function, I structured things in a very specific way to account for overlapping class/template names. I no longer need to do that, as we expect everything remaining to be a template, and we don't expect template names to overlap.
	
	// still need to account for multiword templates (like Industrial Mech),  but we're using a different search process this time.
	
	
	let orphan = [] //'orphan' templates, i.e templates that didn't find a corresponding template in the lcp, to be reported as errors later.
	
	let located = [] //templates which have a corresponding lcp located.
	
	for(let i = 0; i < templates.length; i++){
		
		let currentTemplate = templates[i]
		let found = false;
		
		
		for(let j = 0; j < templateList.length; j++){
			let listedTemplate = templateList[j]
			
			//we use the countSpace function here to figure out how many words we have to consider. 
			
			let words = countSpace(listedTemplate)
			
			currentTemplate = templates.slice(i, i + words + 1).join(" ");
			if(compareStringContents(currentTemplate, listedTemplate)){
				//if found, good! set found to true, add it to located, then abort this internal for-loop.
				
				found = true;
				located.push(listedTemplate);
				break;
			}
		}
		
		
		if(!found){
			orphan.push(currentTemplate)	
		}
	}
	
	
	// ERROR REPORT
	// push orphaned stuff to ERROR REPORT here.
	if(orphan.length >= 1){
		logError("These templates were not matched: " + orphan + " from the total list of " + templates); 
	}
	return(located)
}



function extractOptionals(str){
	// the optionals should look like "Kinetic Compensation, Legendary, Quick March" right now.
	//this function is a simple split plus some trimming of extraneous spaces.
	if(str[str.length -1] == ")"){
		str = str.substr(0, str.length -1)
	}
	str = trimSpaces(str)
	let arr = str.split(",") //contemplating whether it would be smarter to split by ", " or ","- but it's probably better to catch the case where somebody forgot a space.
	
	
	arr = arr.map( (x) => trimSpaces(x))
	return arr;
}






// from here on out, we're mostly dealing with actor creation


// checks for an existing, appropriate folder. if none exist, create one.
// once folder is established, return the id
async function validateFolder(settings){
	let folderName = settings.folder;
	let folder = game.folders.getName(folderName)
	
	if(folder === undefined || folder.type != "Actor"){
		folder = await Folder.create({type:'Actor', name:folderName})
	}
	
	folder = game.folders.getName(folderName);
	return folder.id;
}



async function buildAllNPCs(npc_list, folder_id){
	//something we need to remain conscious of in this macro is that compendiums unload themselves after a while.
	// I don't THINK this will be an issue, but if it is, we may need to restructure this macro.
	
	/*
	for(let i = 0; i < npc_list.length; i++){
		
		
	}
	*/
	
	
	for(let i = 0; i < npc_list.length; i++){
		await buildSingleNPC(npc_list[i], folder_id) //maybe I can async this? I don't THINK it's vital for the game to build NPCs sequentially.
		
	}
}

async function buildSingleNPC(npc_data, folder_id){
	let name = npc_data.name
	let mech = 0 
	
	console.log("Beginning build of " + name)
	
	if(npc_data.image==-1){ //no image assigned
		mech = await Actor.create({
			name: name,
			type: "npc",
			folder: folder_id
		});
	}else{
		mech = await Actor.create({
			name: name,
			type: "npc",
			folder: folder_id,
			img: npc_data.image // NOTE: current experience is that this... seems to do nothing, and it goes to the default empty image anyway. may need to set the image explicitly later. (or my test case is just broken somehow)
		});
	}
	

	
	// 1. add the Class. 
	let classItem = await populateClass(mech, npc_data);
	
	// 1.5 add in optionals associated with the Class:
	let optionals = npc_data.optionals
	optionals = await populateOptionals(mech, classItem, optionals);
		//note- try to populate class optionals FIRST so that class stuff can be grouped together.
	
	
	// 2. loop through templates, add templates, and add optional features,
	
	let templates = npc_data.templates
	for(let temp of templates){
		let templateItem = await populateTemplate(mech, npc_data, temp)
		
		optionals = await populateOptionals(mech, templateItem, optionals)
		
	}
	
	
	// 3. special code to handle certain common optionals that will have been missed by previous code.
	
	let still_unmatched_optionals = []
	if(optionals.length > 0){
		for(let opt of optionals){
			let t = handleSpecialOptional(mech, opt)
			if(!t){
				still_unmatched_optionals.push(opt)
			}
		}
	}
	
	// at this point, still_unmatched_optionals is the final list of optionals that will be abandoned, and therefore will be outputted to the error report.
	
	
	
	// 4. set tier
	//console.log("tier is " + typeof npc_data.tier)
	await mech.update({"system.tier": npc_data.tier});
	
	
	
	

	
	
	if(npc_data.image != -1){
		mech.update({"img": npc_data.image, "prototypeToken.texture.src": npc_data.image }); //setting image to make sure.
		// weirdly, the initial creation seems to set the prototype token image rather than the actor image. I had assumed the opposite would happen based on the data structure.
	}else{
		//setDefaultArt(mech, npc_data.class) //no longer necessary due to drag-drop
		logError("No art found", npc_data.name)
	}
	
	
	//heal them to full - in case tier change messed them up
	await mech.update({"system.hp": mech.system.hp.max}) //for some reason this... doesn't really work- it seems like it takes a nonzero amount of time for the max hp to update and this code runs too quickly. hm.
	
	
	/* ERROR REPORTING GOES HERE */
	if(still_unmatched_optionals.length >= 1){
		logError("The following optionals were not located: " + still_unmatched_optionals, npc_data.name)
	}
	
}


async function populateClass(actor, npc_data){
	let classItem = 0;
	for(let item of globalComp){
		if(item.type == "npc_class" && item.name == npc_data.class){
			classItem = item;
			break;
		}
	}
	
	if(classItem == 0){
		//major error - submit report
		logError("Error populating class", npc_data.name)
		return -1
	}
	
	// In lancer V11- the quickOwn function has singificantly simplified this step.
	await actor.quickOwn(classItem) //this emulates drag-drop behavior, which autopopulates the base templates, sets mech images, fills to max hp, etc.
	
	//console.log("created " + npc_data.class + " on " + actor.name)
	
	
	// here: we do a weird thing where we extract the class item that we JUST added to the NPC. This is for a bit of a technical reason:
	// 1. classItem contains all the information on the optional systems of the class
	// 2. if you take the classitem directly from the compendium, it doesn't actually load the necessary data on the optionals
	// 3. so we have to instead load it into the sheet (where the drag-drop code forces it to load the optionalfeature info) 
	// 4. then extract it and pass it out, so that the rest of the code can access the optional feature info.
	
	// V11 update: I'm not 100% sure this part is necessary anymore.
	let classes = actor.items.filter(f => f.name == npc_data.class && f.type == "npc_class")
	//console.log("all classes found :" + classes)
	if(classes.length == 1){
		classItem = classes[0]
	}else{
		//something is wrong- error report and abort
		logError("found two classes on sheet- not valid", npc_data.name)
		return -1
	}
	
	
	
	
	return classItem; // this function automatically updates the actor, but we pop the classitem back out for later.
}


async function populateOptionals(actor, ctItem, optionals){
	// actor is the actual actor- we can modify it directly
	// ctItem is the actor's class OR template, which includes a list of all of the class's optionals.
	// optionals is an array containing EVERY optional system the mech has; some of these are probably class optionals.
	
	// in theory this should apply for both classes and templates. 
	
	//console.log("processing " + optionals)
	
	let optionalFeatures = Array.from(ctItem.system.optional_features) 

	
	let unmatched_optionals= [] //compile a list of optionals that have not been matched. This is easier than trimming an array, imo.
	let matchedOptLids = []
	let optFeatureNames = optionalFeatures.map(f => getOptFeatNameFromLid(f)) // need to look up optional feature names from LID.
	
	
	for(let opt of optionals){
		console.log("hi!")
		console.log(optFeatureNames)
		found = false;
		for(let i = 0; i < optionalFeatures.length; i++){
			
			console.log(optFeatureNames[i])
			if(compareStringContents(opt, optFeatureNames[i])){
				found = true;
				matchedOptLids.push(optionalFeatures[i]) //add lid to array
				break;
			}
		}
		if(!found){
			unmatched_optionals.push(opt)
		}
	}
	
	//drag drop is unnecessary here because there's no 'linking' in individual features.
	
	
	optFeatureArr = []
	for(let lid of matchedOptLids){
		let optItem = await game.lancer.fromLid(lid);
		optFeatureArr.push(optItem)
	}
	//optFeatureArr = matchedOptLids.map(lid =>  game.lancer.fromLid(lid)) //
	
	actor.createEmbeddedDocuments("Item", optFeatureArr); 
	//console.log("remaining optionals: " + unmatched_optionals)
	return unmatched_optionals
}

function getOptFeatIdFromLid(lid){
	let ind = featureLids.indexOf(lid);
	return featureIds[ind]
}

function getOptFeatNameFromLid(lid){
	let ind = featureLids.indexOf(lid);
	return featureNames[ind]
}

function getOptFeatName(optFeatId){
	return globalComp.get(optFeatId).name
}

async function populateTemplate(actor, npc_data, templateName){
	//this is almost identical to populateClass. in theory we probably could merge the functions.
	
	let templateItem = 0;
	for(let item of globalComp){
		if(item.type == "npc_template" && item.name == templateName){
			templateItem = item;
			break;
		}
	}
	
	if(templateItem == 0){
		//major error - submit report
		logError("Error populating template " + templateName, npc_data.name)
		return -1
	}
	
	/*actor.createEmbeddedDocuments("Item", [templateItem]) 
	let templateMM = await templateItem.sheet.getDataLazy(); // yeah I don't know why either
	templateMM = templateMM.mm
	await actor.sheet.on_root_drop(templateMM, "", "")
	*/
	await actor.quickOwn(templateItem)

	
	
	let templates = actor.items.filter(f => f.name == templateName && f.type == "npc_template")
	//console.log(templates)
	if(templates.length == 1){
		templateItem = templates[0]
	}else{
		//something is wrong- error report and abort
		logError("Template " + templateName + " does not seem unique on actor", npc_data.name)
		//console.log("something wrong: " + templates)
		return -1
	}
	
	return templateItem; // this function automatically updates the actor, but we pop the templateItem back out for later.
}

function handleSpecialOptional(actor, optional){
	//optional should be a string
	// returns true if the optional was handled, and false if not.
	
	//first, handling veterancy. NPC comps may indicate intended veterancy stat in the form Veterancy: Hull or Veterancy (Agility), etc. 
	// we don't really care exactly how its formatted- if the feature includes Veterancy, then we count it.
	// then we go into the actor, find their Veterancy feature, and replace its name with the optional feature's name.
	// i.e it would rename the default Veterancy feature to Veterancy: Hull
	if(optional.includes("Veterancy")){
				
		
		let vet = actor.items.getName("Veterancy");
		vet.update({"name": optional});
		return true;
	}
	
	return false;
	
}

/*
async function healMech(actor){
	actor.update({"system.hp": actor.system.derived.hp.max})
}
*/

async function setDefaultArt(actor, className){
	let base = "systems/lancer/assets/retrograde-minis/Retrograde-Minis-Corpro-"
	let ext = ".png"
	
	let filename = base + className + ext
	
	
	let file_list = await FilePicker.browse("data", "systems/lancer/assets/retrograde-minis/").then(picker => picker.files);
	for(let file of file_list){
		if(file.includes(className)){ //if there's a file that contains the classname, accept it. 
		//This code is real risky, admittedly, because it might again detect certain classNames as a substring of other files (i.e detecting ACE as part of a PC mech frame's name. I don't think it'll be an IMMEDIATE issue with core but maybe a new mech will release that mucks it up, and in particular it may interact badly with homebrew NPC names. I could do a safer brue force (make an explicit list of NPC class names and only accept those for default imaging)
			mech.updateEmbeddedDocuments({"img": filename, "prototypeToken.texture.src": filename });
			break;
		}
	}
	return;
	
	
	// if you wanted to set a default image for stuff that DOESN'T have a default image- like homebrew mechs- you can do so here. I prefer to leave it blank so it's immediately obvious that it's missing.
	
}






// RUN CODE --------

createEncounter();





// -----------




































































// utility functions
// these functions handle some tasks I repeat.

function trimLeadingSpaces(str){
	//takes a string like "              hello world" and trims it down to "hello world" using recursion
	
	if(str[0] == " "){
		return trimLeadingSpaces(str.substr(1, str.length))
	}else{
		return str
	}
	
}

function trimTrailingSpaces(str){
	//takes a string like "hello world         " and trims it down to "hello world"
	if(str[str.length-1] == " "){
		return trimTrailingSpaces(str.substr(0, str.length - 1))
		
	}else{
		return str
	}
}

function trimSpaces(str){
	return trimLeadingSpaces(trimTrailingSpaces(str))
}



// finds the last occurence of a subarray in a larger array
function findLastIndexOfSubarray(bigarr, smallarr){ //this may not be efficient.

	//bigarr = bigarr.slice(start_index)
	
	let i = bigarr.lastIndexOf(smallarr[0])
	
	
	let found = false;
	while(i != -1 && !found){
		
		
		for(let j = 1; j < smallarr.length; j++){
			if(bigarr[i + j] != smallarr[j]){
				i = bigarr.lastIndexOf(smallarr[0], i -1)
				break; //abort the for loop and try again with a new i. If there are no new i, then it will set i = -1, aborting the while loop.
			}
			
			if(j == smallarr.length - 1){ //if the loop has made it this far, then we've found a subarray!
				found = true //set found to true, then break the for loop. Since found is true, the while loop will also end.
				break; 
			}
		}
		
	}
	
	if(i != -1){
		return i  //adjusting for start index
		
	}else{
		return -1
	}
	
	
}

//converts an array of strings to all upper case (mostly to use with findLastIndexOfSubarray)

function arrayToUpperCase(arr){
	return arr.map(function(x){return x.toUpperCase();})
	
}


function countSpace(str){
	//https://stackoverflow.com/questions/881085
	return(str.match(/ /g)||[]).length;	
}

// clears out <p> and </p> from strings (mostly to fix up journal formatting
function cleanString(str){
	
	return str.replaceAll("<p>", "").replaceAll("</p>","")
}
