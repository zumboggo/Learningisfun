import {Link, type LinkProps} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {enterGameFullscreen,prefersGameFullscreen} from '@/services/game-display';
// Request while the link click still carries browser user activation; never wait for a route effect.
export function GameLaunchLink({onClick,...props}:LinkProps) {
  const {user}=useAuth();
  return <Link {...props} onClick={event=>{
    onClick?.(event);
    if(!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&props.target!=='_blank'&&user&&prefersGameFullscreen(user.$id))void enterGameFullscreen();
  }}/>;
}
