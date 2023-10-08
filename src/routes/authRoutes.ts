import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import signUp from '../controllers/authControllers';
import { SignFormSchema } from '../libs/schemas';

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

export default authRouter;
