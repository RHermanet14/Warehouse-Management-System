export interface Location {
  quantity: number;
  bin: string;
  type: string;
  area_name?: string;
}

export interface Item {
  barcode_id: string;
  barcode_type: string;
  name: string;
  description: string;
  locations?: Location[];
  total_quantity: number;
}

export const barcode_types: string[] = ["ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128", "itf14", "pdf417",];

export function parseLocations(locations: any): Location[] {
  if (!Array.isArray(locations)) return [];
  return locations.map(loc => ({
    bin: typeof loc.bin === 'string' ? loc.bin : (typeof loc.location === 'string' ? loc.location : ''),
    quantity: loc.quantity ?? 0,
    type: loc.type || '',
    area_name: loc.area_name || '',
  }));
}