export const STONE_CLASS_ID: string;
export const EPISODE: string;
export const VERSION: number;
export const INITIAL: Record<string,number>;
export const RULES: Record<string,Record<string,number>>[];
export function replay(choices: string[]): Record<string,number>;
export function available(choices:string[],choice:string):boolean;
export function assess(choices:string[]): {state:Record<string,number>;scores:Record<string,number>;total:number;ending:string;notes:string[];complete:boolean};
