import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {GameDisplay} from '@/components/GameDisplay';
import {GameLaunchLink} from '@/components/GameLaunchLink';
import {gameDisplayKey,saveGameDisplay,isGamePlayerRoute} from '@/services/game-display';
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{$id:'u',role:'student'}})}));
let full:Element|null;
let enter:ReturnType<typeof vi.fn>,exit:ReturnType<typeof vi.fn>;
beforeEach(()=>{localStorage.clear();full=null;enter=vi.fn(async()=>{full=document.documentElement;document.dispatchEvent(new Event('fullscreenchange'));});exit=vi.fn(async()=>{full=null;document.dispatchEvent(new Event('fullscreenchange'));});Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>full});Object.defineProperty(document.documentElement,'requestFullscreen',{configurable:true,value:enter});Object.defineProperty(document,'exitFullscreen',{configurable:true,value:exit});});
afterEach(cleanup);
it('requests native fullscreen from the launch gesture but honors window preference and modified clicks',()=>{
 render(<MemoryRouter><GameLaunchLink to="/classes/a/episodes/b">Play</GameLaunchLink></MemoryRouter>);fireEvent.click(screen.getByText('Play'));expect(enter).toHaveBeenCalledOnce();full=null;saveGameDisplay('u',false);fireEvent.click(screen.getByText('Play'));expect(enter).toHaveBeenCalledOnce();saveGameDisplay('u',true);fireEvent.click(screen.getByText('Play'),{ctrlKey:true});expect(enter).toHaveBeenCalledOnce();
});
it('offers fullscreen, window mode and an exit without remounting the game',async()=>{
 const view=render(<MemoryRouter><GameDisplay userId="u"><input aria-label="Draft" defaultValue="keep my place"/></GameDisplay></MemoryRouter>);
 expect(screen.getByRole('region',{name:'Game player'})).toHaveClass('game-display-expanded');
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Full screen'})));expect(screen.getByRole('button',{name:'Exit full screen'})).toBeInTheDocument();
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Exit full screen'})));expect(localStorage.getItem(gameDisplayKey('u'))).toBe('window');expect(screen.getByLabelText('Draft')).toHaveValue('keep my place');expect(screen.getByRole('region')).toHaveClass('game-display-windowed');
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Full screen'})));view.unmount();await act(async()=>{});expect(exit).toHaveBeenCalledTimes(2);
});
it('falls back to filling the window when native fullscreen is denied and Escape restores the window',async()=>{
 enter.mockRejectedValue(new Error('unsupported'));render(<MemoryRouter><GameDisplay userId="u"><p>Story</p></GameDisplay></MemoryRouter>);await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Full screen'})));expect(screen.getByRole('status')).toHaveTextContent('fills this window');fireEvent.keyDown(document,{key:'Escape'});expect(screen.getByRole('region')).toHaveClass('game-display-windowed');
});
it('recognizes both players but not libraries or unrelated class materials',()=>{expect(isGamePlayerRoute('/classes/a/episodes/b')).toBe(true);expect(isGamePlayerRoute('/classes/a/game/preview/teaching-stone')).toBe(true);expect(isGamePlayerRoute('/classes/a/teaching-stone')).toBe(true);expect(isGamePlayerRoute('/classes/a/game')).toBe(false);expect(isGamePlayerRoute('/classes/a')).toBe(false);});
