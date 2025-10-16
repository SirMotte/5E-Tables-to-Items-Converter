// Types for the foundry-tables-to-items module

export interface TableEntry {
  _id: string;
  text: string;
  weight: number;
  range: [number, number];
  drawn: boolean;
  flags: Record<string, any>;
  documentName?: string;
  documentCollection?: string;
  documentId?: string;
  resultId?: string;
}

export interface RollTable {
  _id: string;
  name: string;
  description: string;
  results: Collection<TableEntry>;
  formula: string;
  replacement: boolean;
  displayRoll: boolean;
  folder: string | null;
  sort: number;
  flags: Record<string, any>;
}

export interface CompendiumInfo {
  collection: CompendiumCollection<any>;
  metadata: {
    id: string;
    label: string;
    type: string;
    system: string;
    path: string;
  };
}

export interface ConversionOptions {
  targetCompendium: string;
  namePattern: string;
  useResultName: boolean;
  addBackLinks: boolean;
}

export interface ConversionResult {
  success: boolean;
  itemsCreated: number;
  errors: string[];
  createdItems: {
    id: string;
    name: string;
    tableEntryId: string;
  }[];
}
