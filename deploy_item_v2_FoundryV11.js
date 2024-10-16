// Spawn Lancer Deployable Macro (Native Foundry Version)

// Select one token and execute this macro to generate a selectable list of that actor's deployables. After selecting a deployable from the list, Left-click to place the token.  Right-click or press Escape to abort placement.

// CHANGELOG

// v2: Removed Warpgate requirements, restyled the selection window.

// Step 1: Check selected tokens
if (canvas.tokens.controlled.length !== 1) {
  ui.notifications.warn("You must first select one and only one token.");
  return;
}

// Get the selected token
const token = canvas.tokens.controlled[0];

// Step 2: Fetch all owned deployables
let deployables = game.actors.contents.filter(actor => 
  actor.type === 'deployable' && actor.testUserPermission(game.user, "OWNER")
);

// Step 3: Filter deployables for the selected actor (using the deployer's ID)
deployables = deployables.filter(deployable => {
  const deployerId = deployable.system?.owner?.id?.replace(/^Actor\./, ''); // Clean ID
  return deployerId === token.actor.id;
});

console.log("Deployables for selected actor:", deployables);

// If no deployables are found, stop the script
if (deployables.length === 0) {
  ui.notifications.warn(`No deployables found for ${token.actor.name}.`);
  return;
}

// Step 4: Prepare buttons for each deployable (using Dialog for UI)
const buttons = deployables.map((deployable, index) => {
  return {
    label: `
      <div style="display: flex; align-items: center; margin-bottom: 1px; width: 300px;">
        <div style="width: 50px; height: 50px; overflow: hidden; margin-right: 10px;">
          <img src="${deployable.img}" style="width: 100%; height: auto; transform: scale(2.2);">
        </div>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${deployable.name.replace(`${token.actor.name}'s`, '')}</span>
      </div>
    `,
    callback: () => {
      // Create the translucent preview of the token image
      const texture = PIXI.Texture.from(deployable.img); // Create a texture from the image
      const preview = new PIXI.Sprite(texture); // Create the preview sprite
      preview.anchor.set(0.5); // Center the anchor point
      preview.alpha = 0.3; // Make the preview translucent
      canvas.stage.addChild(preview); // Add the preview to the canvas

      // Step 5: Let user hover to place the token
      const handler = (event) => {
        // Translate global screen coordinates to world coordinates
        const t = canvas.stage.worldTransform;
        const tx = ((event.data.global.x - t.tx) / canvas.stage.scale.x) * 0.97; // Reduced by 1%
        const ty = ((event.data.global.y - t.ty) / canvas.stage.scale.y) * 0.98; // Reduced by 1%

        // Get the grid-snapped position based on the translated world coordinates
        const snappedPos = canvas.grid.getSnappedPosition(tx, ty);

        // Adjust the preview position to be half a grid space lower and to the right
        const gridSize = canvas.grid.size; // Assuming grid size is uniform
        preview.position.set(snappedPos.x + gridSize / 2, snappedPos.y + gridSize / 2); // Move half a grid space down and right
      };

      // Step 6: Handle user click to place the token
      const clickHandler = async (event) => {
        // Translate global screen coordinates to world coordinates
        const t = canvas.stage.worldTransform;
        const tx = ((event.data.global.x - t.tx) / canvas.stage.scale.x) * 0.97; // Reduced by 1%
        const ty = ((event.data.global.y - t.ty) / canvas.stage.scale.y) * 0.98; // Reduced by 1%

        // Get the grid-snapped position based on the translated world coordinates
        const snappedPos = canvas.grid.getSnappedPosition(tx, ty);

        // Fetch the prototype token's settings from the deployable actor
        const prototypeToken = deployable.prototypeToken; // Access the prototype token
        const tokenData = {
          name: deployable.name,
          img: deployable.img,
          actorId: deployable.id,
          x: snappedPos.x,
          y: snappedPos.y,
          // Add additional properties from the prototype token
          ...prototypeToken // Spread operator to include all properties
        };

        // Create the token at the snapped position (with prototype settings)
        await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);

        // Cleanup: Remove the click and hover handlers
        canvas.stage.off('click', clickHandler);
        canvas.stage.off('mousemove', handler);
        canvas.stage.off('rightdown', abortHandler); // Remove right-click handler
        document.removeEventListener('keydown', keyHandler); // Remove keydown handler
        // Remove the preview from the canvas
        canvas.stage.removeChild(preview);
      };

      // Step 7: Handle right-click or escape key to abort
      const abortHandler = (event) => {
        if (event.data.button === 2) { // Right-click event
          console.log("Token placement aborted by right-click");
          cleanup(); // Call cleanup to abort
        }
      };

      const keyHandler = (event) => {
        if (event.key === "Escape") { // Escape key pressed
          console.log("Token placement aborted by Escape key");
          cleanup(); // Call cleanup to abort
        }
      };

      const cleanup = () => {
        // Cleanup: Remove all event handlers
        canvas.stage.off('click', clickHandler);
        canvas.stage.off('mousemove', handler);
        canvas.stage.off('rightdown', abortHandler);
        document.removeEventListener('keydown', keyHandler);
        // Remove the preview from the canvas
        canvas.stage.removeChild(preview);
      };

      // Step 8: Wait for the player to hover, click, or abort
      canvas.stage.on('mousemove', handler); // Update preview on mouse move
      canvas.stage.on('click', clickHandler); // Place token on click
      canvas.stage.on('rightdown', abortHandler); // Abort on right-click
      document.addEventListener('keydown', keyHandler); // Abort on Escape key
    }
  };
});

// Step 9: Create and display the dialog
new Dialog({
  title: "Select Deployable to Place",
  content: "<p>Select a deployable:</p>",
  buttons: buttons.reduce((obj, btn, index) => {
    obj[`deploy${index}`] = btn;
    return obj;
  }, {}),
  default: "deploy0"
}).render(true);
