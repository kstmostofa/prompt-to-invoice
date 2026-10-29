/** The product's name as it appears in titles and copy. */
export const PLATFORM_NAME = "PromptToInvoice";

/** Where people are told to write. Set per environment. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@prompttoinvoice.com";

/** Page titles: "Clients | PromptToInvoice". */
export const pageTitle = (title: string) => `${title} | ${PLATFORM_NAME}`;
