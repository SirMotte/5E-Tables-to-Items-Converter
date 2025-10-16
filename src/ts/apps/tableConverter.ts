import { moduleId } from "../constants.js";
import type { ConversionOptions, ConversionResult, CompendiumInfo } from "../types.js";

export class TableConverter {
    
    static initialize(): void {
        console.log(`${moduleId} | TableConverter initialized`);
    }

    /**
     * Add convert button to rollable table sheets (only in edit mode)
     */
    static addConvertButton(app: any, html: any): void {
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
        if ($html.find(".convert-table-button").length > 0) {
            return;
        }

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
            if (fallbackHeader.length > 0) {
                fallbackHeader.append(button);
            }
        }
    }

    /**
     * Open the conversion dialog for selecting compendium and options
     */
    static async openConversionDialog(table: any): Promise<void> {
        const compendiums = this.getAvailableCompendiums();
        
        const content = await (foundry as any).applications.handlebars.renderTemplate("modules/foundry-tables-to-items/templates/table-converter.hbs", {
            tableName: table.name,
            compendiums: compendiums,
            moduleId: moduleId
        });

        new (Dialog as any)({
            title: (game as any).i18n.localize("foundry-tables-to-items.convert-table"),
            content: content,
            buttons: {
                convert: {
                    icon: '<i class="fas fa-magic"></i>',
                    label: (game as any).i18n.localize("foundry-tables-to-items.convert-all-entries"),
                    callback: (html: any) => this.handleConversion(table, html)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            },
            default: "convert"
        }).render(true);
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
     * Handle the conversion process
     */
    static async handleConversion(table: any, html: any): Promise<void> {
        const formData = new FormData(html.find("form")[0]);
        const selectedCompendium = formData.get("compendium") as string;
        
        if (!selectedCompendium) {
            (ui as any).notifications?.warn((game as any).i18n.localize("foundry-tables-to-items.no-compendium-selected"));
            return;
        }

        const options: ConversionOptions = {
            targetCompendium: selectedCompendium,
            namePattern: formData.get("namePattern") as string || "{tableName} #{number}",
            useResultName: formData.get("useResultName") === "true",
            addBackLinks: formData.get("addBackLinks") === "true"
        };

        try {
            const result = await this.convertTableToItems(table, options);
            
            if (result.success) {
                (ui as any).notifications?.info(
                    (game as any).i18n.format("foundry-tables-to-items.items-created", {
                        count: result.itemsCreated,
                        compendium: selectedCompendium
                    })
                );
            } else {
                (ui as any).notifications?.error((game as any).i18n.localize("foundry-tables-to-items.error-converting"));
                console.error(`${moduleId} | Conversion errors:`, result.errors);
            }
        } catch (error) {
            (ui as any).notifications?.error((game as any).i18n.localize("foundry-tables-to-items.error-converting"));
            console.error(`${moduleId} | Conversion failed:`, error);
        }
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
            result.errors.push(`Compendium ${options.targetCompendium} not found`);
            return result;
        }

        // Check if compendium is locked
        if (compendium.locked) {
            result.success = false;
            result.errors.push(`Compendium ${options.targetCompendium} is locked`);
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
                        result.errors.push(`Failed to create item ${itemName}: createDocument returned invalid result`);
                    }
                } catch (createError) {
                    result.errors.push(`Failed to create item ${itemName}: ${createError}`);
                    console.error(`${moduleId} | Error creating item:`, createError);
                }
                
                entryNumber++;
            } catch (error) {
                result.errors.push(`Failed to create item for entry ${tableResult.id}: ${error}`);
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
