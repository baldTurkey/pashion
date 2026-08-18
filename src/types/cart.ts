// Flat UI shape, populated from cart_items joined with listings (see
// src/lib/cart/queries.ts) — `id` here is the cart_items row id, which is
// what mutation calls (quantity/remove/save) key off. One array with a
// savedForLater flag rather than two separate arrays: keeps an item's
// position stable when it moves between "in cart" and "saved for later".
export interface CartItem {
  id: string;
  name: string;
  brandName: string;
  size: string;
  price: number;
  quantity: number;
  savedForLater: boolean;
}
