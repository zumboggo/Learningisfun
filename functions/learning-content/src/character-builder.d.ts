export interface CharacterView {src:string;frame:[number,number,number,number];anchors:{nearEye:[number,number];farEye?:[number,number];mouth:[number,number]}}
export interface CharacterRecipe {id:string;name:string;version?:number;finish?:'polished'|'hybrid';head?:{src:string;frame:[number,number,number,number]};views?:Partial<Record<'three-quarter'|'profile',CharacterView>>;provenance?:string;palette?:Record<string,string>;appearance?:Record<string,string>}
export function createCharacter(recipe:CharacterRecipe):any;
