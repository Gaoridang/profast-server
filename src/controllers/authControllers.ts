import type { Request, Response } from 'express';
import bycript from 'bcrypt';
import type { SignFormValues } from '../libs/schemas/signFormSchema';

const signUp = async (req: Request<SignFormValues>, res: Response): Promise<void> => {
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

export default signUp;
