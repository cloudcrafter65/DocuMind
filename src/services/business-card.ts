/**
 * Represents information extracted from a business card.
 */
export interface BusinessCard {
    /**
     * The full name extracted from the business card.
     */
    fullName: string;
    /**
     * The job title extracted from the business card.
     */
    jobTitle: string;
    /**
     * The company name extracted from the business card.
     */
    companyName: string;
    /**
     * An array of phone numbers (mobile, work, fax) extracted from the business card.
     */
    phoneNumbers: string[];
    /**
     * An array of email addresses extracted from the business card.
     */
    emailAddresses: string[];
    /**
     * The website URL extracted from the business card.
     */
    website: string;
    /**
     * The physical address extracted from the business card.
     */
    address: string;
}

/**
 * Asynchronously extracts information from a business card image.
 *
 * @param image The image data of the business card to process.
 * @returns A promise that resolves to a BusinessCard object containing the extracted information.
 */
export async function extractBusinessCardInformation(image: string): Promise<BusinessCard> {
    // TODO: Implement this by calling an API.

    return {
        fullName: 'John Doe',
        jobTitle: 'Software Engineer',
        companyName: 'Example Inc.',
        phoneNumbers: ['123-456-7890', '098-765-4321'],
        emailAddresses: ['john.doe@example.com'],
        website: 'www.example.com',
        address: '123 Main St, Anytown',
    };
}
