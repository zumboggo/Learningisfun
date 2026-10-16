export const FAMILY_CONTACT_CLASS_ID: string;
export const FAMILY_CONTACT_FIELDS: ReadonlyArray<{column:string;label:string;required?:boolean;type?:string}>;
export function blankFamilyContacts(): string[];
export function validateFamilyContacts(values: unknown): string[];
export function familyContactsTsv(rows: ReadonlyArray<{values:string[]}>): string;
