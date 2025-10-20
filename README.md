# 5E Table to Items Converter - Foundry VTT Module

**Concept and ideation:** Sir Motte  
**Code and execution:** [ThreeHats](https://github.com/ThreeHats)

Special thanks to Threehats for developing this module to specification. It is in maintenance mode — no new features will be added. Suggestions for improvement are welcome, but implementation is unlikely.

## Overview

⚠️ **Always back up your tables before conversion!**

Table to Items Converter is a Foundry VTT module for Dungeons & Dragons 5E that automates converting rollable tables into fully functional items and importing them into a chosen item compendium. Ideal for game masters and content creators, it streamlines turning randomized loot and other table-driven results into ready-to-use itemized assets within Foundry.

The module reads the entries of a rollable table and creates items based on a customizable naming convention and adds the entry text as item description. If a "Result Name" is specified in a table entry, the module can prioritize using that as the item name. Optionally, it can also insert backlinks into the original table entries, linking each to its corresponding item. This workflow saves significant manual effort or shortens other time consuming workflows.

This also enables other modules — such as [Random Loot Generator](https://github.com/mfozz/random-loot-generator) — to use either the original tables or the newly created items in the compendium.

---

## Features

- Convert any Foundry VTT table into a compendium of items.
- Automatically name items using either:
  - A custom naming pattern: use {tableName} for the table name, {number} or #{number} for the entry number; you may also enter a fully custom pattern.
  - The "Result Name" field, if available (optional setting).
- Adds the table entry text as item description.
- Supports backlinking: generated items can be referenced from their corresponding table entries.  
- Works with tables of any size.  
- Clean UI integrated directly into the table configuration dialog.  
- Simple, guided workflow requiring no coding or scripting knowledge.

---

## How to Use

### Prerequisites

- ⚠️ **Always back up your tables before conversion!**  
- Foundry VTT v13.x (may work on older versions but is not tested).  
- DnD 5E Ruleset v5.1.10+ (may work on older versions but is not tested).  
- The module must be enabled in your world.  
- A rollable table created in Foundry VTT.  
- An item compendium (must exist before starting the conversion).

---

### Step-by-Step Guide

1. Create a destination item compendium  
   Go to the **Compendium Packs** sidebar and create a new compendium of type **Item**. This is where your converted entries will be saved if you choose it as the destination. Any other existing and writable item compendium may be used as well.

2. Open the target rollable table  
   From the **Rollable Tables** sidebar, open any existing table you want to convert, or choose a table from a compendium. Note that locked compendium tables may only be edited as an imported copy.

3. Click "Edit" on the table  
   This enables the table editor.

4. Click the “Convert to Items” button  
   You will see a new button labeled **Convert to Items**. Click it to open the conversion dialog.

5. Target Compendium:  
   From the dropdown, select the compendium you created earlier or an existing one. This is where new items will be generated.

6. Item Name Pattern: 
   Choose how item names should be generated if the table entries don’t use the “Result Name” field. You may use a custom name or a custom name combined with any of the predefined tokens shown in the dialog description.

7. Choose additional options:
   - **Prioritize "Result Name" over pattern (when available)**  
     If enabled and the table entry has a populated “Result Name” field, that entry will be used for the item name instead of the naming pattern.
   - **Add backlinks from table entries to created items**  
     Appends a clickable and draggable reference to the generated item within each corresponding table row.
     
8. Click “Convert Entries to Items”  
   The conversion process will begin. Depending on the number of entries, this may take a while. Foundry will tell you when item creation has finished.

9. Wait for the process to finish  
   Large tables will take a while, especially with back-linking active.

10. Done!  
    You now have a full set of items in your compendium based on the table entries. If enabled, each table entry will also include a backlink to its corresponding item.
    
---

### Important behavior

- The module **does not check for existing item links** in a table entry. If you run the conversion again on the same table, **new items will be created and backlinks appended** to the existing entry.
- This behavior is intentional to allow batch processing and non-destructive editing, but it may require manual cleanup in some workflows.  
- **Always back up your tables before using the module!** You do not want to manually remove all the created backlinks in a 1,000+ entry table.

---

## Installation

### Automated installation (recommended)
Either search the Foundry VTT Module Browser for "Tables to Items Converter" and click Install; or:

1. Open your Foundry VTT instance.  
2. Go to **Add-on Modules**.  
3. Click **Install Module**.  
4. Paste the following URL into the **Manifest URL** field:  
   https://github.com/SirMotte/FoundryVTT_Tables_to_Items/blob/main/module.json  
5. Click Install and wait for the manager to download and install the module.  
6. Launch your game world.  
7. Enable the module in the Module Manager within your game world.

### Manual installation

1. Download the module files.  
2. Place the unzipped folder in your Foundry VTT "modules" directory.  
3. Enable the module in the Module Manager within your game world.

### Development
This module is built with TypeScript and Vite for Foundry VTT v13.

npm run build - Build the module
npm run dev - Build with watch mode for development

### License
This project is licensed under the MIT License.
