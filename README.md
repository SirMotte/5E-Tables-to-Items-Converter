# Foundry Tables to Items

A Foundry VTT module for converting Rollable Table entries into D&D 5E items and storing them in compendiums.

## Features

- **Batch Conversion**: Convert all entries from a rollable table into items in one operation
- **Flexible Item Naming**: Prioritizes "Result Name" from table entries, falls back to table name + entry number
- **Compendium Integration**: Choose target compendium or create new ones for storing items
- **Back-linking**: Automatically adds links from table entries to created compendium items
- **User-Friendly Interface**: Simple button in table headers to trigger conversion

## Requirements

- Foundry VTT v13
- D&D 5E system

## Installation

1. Install the module from the Foundry VTT module browser
2. Enable the module in your world

## Usage

1. Open any Rollable Table in your world, and edit it
2. Click the "Convert Table to Items" button in the table header
3. Select or create a target compendium for the items
4. The module will:
   - Create items for each table entry
   - Use the table entry text as item descriptions
   - Name items using "Result Name" if available, otherwise "TableName #001" format
   - Store items in your chosen compendium
   - Add back-links from table entries to the created items

## Item Naming Priority

1. **Result Name** (if specified in the table entry)
2. **Table Name + Entry Number** (e.g., "Magic Items #001")
3. **Configurable pattern** with appended numbers

## Workflow

```
Select Table → Convert Entries → Choose Compendium → Items Created → Back-links Added
```

## Development

This module is built with TypeScript and Vite for Foundry VTT v13.

- `npm run build` - Build the module
- `npm run dev` - Build with watch mode for development

## License

This project is licensed under the MIT License.
