import * as current from './young-content.js';
import * as v3 from './young-content-v3.js';
import * as v2 from './young-content-v2.js';
export const contentForVersion=version=>version>=4?current:version===3?v3:v2;
