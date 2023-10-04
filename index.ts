import type { Express, Request, Response } from 'express';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 5001;

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server, changed');
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
});
