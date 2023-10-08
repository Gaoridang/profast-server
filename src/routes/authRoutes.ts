import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import axios from 'axios';

import { googleSignIn, googleSignUp, signUp } from '../controllers/authControllers';
import { SignFormSchema } from '../libs/schemas';
import { getGoogleToken } from '../libs/oauth-utils';

const authRouter = express.Router();

const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      console.error('Server Error: ', error);
      res.status(400).send({ message: 'Invalid request body.' });
    }
  };

authRouter.post('/signup', validate(SignFormSchema), signUp);
authRouter.get('/google/signin', googleSignIn);
authRouter.get('/signin/redirect', (req: Request, res: Response) => {
  const { code } = req.query;
  console.log('code: ', code);
  res.send('redirected');
});
authRouter.get('/google/signup', googleSignUp);
authRouter.get('/signup/redirect', async (req: Request, res: Response) => {
  const { code } = req.query;
  console.log('code: ', code);
  res.send('redirected');

  if (typeof code === 'string') {
    const token = await getGoogleToken(code, 'GOOGLE_SIGNUP_REDIRECT_URI');
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    console.log('response: ', userRes.data);
  }
});

export default authRouter;
