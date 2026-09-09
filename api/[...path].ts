import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApi } from '../server/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await createApi()(req, res, () => {
    if (!res.writableEnded) res.status(404).json({ error: '接口不存在。' });
  });
}
