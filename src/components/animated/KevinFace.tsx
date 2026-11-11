import {useId} from 'react';
import {kevinPaint} from './kevin-art';
/** Option A's painted warmth in SVG. Motion is supplied entirely by CartoonActor. */
type Props={skin:string;hair:string;emotion:string;blink:boolean;mouth:number;startled:boolean;firm:boolean;worried:boolean;gazeX:number;gazeY:number};
export default function KevinFace({skin,hair,emotion,blink,mouth,startled,firm,worried,gazeX,gazeY}:Props){
 const id=useId().replace(/:/g,''),smile=['happy','relieved','laughing','excited','proud'].includes(emotion),closed=blink||emotion==='laughing';
 const outline='M 87 91 Q 120 73 153 92 C 158 111 153 142 146 155 Q 135 172 123 178 Q 119 181 113 177 C 99 170 91 158 87 145 Q 81 120 87 91 Z';
 const hairOutline='M 84 134 Q 73 125 77 111 Q 67 98 77 83 Q 68 83 68 76 Q 82 81 91 67 Q 84 67 82 62 Q 95 66 105 57 Q 111 51 112 48 Q 113 57 120 57 Q 139 48 151 62 Q 162 58 171 69 Q 160 65 160 74 Q 176 84 169 103 Q 172 118 158 132 L 155 116 Q 156 104 148 94 Q 145 112 135 122 Q 138 104 131 92 Q 125 114 110 122 Q 119 106 116 93 Q 103 113 94 123 L 91 143 Q 86 141 84 134 Z';
 return <g data-kevin-face="option-a" stroke="#49382e" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
 <defs>
  <radialGradient id={`${id}-skin`} cx="35%" cy="32%" r="76%"><stop stopColor={kevinPaint.skinLight}/><stop offset=".58" stopColor={skin}/><stop offset="1" stopColor={kevinPaint.skinShade}/></radialGradient>
  <linearGradient id={`${id}-hair`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor={kevinPaint.hairLight}/><stop offset=".45" stopColor={hair}/><stop offset="1" stopColor={kevinPaint.hairShade}/></linearGradient>
  <radialGradient id={`${id}-cheek`}><stop stopColor="#d68a6e" stopOpacity=".28"/><stop offset="1" stopColor="#d68a6e" stopOpacity="0"/></radialGradient>
  <clipPath id={`${id}-face`}><path d={outline}/></clipPath>
 </defs>
 <path d="M 90 126 C 73 115 78 142 89 145 M 151 125 C 167 116 164 141 151 145" fill={`url(#${id}-skin)`}/>
 <path d="M 85 129 Q 79 125 84 138 M 156 129 Q 162 125 157 138" stroke="#af7452" fill="none" strokeWidth="1"/>
 <path d={outline} fill={`url(#${id}-skin)`}/>
 <g clipPath={`url(#${id}-face)`} stroke="none">
  <path d="M 81 107 Q 93 128 93 146 Q 103 165 123 174 Q 138 171 148 157 Q 139 177 122 182 Q 96 177 85 151 Z" fill="#ac704d" opacity=".25"/>
  <path d="M 85 100 Q 123 81 156 100 L 151 120 Q 143 109 136 114 L 126 111 L 112 119 L 104 111 L 91 126 Z" fill="#835738" opacity=".16"/>
  <ellipse cx="98" cy="146" rx="13" ry="9" fill={`url(#${id}-cheek)`}/><ellipse cx="143" cy="146" rx="12" ry="9" fill={`url(#${id}-cheek)`}/>
  <path d="M 112 148 Q 119 151 126 146 Q 120 157 112 148 M 108 166 Q 120 171 133 165 Q 122 175 108 166" fill="#ffe2bc" opacity=".38"/>
 </g>
 {[102,140].map((x,i)=><g key={x} data-kevin-eyes={closed?'closed':'open'}>
  <path d={worried?`M ${x-9} 119 Q ${x} 118 ${x+9} ${i?122:114}`:firm?`M ${x-9} ${i?120:116} Q ${x} 117 ${x+9} ${i?116:120}`:startled?`M ${x-9} 114 Q ${x} 108 ${x+9} 114`:`M ${x-9} 118 Q ${x} 113 ${x+9} 117`} fill="none" stroke={hair} strokeWidth="2.8"/>
  {closed?<path d={`M ${x-9} 130 Q ${x} ${smile?123:134} ${x+9} 130`} fill="none" strokeWidth="1.8"/>:<>
   <path d={`M ${x-9} 130 Q ${x} ${startled?115:firm?124:120} ${x+9} 130 Q ${x} ${startled?142:firm?134:137} ${x-9} 130 Z`} fill="#fff7e9" strokeWidth="1"/>
   <ellipse cx={x+Math.max(-2,Math.min(2,gazeX))} cy={130+Math.max(-1,Math.min(1,gazeY))} rx="3.6" ry={firm?2.2:4.1} fill="#70503b" stroke="none"/>
   <ellipse cx={x+Math.max(-2,Math.min(2,gazeX))} cy={130+Math.max(-1,Math.min(1,gazeY))} rx="1.8" ry={firm?2:3.4} fill="#242725" stroke="none"/>
   <circle cx={x-1+Math.max(-2,Math.min(2,gazeX))} cy="128.5" r="1" fill="#fff8e9" stroke="none"/>
   <path d={`M ${x-8} 130 Q ${x} ${startled?115:firm?124:120} ${x+8} 130`} fill="none" strokeWidth="1.6"/>
  </>}
 </g>)}
 <path d="M 119 131 Q 118 139 116 143 Q 119 147 124 144" stroke="#b67b55" strokeWidth="1.1" fill="none"/>
 <path d="M 121 134 L 122 140" stroke="#ffe1b9" strokeWidth="1.5" fill="none" opacity=".7"/>
 <g data-mouth={mouth} data-smile={smile?'broad':'none'} stroke="#87533e" strokeWidth="1.2">
  {startled||mouth===2?<path d="M 116 153 Q 123 149 128 155 Q 130 165 122 166 Q 115 165 116 153 Z" fill="#643e34"/>:mouth||smile?<><path d={smile?'M 108 154 Q 121 160 136 152 Q 132 167 121 167 Q 112 165 108 154 Z':'M 112 155 Q 122 151 132 155 Q 131 163 122 163 Q 114 162 112 155 Z'} fill="#643e34"/><path d="M 111 155 Q 122 159 133 154 L 131 158 Q 120 162 114 158 Z" fill="#fff7e9" stroke="none"/></>:<path d={worried?'M 111 160 Q 122 153 133 160':firm?'M 111 158 Q 122 157 133 158':'M 109 155 Q 122 162 135 154'} fill="none"/>}
 </g>
 <path d="M 115 168 Q 122 171 129 167" stroke="#b77c59" strokeWidth=".7" opacity=".55" fill="none"/>
 <path d={hairOutline} fill={`url(#${id}-hair)`} stroke="#292b27"/>
 <g fill="#655444" opacity=".37" stroke="none" data-kevin-hair="layered-locks">
  <path d="M 79 87 Q 105 87 116 64 Q 109 86 89 101 Q 95 90 79 87 Z"/>
  <path d="M 101 96 Q 119 72 134 67 Q 123 85 121 103 Q 118 87 101 96 Z"/>
  <path d="M 133 75 Q 155 66 160 86 Q 145 74 145 102 Q 141 85 133 75 Z"/>
  <path d="M 154 95 Q 167 107 158 123 Q 161 110 154 95 Z"/>
 </g>
 <g fill="none" stroke="#a38a6b" strokeWidth=".8" opacity=".47">
  <path d="M 80 84 Q 100 84 111 67 M 86 96 Q 104 89 111 79 M 99 109 Q 114 91 118 78 M 123 95 Q 124 80 137 71 M 139 109 Q 144 93 138 83 M 148 78 Q 161 84 163 97 M 119 62 Q 139 55 151 65"/>
 </g>
 <path d="M 86 77 Q 77 67 76 61 M 104 60 Q 99 50 104 44 M 147 60 Q 157 52 164 57" fill="none" stroke="#39352e" strokeWidth="1.1"/>
 </g>;
}
