import type {ReactNode} from 'react';
import {Navigate} from 'react-router-dom';
import {useTeacherPreferences} from '@/services/teacher-preferences';
import GeneralPlannerPage from '@/pages/GeneralPlannerPage';
export default function PlannerAccess({children,entry=false}:{children:ReactNode;entry?:boolean}){const {preferences,error}=useTeacherPreferences();if(error)return <p role="alert" className="p-6">{error}</p>;if(!preferences)return <p className="p-6">Opening your planner…</p>;if(preferences.legacyPlanner)return <>{children}</>;return entry?<GeneralPlannerPage/>:<Navigate to="/planner" replace/>;}
