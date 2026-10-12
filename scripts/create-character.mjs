import {readFile,writeFile} from 'node:fs/promises';
import {createCharacter} from '../functions/learning-content/src/character-builder.js';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node scripts/create-character.mjs recipe.json character.json');
const recipe=JSON.parse(await readFile(input,'utf8'));
await writeFile(output,JSON.stringify(createCharacter(recipe),null,2)+'\n',{flag:'wx'});
console.log(`Created ${recipe.id}. Add this pack under assets.characters.${recipe.id}; use the shared Story 2 cues.`);
