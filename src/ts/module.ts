import { moduleId } from "./constants.js";
import { TableConverter } from "./apps/tableConverter.js";
// Import SCSS to ensure it gets compiled
import "../styles/style.scss";

// Initialize the module when Foundry is ready
(Hooks as any).once("ready", () => {
    console.log(`${moduleId} | Module initialized`);
    
    // Initialize the table converter functionality
    TableConverter.initialize();
});

// Hook into rollable table sheet rendering to add convert button when in edit mode
(Hooks as any).on("renderRollTableSheet", (app: any, html: any) => {
    TableConverter.addConvertButton(app, html);
});

// Hook into rollable table config sheet rendering to add convert button
(Hooks as any).on("renderRollTableConfig", (app: any, html: any) => {
    TableConverter.addConvertButton(app, html);
});

console.log(`${moduleId} | Module loaded`);
