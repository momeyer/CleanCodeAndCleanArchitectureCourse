import { OrderItem } from "./Order";
import { Product } from "./Product";
import { ShoppingCartId } from "./ShoppingCartIdGenerator";

export default class ShoppingCart {
    private orderItems: Map<number, OrderItem>;
    discount?: number;

    constructor(readonly id: ShoppingCartId) {
        this.orderItems = new Map<number, OrderItem>();
    }

    getContent(): OrderItem[] {
        let listOfItems: OrderItem[] = [];
        this.orderItems.forEach((cur): number =>
            listOfItems.push(cur));
        return listOfItems;
    }

    addItem(product: Product, quantity: number): boolean {

        const existingProduct = this.orderItems.get(product.id);
        if (!existingProduct) {
            const orderItem: OrderItem = {
                productId: product.id,
                productDetails: product.dimensionsAndWeight,
                quantity: quantity,
                price: product.price
            }
            this.orderItems.set(product.id, orderItem);
            return true;
        }
        existingProduct.quantity += quantity;
        return true;
    }

    removeItem(productId: number): boolean {
        return this.orderItems.delete(productId);
    }

    clear(): void {
        this.orderItems.clear();
    }

    getItemQuantity(productId: number): number {
        const product = this.orderItems.get(productId);
        if (!product) {
            return 0;
        }
        return product.quantity;
    }

    isEmpty(): boolean {
        return this.orderItems.size == 0;
    }

    applyDiscountCode(discount: number): void {
        this.discount = discount;
    }
}