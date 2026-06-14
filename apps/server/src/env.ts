import dotenv from 'dotenv';

dotenv.config();

export const env = {
  BVSHOP_API_BASE: process.env.BVSHOP_API_BASE ?? 'https://bvshop-manage.bvshop.tw/api/v2',
  BVSHOP_API_TOKEN: process.env.BVSHOP_API_TOKEN ?? '',
  PORT: Number(process.env.PORT ?? 3001),
};
