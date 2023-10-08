import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (typeof value === 'undefined') {
    throw new Error(`Environment variable ${key} is not defined.`);
  }
  console.log('value: ', value);
  return value;
};

export default getEnv;
