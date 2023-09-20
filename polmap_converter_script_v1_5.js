/*
Convert Political Map Overlay Coloring to Drawings
Written by StarsofCarcosa#0440
V 1.5

May (?) require the Advanced Macros and Math.js modules to function. Also requires Political Map Overlay, obviously.
Supports IronMonk's Enhanced Terrain Layer, but is not required for main functionality.
Tested in Foundry 10.291, Lancer 1.5.4

This macro looks at the current scene's political map overlay and converts the regions colored by polmap into drawings. By default, it will turn every region into just an outline, but you can configure both the default drawing settings as well as custom settings for specific colors.

For example, you can set it up so that yellow regions are shaded in to represent zones of soft cover, while blue regions just recieve a hard outline to represent hard cover.

You could even do size/height labelling- for example, if you colored every H2 object in Orange, you could add a text option to write "H2" on every drawing made from an orange region.


Alter the booleans in the SETTINGS variable to change global functionality. (only 1 functional setting for now.)

Alter CONVERSION_SETTINGS to change how specific colors are converted into walls.

Alter DEFAULTSETTINGS to change the default for how colors are converted.

V1.1: now works for squares too
V1.2: now can convert into walls. (Must be enabled; see WALL_SETTINGS below.
V1.3: can now convert into difficult terrain
V1.4: reduce number of unnecessary walls created during wall conversion on square grid; add an option to SETTINGS that clears the polmap overlay after running.
V1.5: fixed shoddy variable initilaization causing errors for some people.

List of polmap colors:

#ff4500 Red
#ffa800 Orange
#ffd635 Yellow
#00a368 Dark Green
#7eed56 Light Green
#2450a4 Dark Blue
#3690ea Blue
#51e9f4 Light Blue
#811e9f Purple
#b44ac0 Light Purple
#ff99aa Pink
#9c6926 Brown
#ffffff White
#d4d7d9 Light Gray
#898d90 Gray
#000000 Black

*/
const SETTINGS = {
    "convertAllDrawings": true, //if false, it only converts polmap colors into DRAWINGS with explicit rules defined. If true, it converts all colors, applying default options when necessary
	"convertAllWalls": false, //same as above, but if true it converts all polmap regions into walls. This should PROBABLY ALWAYS BE FALSE unless you want too many walls.
	"convertAllTerrain": false, // same as above, but if true it converts all polmap region into difficult terrain. Again, SHOULD PROBABLY ALWAYS BE FALSE.
	"clearPolmap": false, //if true, it clears the current scene's political map overlay after running. mostly useful if you're exclusively using polmap for the purpose of this macro. Note that it will wipe ALL polmap overlay, not just the ones used.
}

const CONVERSION_SETTINGS = [ //in this array, you can alter how the conversion is run.
	{
		//this is an example settings box. You can delete any part that is irrelevant and it will default to whatever is defined in the DEFAULTSETTINGS. The "color" tag determines WHICH polmap colors it applies to- for example, ff99aa means this ruleset only applies to pink regions. see DEFAULTSETTINGS below for an explanation of what these settings mean. 
		"color": "#ff99aa",
		"bezierFactor": 0,
		"fillType": 0,
		"fillColor": "#fbff00",
		"fillAlpha": 0.5,
		"strokeWidth": 8,
		"strokeColor": "#ff0000", //makes outline red
		"strokeAlpha": 1,
		"texture": null,
		"text": "",
		"fontFamily": "Courier",
		"fontSize": 48,
		"textColor": "#FFFFFF",
		"textAlpha": 1,
		"hidden": false,
		"locked": false,
	},
	{
		"color": "#ff4500",  //another example
		"fillType": 1, //this one just makes it have solid fill. For any setting not explicitly defined, it will default to whatever is stored in DEFAULTSETTINGS
		"text": "hi" //and it says hi, to show that it can in fact do text!
	}  //add more settings below.
]
const DEFAULTSETTINGS = { // in retrospect I wish i had named it DEFAULT_SETTINGS but it's too late to change now
	"color": "DEFAULT", //default settings used if you fail to define something relevant, or if a color has no defined settings at all and convertAll = true.
	"bezierFactor": 0, //I think this is smoothingFactor
	"fillType": 0, // 0 = none; 1 = solid; 2 = pattern
	"fillColor": "DEFAULT", //color of fill - if you leave it as DEFAULT, it will be set to match the color of the polmap region
	"fillAlpha": 0.5, //opacity of fill
	"strokeWidth": 8, //width of stroke (i.e outline of the region)
	"strokeColor": "DEFAULT", //color of stroke - if you leave it as DEFAULT, it will be set to match the color of the polmap region
	"strokeAlpha": 1, //opacity of stroke 
	"texture": null, //an image texture (to be used with fillType = 2.)
	"text": "", // If you want to insert text, although this should probably be off by default
	"fontFamily": "Courier", // 
	"fontSize": 48, //
	"textColor": "#FFFFFF", // 
	"textAlpha": 1,
	"hidden": false, // the drawing starts hidden; will need to unhide for players to see
	"locked": false, // the drawing starts locked; will need to unlock to move it
}








const WALL_SETTINGS = [ //in this array, you can alter how converting to walls happens.
	/*
	{
		//again, this is an example settings box; it tells foundry to convert yellow regions into walls that block movement but not sight. See DEFAULT_WALLSETTINGS for more detailed info.
		"color": "#ffd635",
		"move": 20,
		"sight": 0

	} //add more color specific settings here.
	*/
]





// default wallsettings are "standard wall".
// limited block is basically like terrain walls- it allows you to see through one limited wall but not two.
const DEFAULT_WALLSETTINGS = {
	"light": 20, // 0 = blocks light, 10 = limited block, 20 = full block
    "move": 20, //0 = doesn't block movement, 20 = blocks movement
    "sight": 20, // 0 = doesn't block light, 10 = limited, 20 = full block
    "sound": 20, //same as light,basically
    "dir": 0,  // 0 = both, 1 = left, 2 = right
    "door": 0, // 0 = wall, 1 = door, 2 = secret door
    "ds": 0, // door state: 0 = closed, 1 = open, 2 = locked
    "flags": {} //you can add flags- like, for example, if you want to do WallHeight.
}

/*

if you use wallheight, you can create walls with wallheight settings via:
	"flags": {
		"wall-height": {
			"top": 0,
			"bottom": 1.5
		} 
	} 
	if you exclude either 'top' or 'bottom'; it'll default to infinity (I think).
*/

const TERRAIN_SETTINGS = [
	/* like walls, terrain is disabled by default. uncomment this section to enable the example default terrain.
	{
		"color": "#3690ea", //blue
		"multiple": 2,
		"elevation": 0, 
		"depth": 0, // 
		"opacity": 0.4, 
		"drawcolor": "#ffffff",
		"environment": "water",
		"obstacle": "",
		"flags": {}
	}
	*/
]


const DEFAULT_TERRAINSETTINGS = {
	"hidden": false, // terrain is secretly just bespoke drawing.
	"locked": false, // so these settings are basically the same.
	"multiple": 2, // multiplier on how much movement it takes to get through a patch of terrain. 2 = takes 2x movement.
	"elevation": 0, // I'm not 100% sure what terrain elevation and depth do
	"depth": 0, // presumably it ensures flying tokens don't get hit by the difficult terrain?
	"opacity": 0.4, 
	"drawcolor": "#000000", //note that color has to be EXPLICITLY set- if you leave it blank in an attempt to make it default to the ETL's global default, it'll just be invisible. Puttting DEFAULT here doesn't work yet.
	"environment": "", //any of ETL's environment settings- like "arctic", "coast", etc
	"obstacle": "", // any of ETL's obstacles, like "crowd" "current" etc. MUTUALLY EXCLUSIVE WITH ENVIRONMENT.
	"flags": {}
}









/*
Past this is stuff you should not touch. 





rough workflow (hex)

1. clean up the polmap history, to remove all overlaps. You might want to remove self-overlaps too.
	for example, if we painted a hex red, and then later overrode it by painting it green, we want to remove it entirely from the red history.
	
	this requires you to compare all hexes in the current event with hexes in the later event, IGNORING color- i.e just check to see if the SET of vertices is the same.
	
	
2. convert each element of the polmap history into a Shape.
	Specifically, every element of the polmap history is going to be a list of hexes.
	Turn each of those hexes into a cyclic graph (vertex + edge set).
	Remove all edges that OVERLAP across the hexes.
	Then filter through and remove all vertices with 0 edges.
	This should end up with the outline of the colored shape.

4. for each shape, create certain structures on the canvas based on the shape's color.
	for example, create walls of a particular height and add an elevation marker, as well as adding a drawing of a particular color
	
	
	
5. optionally delete polmap overlay.
Note: haven't actually figured out how to do this yet.


Note that you need SEPARATE processes for hexes and grids, because they are stored differently. Hexes are shape 3, squares are shape 1.

Square history Events are stored as an array of squares, but squares are defined as an origin, height, & width. We should be able to convert this into a set of vertices fairly easily, then pass it into the above functions.

*/

// step 0: get history for current scene. Check if square. If square, convert the squares to a vertex set.




let HISTORY = game.scenes.current.flags.polmap.history
let EVENTS = []
Object.assign(EVENTS, HISTORY.events) //make a DEEP COPY so we can meddle with it without messing up polmap.
let gridtype = game.scenes.current.grid.type
if(gridtype == 0){
	ui.notifications.error("This only works on scenes that have a proper grid!")
	return;
	
}
if(game.scenes.current.grid.type == 1){ //i.e square
	EVENTS = convert_square_to_hex(EVENTS)
}

const BORDERLIST = convert_all_events_to_borders()
for(let i = 0; i < BORDERLIST.length; i++){
	convert_border_to_drawing(BORDERLIST[i])
	convert_border_to_walls(BORDERLIST[i])
	convert_border_to_terrain(BORDERLIST[i])
}


if(SETTINGS.clearPolmap){
	game.scenes.current.setFlag("polmap", "history.events", [])
	game.scenes.current.setFlag("polmap", "history.pointer", 0)
}








function convert_square_to_hex(events){
	for(let e = 0; e < events.length; e++){
		let event = events[e]
		for(let i = 0; i < event.length; i++){
			let square = event[i]
			
			x = square.x
			y = square.y
			w = square.width
			h = square.height
			
			let newvertices = [
				x,
				y,
				x + w,
				y,
				x + w,
				y + h,
				x,
				y + h,
				x,
				y
			]
			let mod_square = {
				"shape": 1,
				"x": 0,
				"y": 0,
				"fill": square.fill,
				"vertices": newvertices
			}
			
			if(square.hasOwnProperty('blend')){
				mod_square.blend = square.blend
				
			}
			
			
			
			
			
			event[i] = mod_square
			
			
		}
		
		
		
	}
	console.log(events)
	return events
	
	
}


//step 1: Clean up the history.
//plug EVENTS into here.
function clean_events(events){  //verified works
	let hist_clean = []
	
	for(let i = 0; i < events.length-1; i++){
		let current_event = events[i]
		let new_event = []
		
		for(let s = 0; s < current_event.length; s++){
			let shape = current_event[s]
			let isUnique = true;
			for(let j = i + 1; j < events.length; j++){
				if(check_shape_in_event(shape, events[j])){
					isUnique = false;
					break;
				}
			}
			if(isUnique){
				new_event.push(shape)
				
			}
		}
		
		
		
		if(new_event.length >0){
		    hist_clean.push(new_event)
		}
	}
	hist_clean.push(events[events.length-1])
	//console.log(hist_clean)
	return hist_clean
	
	
}

function check_shape_in_event(shape, event){ // verified works
	// an event is just a list of shapes. We don't care about color for this.
	for(let i = 0; i < event.length; i++){
		let s = event[i]
		if(compare_shapes(shape, s)){
			return true;
			
		}
		
	}
	return false;
	
	
}

function compare_shapes(shape1, shape2){ //verified works
	// a shape is an element of an event object.
	// They are an object that contains a array Vertices (length 14 or 10) and a fill.
	// to compare two shapes, we ONLY care about whether they have the same vertices.
	
	
	// you may need to rewrite this function later if there's a precision issue.
	if(JSON.stringify(shape1.vertices) == JSON.stringify(shape2.vertices)){ 
		return true;
	}else{
		return false;
	}
	
}



// step 2: graph/shape conversion.


function convert_all_events_to_borders(){ // important function
	let borderlist = []
	let events_clean = clean_events(EVENTS)
	for(let e =0; e < events_clean.length; e++){
		let event = events_clean[e];
		//console.log("Cleaned Event:")
		//console.log(event) //cleaning events seems to work ok- haven't deeply verified.
		borderlist = borderlist.concat(convert_event_to_borders(event))
		
	}
	
	return borderlist;
	
}

// first, convert every shape into a graph.
// then merge all graphs within an event together


// converts an  individual event into a set of borders.
// each border contains an ordered edgeset, an ordered vertexset, and a color. this should be sufficient data to construct the border of the relevant object.
function convert_event_to_borders(event){
	// first, convert all shapes in the event to a graph object.
	
	
	let event_graphs = []
	for(let s = 0; s < event.length; s++){
		let shape = event[s]
		event_graphs.push(convert_shape_to_graph(shape)) //This appears to work.
	}
	//console.log(event_graphs)
	
	let color = event_graphs[0].color;

	//console.log("Converting event with color " + color)
	let graph_blend= event_graphs[0].blend; //it'll usually be undefined, but it'll be ERASE when we're doing an erasing task.
	
	
	// next, we want to build up a global edgeset.
	
	// for the edgeset- we should only add edges that appear EXACTLy once across all shapes.
	let border_edgeset = []
	let border_vertexset = [] //this is a bit of a decoy; we'll define the border vertexset more properly later.
	
	for(let i = 0; i < event_graphs.length; i++){ //there's an issue with this block- it seems unable to detect overlapping edges whenever i < j, for some reason.
		let graph1 = event_graphs[i];
		let edgeset1 = graph1.edgeset;
		for(let e1 = 0; e1 < edgeset1.length; e1++){
			let edge = edgeset1[e1]
			let unique = true; //assume it's unique.
			
			for(let j = 0; j < event_graphs.length; j++){ //go through every other edgeset and try to prove that it's not unique.
				if(i != j){
					let graph2 = event_graphs[j]
					let edgeset2 = graph2.edgeset
					
					for(let e2 = 0; e2 < edgeset2.length; e2++){
						let edge2 = edgeset2[e2];
						if(edges_equal(edge, edge2)){
							unique = false;
							break;
						}
						
					}
					
					
					if(!unique){ // if we've already found that it's not unique, stop looping.
						break;
					}
				}
			}
			
			if(unique){
				border_edgeset.push(edge)
				
			}
		}
		
	}
	
	//great! we should now have a border_edgeset for the object, which is essentially all we need.
	//console.log("Border edgeset: ")
	//console.log(border_edgeset)
	// we DO still want to define the vertex set... but we need to go check on our downstream tasks first.
	
	//there's another thing we want to do- this edgeset might not represent a SINGLE contiguous border, but instead represents multiple separate shapes. so we want to find a way to separate out our edgeset into multiple shapes. 
	
	
	let ord = order_edgeset(border_edgeset)
	//console.log("ord:")
	//console.log(ord)
	let ordered_edgesets = [ord.ordered]
	//console.log("ordered edgesets")
	//console.log(ordered_edgesets)
	let remaining = ord.remainder
	while(remaining.length != 0){ 
		ord = order_edgeset(remaining)
		ordered_edgesets.push(ord.ordered)
		remaining = ord.remainder
	}
	//console.log("remaining: ")
	//console.log(remaining)
	//console.log("ordered edgesets")
	//console.log(ordered_edgesets)
	
	let border_list = []
	for(let oe = 0; oe < ordered_edgesets.length; oe++){
		//console.log(oe)
		let ord_edgeset = ordered_edgesets[oe];
		border_list.push({
			fill: fix_fill(color), // fix the color so it's more easily readable by foundry
			edgeset: ord_edgeset,
			vertexset: convert_ordered_edgeset_to_vertexset(ord_edgeset),
			blend: graph_blend,
		});
		
		
	}
	return border_list; //returns a list of border objects. Each border object is basically what an event object ultimately needs to be.
	
}

function convert_shape_to_graph(shape){
	
	let vertices = convert_polmap_vertices(shape.vertices)
	
	let edges = [] 
	//console.log("convert shape to graph")
	//console.log(shape)
	for(let i = 0; i < vertices.length-1; i++){
		edges.push([vertices[i], vertices[i + 1]]) 
		// note an issue here- these edges are directed. While it'd be nice to be able to use sets, for some reason set comparison is pretty hard. So... we're going to have to do a few tricks.
	}

	vertices = [...new Set(vertices)]; // take out duplicate value.
	
	let graph = {
		vertexset: vertices,
		edgeset: edges,
		color: shape.fill,
		blend: shape.blend
	}
	
	//console.log("graph")
	//console.log(graph)
	return graph;
}


function convert_polmap_vertices(vertices){
    // takes a list of 14 or 10 values, which are essentially an array that goes [x_1, y_1, x_2, y_2,...]
    // and turns them into an array of vertices [[x_1, y_1], [x_2, y_2],...]
    let n = vertices.length;
	
    let resultvertices = [];
    for(let i = 0; i < n-1; i+=2){
        resultvertices.push([vertices[i], vertices[i+1]]);
    }
    return resultvertices;
	
	// note that there are 7/5 vertexes for hexes/squares; they repeat the first one.
    
}

function order_edgeset(edgeset){
	
	// begin by picking an arbitrary edge of the edgeset (we default to 0)
	let ordered_edgeset = [edgeset[0]]
	let remaining_edgeset = remove_edge_from_edgeset(edgeset[0], edgeset) //remaining_edgeset serves as the 'remainder'- if it's not empty, we can go find another border in there.
	
	// loop through. Look at the second vertex of the original edge, and try to find an edge that connects back to it.
	// if you do, add that edge to ordered_edgeset, then remove it from the original edgeset.
	
	for(let dummyvar = 0; dummyvar < edgeset.length; dummyvar++){ //dummyvar is never used, but we should never loop more than edgeset.length times, so this is here as a replacement for a while(true) so it doesn't just loop forever if we mess up.
		let last_edge = ordered_edgeset[ordered_edgeset.length - 1]
		let last_vertex = last_edge[1]
		let next_edge = find_edge_adj_to_vertex_in_edgeset(last_vertex, remaining_edgeset)
		if(next_edge == -1){
			break;
			//we're done
		}else{
			ordered_edgeset.push(next_edge)
			remaining_edgeset = remove_edge_from_edgeset(next_edge, remaining_edgeset)
			
		}
	}
	
	let obj = {
		ordered: ordered_edgeset,
		remainder: remaining_edgeset,
	};
	return obj;
	
	
	
	
}

function find_edge_adj_to_vertex_in_edgeset(vertex, edgeset){
	// given a vertex v, looks for an edge in edgeset of the form (v, w) or (w, v).
	// if in the form (w, v), it returns (v, w) instead.
	// if none available, returns -1;
	
	for(let e = 0; e < edgeset.length; e++){
		let edge = edgeset[e]
		if(edge_contains_vertex(edge, vertex)){
			if(vert_equal(edge[1], vertex)){
				edge = [edge[1], edge[0]]
			}
			return edge;
			
		}
		
	}
	return -1
	
	
}

function remove_edge_from_edgeset(edge,edgeset){
	return edgeset.filter(e => !edges_equal(e, edge))
	
}

function convert_ordered_edgeset_to_vertexset(edgeset){ 
	//iterates through an ordered edgeset (i.e of the form (v1, v2), (v2, v3), (v3, v4)) etc and essentially returns a path (v1, v2, v3, v4... vn, v1). note there will be 1 more vertex than edge- this is ok.
	if(edgeset.length == 0){
		return []
	}
	
	let vertexset = [edgeset[0][0]] // gets first vertex
	for(let e = 0; e < edgeset.length; e++){
		let edge = edgeset[e]
		vertexset.push(edge[1])
	}
	return(vertexset)
	
}

//checks whether two edges are equal 
function edges_equal(e1, e2){
	// e1 = [v1, w1] e2 = [v2, w2]
	let v1 = e1[0]
	let w1 = e1[1]
	let v2 = e2[0]
	let w2 = e2[1]
	
	let cond1 = vert_equal(v1, v2) && vert_equal(w1, w2);
	let cond2 = vert_equal(v1, w2) && vert_equal(w1, v2);
	return cond1 || cond2;
}

//checks whether two vertices are equal
function vert_equal(v1, v2){ //javascript array comparison is really annoying.
	// v1 = [x1, y1], v2 = [x2, y2]
	// equal iff x1 = x2, y1 = y2
	let x1 = v1[0]
	let x2 = v2[0]
	let y1 = v1[1]
	let y2 = v2[1]
	return ( Math.abs(x1 - x2) < 5 && Math.abs(y1 - y2) < 5) //here's a slightly 'blurry' equality- given that no grid size should ever be < 50; we can afford a little bit of blurry in the vertex to avoid any issues that might arise from rounding
	
	//return(x1 == x2 && y1 == y2)
	
}

// checks whether an edge is part of an edgeset
function edgeset_contains_edge(edge, edgeset){
	for(let i = 0; i < edgeset.length; i++){
		let e = edgeset[i]
		if(edges_equal(e, edge)){
			return true;
		}
	}
	return false;
	
}

// returns whether a vertex is adjacent to a given edge
function edge_contains_vertex(edge, vertex){
	return vert_equal(vertex, edge[0]) || vert_equal(vertex, edge[1]);
}

//returns degree of a vertex given a certain edgeset
function vertex_degree(vertex, edgeset){
	let deg = 0;
	for(let e = 0; e < edgeset.length; e++){
		let edge = edgeset[e]
		if(edge_contains_vertex(edge, vertex)){
			deg++
		}
	}
	return deg;
	
}





// at this point, we can finally convert all events to a large set of borders.






// step 3: start doing downstream tasks


//fixes the fill color from 0xffffff to #ffffff formatting
function fix_fill(col){
	if(col.length != 8){ //catches the case where COL may be improperly formatted- especially in the case where the area being handled is technically being erased.
		return "#FFFFFF" 
	}
	return "#" + col.substr(2,7)
}

// converts vertexes of the form [[a, b], [c,d]] to [a,b,c,d], because that's how foundry likes vertexes
// which, by the way, is a notation I absolutely hate. but ok.
function convert_paired_vertices_to_vertex_list(vertices){
	
	let vlist = []
	for(let v= 0; v < vertices.length; v++){
		let vert = vertices[v]
		vlist = vlist.concat(vert)
		
	}
	return vlist
}



function convert_border_to_drawing(border){
	if(border.blend == "ERASE"){
		return; //don't draw anything for erased areas.
	}
    let color = border.fill;
	//console.log("making a shape with color " + color)
    let vertexset = border.vertexset;
	let extrema = get_extrema_of_vertexset(vertexset);
	//console.log(extrema)
    // there is an additional problem here- it turns out drawings don't use absolute coordinates!
	// instead, they're relative to an origin point.
	// some adjustments need to be made.
	
	let xorigin = extrema.xmin
	let yorigin = extrema.ymin
	
	let vertexlist = convert_paired_vertices_to_vertex_list(vertexset);
	let adjustedvertexlist = [];
	for(let i = 0; i < vertexlist.length; i = i + 2){
		adjustedvertexlist.push(vertexlist[i] - xorigin);
		adjustedvertexlist.push(vertexlist[i+1]-yorigin);
		
	}
	
	
	let settings = process_settings(color)
	//console.log(settings)
	if(settings == -1){ //i.e if the parsed settings tells us that we should NOT do anything, stop the function.
		//console.log("Break!")
		return 
	}
	delete settings.color //this is useless
	
	
    let drawing = {
		"author": game.userId,
        "shape": {
            "type": "p",
            "radius": null,
			"height": extrema.height,
            "width": extrema.width,
			"points": adjustedvertexlist
        },
		"x": xorigin,
		"y": yorigin,
		"z": 0,
    }
	
	drawing = {...drawing, ...settings} //merge the two objects together, essentially adding on all the drawing settings into the drawing object.
    canvas.scene.createEmbeddedDocuments("Drawing", [drawing]);
    
}


function process_settings(color){
	let colsettings = 0;
	for(let i = 0; i < CONVERSION_SETTINGS.length; i++){
		let settings = CONVERSION_SETTINGS[i];
		if(settings.color == color){
			//console.log(settings.color)
			//console.log(color)
			colsettings = settings;
			break;
		}
		
		
	}
	if(colsettings == 0){
		if(SETTINGS.convertAllDrawings){
			// if there are no specific settings and convertAllDrawings is true, go with the default.
			
			let truesettings = {}
			Object.assign(truesettings, DEFAULTSETTINGS) // make a duplicate as a deep copy
			
			//make relevant replacements, if needed
			if(truesettings.strokeColor == "DEFAULT"){
				//console.log("setting default color to " + color)
				truesettings["strokeColor"] = color;
			}
			if(truesettings.fillColor == "DEFAULT"){
				truesettings.fillColor = color;
			}
			return truesettings
			
		}else{
			return -1; // if there are no defined settings, and convertAllDrawings is false, return -1 so the program knows not to make any drawings at all..
		}
	}
	let keys = Object.keys(DEFAULTSETTINGS)
	
	let truesettings = {};
	Object.assign(truesettings, DEFAULTSETTINGS) // make a deep copy of the default settings, which we will then override with any color-specific settings
	
	for(let k = 0; k < keys.length; k++){
		let prop = keys[k];
		if(colsettings.hasOwnProperty(prop)){
			truesettings[prop] = colsettings[prop]
			
		}
		
	}
	if(truesettings.strokeColor == "DEFAULT"){
		truesettings["strokeColor"]= color;
	}
	if(truesettings.fillColor == "DEFAULT"){
		truesettings.fillColor = color;
	}
	return truesettings
	
	
	
	
}

function process_wall_settings(color){
	let wallsettings = 0;
	for(let i = 0; i < WALL_SETTINGS.length; i++){
		let settings = WALL_SETTINGS[i];
		if(settings.color == color){
			//console.log(settings.color)
			//console.log(color)
			wallsettings = settings;
			break;
		}
		
		
	}
	if(wallsettings == 0){
		if(SETTINGS.convertAllWalls){
			// if there are no specific settings and convertAllDrawings is true, go with the default.
			
			let truesettings = {}
			Object.assign(truesettings, DEFAULT_WALLSETTINGS) // make a duplicate as a deep copy
			
			return truesettings
			
		}else{
			return -1; // if there are no defined settings, and convertAllDrawings is false, return -1 so the program knows not to make any drawings at all..
		}
	}
	let keys = Object.keys(DEFAULT_WALLSETTINGS)
	
	let truesettings = {};
	Object.assign(truesettings, DEFAULT_WALLSETTINGS) // make a deep copy of the default settings, which we will then override with any color-specific settings
	
	for(let k = 0; k < keys.length; k++){
		let prop = keys[k];
		if(wallsettings.hasOwnProperty(prop)){
			truesettings[prop] = wallsettings[prop]
			
		}
		
	}
	return truesettings
	
	
	
	
}






function get_extrema_of_vertexset(vertexset){
	//this function wants a VertexSet NOT a vertexlist, and will fetch the width + height (i.e difference between the largest & smallest x/y element) for the purpose of making a drawing.
	// for good measure it returns the min & max as well, since that may be useful.
	
	//vertexset is of the form [[x1,y1], [x2,y2]...]
	
	let xset = []
	let yset = []
	for(let i = 0; i < vertexset.length; i++){
		xset.push(vertexset[i][0])
		yset.push(vertexset[i][1])
	}
	
	let xminimum = Math.min(...xset)
	let xmaximum = Math.max(...xset)
	let yminimum = Math.min(...yset)
	let ymaximum = Math.max(...yset)
	return {
		width: xmaximum - xminimum,
		height: ymaximum - yminimum,
		xmin: xminimum,
		xmax: xmaximum,
		ymin: yminimum,
		ymax: ymaximum
	};
	
	
	
}





function convert_border_to_walls(border){ //not done yet
	if(border.blend == "ERASE"){
		return; //don't draw anything for erased areas.
	}
	
	let edges = border.edgeset;
	let color = border.fill
	
	
	
	if(gridtype == 1){ //i.e if the scene is square
		//we want to do a bit of wall cleanup. If we don't do this, it'll make a wall for every 1 grid segment, but when we're doing square grids we can often merge a lot of the walls together.
		// doesn't apply for hex grids, of course.
		let newedgeset = []
		
		for(let i = edges.length - 1; i > 0; i--){
			let currentedge = edges[i]
			let prevedge = edges[i-1]
			//edge is of form  [ [x1, y1], [x2, y2] ]
			// they should be merged if currentedge.y2 = prevedge.y1 OR currentedge.x2 = prevedge.x1
			if(currentedge[1][1] == prevedge[0][1] || currentedge[1][0] == prevedge[0][0]){
				let newedge = [prevedge[0], currentedge[1]]
				edges[i-1] = newedge 
				edges.splice(i, 1) // merge the edges, then replace the originals. this is why we're iterating backward over the set- it means we can safely mess with the sections we've already looked at without breaking the loop.
			}
			
			
		}
		
		//also you need to explicitly look at the first and last edge.
		let lastedge = edges[edges.length-1] //[v1, v2]
		let firstedge = edges[0] //[v2, v3]
		if(firstedge[1][1] == lastedge[0][1] || firstedge[1][0] == lastedge[0][0]){
			let newedge = [lastedge[0], firstedge[1]]
			edges[0] = newedge
			edges.splice(edges.length - 1,1)
		}
		
		
		
		
		
	}
	
	// this bit converts the edges from a set like [ [[x1, y1], [x2, y2]], [[x3, y3], [x4,y4]]] to [ [x1,y1,x2,y2], [x3,y3,x4,y4]]
	let edges_processed = [];
	for(let e = 0; e < edges.length; e++){
		let edge = edges[e]
		edges_processed.push(convert_paired_vertices_to_vertex_list(edge))
	} 
	console.log(edges_processed) //
	
	let settings = process_wall_settings(color)
	console.log(settings)
	if(settings == -1){
		return ;
	}
	delete settings.color
	let walls = []
	for(let i = 0; i < edges_processed.length; i++){
		let edge = edges_processed[i] //should be of form [x1, y1, x2, y2]
		let wall = {
			"c": edge
		}
		
		wall = {...wall, ...settings} //merge the other settings with the wall coordinates
		walls.push(wall)
		console.log(wall)
	}
	canvas.scene.createEmbeddedDocuments("Wall", walls)
	
	
	
}


function process_terrain_settings(color){
	let terrainsettings = 0;
	for(let i = 0; i < TERRAIN_SETTINGS.length; i++){
		let settings = TERRAIN_SETTINGS[i];
		if(settings.color == color){
			terrainsettings = settings;
			break;
		}
		
		
	}
	if(terrainsettings == 0){
		if(SETTINGS.convertAllTerrain){
			// if there are no specific settings and convertAllDrawings is true, go with the default.
			
			let truesettings = {}
			Object.assign(truesettings, DEFAULT_WALLSETTINGS) // make a duplicate as a deep copy
			
			return truesettings
			
		}else{
			return -1; // if there are no defined settings, and convertAllDrawings is false, return -1 so the program knows not to make any drawings at all..
		}
	}
	let keys = Object.keys(DEFAULT_TERRAINSETTINGS)
	
	let truesettings = {};
	Object.assign(truesettings, DEFAULT_TERRAINSETTINGS) // make a deep copy of the default settings, which we will then override with any color-specific settings
	
	for(let k = 0; k < keys.length; k++){
		let prop = keys[k];
		if(terrainsettings.hasOwnProperty(prop)){
			truesettings[prop] = terrainsettings[prop]
			
		}
		
	}
	return truesettings
}



function convert_border_to_terrain(border){ //fundamentally it's the samea s convert_border_to_drawings, it just pushes some differens ettings.
	if(border.blend == "ERASE"){
		return; //don't draw anything for erased areas.
	}
    let color = border.fill;
	//console.log("making a shape with color " + color)
    let vertexset = border.vertexset;
	let extrema = get_extrema_of_vertexset(vertexset);
	//console.log(extrema)
    // there is an additional problem here- it turns out drawings don't use absolute coordinates!
	// instead, they're relative to an origin point.
	// some adjustments need to be made.
	
	let xorigin = extrema.xmin
	let yorigin = extrema.ymin
	
	let vertexlist = convert_paired_vertices_to_vertex_list(vertexset);
	let adjustedvertexlist = [];
	for(let i = 0; i < vertexlist.length; i = i + 2){
		adjustedvertexlist.push(vertexlist[i] - xorigin);
		adjustedvertexlist.push(vertexlist[i+1]-yorigin);
		
	}
	
	
	let settings = process_terrain_settings(color)
	//console.log(settings)
	if(settings == -1){ //i.e if the parsed settings tells us that we should NOT do anything, stop the function.
		//console.log("Break!")
		return 
	}
	delete settings.color //this is useless
	
	
    let terrain = {
		"author": game.userId,
        "shape": {
            "type": "p",
            "radius": null,
			"height": extrema.height,
            "width": extrema.width,
			"points": adjustedvertexlist
        },
		"x": xorigin,
		"y": yorigin,
    }
	
	terrain = {...terrain, ...settings} //merge the two objects together, essentially adding on all the terrain settings into the terrain object.
    canvas.scene.createEmbeddedDocuments("Terrain", [terrain]);
    
}

