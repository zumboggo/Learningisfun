import {useParams} from 'react-router-dom';
import {useAuth} from '@/contexts/AuthContext';
import {GameDisplay} from '@/components/GameDisplay';
import {EpisodeExample} from '@/components/teachers/TeacherExamplePreview';

const exampleIds = ['the-people-who-told-him-to-wait', 'one-more-step-toward-peace'];

export default function EpisodeExamplePage() {
  const {slug} = useParams();
  const {user} = useAuth();
  if (!slug || !exampleIds.includes(slug)) return <p role="alert">This episode example was not found.</p>;
  return <GameDisplay cinema userId={user?.$id || 'guest'}>
    <EpisodeExample key={slug} id={slug} cinema/>
  </GameDisplay>;
}
