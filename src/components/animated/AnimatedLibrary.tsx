import {Link} from 'react-router-dom';
export default function AnimatedLibrary({teacher}:{userId:string;teacher:boolean;classId?:string|null}){if(!teacher)return null;return <section className="space-y-3" aria-label="Episode authoring"><Link className="inline-block rounded bg-teal-900 px-5 py-3 text-white" to="/game/create">Create episode</Link></section>;}
