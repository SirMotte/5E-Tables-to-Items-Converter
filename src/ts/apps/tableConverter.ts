import { moduleId } from "../constants.js";
import type { ConversionOptions, ConversionResult, CompendiumInfo } from "../types.js";

/**
 * Application v2 dialog for table conversion
 */
class TableConverterDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    table: any;
    
    static DEFAULT_OPTIONS = {
        id: "table-converter-dialog",
        tag: "form",
        window: {
            title: "foundry-tables-to-items.convert-table",
            icon: "fas fa-magic",
            resizable: false
        },
        position: {
            width: 500,
            height: "auto"
        }
    };

    static PARTS = {
        form: {
            template: "modules/foundry-tables-to-items/templates/table-converter.hbs"
        }
    };

    constructor(table: any, options = {}) {
        super(options);
        this.table = table;
    }

    get title() {
        return (game as any).i18n.localize("foundry-tables-to-items.convert-table");
    }

    async _prepareContext(): Promise<any> {
        const compendiums = TableConverter.getAvailableCompendiums();
        return {
            tableName: this.table.name,
            compendiums: compendiums,
            moduleId: moduleId
        };
    }

    _onClickAction(_event: Event, target: HTMLElement) {
        const action = target.dataset.action;
        switch (action) {
            case "convert":
                return this._onConvert();
            case "cancel":
                return this._onCancel();
            default:
                return;
        }
    }

    async _onConvert() {
        const form = (this as any).element?.querySelector('form') as HTMLFormElement;
        if (!form) return;
        
        const formData = new FormData(form);
        const compendium = formData.get("compendium") as string;
        
        if (!compendium) {
            (ui as any).notifications?.warn((game as any).i18n.localize("foundry-tables-to-items.no-compendium-selected"));
            return;
        }

        const options: ConversionOptions = {
            targetCompendium: compendium,
            namePattern: (formData.get("namePattern") as string) || "{tableName} #{number}",
            useResultName: Boolean(formData.get("useResultName")),
            addBackLinks: Boolean(formData.get("addBackLinks"))
        };

        try {
            const result = await TableConverter.convertTableToItems(this.table, options);
            
            if (result.success) {
                (ui as any).notifications?.info(
                    (game as any).i18n.format("foundry-tables-to-items.conversion-complete", {
                        count: result.itemsCreated
                    })
                );
                await (this as any).close();
            } else {
                (ui as any).notifications?.error(
                    (game as any).i18n.localize("foundry-tables-to-items.conversion-failed") + ": " + result.errors.join(", ")
                );
            }
        } catch (error) {
            console.error(`${moduleId} | Conversion failed:`, error);
            (ui as any).notifications?.error((game as any).i18n.localize("foundry-tables-to-items.conversion-failed"));
        }
    }

    async _onCancel() {
        await (this as any).close();
    }

    async _onSubmitForm(event: Event, _form: HTMLFormElement, formData: FormData) {
        event.preventDefault();
        
        const compendium = formData.get("compendium") as string;
        if (!compendium) {
            (ui as any).notifications?.warn((game as any).i18n.localize("foundry-tables-to-items.no-compendium-selected"));
            return false;
        }

        const options: ConversionOptions = {
            targetCompendium: compendium,
            namePattern: (formData.get("namePattern") as string) || "{tableName} #{number}",
            useResultName: Boolean(formData.get("useResultName")),
            addBackLinks: Boolean(formData.get("addBackLinks"))
        };

        try {
            const result = await TableConverter.convertTableToItems(this.table, options);
            
            if (result.success) {
                (ui as any).notifications?.info(
                    (game as any).i18n.format("foundry-tables-to-items.conversion-complete", {
                        count: result.itemsCreated
                    })
                );
                return true; // Allow close
            } else {
                (ui as any).notifications?.error(
                    (game as any).i18n.localize("foundry-tables-to-items.conversion-failed") + ": " + result.errors.join(", ")
                );
                return false; // Prevent close
            }
        } catch (error) {
            console.error(`${moduleId} | Conversion failed:`, error);
            (ui as any).notifications?.error((game as any).i18n.localize("foundry-tables-to-items.conversion-failed"));
            return false; // Prevent close
        }
    }
}

export class TableConverter {
    
    static initialize(): void {
        console.log(`${moduleId} | TableConverter initialized`);
    }

    /**
     * Add convert button to rollable table sheets (only in edit mode)
     */
    static addConvertButton(app: any, html: any): void {
        // addConvertButton called when a RollTable sheet renders

        // Ensure html is a jQuery object
        const $html = ($ as any)(html);

        // Check if we're in edit mode by looking for the fa-pen icon
        // If fa-pen is present, we're NOT in edit mode, so don't show the button
        const editButton = $html.find('[data-action="changeMode"]');
        const isViewMode = editButton.find('.fa-pen').length > 0;

        if (isViewMode) {
            // Remove button if it exists and we're in view mode
            $html.find(".convert-table-button").remove();
            return;
        }

        // Check if button already exists to avoid duplicates
        if ($html.find(".convert-table-button").length > 0) return;

        const button = ($ as any)(`
            <button type="button" class="convert-table-button" data-action="convertTable">
                <i class="fas fa-magic"></i>
                <span>${(game as any).i18n.localize("foundry-tables-to-items.convert-table")}</span>
            </button>
        `);

        button.on("click", (event: any) => {
            event.preventDefault();
            this.openConversionDialog(app.document);
        });

        // Add button to the header - append to the end instead of right after edit button
        const sheetHeader = $html.find(".sheet-header");
        if (sheetHeader.length > 0) {
            sheetHeader.append(button);
        } else {
            // Fallback: try to find any header element
            const fallbackHeader = $html.find("header").first();
            if (fallbackHeader.length > 0) fallbackHeader.append(button);
        }
    }

    /**
     * Open the conversion dialog for selecting compendium and options
     */
    static async openConversionDialog(table: any): Promise<void> {
        try {
            const dialog = new TableConverterDialog(table);
            await (dialog as any).render({ force: true });
        } catch (error) {
            console.error(`${moduleId} | Failed to open dialog:`, error);
        }
    }

    /**
     * Get available item compendiums
     */
    static getAvailableCompendiums(): CompendiumInfo[] {
        const compendiums: CompendiumInfo[] = [];
        
        (game as any).packs.forEach((pack: any) => {
            if (pack.documentName === "Item" && pack.metadata.system === (game as any).system.id) {
                compendiums.push({
                    collection: pack,
                    metadata: pack.metadata
                });
            }
        });

        return compendiums;
    }



    /**
     * Convert table entries to items
     */
    static async convertTableToItems(table: any, options: ConversionOptions): Promise<ConversionResult> {
        const result: ConversionResult = {
            success: true,
            itemsCreated: 0,
            errors: [],
            createdItems: []
        };

        const compendium = (game as any).packs.get(options.targetCompendium);
        if (!compendium) {
            result.success = false;
            result.errors.push((game as any).i18n.format("foundry-tables-to-items.compendium-not-found", { compendium: options.targetCompendium }));
            return result;
        }

        // Check if compendium is locked
        if (compendium.locked) {
            result.success = false;
            result.errors.push((game as any).i18n.format("foundry-tables-to-items.compendium-locked", { compendium: options.targetCompendium }));
            return result;
        }

        let entryNumber = 1;
        
        for (const tableResult of table.results) {
            try {
                
                const itemName = this.generateItemName(table, tableResult, entryNumber, options);
                const itemData = {
                    name: itemName,
                    type: "loot", // Default to loot items for D&D 5e
                    system: {
                        description: {
                            value: tableResult.description || tableResult.name || "",
                            chat: "",
                            unidentified: ""
                        }
                    },
                    flags: {
                        [moduleId]: {
                            sourceTable: table.id,
                            sourceTableName: table.name,
                            sourceEntryId: tableResult.id,
                            originalWeight: tableResult.weight,
                            originalRange: tableResult.range
                        }
                    }
                };


                
                try {
                    // Use Item.createDocuments with pack option instead of compendium.createDocuments
                    const createdItems = await Item.createDocuments([itemData], { pack: compendium.collection });
                    const createdItem = createdItems[0];
                    
                    // Check if item was created successfully and properly saved
                    if (createdItem && createdItem.name && createdItem.type && (createdItem.id || createdItem._id)) {
                        const itemName = createdItem.name;
                        // Try to get an identifier, fallback to name if none available
                        const itemId = createdItem.uuid || createdItem.id || createdItem._id || `temp-${Date.now()}-${Math.random()}`;
                        result.itemsCreated++;
                        result.createdItems.push({
                            id: itemId,
                            name: itemName,
                            tableEntryId: tableResult.id || tableResult._id
                        });

                        // Add back-link to table entry if enabled
                        if (options.addBackLinks) {
                            await this.addBackLinkToTableEntry(table, tableResult, createdItem, compendium);
                        }
                    } else {
                        result.errors.push((game as any).i18n.format("foundry-tables-to-items.failed-create-item", { name: itemName }) + ": " + (game as any).i18n.localize("foundry-tables-to-items.invalid-result"));
                    }
                } catch (createError) {
                    result.errors.push((game as any).i18n.format("foundry-tables-to-items.failed-create-item", { name: itemName }) + ": " + createError);
                    console.error(`${moduleId} | Error creating item:`, createError);
                }
                
                entryNumber++;
            } catch (error) {
                result.errors.push((game as any).i18n.format("foundry-tables-to-items.failed-create-entry", { entry: tableResult.id }) + ": " + error);
                console.error(`${moduleId} | Error creating item:`, error);
            }
        }

        if (result.errors.length > 0) {
            result.success = false;
        }

        // Refresh the compendium to ensure items are visible
        if (result.itemsCreated > 0) {
            try {
                await compendium.getIndex({ force: true });

            } catch (refreshError) {
                console.warn(`${moduleId} | Failed to refresh compendium:`, refreshError);
            }
        }

        return result;
    }

    /**
     * Generate item name based on options and priorities
     */
    static generateItemName(table: any, tableResult: any, entryNumber: number, options: ConversionOptions): string {
        // Priority 1: Use Result Name if available and enabled
        if (options.useResultName && tableResult.documentName && tableResult.documentName !== "TableResult") {
            return tableResult.documentName;
        }

        // Priority 2: Use the table result's own name if available and not default
        if (tableResult.name && tableResult.name.trim() !== "" && tableResult.name !== "TableResult") {
            return tableResult.name.trim();
        }

        // Priority 3: Use name pattern (default behavior)
        const paddedNumber = entryNumber.toString().padStart(3, '0');
        const patternResult = options.namePattern
            .replace('{tableName}', table.name || 'Table')
            .replace('{number}', paddedNumber)
            .replace('#{number}', `#${paddedNumber}`);

        // If the user wants to use description names and no pattern/result name is available
        if (!options.useResultName && patternResult === `${table.name || 'Table'} #${paddedNumber}`) {
            // Extract meaningful name from description as fallback
            const description = tableResult.description || tableResult.text || "";
            if (description && description.trim()) {
                // Remove HTML tags and clean the text
                const cleanText = description.replace(/<[^>]*>/g, '').trim();
                
                // Look for the first sentence or meaningful phrase
                let firstSentence = cleanText.split(/[.!?]/)[0].trim();
                
                // If the first sentence is too long, take the first meaningful chunk
                if (firstSentence.length > 50) {
                    const words = firstSentence.split(/\s+/);
                    // Take first 5-7 words to create a reasonable name
                    firstSentence = words.slice(0, Math.min(7, words.length)).join(' ');
                }
                
                // Clean up the name by removing trailing punctuation
                firstSentence = firstSentence.replace(/[.,!?;:]+$/, '').trim();
                
                if (firstSentence.length > 3) {
                    return firstSentence;
                }
            }
        }

        // Return the pattern result
        return patternResult;
    }

    /**
     * Add back-link from table entry to created compendium item
     */
    static async addBackLinkToTableEntry(table: any, tableResult: any, createdItem: any, compendium: any): Promise<void> {
        try {
            const linkText = `@Compendium[${compendium.collection}.${createdItem.id}]{${createdItem.name}}`;
            const originalText = tableResult.description || tableResult.name || "";
            const updatedText = `${originalText}\n\n<p><strong>Item:</strong> ${linkText}</p>`;
            
            await table.updateEmbeddedDocuments("TableResult", [{
                _id: tableResult.id,
                description: updatedText
            }]);
        } catch (error) {
            console.error(`${moduleId} | Failed to add back-link:`, error);
        }
    }
}
