import {expect,it} from 'vitest';
import {routeContentScope} from '@/services/route-content-scope';
it('does not fetch classroom content on unrelated pages',()=>{
 for(const route of ['/classes','/settings','/brainstorming','/game'])expect(routeContentScope(route,['a','b']).domains).toEqual([]);
});
it('scopes classes and features without broadening foreign classes',()=>{
 expect(routeContentScope('/classes/a',['a','b']).classIds).toEqual(['a']);
 expect(routeContentScope('/classes/foreign',['a','b']).classIds).toEqual([]);
 expect(routeContentScope('/decks',['a','b'])).toEqual({classIds:['a','b'],domains:['flashcards']});
 expect(routeContentScope('/texts',['a','b']).domains).toEqual(['texts']);
});
