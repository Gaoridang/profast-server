import type { Express, Request, Response } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import authRouter from './src/routes/authRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 5001;

app.use(express.json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server, changed');
});

app.use(authRouter);

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
});
