import type {AngleCharacter} from './character-angles';
import {useState} from 'react';
/** Angle-specific silhouettes and facial anchors. All coordinates use the shared 240×600 rig. */
export default function AngleFace({character,angle,direction=1,emotion,blink,mouth,gazeX=0,gazeY=0}:{character:AngleCharacter;angle:'three-quarter'|'profile';direction?:number;emotion:string;blink:boolean;mouth:number;gazeX?:number;gazeY?:number}){
 const a=character.rig.appearance||{},p=character.rig.palette||{},skin=p.skin||'#eac09c',hair=p.hair||'#293338',ink='#30343b';
 const profile=angle==='profile',kevin=a.face==='kevin',soft=['round','spirited'].includes(a.face),elder=a.age==='elder';
 const long=['long','ponytail'].includes(a.hair),bob=a.hair==='bob',bun=a.hair==='bun',short=a.hair==='cropped',tousled=['tousled','layered'].includes(a.hair)||['scrappy','kevin'].includes(a.face);
 const [failed,setFailed]=useState('');const artwork=character.rig.views?.[angle],image=artwork&&failed!==artwork.src?artwork:null;
 const near=image?.anchors.nearEye||(profile?[143,119]:[126,119]),far=image?.anchors.farEye||[151,117],lips=image?.anchors.mouth||(profile?[153,148]:[139,150]);
 const happy=['happy','relieved','proud','excited','laughing'].includes(emotion),worried=['worried','sad','embarrassed','disappointed','pleading'].includes(emotion),firm=['angry','determined','skeptical'].includes(emotion),shock=['shocked','surprised','scared'].includes(emotion);
 const outline=profile?'M 100 80 Q 134 64 150 86 L 151 106 L 157 119 L 170 132 Q 173 136 161 138 L 158 147 Q 166 150 156 154 L 154 163 Q 148 177 124 174 L 108 159 Q 91 151 91 130 Z':soft?'M 89 87 Q 121 65 153 83 Q 165 100 159 118 L 164 134 Q 161 158 142 171 Q 131 181 116 171 Q 88 159 85 132 Z':'M 89 86 Q 121 65 151 82 Q 164 96 159 119 L 165 135 L 156 154 L 138 173 Q 129 179 117 169 L 97 152 Q 85 138 87 116 Z';
 const eye=(xy:number[],farEye=false)=>{const [x,y]=xy,w=farEye?5:8;return <g key={farEye?'far':'near'} data-angle-eye={farEye?'far':'near'}>
 <path d={worried?`M ${x-w} ${y-12} Q ${x} ${y-9} ${x+w} ${y-15}`:firm?`M ${x-w} ${y-13} L ${x+w} ${y-9}`:shock?`M ${x-w} ${y-16} Q ${x} ${y-20} ${x+w} ${y-15}`:`M ${x-w} ${y-11} Q ${x} ${y-15} ${x+w} ${y-11}`} fill="none" stroke={hair} strokeWidth={kevin?2.6:2}/>
 {blink||emotion==='laughing'?<path d={`M ${x-w} ${y} Q ${x} ${y+4} ${x+w} ${y}`} fill="none" stroke={ink} strokeWidth="1.8"/>:<><path d={`M ${x-w} ${y} Q ${x} ${y-(shock?10:firm?3:6)} ${x+w} ${y} Q ${x} ${y+(shock?9:firm?3:5)} ${x-w} ${y}`} fill="#fff7e8" stroke={ink} strokeWidth="1.2"/><ellipse cx={x+Math.max(-1.4,Math.min(1.4,gazeX*direction))} cy={y+Math.min(1.5,gazeY)} rx={farEye?1.8:2.7} ry={firm?2:3.5} fill={ink}/><circle cx={x-.7} cy={y-1.4} r=".8" fill="white"/></>}
 </g>};
 return <g data-kevin-face={kevin?'approved-c-angle':undefined} data-angle-face={angle} transform={direction<0?'translate(240 0) scale(-1 1)':undefined} strokeLinejoin="round" strokeLinecap="round">
 {image?<image href={image.src} x={image.frame[0]} y={image.frame[1]} width={image.frame[2]} height={image.frame[3]} preserveAspectRatio="none" onError={()=>setFailed(image.src)} data-angle-artwork={angle}/>:<>
 {(long||bob||bun)&&<path d={bun?'M 86 102 Q 52 105 63 137 Q 70 150 91 141 Z':bob?'M 85 73 Q 59 91 68 143 L 62 163 Q 83 180 110 160 L 132 111 Z':'M 89 72 Q 59 95 68 146 Q 65 186 56 209 Q 91 210 103 167 L 130 115 Z'} fill={hair} stroke={ink} strokeWidth="2"/>}
 <path d={outline} fill={skin} stroke={ink} strokeWidth="2"/>
 <path d={profile?'M 98 108 Q 91 141 120 169 L 132 174 Q 111 176 100 158 L 89 133 Z':'M 91 103 Q 90 135 109 155 L 130 174 Q 108 170 96 151 Q 85 129 91 103'} fill="#8b5340" opacity=".18"/>
 <path d={profile?'M 104 82 Q 125 63 149 83 L 149 106 L 143 99 L 140 83 Q 119 100 110 114 L 102 136 L 94 131 L 86 112 L 81 89 Q 83 66 108 58 Q 141 51 155 74 L 157 88 Z':short?'M 85 119 Q 71 85 92 68 Q 122 51 149 65 Q 166 74 161 96 L 153 105 L 150 85 Q 126 94 104 85 L 96 108 L 95 131 Z':tousled?'M 86 124 L 77 101 L 81 86 L 75 82 L 91 64 L 87 58 L 106 57 L 118 45 L 125 55 L 145 50 L 151 62 L 165 70 L 159 85 L 162 99 L 153 111 L 148 87 Q 141 103 130 108 L 136 86 Q 124 104 113 113 L 118 87 Q 104 105 97 112 L 96 132 Z':'M 85 125 Q 70 94 84 73 Q 105 50 135 57 Q 162 59 165 85 L 157 108 L 149 91 Q 135 105 115 111 L 126 83 Q 108 99 97 121 L 94 138 Z'} fill={hair} stroke={ink} strokeWidth="2"/>
 {profile&&tousled&&<path d="M 85 105 L 76 92 L 82 79 L 77 73 L 92 63 L 88 55 L 108 56 L 119 45 L 127 55 L 146 54 L 151 65 L 162 72 L 153 88 L 146 82 Q 125 94 110 111 L 104 127 L 98 133 L 95 109 Z" fill={hair} stroke={ink} strokeWidth="2"/>}
 <path d="M 99 118 Q 84 110 87 128 Q 90 143 101 137 L 106 129" fill={skin} stroke={ink} strokeWidth="1.5"/><path d="M 96 121 Q 89 120 94 132" fill="none" stroke="#a8775d" strokeWidth="1.2"/>
 <path d={profile?'M 89 85 Q 104 63 133 64 M 96 98 Q 117 76 143 72':'M 88 84 Q 104 64 133 64 M 99 91 Q 114 71 142 69 M 146 75 L 156 88'} fill="none" stroke="#a3a0a0" opacity=".26" strokeWidth="1.5"/>
 </>}
 {a.facialHair==='full'&&<g data-angle-beard="full"><path d={profile?'M 109 133 Q 120 144 145 140 L 163 143 L 162 155 Q 169 166 155 177 Q 136 185 119 169 L 109 152 Z':'M 94 132 Q 106 144 123 138 Q 143 138 160 133 L 156 158 Q 146 183 130 185 Q 104 177 97 157 Z'} fill={p.beard||hair} stroke={ink} strokeWidth="1.5"/><ellipse cx={lips[0]} cy={lips[1]} rx={profile?7:12} ry="7" fill={skin}/></g>}
 {!profile&&eye(far,true)}{eye(near)}
 {a.glasses==='round'&&<g data-angle-glasses="round" fill="none" stroke={p.glasses||'#328fbd'} strokeWidth="2.2"><rect x={near[0]-11} y={near[1]-7} width="22" height="17" rx="5"/>{!profile&&<><rect x={far[0]-7} y={far[1]-7} width="14" height="16" rx="4"/><path d={`M ${near[0]+11} ${near[1]-1} L ${far[0]-7} ${far[1]-1}`}/></>}<path d={`M ${near[0]-11} ${near[1]} L 100 120`}/></g>}
 {!profile&&!image&&<path d="M 146 124 L 150 136 L 141 138" fill="none" stroke="#a8775d" strokeWidth="1.4"/>}
 {elder&&<path d={`M ${near[0]-12} ${near[1]+10} l 5 2 M 116 95 Q 130 90 143 94 M 119 99 L 140 98`} fill="none" stroke="#a8775d" strokeWidth=".9"/>}
 <g transform={`translate(${lips[0]} ${lips[1]}) scale(${profile?.65:1} 1)`} data-mouth={mouth} stroke="#734b41" strokeWidth="1.4">
 {mouth||shock?<path d={mouth===2||shock?'M -4 -4 Q 4 -6 5 0 Q 5 8 0 8 Q -5 7 -4 -4':'M -9 -2 Q 0 1 9 -3 Q 7 8 0 8 Q -8 7 -9 -2'} fill="#633e35"/>:happy?<><path d="M -10 -2 Q 0 3 10 -3 Q 7 9 0 9 Q -8 7 -10 -2" fill="#633e35"/><path d="M -7 0 Q 0 3 7 -1 L 5 3 Q 0 6 -5 3" fill="#fff8e8" stroke="none"/></>:<path d={worried?'M -8 3 Q 0 -2 8 3':firm?'M -8 0 L 8 0':'M -8 0 Q 0 3 8 -1'} fill="none"/>}
 </g>
 </g>;
}
