import {Link as RouterLink,type LinkProps} from 'react-router-dom';
import {workshopLink} from '@/services/workshop-context';
export function WorkshopLink({to,...props}:LinkProps){return <RouterLink {...props} to={typeof to==='string'?workshopLink(to):to}/>;}
