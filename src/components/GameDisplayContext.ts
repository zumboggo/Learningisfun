import {createContext} from 'react';

export const GameDisplayContext=createContext<{native:boolean;fullscreen:()=>Promise<void>;windowed:()=>void}|null>(null);
