import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET'; // Use the same secret as verify-code.ts

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const cookies = parse(req.headers.cookie || '');
  const token = cookies.auth_token;

  if (!token) {
    return res.status(200).json({ isValid: false });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    // If verification is successful, the token is valid
    return res.status(200).json({ isValid: true });
  } catch (error) {
    // If verification fails, the token is invalid (expired, tampered, etc.)
    return res.status(200).json({ isValid: false });
  }
}