export const LAST_ORDER_STORAGE_KEY = "ahhio-last-order";

export function readLastOrder() {
  try {
    const storedOrder = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!storedOrder) return null;

    const parsedOrder = JSON.parse(storedOrder);
    return Array.isArray(parsedOrder?.orders) && parsedOrder.orders.length > 0
      ? parsedOrder
      : null;
  } catch (error) {
    console.error("Failed to read the saved order:", error);
    return null;
  }
}

export function saveLastOrder(order) {
  localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(order));
}
