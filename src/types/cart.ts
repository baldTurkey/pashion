// Flat mock shape — no product catalog exists yet to normalize against
// (that's the deferred "Marketplace" milestone). One array with a
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
