/**
 * Represents an item in an invoice.
 */
export interface InvoiceItem {
    /**
     * A description of the item.
     */
    description: string;
    /**
     * The quantity of the item.
     */
    quantity: number;
    /**
     * The unit price of the item.
     */
    unitPrice: number;
    /**
     * The total price of the item.
     */
    totalPrice: number;
}

/**
 * Represents information extracted from an invoice.
 */
export interface Invoice {
    /**
     * The invoice number or bill ID.
     */
    invoiceNumber: string;
    /**
     * The date the invoice was issued.
     */
    issueDate: string;
    /**
     * The date the invoice is due.
     */
    dueDate: string;
    /**
     * Information about the biller (name, address, contact).
     */
    billerInformation: string;
    /**
     * Information about the recipient (name, address).
     */
    recipientInformation: string;
    /**
     * An array of items included in the invoice.
     */
    items: InvoiceItem[];
    /**
     * The subtotal amount of the invoice.
     */
    subtotal: number;
    /**
     * The taxes applied to the invoice.
     */
    taxes: number;
    /**
     * Any discounts applied to the invoice.
     */
    discounts: number;
    /**
     * The total amount due for the invoice.
     */
    totalAmountDue: number;
}

/**
 * Asynchronously extracts information from an invoice image.
 *
 * @param image The image data of the invoice to process.
 * @returns A promise that resolves to an Invoice object containing the extracted information.
 */
export async function extractInvoiceInformation(image: string): Promise<Invoice> {
    // TODO: Implement this by calling an API.

    return {
        invoiceNumber: 'INV-2024-123',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        billerInformation: 'Acme Corp, 123 Main St, Anytown',
        recipientInformation: 'John Doe, 456 Oak St, Anytown',
        items: [
            {
                description: 'Consulting Services',
                quantity: 10,
                unitPrice: 100,
                totalPrice: 1000,
            },
        ],
        subtotal: 1000,
        taxes: 100,
        discounts: 0,
        totalAmountDue: 1100,
    };
}
