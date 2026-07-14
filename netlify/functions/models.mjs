// Seznam modelů pro frontend
import { MODELS } from '../../shared/models.mjs';

export default async () => Response.json(MODELS);

export const config = { path: '/api/models' };
