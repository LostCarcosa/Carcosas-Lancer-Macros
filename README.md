# Carcosas-Lancer-Macros
A collection of useful macros I've written for the Lancer system on Foundry.

Currently, these macros are verified to work with Foundry V10.291, Lancer version [insert version here], though they should work on similar versions. 

This is _not_ a Foundry module! To add each macro to your game, simply create a new macro in your foundry world, set it to a script macro, and copy paste the macro in. Detailed information is included in the file for each macro, including any other module prerequisites; Please read carefully.

Basic description of the currently available macros:

## Apply Damage Macro
Requires: Warpgate, Math.js

Filename: applydamage_base

A macro that offers a quick little pop-up menu to apply damage to tokens. Select a token, run the macro, input the damage, and the macro will apply the damage correctly to the token. The macro automatically considers armor & overshield, and there are three extra settings that let you set if the damage should be resisted, if the damage is armor-piercing, or if the target is exposed. Supports heat/burn as well.

## Auto Apply Damage Macro
Requires: Warpgate, Math.js, Advanced Macros

Filename: applydamage_auto

A companion macro to the Apply Damage macro; this macro scans the chat for the _most recent_ weapon damage roll and then runs the Apply Damage macro, automatically filling out the damage field with the discovered damage. You still need to manually set resistance/exposed/armor piercing and choose the damage type. Saves a few seconds.

_Only_ detects weapon damage rolls; invades/grenades/etc don't roll damage and therefore aren't detected.

This _requires_ the Apply Damage macro to exist in the same Foundry world, and requires that it be named "Apply Damage" exactly. 


## Political Map Overlay Converter
Requires: Political Map Overlay, Math.js

Filename: polmap_converter_script

A macro that allows you to quickly create drawings in foundry to denote zones/cover/etc. Use the Political Map Overlay module to actually color the zones, then use this macro to quickly convert them into Foundry drawings. Can also convert Political Map Overlay zones into walls & difficult terrain (from Monk's Enhanced Terrain layer module). Highly customizable.


## Quick Combat Builder
Requires: Advanced Macros, Math.js

Filename: lancer_quick_combat_builder

A script that takes a text description of an encounter composition as input, and creates all the NPCs for you, complete with class/templates/optionals. Will also auto-assign art if you have the tokens uploaded. All NPCs are created into a folder of your choice. See header of macro for details on usage/formatting.



## Troubleshooting
I maintain a thread on the PILOT.NET discord server, which you can access [here](https://discord.com/channels/426286410496999425/1092876995341328445); if you need help getting these macros to work or you think you've found a bug or something, you can contact me there (ideally with your Foundry version, Lancer version, a description of your workflow, and screenshots of errors, if any).

Before doing so, however, please run through the generic self-troubleshooting steps:
1. Make sure you're using the most recent macro version
2. Make sure the macro is actually correctly installed & is set to script (as opposed to chat)
3. Double check all prerequisites are installed.
