/** Rounded elbow joins without a rubber-hose spline; shared by every skin. */
export function armGeometry(side:'left'|'right',upperDegrees:number,forearmDegrees:number){
 const sign=side==='left'?-1:1,x=120+sign*44,y=213,a=upperDegrees*Math.PI/180,b=a+forearmDegrees*Math.PI/180;
 const ex=x-Math.sin(a)*58,ey=y+Math.cos(a)*58,wx=ex-Math.sin(b)*57,wy=ey+Math.cos(b)*57;
 const before={x:ex+Math.sin(a)*10,y:ey-Math.cos(a)*10},after={x:ex-Math.sin(b)*10,y:ey+Math.cos(b)*10};
 return {x,y,ex,ey,wx,wy,a,b,path:`M ${x} ${y} L ${before.x} ${before.y} Q ${ex} ${ey} ${after.x} ${after.y} L ${wx} ${wy}`};
}
export const FACE_PATHS:Record<string,string>={
 oval:'M 82 88 Q 120 62 158 88 L 156 132 Q 153 157 130 172 Q 120 178 110 172 Q 87 157 84 132 Z',
 round:'M 82 88 Q 120 62 158 88 L 157 132 Q 156 157 139 167 Q 120 178 101 167 Q 84 157 83 132 Z',
 angular:'M 82 88 Q 120 62 158 88 L 156 135 L 145 155 L 128 172 Q 120 177 112 172 L 95 155 L 84 135 Z',
};
