export interface CharacterRecipe {id:string;name:string;version?:number;provenance?:string;palette?:Record<string,string>;appearance?:Record<string,string>}
export function createCharacter(recipe:CharacterRecipe):any;
