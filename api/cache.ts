import type { GithubContext } from '../server/src/types.js';

export const contextCache = new Map<string, GithubContext>();
