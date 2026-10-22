import {useContext} from 'react';
import {GameDisplayContext} from './GameDisplayContext';

export function GameFullscreenButton(){
 const display=useContext(GameDisplayContext);
 if(!display)return null;
 return <button className="cinema-fullscreen" aria-label={display.native?'Exit full screen':'Full screen'} title={display.native?'Exit full screen':'Full screen'} onClick={()=>display.native?display.windowed():void display.fullscreen()}>
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={display.native?'M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5':'M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5'}/></svg>
 </button>;
}
