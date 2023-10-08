import { z } from 'zod';

export const SignFormSchema = z
  .object({
    name: z
      .string()
      .min(10, '이름은 10자 이상이어야 합니다.')
      .max(20, '이름은 20자 이하여야 합니다.'),
    email: z.string().email(),
    password: z
      .string()
      .min(10, '비밀번호는 10자 이상이어야 합니다.')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{10,25}$/,
        '비밀번호는 영문, 숫자, 특수문자 (!, @, #, $, %, ^, &, *)를 포함해야 합니다.',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type SignFormValues = z.infer<typeof SignFormSchema>;