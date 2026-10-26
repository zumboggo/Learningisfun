/** Approved Kevin design C, adapted to the shared head pivot; no separate timers. */
type Props={skin:string;hair:string;emotion:string;blink:boolean;mouth:number;startled:boolean;firm:boolean;worried:boolean;gazeX:number;gazeY:number};
export default function KevinFace({skin,hair,emotion,blink,mouth,startled,firm,worried,gazeX,gazeY}:Props){
 const smile=['happy','relieved','laughing','excited','proud'].includes(emotion);
 return <g data-kevin-face="approved-c" transform="translate(-18 13) scale(1.15)" stroke="#242b35" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
 <path d="M94 103 Q80 96 85 115 Q88 126 97 122 M146 103 Q159 96 154 116 Q150 125 143 123" fill={skin}/>
 <path d="M94 76 Q121 64 148 79 L146 114 L140 133 L124 148 Q118 151 110 144 L97 132 L92 111 Z" fill={skin}/>
 <path d="M94 103 Q92 127 110 139 Q119 146 130 141 Q115 155 102 139 Q89 125 94 103" fill="#b87c57" stroke="none" opacity=".6"/>
 <path d={worried?"M99 102 Q108 102 113 97 M128 97 Q134 102 143 103":firm?"M99 99 L114 103 M128 103 L143 99":startled?"M99 96 Q106 91 113 95 M128 95 Q136 91 143 96":"M99 100 Q106 96 113 99 M128 99 Q136 96 143 101"} fill="none" strokeWidth="2.8"/>
 {blink||smile&&!mouth?<path data-kevin-eyes="smile" d="M99 110 Q106 104 114 110 M128 110 Q136 105 143 111" fill="none" strokeWidth="2.3"/>:<g data-kevin-eyes="open">{[106,136].map(x=><g key={x}><ellipse cx={x} cy="110" rx="7" ry={startled?7:firm?2.5:4} fill="#fff8e8" strokeWidth="1.2"/><ellipse cx={x+Math.max(-2,Math.min(2,gazeX))} cy={110+Math.max(-1,Math.min(1,gazeY))} rx="2.5" ry={firm?2:3.5} fill="#30302a" stroke="none"/></g>)}</g>}
 <path d="M120 110 L117 121 Q121 125 125 121" fill="none" stroke="#b87c57" strokeWidth="1.5"/>
 <g data-mouth={mouth} data-smile={smile?'broad':'none'} strokeWidth="1.3">
 {smile?<><path d={mouth?'M103 128 Q121 134 139 126 Q135 146 120 146 Q108 143 103 128 Z':'M103 128 Q121 134 139 126 Q134 142 120 142 Q109 140 103 128 Z'} fill="#633e35"/><path d="M106 130 Q121 135 136 128 L132 135 Q119 140 109 134 Z" fill="#fff8e8" stroke="none"/></>:startled?<ellipse cx="121" cy="134" rx="6" ry="8" fill="#633e35"/>:mouth?<path d="M109 130 Q121 126 132 130 Q130 140 120 140 Q112 139 109 130 Z" fill="#633e35"/>:<path d={worried?'M109 136 Q121 129 133 136':firm?'M108 133 L134 133':'M108 131 Q121 136 134 130'} fill="none"/>}
 </g>
 <path d="M99 127 L98 131 M142 125 L143 129" stroke="#b87c57" fill="none" strokeWidth="1"/>
 <path d="M88 108 L82 91 L85 80 L81 76 L90 58 L88 52 L105 49 L113 42 L126 47 L139 43 L150 53 Q164 63 159 83 L153 108 L148 101 L145 80 Q142 97 135 101 L137 78 Q131 96 122 102 L125 76 Q117 94 108 99 L112 76 Q100 95 95 97 L95 114 Z" fill={hair}/>
 <path d="M92 76 Q96 57 108 56 M105 71 Q113 52 123 53 M122 69 Q133 50 142 58 M143 67 Q153 75 151 88" stroke="#46443e" fill="none" strokeWidth="1.5"/>
 </g>;
}
