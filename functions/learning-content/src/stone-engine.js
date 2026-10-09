/** Shared deterministic rules. Browser preview and server validation use this exact module. */
export const STONE_CLASS_ID = 'e24ec8d9-21d7-4c32-a30e-08655c2f4e65';
export const EPISODE = 'grain-we-keep';
export const VERSION = 1;
export const INITIAL = { grain: 60, seed: 20, households: 40, workers: 40, influential: 50, self: 55, trust: 40, resilience: 25, dignity: 35, legacy: 20, knowledge: 0 };
export const RULES = [
  { listen: {trust:8,dignity:5,knowledge:5}, ledger:{resilience:5,knowledge:5}, command:{influential:8,trust:-5} },
  { needs:{grain:-16,households:20,dignity:15}, equal:{grain:-18,households:12,dignity:8}, feast:{grain:-36,households:25,self:-5}, reserve:{households:-18,influential:8,dignity:-10} },
  { paid:{grain:-12,workers:22,resilience:22,trust:8}, shared:{grain:-6,workers:12,self:-8,resilience:18,trust:8}, forced:{workers:-18,resilience:12,dignity:-15}, delay:{workers:-5,resilience:-10} },
  { bargain:{grain:16,influential:10,trust:6}, debt:{grain:24,influential:20,households:-12,dignity:-15}, levy:{grain:12,influential:-15,households:5,trust:4}, refuse:{influential:-10,self:-5} },
  { investigate:{trust:10,dignity:8,knowledge:5}, punish:{workers:-12,trust:-12,dignity:-10}, conceal:{influential:10,trust:-10}, mercy:{households:5,trust:2} },
  { balance:{knowledge:5,legacy:5}, obedience:{influential:5}, kindness:{households:2} },
  { preserve:{resilience:12,households:-3}, ration:{seed:-5,households:8,resilience:5}, consume:{seed:-15,households:15,resilience:-15} },
  { delegate:{self:12,workers:5,trust:7,resilience:5}, alone:{self:-22,resilience:4}, elite:{self:10,influential:10,trust:-7} },
  { publish:{trust:12,dignity:8,legacy:15}, monument:{grain:-8,influential:12,legacy:5}, credit:{trust:8,workers:5,legacy:10} },
  { council:{legacy:20,resilience:12,trust:8,knowledge:5}, successor:{legacy:15,resilience:10,knowledge:5}, secrecy:{legacy:-10,influential:8}, empty:{grain:-12,households:8,resilience:-8} },
];
export function replay(choices) {
  if (!Array.isArray(choices) || choices.length > RULES.length) throw new Error('Invalid choice history');
  const state = {...INITIAL};
  choices.forEach((choice,index)=>{
    if(typeof choice !== 'string' || !Object.hasOwn(RULES[index],choice)) throw new Error('Invalid choice at decision '+(index+1));
    const changes=RULES[index][choice];
    if (state.grain + (changes.grain || 0) < 0) throw new Error('Not enough grain for that promise');
    Object.entries(changes).forEach(([key,value])=>state[key] = key === 'grain' || key === 'seed' ? state[key]+value : Math.max(0,Math.min(100,state[key]+value)));
  });
  return state;
}
export function available(choices, choice) { try { replay([...choices,choice]); return true; } catch { return false; } }
export function assess(choices) {
  const s=replay(choices), complete=choices.length===RULES.length;
  // Published rubric. Resource surplus cannot compensate for dignity or unmet needs.
  const scores={
    needs: Math.round(Math.min(25, (Math.min(s.households,s.workers,s.self)/100)*15 + s.dignity/100*10)),
    resilience: Math.round(Math.min(25, s.resilience/100*15 + Math.min(s.seed/20,1)*5 + Math.min(s.grain/12,1)*5)),
    cooperation: Math.round(Math.min(25, s.trust/100*15 + s.legacy/100*10)),
    understanding: Math.round(Math.min(25,s.knowledge / 20 * 25)),
  };
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  const ending=s.households<40||s.workers<35?'The quiet courtyard':s.seed<10||s.resilience<35?'Bread today, an uncertain tomorrow':s.trust>=65&&s.resilience>=65?'A village that can answer back':'A beginning worth tending';
  const notes=[
    s.households>=60?'Households have enough support to face tomorrow with more security.':'Some households still carry the weight of your decisions. Listen for the people missing from the celebration.',
    s.workers>=60?'Workers gained support as well as responsibilities. Their cooperation has roots.':'The repair depended on people whose needs were not fully met. A working canal alone does not prove a flourishing village.',
    s.seed>=15?'You preserved most seed grain: food for a future that cannot yet thank you.':'You used a substantial share of seed grain. Hunger eased now may return at the next planting.',
    s.self>=45?'Your own wellbeing remains part of the village’s future. You do not have to disappear to serve others.':'Your own reserves are running low. A community that depends on your exhaustion is fragile.',
    choices[3]==='debt'?'The landholder supplied grain, but household debt gave him power over tomorrow. The benefit and the dependency both count.':choices[3]==='levy'?'Your levy protected people but damaged the landholder’s trust. Fair demands still need reasons and accountability.':choices[3]==='bargain'?'Your negotiated grain agreement kept a powerful ally involved without promising him other people’s labor.':'Refusing the landholder avoided dependency but left fewer resources for urgent work.',
    s.trust>=65?'People have reasons to trust the arrangements you leave behind.':'The village needs a way to question decisions without depending on your goodwill.',
    s.knowledge>=20?'You used evidence, interpreted ma’at, and planned beyond your own time in office.':'Growth invitation: inspect evidence, distinguish order from obedience, and ask what survives your departure.',
  ];
  return {state:s,scores,total,ending,notes,complete};
}
