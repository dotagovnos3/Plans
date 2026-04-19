import type { FastifyInstance } from 'fastify';
import { sendOtp, verifyOtp } from '../auth/otp.js';
import { query } from '../db/pool.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/otp/send', async (request, reply) => {
    const { phone } = request.body as { phone: string };
    if (!phone || phone.length < 10) return reply.code(400).send({ code: 'INVALID_PHONE', message: 'Invalid phone number' });
    sendOtp(phone);
    return reply.send({});
  });

  app.post('/otp/verify', async (request, reply) => {
    const { phone, code } = request.body as { phone: string; code: string };
    if (!verifyOtp(phone, code)) return reply.code(401).send({ code: 'INVALID_OTP', message: 'Invalid or expired OTP' });

    let user = (await query('SELECT * FROM users WHERE phone = $1', [phone])).rows[0];
    if (!user) {
      const username = 'user_' + phone.slice(-4);
      const name = 'Пользователь';
      user = (await query(
        'INSERT INTO users (phone, name, username) VALUES ($1, $2, $3) RETURNING *',
        [phone, name, username]
      )).rows[0];
    }

    const accessToken = app.jwt.sign({ userId: user.id }, { expiresIn: '1h' });
    const refreshToken = app.jwt.sign({ userId: user.id, type: 'refresh' }, { expiresIn: '30d' });
    return reply.send({ access_token: accessToken, refresh_token: refreshToken, user });
  });

  app.post('/refresh', async (request, reply) => {
    const { refresh_token } = request.body as { refresh_token: string };
    try {
      const decoded = app.jwt.verify(refresh_token) as any;
      if (decoded.type !== 'refresh') return reply.code(401).send({ code: 'INVALID_TOKEN', message: 'Not a refresh token' });
      const accessToken = app.jwt.sign({ userId: decoded.userId }, { expiresIn: '1h' });
      const newRefresh = app.jwt.sign({ userId: decoded.userId, type: 'refresh' }, { expiresIn: '30d' });
      return reply.send({ access_token: accessToken, refresh_token: newRefresh });
    } catch {
      return reply.code(401).send({ code: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }
  });

  app.get('/me', { preHandler: [(app as any).authenticate] }, async (request) => {
    const userId = (request.user as any).userId;
    const user = (await query('SELECT * FROM users WHERE id = $1', [userId])).rows[0];
    return { user };
  });
}
