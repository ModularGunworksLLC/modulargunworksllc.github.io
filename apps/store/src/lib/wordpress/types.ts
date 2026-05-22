export type WcStoreCategory = {
  id: number;
  name: string;
  slug: string;
  link?: string;
};

export type WcStoreProduct = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  short_description?: string;
  description?: string;
  permalink: string;
  on_sale?: boolean;
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_minor_unit?: number;
  };
  images: Array<{ src: string; thumbnail?: string; alt?: string }>;
  categories: WcStoreCategory[];
  brands?: Array<{ name?: string }>;
  attributes?: Array<{ name: string; taxonomy?: string; terms?: Array<{ name: string }> }>;
  is_in_stock?: boolean;
  is_purchasable?: boolean;
};
