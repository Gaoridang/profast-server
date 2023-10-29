import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
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

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, password, email } = SignFormSchema.parse(req.body);

    const db = getDbConnection();

    const [existingUserName] = (await db.execute(checkUserNameQuery, [name])) as RowDataPacket[];
    const [existingUserEmail] = (await db.execute(checkUserEmailQuery, [email])) as RowDataPacket[];
    if (existingUserName.length) {
      return res.send({ error: '이미 사용중인 이름입니다.' });
    }
    if (existingUserEmail.length) {
      return res.send({ error: '이미 가입된 이메일입니다.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await db.execute(createUserQuery, [name, email, hashedPassword]);

    return res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Server Error: ', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const db = getDbConnection();

    const [existingUser] = (await db.execute(getUserQuery, [email])) as RowDataPacket[];
    if (!existingUser.length) {
      return res.send({ error: '가입되지 않은 이메일입니다.' });
    }

    const user = existingUser[0];
    const isPasswordCorrect = bcrypt.compareSync(password, existingUser[0].password);
    if (!isPasswordCorrect) {
      return res.send({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const secretKey = process.env.JWT_SECRET_KEY ?? 'secret';
    const accessToken = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, secretKey);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await db.execute(insertTokenQuery, [user.id, refreshToken, 'refresh', expiresAt]);

    return res.send({ accessToken, refreshToken });
  } catch (error) {
    console.error('Server Error: ', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader && authHeader.split(' ')[1];
    if (!refreshToken) {
      return res.status(401).send({ error: '갱신 토큰이 없습니다.' });
    }

    const db = getDbConnection();
    const secretKey = process.env.JWT_SECRET_KEY ?? 'secret';

    try {
      jwt.verify(refreshToken, secretKey);
    } catch (error) {
      return res.status(401).send({ error: '유효하지 않은 갱신 토큰입니다.' });
    }

    // Check if refresh token is expired
    const [existingToken] = (await db.execute(checkTokenQuery, [refreshToken])) as RowDataPacket[];

    if (!existingToken.length) {
      return res.status(401).send({ error: '유효하지 않은 토큰입니다.' });
    }

    // 기존 리프레시 토큰 삭제
    await db.execute(revokeTokenQuery, [refreshToken]);

    const userId = existingToken[0].user_id;
    const [user] = (await db.execute(getUserQuery, [userId])) as RowDataPacket[];

    if (!user.length) {
      return res.status(401).send({ error: '유저를 찾을 수 없습니다.' });
    }

    const userInfo = user[0];
    const payload = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
    };

    const newAccessToken = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign(payload, secretKey);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await db.execute(insertTokenQuery, [userInfo.id, newRefreshToken, 'refresh', expiresAt]);

    return res.send({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Server Error: ', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const db = getDbConnection();
  const refreshToken = authHeader && authHeader.split(' ')[1];
  const revokedTokenQuery = 'UPDATE token SET revoked = 1 WHERE token = ?';
  await db.execute(revokedTokenQuery, [refreshToken]);

  return res.send({ message: '성공적으로 로그아웃 되었습니다.' });
};
