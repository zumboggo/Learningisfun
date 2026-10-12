/** Closed, versioned vocabulary shared by parser, renderer, studio and authoring tools. */
export const ACTING_VERSION=1;
export const EMOTIONS=['neutral','happy','worried','sad','angry','surprised','curious','confused','skeptical','embarrassed','relieved','determined'];
export const RESTS=['relaxed','attentive','guarded','downcast'];
export const TALKS=['explain','reassure','question','insist','hesitant','celebrate'];
export const RESPONSES=['nod','shake-head','shrug','point','wave','recoil','laugh','sigh'];
export const MOVES=['enter','exit','left','center','right','turn','nod','shake','bounce','recoil'];
export const EFFECTS=['fade','closeup','shake','magic'];
export const CAMERAS=['auto','wide','medium','close'];
export const RIG_PARTS=['torso','pelvis','head','leftUpperArm','leftForearm','leftHand','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','rightThigh','rightShin'];
export const AUTO_ACTING={
 neutral:{rest:'relaxed',talk:'explain'},happy:{rest:'relaxed',talk:'celebrate'},
 worried:{rest:'guarded',talk:'hesitant'},sad:{rest:'downcast',talk:'hesitant'},
 angry:{rest:'guarded',talk:'insist'},surprised:{rest:'attentive',talk:'question'},
 curious:{rest:'attentive',talk:'question'},confused:{rest:'attentive',talk:'question'},
 skeptical:{rest:'guarded',talk:'question'},embarrassed:{rest:'downcast',talk:'hesitant'},
 relieved:{rest:'relaxed',talk:'reassure'},determined:{rest:'attentive',talk:'insist'},
};
// Joint angles in degrees. Every preset uses the same anatomy; skins supply only artwork.
export const POSES={
 relaxed:{},attentive:{head:-3,leftForearm:8,rightForearm:-8},
 guarded:{head:3,leftUpperArm:-12,leftForearm:-42,rightUpperArm:12,rightForearm:42},
 downcast:{head:8,torso:2,leftUpperArm:3,rightUpperArm:-3},
 explain:{head:-3,rightUpperArm:-24,rightForearm:-62,rightHand:-12},
 reassure:{head:-5,leftUpperArm:12,leftForearm:45,rightUpperArm:-15,rightForearm:-44},
 question:{head:7,leftUpperArm:22,leftForearm:63,rightUpperArm:-22,rightForearm:-63},
 insist:{head:-2,rightUpperArm:-30,rightForearm:-86,rightHand:12},
 hesitant:{head:8,leftUpperArm:8,leftForearm:30,rightForearm:-12},
 celebrate:{head:-5,leftUpperArm:48,leftForearm:75,rightUpperArm:-48,rightForearm:-75},
 nod:{head:12},'shake-head':{head:-10},
 shrug:{head:7,leftUpperArm:30,leftForearm:60,rightUpperArm:-30,rightForearm:-60},
 point:{head:-5,rightUpperArm:-70,rightForearm:-15,rightHand:0},
 wave:{rightUpperArm:-55,rightForearm:-110,rightHand:-15},
 recoil:{torso:-5,head:7,leftUpperArm:20,leftForearm:80,rightUpperArm:-20,rightForearm:-80},
 laugh:{head:-8,torso:3,leftForearm:25,rightForearm:-25},
 sigh:{head:9,torso:3,leftUpperArm:5,rightUpperArm:-5},
};
export const ACTING_DESCRIPTIONS={
 relaxed:'Soft breathing, occasional blink, shoulders at ease.',attentive:'Slight head tilt and alert listening.',guarded:'Arms held nearer the body; restrained movement.',downcast:'Lowered head and quieter breathing.',
 explain:'One open hand presents an idea.',reassure:'Gentle open hands and a sympathetic tilt.',question:'Both hands open with a questioning head tilt.',insist:'A firm single-hand emphasis.',hesitant:'Small hand movement and a tentative tilt.',celebrate:'Open arms and an upbeat emphasis.',
 nod:'One head nod, then return to rest.','shake-head':'A small side-to-side head motion.',shrug:'Raised forearms and a questioning tilt.',point:'Extend an arm toward something.',wave:'Lift a forearm and wave the hand.',recoil:'Lean back with raised forearms.',laugh:'Head lifts with a brief shoulder bounce.',sigh:'Head and shoulders settle downward.',
};
export function packageAssetEntries(pack){return [...Object.values(pack.assets?.backgrounds||{}),...Object.values(pack.assets?.characters||{}).flatMap(c=>[...Object.values(c.expressions||{}),...Object.values(c.rig?.parts||{})]),...(pack.assets?.music?[pack.assets.music]:[])];}
export function validateRig(rig){
 if(!rig||rig.version!==1||rig.preset!=='teen-v1')return 'Use rig version 1 and the teen-v1 preset';
 if(!rig.parts||RIG_PARTS.some(k=>!rig.parts[k]?.src)||Object.keys(rig.parts).some(k=>!RIG_PARTS.includes(k)))return 'Rig requires exactly the 13 standard body parts';
 if(rig.faceSkin&&!/^#[0-9a-fA-F]{6}$/.test(rig.faceSkin))return 'Rig faceSkin must be a six-digit hex colour';
 return null;
}

/** Decoded payload plus metadata; shared so studio and backend enforce the same budget. */
export function packageContentBytes(pack){const copy=structuredClone(pack);let bytes=0;for(const a of packageAssetEntries(copy)){const data=String(a.src||'').split(',')[1]||'';bytes+=Math.floor(data.length*3/4)-(data.endsWith('==')?2:data.endsWith('=')?1:0);a.src='';}return bytes+new TextEncoder().encode(JSON.stringify(copy)).length;}
