import mysql from 'mysql2/promise';

const config =
  process.env.NODE_ENV === 'production'
    ? {
        host: process.env.DB_HOST_PROD,
        user: process.env.DB_USER_PROD,
        password: process.env.DB_PASSWORD_PROD,
        database: process.env.DB_NAME_PROD,
      }
    : {
        host: process.env.DB_HOST_LOCAL,
        user: process.env.DB_USER_LOCAL,
        password: process.env.DB_PASS_LOCAL,
        database: process.env.DB_NAME_LOCAL,
      };

const dbPool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getDbConnection = () => dbPool;

export default getDbConnection;
