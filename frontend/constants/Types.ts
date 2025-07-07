export interface Location {
    quantity: number;
    location : string;
  }
  
  export interface Item {
    barcode_id: string;
    barcode_type: string;
    name: string;
    description: string;
    primary_location: Location | null;
    secondary_location: Location | null;
    total_quantity: number;
  }

  export const barcode_types: string[] = ["ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128", "itf14", "pdf417",];