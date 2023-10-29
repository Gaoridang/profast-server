import bcrypt from 'bcrypt';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2';
import getDbConnection from '../../db';
import { SignFormSchema } from '../libs/schemas';
import {
  checkTokenQuery,
  checkUserEmailQuery,
  checkUserNameQuery,
  createUserQuery,
  getUserQuery,
  insertTokenQuery,
  revokeTokenQuery,
} from './auth.queries';
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  BCRYPT_SALT_ROUNDS,
  REFRESH_TOKEN_EXPIRATION_TIME,
} from './constants';
// DONE: JWT 토큰을 이용한 로그인, 로그아웃, 회원가입, 토큰 갱신 기능 구현
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, password, email } = SignFormSchema.parse(req.body);

    const db = getDbConnection();

    const [existingUserName] = (await db.execute(checkUserNameQuery, [name])) as RowDataPacket[];
    const [existingUserEmail] = (await db.execute(checkUserEmailQuery, [email])) as RowDataPacket[];
    if (existingUserName.length) {
      throw new Error('이미 사용중인 이름입니다.');
    }
    if (existingUserEmail.length) {
      throw new Error('이미 가입된 이메일입니다.');
    }

    const hashedPassword = bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
    await db.execute(createUserQuery, [name, email, hashedPassword]);

    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const db = getDbConnection();

    const [existingUser] = (await db.execute(getUserQuery, [email])) as RowDataPacket[];
    if (!existingUser.length) {
      throw new Error('가입되지 않은 이메일입니다.');
    }

    const user = existingUser[0];
    const isPasswordCorrect = bcrypt.compareSync(password, existingUser[0].password);
    if (!isPasswordCorrect) {
      throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error('JWT_SECRET_KEY를 찾을 수 없습니다.');
    }
    const accessToken = jwt.sign(payload, secretKey, { expiresIn: ACCESS_TOKEN_EXPIRATION_TIME });
    const refreshToken = jwt.sign(payload, secretKey);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_TIME);

    await db.execute(insertTokenQuery, [user.id, refreshToken, 'refresh', expiresAt]);

    res.send({ accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

export const refreshUserToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader && authHeader.split(' ')[1];
    if (!refreshToken) {
      throw new Error('갱신 토큰이 없습니다.');
    }

    const db = getDbConnection();
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      throw new Error('JWT_SECRET_KEY를 찾을 수 없습니다.');
    }

    try {
      jwt.verify(refreshToken, secretKey);
    } catch (error) {
      throw new Error('유효하지 않은 갱신 토큰입니다.');
    }

    // 리프레시 토큰 검증
    const [existingToken] = (await db.execute(checkTokenQuery, [refreshToken])) as RowDataPacket[];

    if (!existingToken.length) {
      throw new Error('유효하지 않은 토큰입니다.');
    }

    // 기존 리프레시 토큰 삭제
    await db.execute(revokeTokenQuery, [refreshToken]);

    const userId = existingToken[0].user_id;
    const [user] = (await db.execute(getUserQuery, [userId])) as RowDataPacket[];

    if (!user.length) {
      throw new Error('존재하지 않는 사용자입니다.');
    }

    const userInfo = user[0];
    const payload = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
    };

    const newAccessToken = jwt.sign(payload, secretKey, {
      expiresIn: ACCESS_TOKEN_EXPIRATION_TIME,
    });
    const newRefreshToken = jwt.sign(payload, secretKey);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_TIME);

    await db.execute(insertTokenQuery, [userInfo.id, newRefreshToken, 'refresh', expiresAt]);

    res.send({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const db = getDbConnection();
  const refreshToken = authHeader && authHeader.split(' ')[1];
  await db.execute(revokeTokenQuery, [refreshToken]);

  res.send({ message: '성공적으로 로그아웃 되었습니다.' });
};
