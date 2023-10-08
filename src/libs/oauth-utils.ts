import axios from 'axios';
import type { GoogleTokenRes } from './types/token';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (typeof value === 'undefined') {
    throw new Error(`Environment variable ${key} is not defined.`);
  }
  return value;
};

export const buildOAuthUrl = (redirectUriKey: string): string => {
  const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
  const redirectUri = getEnv(redirectUriKey);

  let url = 'https://accounts.google.com/o/oauth2/v2/auth';
  url += `?client_id=${GOOGLE_CLIENT_ID}`;
  url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
  url += '&response_type=code';
  url += '&scope=openid%20email%20profile';
  return url;
};

export const getGoogleToken = async (
  code: string,
  redirectUriKey: string,
): Promise<GoogleTokenRes> => {
  const redirectURI = getEnv(redirectUriKey);
  const tokenRes = await axios.post(getEnv('GOOGLE_TOKEN_URI'), {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectURI,
    grant_type: 'authorization_code',
  });
  return tokenRes.data;
};
