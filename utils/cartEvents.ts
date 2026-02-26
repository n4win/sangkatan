// Custom event สำหรับแจ้ง navbar ให้ refetch cart count
export const CART_UPDATED_EVENT = "cart-updated";

export function dispatchCartUpdate() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
