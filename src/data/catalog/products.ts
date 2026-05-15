// Catalog product references used by tests. Each entry includes the suffix used in SauceDemo's `data-test` attributes (`add-to-cart-<id>`, `remove-<id>`) so page objects can build stable selectors.
export interface Product {
  readonly id: string;       // matches data-test suffix
  readonly displayName: string;
  readonly price: number;
}

export const Products = {
  backpack: { id: 'sauce-labs-backpack', displayName: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { id: 'sauce-labs-bike-light', displayName: 'Sauce Labs Bike Light', price: 9.99 },
  boltTshirt: { id: 'sauce-labs-bolt-t-shirt', displayName: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  fleeceJacket: { id: 'sauce-labs-fleece-jacket', displayName: 'Sauce Labs Fleece Jacket', price: 49.99 },
  onesie: { id: 'sauce-labs-onesie', displayName: 'Sauce Labs Onesie', price: 7.99 },
  redTshirt: { id: 'test.allthethings()-t-shirt-(red)', displayName: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
} as const satisfies Record<string, Product>;

export type ProductKey = keyof typeof Products;

export const ALL_PRODUCTS: readonly Product[] = Object.values(Products);
