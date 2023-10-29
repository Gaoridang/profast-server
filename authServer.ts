import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createServer } from 'http';
import type { RowDataPacket } from 'mysql2';
import getDbConnection from './db';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(express.json());

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password, email } = req.body;
    // TODO: Validate user with zod
    const db = getDbConnection();

    const checkUserNameQuery = 'SELECT * FROM users WHERE name = ?';
    const checkUserEmailQuery = 'SELECT * FROM users WHERE email = ?';
    const [existingUserName] = (await db.execute(checkUserNameQuery, [name])) as RowDataPacket[];
    const [existingUserEmail] = (await db.execute(checkUserEmailQuery, [email])) as RowDataPacket[];

    if (existingUserName.length) {
      return res.send({ error: '이미 사용중인 이름입니다.' });
    }

    if (existingUserEmail.length) {
      return res.send({ error: '이미 가입된 이메일입니다.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const createUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    await db.execute(createUserQuery, [name, email, hashedPassword]);

    return res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Server Error: ', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDbConnection();

    const getUserQuery = 'SELECT * FROM users WHERE email = ?';
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
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    return res.send({ accessToken: token });
  } catch (error) {
    console.error('Server Error: ', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
});

server.listen(5002, () => {
  console.log('Authentication server listening on port 5002');
});
