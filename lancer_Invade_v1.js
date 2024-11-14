// Function to handle the Tech Attack flow and populate Invade options from Mech systems and Pilot Talents
async function attemptInvade(actor) {
  // Updated dialog content with two-column layout
  const content = `
  <div style="display: block; background-color: var(--background-color); padding: 5px; border-radius: 1px;">
    <div class="card clipped" style="color: white; background-color: var(--darken-1);"> 
      <span class="lancer-header lancer-tech card clipped" style="font-size: 20px; align-items: center; padding: 5px;">
        <strong><i class="cci cci-tech-quick i--m i--light" style="margin-left: 3px;"></i>  INVADE MENU ::</strong>
      </span>
      <div style="display: flex; flex-direction: row; width: 100%;">
        <!-- Left Column: Attack and Options -->
        <div class="lancer-hit" style="width: 50%; padding-right: 10px; flex-direction: column">
          <div style="display: flex; align-items: center; justify-content: left; margin-top: 5px; min-width: 100%; background-color: var(--darken-2); color: white;">  
              <button id="tech-attack-button" class="lancer-button lancer-tech" style="padding: 2px; font-size: 18px; max-width: 30px; margin: 5px;"><i class="fas fa-dice-d20" style="margin-left: 3px;"></i></button>
              <p>To initiate Invade, roll a Tech Attack against your target(s).</p>
          </div>
          <div class="lancer-hit" style="display: flex; align-items: center; justify-content: left; margin-top: 5px; width: 100%; background-color: var(--darken-2); color: white;">
              <button id="check-results-button" class="lancer-button lancer-secondary" style="padding: 2px; font-size: 18px; max-width: 30px; margin: 5px;"><i class="fa-solid fa-check" style="margin-left: 3px;"></i></button>
              <p>Check After a Successful Tech Attack to populate Invade options.</p>
          </div>
          <div class="lancer-hit" style="display: flex; align-items: center; justify-content: center; padding: 5px; width: 50%; background-color: var(--darken-2); color: white;">
            <div id="result-display" style="font-weight: bold; color: white;">Result: Pending...</div>
          </div>
        </div>

        <!-- Right Column: Effect Details and Confirm/Cancel Buttons -->
        <div style="width: 50%; padding: 10px;">
          <div class="lancer-mini-header" style="display: flex; align-items: center; justify-content: center; height: 28px;"><strong>EFFECT</strong></div>    
          <div class="lancer-hit" style="justify-content: left; display: flex; flex-direction: column; background-color: var(--darken-2); margin-top: 0px; margin-left: 0px; margin-right: 0px; padding: 7px 7px;">
            <div id="effect-display" style="margin-top: 5px; padding: 10px; min-height: 100px; background-color: var(--darken-2); color: white;">
              Select an option to view details.
            </div>
          </div>
          <div style="display: flex; justify-content: right; margin-top: 5px;">
            <button id="confirm-button" class="lancer-button lancer-secondary" style="padding: 2px; font-size: 14px; max-width: 100px; margin: 5px;">CONFIRM</button>
            <button id="cancel-button" class="lancer-button lancer-secondary" style="padding: 2px; font-size: 14px; max-width: 100px; margin: 5px;">CANCEL</button>
          </div>
        </div>
      </div>
        <div class="lancer-mini-header" style="display: flex; align-items: center; justify-content: center; height: 28px;"><strong>AVAILABLE INVASION PACKAGES</strong></div>    
          <div class="lancer-hit" style="justify-content: left; display: flex; flex-direction: column; background-color: var(--darken-2); margin-top: 0px; margin-left: 0px; margin-right: 0px; padding: 7px 7px;">
            <div id="invade-options" style="margin-top: 3px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;"></div> <!-- Placeholder for Invade options -->
          </div>
        </div>
    </div>
   `;
  
  const target = Array.from(game.user.targets)[0];
  const targetName = target ? target.name : "No target selected";
  
  // Render the dialog with custom HTML content
  const dialog = new Dialog({
    title: "Attempt Invade?",
    content: content,
    buttons: {},
    render: (html) => {
      // Set dialog width and height for the two-column layout
      html.closest(".dialog").css({
        minWidth: "700px",
        minHeight: "500px"
      });

      let selectedOption = null;
      
      //Tech Attack button
      html.find("#tech-attack-button").click(async () => {
        await actor.beginBasicTechAttackFlow();
        html.find("#tech-attack-button")
          .prop("disabled", true)           // Disable the button
          .removeClass()                    // Remove any existing classes
          .addClass("lancer-secondary-highlight"); // Add the new class
      });


      //Check Results button
      html.find("#check-results-button").click(() => {
        const messages = game.messages.contents.reverse();
        const relevantMessage = messages.find(msg => msg.content.includes("ATTACK VS E-DEF"));
        
        if (relevantMessage) {
          let result = "MISS";
          const messageContent = relevantMessage.content;
          if (messageContent.includes("HIT")) result = "HIT";
          if (messageContent.includes("CRIT")) result = "CRIT";

          html.find("#result-display").text(`Result: ${result}`);
          if (result === "HIT" || result === "CRIT") {
            populateInvadeOptions(html.find("#invade-options"), html.find("#effect-display"), actor, (option) => {
              selectedOption = option;
            });
          }
        } else {
          html.find("#result-display").text("Result: No relevant message found.");
        }
      });

// Confirm and Cancel buttons
html.find("#confirm-button").click(() => {
  console.log("Confirm Clicked. Selected Option:", selectedOption); // Log on confirm click
  if (selectedOption) {
    // Send chat message with Invade details
    const messageContent = `
    <h4 class="chat-portrait-text-content-name-generic chat-portrait-flexrow"></h4>
      <div class="card clipped-bot" style="margin: 0px;">
        <div class="lancer-header lancer-tech tech medium" style="margin: 0px;"><i class="cci cci-tech-quick i--m i--light" style="margin-left: 3px;"></i> INVADE :: ${selectedOption.name}</div>
          <div class= "lancer-hit" style="display: flex; margin: 0px;">
            <div class="flexrow" style="width: 100%; margin: 0px;">
              <div class="dice-roll lancer-dice-roll collapse;" style="margin: 0px;">
                <div class="dice-result" style="margin: 0px;">
                  <div class="dice-formula lancer-dice-formula flexrow" style="margin: 0px;">
                    <span style="text-align:left;margin-left:5px;"><strong>${targetName}</strong> Recieves</span>
                    <span class="dice-total lancer-dice-total major">2</span>
                    <i class="cci cci-heat i--m damage--heat"></i></div>
                  </div>
                </div>
              </div>
            </div>
          <div class="lancer-mini-header">// EFFECT //</div>
            <div class="lancer-hit">${selectedOption.detail}</div>
            </div>
          </div>
    `;
    
    ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: messageContent,
    });
  } else {
    console.log("No option selected to confirm.");
  }
  dialog.close();
});


      html.find("#cancel-button").click(() => dialog.close());
    },
    default: ""
  });

  dialog.render(true);
}

// Function to populate Invade options from Mech systems and Pilot talents
async function populateInvadeOptions(container, effectDisplay, actor, onOptionSelected) {
  container.empty();

  // Retrieve invade options from equipped systems
  const invadeOptions = [];
  actor.system.loadout.systems.forEach(system => {
    const systemName = system.value.name;
    const actions = system.value.system.actions || [];
    actions.forEach(action => {
      if (action.activation === "Invade") {
        invadeOptions.push({
          name: `${action.name} [${systemName}]`,
          detail: action.detail // Effect detail for display
        });
      }
    });
  });

  // Special case for "Chomolungma" mech
  if (actor.system.loadout.frame.value.name === "Chomolungma") {
    console.log("Special mech 'Chomolungma' detected.");
    
    const passiveActions = actor.system.loadout.frame.value.system.core_system.passive_actions || [];
    passiveActions.forEach((action) => {
      if (action.activation === "Invade") {
        console.log(`Found Invade action in Chomolungma frame: ${action.name}`);
        invadeOptions.push({
          name: `${action.name} [Chomolungma Frame]`,
          detail: action.detail || "No details available."
        });
      }
    });
  }
  
  // Attempt to retrieve the pilot ID and log each step
  const pilotId = actor.system?.pilot?.id;
  console.log("Pilot ID found in actor:", pilotId);

  if (pilotId) {
    const cleanedPilotId = pilotId.replace("Actor.", ""); // Remove "Actor." prefix if present
    console.log("Cleaned Pilot ID:", cleanedPilotId);

    const pilot = game.actors.get(cleanedPilotId);
    
    if (pilot) {
      console.log(`Pilot found: ${pilot.name}`);
      
      // Access items in the EmbeddedCollection using `.contents`
      pilot.items.contents.forEach((item) => {
        // Check if item is of type "talent" and has actions
        if (item.type === "talent" && Array.isArray(item.system.actions)) {
          console.log(`Processing talent: ${item.name}`);
          
          item.system.actions.forEach((action) => {
            if (action.activation === "Invade") {
              console.log(`Found Invade action: ${action.name}`);
              invadeOptions.push({
                name: `${action.name} [${item.name}]`,
                detail: action.detail || "No details available."
              });
            }
          });
        }
      });
    } else {
      console.log("No pilot found with the cleaned Pilot ID.");
    }
  } else {
    console.log("Pilot ID not found in actor data.");
  }

  // Always-available default option
  invadeOptions.push({
    name: "Fragment Signal [Default]",
    detail: "You feed false information, obscene messages, or phantom signals to your target's computing core. They become IMPAIRED and SLOWED until the end of their next turn."
  });
  
  // Generate radio-type buttons for each invade option
  invadeOptions.forEach((option, index) => {
    const button = $(`<button class="lancer-button lancer-secondary" style="padding: 5px; font-size: 14px; text-align: center;">${option.name}</button>`);
    button.attr("data-option-index", index);
    button.click(function () {
      container.find("button").removeClass("lancer-primary").addClass("lancer-secondary");
      $(this).removeClass("lancer-secondary").addClass("lancer-primary");

      effectDisplay.text(option.detail);
      onOptionSelected(option);
    });
    container.append(button);
  });

  if (invadeOptions.length === 0) {
    container.append(`<p>No Invade options available.</p>`);
    effectDisplay.text("No Invade options available.");
  }
}

// Call the function to start the macro with a valid actor
attemptInvade(actor);
