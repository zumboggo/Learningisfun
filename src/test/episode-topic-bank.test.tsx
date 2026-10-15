import {afterEach,it,expect} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {EpisodeTopicBank} from '@/components/EpisodeTopicBank';
import {episodeTopic} from '../../functions/learning-content/src/episode-topics.js';
afterEach(cleanup);
it('opens a chapter-ordered bank, keeps unrelated topics separate, and collapses again',()=>{
 const titles=['The Giants That Were Mills','The Promise Left Behind','A Knight Needs a Sidekick','The Door That Disappeared','The Castle That Served Supper'];
 render(<EpisodeTopicBank entries={[...titles.map(title=>({id:title,...episodeTopic({title}),content:<a href={'#'+title}>{title}</a>})),{id:'ethics',topic:'The Teaching Stone',order:0,content:<a href="#ethics">Ethics story</a>}]}/>);
 const topic=screen.getByRole('button',{name:'Don Quixote 5 episodes'});
 expect(topic).toHaveAttribute('aria-expanded','false');expect(screen.queryByRole('link')).not.toBeInTheDocument();
 fireEvent.click(topic);expect(topic).toHaveAttribute('aria-expanded','true');
 expect(screen.getAllByRole('link').map(l=>l.textContent)).toEqual([titles[2],titles[4],titles[1],titles[3],titles[0]]);
 expect(screen.queryByRole('link',{name:'Ethics story'})).not.toBeInTheDocument();
 fireEvent.click(topic);expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
