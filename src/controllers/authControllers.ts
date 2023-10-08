import type { Request, Response } from 'express';
import bycript from 'bcrypt';
import axios from 'axios';

import type { SignFormValues } from '../libs/schemas/signFormSchema';
import getEnv from '../../config';

export const signUp = async (req: Request<SignFormValues>, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    // TODO: Implement sign up logic, upload to mongoDB
    const hashedPassword = await bycript.hash(password, 10);
    console.log('hashedPassword: ', hashedPassword);

    res.status(200).send({ message: 'User signed up successfully!' });
  } catch (error) {
    console.error('Server Error: ', error);
    res.status(500).send({ message: 'Error signing up user.' });
  }
};

export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${getEnv('GOOGLE_CLIENT_ID')}`;
    url += `&redirect_uri=${encodeURIComponent(getEnv('GOOGLE_REDIRECT_URI'))}`;
    url += '&response_type=code';
    url += '&scope=openid%20email%20profile';
    res.redirect(url);
  } catch (error) {}
};

export const googleSignInRedirect = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  console.log('code: ', code);
  try {
    if (typeof code !== 'string') throw new Error('code is not string');
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: `${getEnv('GOOGLE_CLIENT_ID')}`,
      client_secret: `${getEnv('GOOGLE_CLIENT_SECRET')}`,
      redirect_uri: `${getEnv('GOOGLE_REDIRECT_URI')}`,
      grant_type: 'authorization_code',
    });

    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenRes.data.access_token}`,
      },
    });

    console.log('response: ', userRes.data);
    res.redirect('http://localhost:5174');
  } catch (error) {
    console.error('Server Error: ', error);
    res.status(500).send({ message: 'Error signing in user.' });
  }
};
