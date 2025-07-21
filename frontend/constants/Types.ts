export interface Location {
  quantity: number;
  location: string;
  type: string;
}

export interface Item {
  barcode_id: string;
  barcode_type: string;
  name: string;
  description: string;
  locations?: Location[];
  // Keep backward compatibility
  primary_location?: Location | null;
  secondary_location?: Location | null;
  total_quantity: number;
}

export const barcode_types: string[] = ["ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128", "itf14", "pdf417",];

export function parseLocations(locations: any): Array<{ quantity: number, location: string, type: string }> {
  if (Array.isArray(locations)) return locations;
  if (!locations || typeof locations !== 'string') return [];
  return locations
    .replace(/^{|}$/g, '')
    .split(/"\s*,\s*"/)
    .map(s => s.replace(/^"|"$/g, ''))
    .map(s => {
      const [quantity, location, type] = s.replace(/^\(|\)$/g, '').split(',');
      return {
        quantity: Number(quantity),
        location: location.replace(/^"|"$/g, ''),
        type: type.replace(/^"|"$/g, '')
      };
    });
}