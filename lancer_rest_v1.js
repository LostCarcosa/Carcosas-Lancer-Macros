// Get the triggering player's owned pilots
let player = game.user;
let pilots = game.actors.filter(actor => actor.type === "pilot" && actor.isOwner);

if (pilots.length === 0) {
    ui.notifications.warn("You don't own any pilots.");
    return;
}

// If there's only one pilot, immediately proceed to open the window
if (pilots.length === 1) {
    openPilotWindow(pilots[0]);
} else {
    // Create the button list for multiple pilots
    let dialogContent = '<div class="lancer-hit card clipped" style="display: block; background-color: var(--background-color); padding: 10px; border-radius: 5px; color: white;"><h2>Select a Pilot</h2>';
    pilots.forEach(pilot => {
        dialogContent += `<button class="lancer-button lancer-secondary" style="display: block; margin: 5px; margin-left: -1px;" data-id="${pilot.id}">${pilot.name}${pilot?.system?.callsign ? ` [${pilot.system.callsign}]` : ''}</button>`;
    });
    dialogContent += '</div>';

    new Dialog({
        title: "Choose a Pilot",
        content: dialogContent,
        buttons: {},
        render: (html) => {
            html.find('button').click(ev => {
                let pilotId = ev.currentTarget.dataset.id;
                let selectedPilot = pilots.find(p => p.id === pilotId);
                openPilotWindow(selectedPilot);
            });
        }
    }).render(true);
}

// Fetch and accumulate contributions from recent chat messages
async function getAlliedRepairs() {
    const messages = await game.messages.contents.slice(-5); // Last 5 messages
    let totalAlliedRepairs = 0;
    
    messages.forEach(message => {
        if (message.content.includes("Rest Report") && message.content.includes("Contributed")) {
            const contributionMatch = message.content.match(/Contributed (\d+) Repairs/);
            if (contributionMatch) {
                totalAlliedRepairs += parseInt(contributionMatch[1], 10);
            }
        }
    });
    
    return totalAlliedRepairs;
}

// Function to open a new window with the mech image and Confirm/Cancel buttons
async function openPilotWindow(pilot) {
    let mechId = pilot.system.active_mech?.id?.replace("Actor.", "");
    console.log("Rest Macro | Mech ID: ", mechId);

    // Fetch the Mech actor by ID
    let mech = game.actors.get(mechId);
    let mechImg = mech ? mech.img : "systems/lancer/assets/icons/white/frame.svg"; // Default image if mech is missing

    // Retrieve active effects for cleared conditions list
    let activeEffects = mech.effects.map(effect => ({
        id: effect.id,
        name: effect.name,
        icon: effect.icon
    }));

    // Get mech properties
    let repairsValue = mech ? mech.system.repairs.value : 0;
    let maxRepairs = mech ? mech.system.repairs.max : 0;
    let initialHeatValue = mech ? mech.system.heat.value : 0;
    let maxHeat = mech ? mech.system.heat.max : 0;
    let hpValue = mech ? mech.system.hp.value : 0;
    let maxHP = mech ? mech.system.hp.max : 0;
    let hpRestored = maxHP - hpValue;
    let structureValue = mech.system.structure.value;
    let maxStructure = mech.system.structure.max;
    let stressValue = mech.system.stress.value;
    let maxStress = mech.system.stress.max;
    let structureRate = mech.system.structure_repair_cost;
    let stressRate = mech.system.stress_repair_cost;
    let contributedRepairs = 0;
    let repairIcon = "systems/lancer/assets/icons/white/repair.svg";
    let currentCost = 0;
    let alliedRepairs = await getAlliedRepairs();
    
    const isDestroyed = stressValue === 0 || structureValue === 0;
    
        // Reinitialization form if destroyed
    if (isDestroyed) {
        let totalAvailableRepairs = repairsValue + alliedRepairs;
        let repairsRequired = 4 - alliedRepairs;
        
        let reinitContent = `
            <div style="display: block; background-color: var(--background-color); padding: 5px; border-radius: 5px;">
                <span class="lancer-header lancer-primary card clipped" style="font-size: 18px; text-align: center; padding: 5px 0; margin-top: 15px;">
                    <strong>EMERGENCY RECOVERY MENU::</strong> ${mech.name}
                </span>
                
                <!-- Repairs Box -->
                <div style="background-color: var(--primary-color); color: white; font-size: 36px; padding: 10px; display: flex; align-content: center; margin-top: 15px; margin-left: 10px; max-width: 160px; max-height: 60px; justify-content: space-between; border-radius: 5px;" title="Repairs Available / Repair Capacity">
                    <img src="${repairIcon}" style="width: 36px; margin-right: 10px; border: none; overflow: hidden; transform: scale(1.8);">
                    <div style="align-content: center;">${repairsValue} / ${maxRepairs}</div>
                </div>
                

                <!-- Warning Icon and Message -->
                <div style="text-align: center; margin: 5px 0;">
                    <i class="mdi mdi-alert" style="font-size: 100px; color: var(--primary-color);"></i>
                    <div style="color: var(--primary-color); font-size: 24px; margin-top: 5px;"><strong>WARNING::</strong><br>CATASTROPHIC DAMAGE DETECTED</div>
                    <!-- Structure/Stress Icons -->
                    <div style="display: flex; justify-content: center; gap: 10px; margin: 5px 5px;">
                        ${structureValue === 0 ? `
                            <div style="position: relative; width: 64px; height: 64px; display: inline-block;">
                                <i class="mdi mdi-rhombus-outline" style="font-size: 64px; color: #1F9EFF;"></i>
                                <i class="mdi mdi-plus-thick" style="font-size: 44px; color: #1F9EFF; position: absolute; top: 57%; left: 50%; transform: translate(-50%, -50%);"></i>
                            </div>` : ""}
                        ${stressValue === 0 ? `
                            <div style="position: relative; width: 64px; height: 64px; display: inline-block;">
                                <i class="mdi mdi-circle-outline" style="font-size: 64px; color: #e74210;"></i>
                                <i class="mdi mdi-radioactive" style="font-size: 44px; color: #e74210; position: absolute; top: 57%; left: 50%; transform: translate(-50%, -50%); rotate(180deg);"></i>
                            </div>` : ""}
                    </div>
                </div>

                <!-- Repair Requirements -->
                        <div class="card clipped" style="color: white; margin-right: 10px; margin-left: 10px; margin-top: 15px;">
                            <div class="lancer-mini-header" style="display: flex; align-items: center; justify-content: center; height: 28px; font-size:16px;"><strong>REINIT::</strong>
                            </div>
                            <div class="lancer-hit" style="justify-content: left; display: flex; flex-direction: column; background-color: var(--darken-2); margin-top: 0px; margin-left: 0px; margin-right: 0px; padding: 7px 7px;">
                                <div style="display: flex-column; align-items: center; justify-content: center; color: white; font-size: 18px; margin: 5px 0;">Chassis recovery requires 4 repairs.<br>
                                    <button id="refreshAlliedRepairs" class="lancer-button lancer-secondary" style="padding: 2px 2px; font-size: 18px; max-width: 30px; margin: 5px;">
                                        <i class="mdi mdi-refresh" style="margin-left: 3px;"></i>
                                    </button>
                                    <span id="alliedRepairsCount">${alliedRepairs}</span>&nbsp;Allied Repairs Detected.
                                </div>
                                    <div style="display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
                                        <div id="repairsRequiredCount">${repairsRequired}</div>&nbsp;Additional Repair(s) required.<br>
                                    </div>
                            </div>
                        </div>


                <!-- Confirm and Cancel Buttons -->
                <div style="text-align: right; margin-top: 20px;">
                    <button id="confirmReinit" class="lancer-button ${totalAvailableRepairs < 4 ? 'lancer-secondary-highlight' : 'lancer-secondary'}" ${totalAvailableRepairs < 4 ? 'disabled' : ''}>Confirm</button>
                    <button id="cancelReinit" class="lancer-button lancer-secondary">Cancel</button>
                </div>
            </div>
        `;

        // Render the reinitialization dialog
        let reinitDialog = new Dialog({
            title: `Pilot: ${pilot.name} - Emergency Reinitialization`,
            content: reinitContent,
            buttons: {},
            render: (html) => {
                const reinitButton = html.find('#confirmReinit');
                
                // Check repairs available to toggle button class
                function toggleReinitButtonState() {
                    const reinitButton = html.find('#confirmReinit');
    
                    reinitButton.prop("disabled", totalAvailableRepairs < 4);
                    reinitButton.toggleClass("lancer-secondary-highlight", totalAvailableRepairs < 4);
                    reinitButton.toggleClass("lancer-secondary", totalAvailableRepairs >= 4);
                }

                toggleReinitButtonState(); // Run toggle check initially
            
                    // Refresh button handler
                html.find('#refreshAlliedRepairs').click(async () => {
                    alliedRepairs = await getAlliedRepairs();
                    totalAvailableRepairs = repairsValue + alliedRepairs;
                    repairsRequired = 4 - alliedRepairs;
                    
                    // Update the allied repairs display and button state
                    html.find('#alliedRepairsCount').text(alliedRepairs);
                    html.find('#repairsRequiredCount').text(repairsRequired);
                    toggleReinitButtonState();
                });
        
                reinitButton.click(async () => {
                    // Set mech stats to reinitialized values
                    const repairsRequired = 4 - alliedRepairs;
                    
                    if (alliedRepairs + mech.system.repairs.value >= 4) {
                        await mech.update({
                            "system.structure.value": 1,
                            "system.stress.value": 1,
                            "system.hp.value": mech.system.hp.max,
                            "system.repairs.value": mech.system.repairs.value - repairsRequired
                        });
                    
                    
                        let reinitMsgContent = `
                            <div class="card clipped-bot" style="margin: 0px;">
                                <div class="card clipped">
                                    <div class="lancer-mini-header">// Reinitialization Report //</div>
                                    <div class="lancer-hit">
                                        <div><img class="lancer-hit-thumb" src="${mechImg}" /></div>
                                        <div class="lancer-hit-text" style="display: inline;">
                                            [${pilot.name}] Reinitialized [${mech.name}]
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                    
                        ChatMessage.create({
                            content: reinitMsgContent,
                            speaker: { alias: pilot.name },
                        });
                        
                        reinitDialog.close();
                        openPilotWindow(pilot); // Reopen the regular rest menu
                    }
                });

                    html.find('#cancelReinit').click(() => reinitDialog.close());
            },
            options: { height: 400, width: 600 },
        }).render(true);

        return; // Stop here to avoid running the normal ledger if mech is destroyed
    }
    
    // Find destroyed weapons
    let destroyedWeapons = [];
    mech.system.loadout.weapon_mounts.forEach((mount, mountIndex) => {
        mount.slots.forEach((slot, slotIndex) => {
            let weapon = slot.weapon?.value;
            if (weapon?.system?.destroyed) {
                destroyedWeapons.push({
                    name: weapon.name,
                    weaponId: weapon._id
                });
            }
        });
    });
    
        // Find destroyed systems
    let brokenSystems = [];
    mech.system.loadout.systems.forEach((system, systemIndex) => {
        if (system?.value?.system?.destroyed) {
            brokenSystems.push({
                name: system.value.name,
                systemId: system.value._id
            });
        }
    });

    // Only render Clear Conditions button if there are active effects
    let clearConditionsButton = activeEffects.length > 0 ? `
        <button id="clearEffects" class="lancer-button lancer-secondary" style="padding: 5px 15px; border-radius: 5px; width: 84px; border: none; margin-right: 10px; margin-left: 5px;">CLEAR</button>
    ` : "";

        // Updated function to track total cost
        function updateRepairCost(baseCost = 0) {
            currentCost += baseCost; // Update currentCost with base adjustments
            const totalRepairs = currentCost + contributedRepairs;
            const confirmButton = document.getElementById("confirm");
    
            // Update display with total repairs cost
            const repairCostElement = document.getElementById("repairCost");
            repairCostElement.innerHTML = totalRepairs;

            // Visual feedback if total exceeds available repairs
            if (totalRepairs > repairsValue) {
                repairCostElement.style.color = "red";
                repairCostElement.style.fontWeight = "bold";
                confirmButton.disabled = true;
                confirmButton.className = "lancer-button lancer-secondary-highlight";
            } else {
                repairCostElement.style.color = "";
                repairCostElement.style.fontWeight = "normal";
                confirmButton.disabled = false;
                confirmButton.className = "lancer-button lancer-secondary";
            }
        }

    let content = `
    <div style="display: block; background-color: var(--background-color); padding: 5px; border-radius: 5px;">
        <span class="lancer-header lancer-primary card clipped" style="font-size: 18px; align-items: center; padding: 5px 0; margin-top: 15px;">
            <strong>REST MENU::</strong> ${mech.name}
        </span>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; height: 130px; background-color: var(--darken-2); margin-top: -13px; margin-left: 10px; margin-right: 10px;">
            <!-- Repairs Box -->
            <div style="background-color: var(--primary-color); color: white; font-size: 36px; padding: 10px; display: flex; align-content: center; margin-top: 15px; margin-left: 10px; max-width: 160px; max-height: 60px; justify-content: space-between; border-radius: 5px;" title="Repairs Available / Repair Capacity">
                <img src="${repairIcon}" style="width: 36px; margin-right: 10px; border: none; overflow: hidden; transform: scale(1.8);">
                <div style="align-content: center;">${repairsValue} / ${maxRepairs}</div>
            </div>
            <div class="lancer-header lancer-primary card clipped" style="flex-grow: 1; text-align: right; height: 110px; margin-top: 15px; max-width: 120px; align-content: flex-end;">
                <img src="${mechImg}" style="max-width: 100px; max-height: 100px; border: none;">
            </div>
        </div>
    
        <!-- CONDITIONS AND HEAT -->
        
        <div class="card clipped" style="color: white; margin-right: 10px; margin-left: 10px; margin-top: 5px;">
            <div class="lancer-mini-header" style="display: flex; align-items: center; justify-content: center; height: 28px;"><strong>CONDITIONS AND HEAT</strong>
            </div>
            <div class="lancer-hit" style="justify-content: left; display: flex; flex-direction: column; background-color: var(--darken-2); margin-top: 0px; margin-left: 0px; margin-right: 0px; padding: 7px 7px;">
                <div style="display: flex; align-items: center; justify-content: left; margin-top: 5px; width: 100%;">
                    <button id="heatReset" class="lancer-button lancer-secondary" style="padding: 5px 15px; border-radius: 5px; width: 85px; border: none; margin-left: 5px;">CLEAR</button>
                    <i class="cci cci-heat i--l" style="color:#e74210; font-size: 36px;"></i>
                    <div style="font-size: 24px;">${initialHeatValue} / ${maxHeat}</div>
                </div>
                <div style="display: flex; align-items: center; justify-content: left; margin-top: 5px; width: 100%; gap: 2px">
                    ${clearConditionsButton}
                    ${mech.effects.map(effect => `<img src="${effect.icon}" title="${effect.name}" style="width: 25px; height: 25px; background: #666666; border: none;" />`).join('')}
                </div>
            </div>
        </div>
        
        <!-- CHASSIS HEALTH -->
           
        <div class="card clipped" style="color: white; margin-right: 10px; margin-left: 10px;">
            <div class="lancer-mini-header" style="display: flex; align-items: center; justify-content: center; height: 28px;"><strong>CHASSIS HEALTH</strong>
            </div>
                        <!-- HP Row -->
            <div class="lancer-hit" style="justify-content: left; display: flex; flex-direction: column; background-color: var(--darken-2); margin-top: 0px; margin-left: 0px; margin-right: 0px; padding: 7px 7px;">
                <div style="display: flex; align-items: center; justify-content: left; margin-top: 5px; width: 100%;">
                    <button id="repairHP" class="lancer-button lancer-secondary" style="padding: 5px 5px; border-radius: 5px; width: 85px; border: none; margin-right: 22px; margin-left: 5px;">RESTORE</button>
                    <i class="mdi mdi-heart-outline" style="color: #1F9EFF; font-size: 36px;"></i>
                    <div style="font-size: 24px;">${hpValue} / ${maxHP}</div>
                </div>
    
                <!-- Structure Repair Section -->
    
                <div style="display: flex; align-items: center; margin-top: 5px; width: 100%;">
                    <button id="structureDecrease" class="lancer-button lancer-secondary" style="padding: 5px 15px; border-radius: 5px; width: 40px; border: none; font-size: 24px; margin-left: 5px;">-</button>
                    <button id="structureIncrease" class="lancer-button lancer-secondary"  style="padding: 5px 15px; border-radius: 5px; width: 40px; border: none; margin-left: 5px; font-size: 24px;">+</button>
                    <div id="structureIcons" style="display: flex; gap: 5px; margin-left: 20px;">
                        <!-- renderStructureIcons puts icons here -->
                    </div>
                </div>
    
                 <!-- Reactor Stress Repair Section -->
                <div style="display: flex; align-items: center; margin-top: 5px; width: 100%;">
                    <button id="stressDecrease" class="lancer-button lancer-secondary"  style="padding: 5px 15px; border-radius: 5px; width: 40px; border: none; font-size: 24px; margin-left: 5px;">-</button>
                    <button id="stressIncrease" class="lancer-button lancer-secondary" style="padding: 5px 15px; border-radius: 5px; width: 40px; border: none; margin-left: 5px; font-size: 24px;">+</button>
                    <div id="stressIcons" style="display: flex; gap: 5px; margin-left: 20px;">
                        <!-- renderStressIcons puts icons here -->
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card clipped" style="margin-right: 10px; margin-left: 10px; margin-top: 5px;">
            <div class="lancer-mini-header" style="display: flex; align-items: center; justify-content: center; height: 28px;"><strong>WEAPONS AND SYSTEMS</strong>
            </div>
                <div class="lancer-hit" style="justify-content: left; display: flex; flex-direction: column; background-color: var(--darken-2); margin-top: 0px; margin-left: 0px; margin-right: 0px; padding: 7px 7px;">
            
                    <!-- Destroyed Weapons Section -->
                    <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                    ${destroyedWeapons.map((weapon, index) => `
                        <button id="weapon-${index}" data-mount="${weapon.mountIndex}" data-slot="${weapon.slotIndex}" 
                            class="lancer-button lancer-secondary" 
                            style="padding: 5px 15px; border-radius: 5px; border: none; cursor: pointer;">
                            ${weapon.name}
                        </button>
                   `).join('')}
                </div>
        
                 <!-- Destroyed Systems Section -->
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
                    ${brokenSystems.map((system, index) => `
                        <button id="system-${index}" data-id="${system.systemId}" 
                            class="lancer-button lancer-secondary" 
                            style="padding: 5px 15px; border-radius: 5px; border: none; cursor: pointer;">
                            ${system.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        <div>
        
        <!-- Contribute Repairs Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div class="card clipped" style="max-width: 160px; margin-right: 10px;" title="Deducts repairs and notes contribution to repair destroyed allied mech in chat.">
                <div class="lancer-mini-header" style="display: flex; align-items: center; padding: 5px 5px;">
                    <img src="${repairIcon}" style="width: 28px; border: none; overflow: hidden;"> <strong>CONTRIBUTIONS</strong>
                </div>
                <div class="lancer-hit" style="justify-content: center;">
                     <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
                        <input type="number" id="contributeRepairs" value="0" min="0" max="4" 
                               style="width: 50px; background-color: #666666; color: white; text-align: center; border: 1px solid #555;" 
                               title="This function only for repairing destroyed allied mechs. Track contributions manually.">
                    </div>
                </div>
            </div>
                <!-- Repair Cost Tally Section -->
            <div style="background-color: var(--primary-color); color: white; font-size: 24px; padding: 10px; border-radius: 5px; display: flex; align-items: center; max-width: 175px; margin-right: 10px;" title="Total Repair Cost">
                <img src="${repairIcon}" style="width: 28px; margin-right: 10px; border: none; overflow: hidden; transform: scale(1.2);">
                <div id="repairCost" style="font-weight: normal;">0</div>
            </div>
        </div>
        
    
    
        <!-- Confirm/Cancel Buttons -->
        <div style="text-align: right; margin-top: 20px;">
            <button id="confirm" class="lancer-button lancer-secondary">Confirm</button>
            <button id="cancel" class="lancer-button lancer-secondary">Cancel</button>
        </div>
    </div>
`;


let dialog = new Dialog({
    title: `Pilot: ${pilot.name}`,
    content: content,
    buttons: {},
    render: (html) => {
        let isHeatResetSelected = false;
        let isClearEffectsSelected = false;
        let isRepairHPSelected = false;
        let currentStructure = structureValue; // Track structure value in real-time
        let currentStress = stressValue;
        let selectedWeapons = [];
        let selectedSystems = [];

        // Toggle button for heat reset
        html.find('#heatReset').click(function () {
            isHeatResetSelected = !isHeatResetSelected;
            $(this).toggleClass('lancer-button lancer-secondary lancer-button lancer-primary');
        });

        // Toggle button for clear effects
        html.find('#clearEffects').click(function () {
            isClearEffectsSelected = !isClearEffectsSelected;
            $(this).toggleClass('lancer-button lancer-secondary lancer-button lancer-primary');
        });

        // Toggle button for HP repair
        html.find('#repairHP').click(function () {
            isRepairHPSelected = !isRepairHPSelected;
            $(this).toggleClass('lancer-button lancer-secondary lancer-button lancer-primary');
            updateRepairCost(isRepairHPSelected ? 1 : -1); // Update tally
        });

        // Function to render structure icons with updated icon style and opacity
        function renderStructureIcons() {
            const structureIconsDiv = html.find('#structureIcons');
            structureIconsDiv.empty();
            for (let i = 0; i < currentStructure; i++) {
                let opacity = i < structureValue ? 1 : 0.5;
                structureIconsDiv.append(`
                    <div style="position: relative; width: 36px; height: 36px; display: inline-block; opacity: ${opacity};">
                        <i class="mdi mdi-rhombus-outline" style="font-size: 36px; color: #1F9EFF;"></i>
                        <i class="mdi mdi-plus-thick" style="font-size: 22px; color: #1F9EFF; position: absolute; top: 57%; left: 50%; transform: translate(-50%, -50%);"></i>
                    </div>
                `);
            }
        }

        // Render the Stress Icons
        function renderStressIcons() {
            const stressIconsDiv = html.find('#stressIcons');
            stressIconsDiv.empty();
            for (let i = 0; i < currentStress; i++) {
                let opacity = i < stressValue ? 1 : 0.5;
            stressIconsDiv.append(`
                    <div style="position: relative; width: 36px; height: 36px; display: inline-block; opacity: ${opacity};">
                        <i class="mdi mdi-circle-outline" style="font-size: 36px; color: #e74210;"></i>
                        <i class="mdi mdi-radioactive" style="font-size: 22px; color: #e74210; position: absolute; top: 57%; left: 50%; transform: translate(-50%, -50%); rotate(180deg);"></i>
                    </div>
                `);
            }
        }

        // Structure increase button
        html.find('#structureIncrease').click(() => {
            if (currentStructure < maxStructure) {
                currentStructure++;
                renderStructureIcons();
                updateRepairCost(structureRate); // Increase repair cost tally by structure rate
            }
        });

        // Structure decrease button
        html.find('#structureDecrease').click(() => {
            if (currentStructure > structureValue) {
                currentStructure--;
                renderStructureIcons();
                updateRepairCost(-structureRate); // Decrease repair cost tally by structure rate
            }
        });
        
        // Stress increase button
        html.find('#stressIncrease').click(() => {
            if (currentStress < maxStress) {
                currentStress++;
                renderStressIcons();
                updateRepairCost(stressRate); // Add repair cost per stress increase
            }
        });
        
        // Stress decrease button
        html.find('#stressDecrease').click(() => {
            if (currentStress > stressValue) {
                currentStress--;
                renderStressIcons();
                updateRepairCost(-stressRate); // Deduct repair cost per stress decrease
            }
        });
        
        // Listener for Contribute Repairs input
        html.find("#contributeRepairs").on("input", function () {
            let newContributed = Math.min(Math.max(0, parseInt(this.value)), 4); // Constrain between 0-4
            contributedRepairs = newContributed;
            updateRepairCost(0); // Re-run tally with adjusted contributions
        });
        
        renderStructureIcons();
        renderStressIcons();
        
        // Register toggle selection for each weapon and system button
        destroyedWeapons.forEach((weapon, index) => {
            html.find(`#weapon-${index}`).click(function () {
                toggleRepairSelection(selectedWeapons, index, $(this));
            });
        });

        brokenSystems.forEach((system, index) => {
            html.find(`#system-${index}`).click(function () {
                toggleRepairSelection(selectedSystems, index, $(this));
            });
        });

        // Handle selected weapons and systems
        function toggleRepairSelection(selectedArray, index, buttonElement) {
        if (selectedArray.includes(index)) {
            selectedArray.splice(selectedArray.indexOf(index), 1);
            buttonElement.removeClass("lancer-button lancer-primary").addClass("lancer-button lancer-secondary");
            updateRepairCost(-1); // Reduce repair cost tally
        } else {
            selectedArray.push(index);
            buttonElement.removeClass("lancer-button lancer-secondary").addClass("lancer-button lancer-primary");
            updateRepairCost(1); // Increase repair cost tally
        }
    }
        
        async function confirmRepairSelection(selectedWeapons, selectedSystems) {
            let repairMessage = "";
            let updates = [];
        
            // Handle weapon repairs
            selectedWeapons.forEach(index => {
                let weaponId = destroyedWeapons[index].weaponId;
                updates.push({ _id: weaponId, "system.destroyed": false });
                repairMessage += `<br>Repaired ${destroyedWeapons[index].name}`;
            });
        
            // Handle system repairs
            selectedSystems.forEach(index => {
                let systemId = brokenSystems[index].systemId;
                updates.push({ _id: systemId, "system.destroyed": false });
                repairMessage += `<br>Repaired ${brokenSystems[index].name}`;
            });
        
            // Apply updates
            await mech.updateEmbeddedDocuments("Item", updates);
            return repairMessage;
        }
console.log("Current Cost:", currentCost)
        // Confirm button logic
        html.find('#confirm').click(async () => {
        const totalRepairs = currentCost + contributedRepairs; // Final tally
        let clearedEffects = isClearEffectsSelected ? activeEffects : [];
        let heatCleared = isHeatResetSelected ? initialHeatValue : 0;
        let remainingRepairs = repairsValue - totalRepairs; // Calculate remaining repairs after cost
        let structureRestored = currentStructure - structureValue; // Calculate restored structure points
        let stressRestored = currentStress - stressValue; // Calculate restored stress points
        let updates = [];
        let repairsConsumed = currentCost;
        let repairMessage = await confirmRepairSelection(selectedWeapons, selectedSystems);

            // Update the mech with repaired weapons
            await mech.updateEmbeddedDocuments("Item", updates);

    // Generate and send chat message
    let msgContent = `<div class="card clipped-bot" style="margin: 0px;">
        <div class="card clipped">
            <div class="lancer-mini-header">// Rest Report //</div>
            <div class="lancer-hit">
                <div><img class="lancer-hit-thumb" src="${mechImg}" /></div>
                <div class="lancer-hit-text" style="display: inline;">
                    ${isHeatResetSelected ? `Cleared ${heatCleared} Heat` : ""}
                    ${isRepairHPSelected ? `<br>Restored ${hpRestored} HP` : ""}
                    ${structureRestored > 0 ? `<br>Restored ${structureRestored} Structure` : ""}
                    ${stressRestored > 0 ? `<br>Restored ${stressRestored} Stress` : ""}
                    ${repairMessage}
                    ${clearedEffects.length > 0 ? `<br>Cleared Conditions:<br> ${clearedEffects.map(effect => `
                        <img src="${effect.icon}" title="${effect.name}" style="width: 25px; height: 25px; background: #666666; border: none;" />
                    `).join('')}` : ""}
                    <br>Consumed ${currentCost} Repairs
                    ${contributedRepairs > 0 ? `<br>Contributed ${contributedRepairs} Repairs for Destroyed Mechs.` : ""}
                </div>
            </div>
        </div>
    </div>`;

    ChatMessage.create({
        content: msgContent,
        speaker: { alias: pilot.name },
    });

            //Update selected stats on the mech
            if (isHeatResetSelected) mech.update({ "system.heat.value": 0 });
            if (isClearEffectsSelected) mech.effects.forEach(effect => effect.delete());
            if (isRepairHPSelected) mech.update({ "system.hp.value": maxHP });
            mech.update({ "system.structure.value": currentStructure });
            mech.update({ "system.stress.value": currentStress });
            mech.update({ "system.repairs.value": remainingRepairs });
                            
            dialog.close();
        });

        html.find('#cancel').click(() => dialog.close());
    },
    options: { height: 500 },
}).render(true);
}
