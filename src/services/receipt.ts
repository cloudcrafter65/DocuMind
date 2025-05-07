/**
 * Represents an item in a retail receipt.
 */
export interface ReceiptItem {
    /**
     * A description of the item.
     */
    description: string;
    /**
     * The quantity of the item.
     */
    quantity: number;
    /**
     * The price per item.
     */
    pricePerItem: number;
    /**
     * The total price for the item.
     */
    totalPrice: number;
}

/**
 * Represents information extracted from a retail receipt.
 */
export interface Receipt {
    /**
     * The name of the vendor or store.
     */
    vendorName: string;
    /**
     * The date and time of purchase.
     */
    dateTimeOfPurchase: string;
    /**
     * An array of items included in the receipt.
     */
    items: ReceiptItem[];
    /**
     * The subtotal amount of the receipt.
     */
    subtotal: number;
    /**
     * The taxes applied to the receipt (type and amount).
     */
    taxes: number;
    /**
     * The total amount of the receipt.
     */
    totalAmount: number;
    /**
     * The payment method used.
     */
    paymentMethod: string;
    /**
     * The store address or contact information.
     */
    storeAddress: string;
}

/**
 * Asynchronously extracts information from a retail receipt image.
 *
 * @param image The image data of the receipt to process.
 * @returns A promise that resolves to a Receipt object containing the extracted information.
 */
export async function extractReceiptInformation(image: string): Promise<Receipt> {
    // TODO: Implement this by calling an API.

    return {
        vendorName: 'Grocery Store',
        dateTimeOfPurchase: '2024-01-01 10:00',
        items: [
            {
                description: 'Milk',
                quantity: 1,
                pricePerItem: 3.00,
                totalPrice: 3.00,
            },
        ],
        subtotal: 3.00,
        taxes: 0.30,
        totalAmount: 3.30,
        paymentMethod: 'Credit Card',
        storeAddress: '123 Main St, Anytown',
    };
}
