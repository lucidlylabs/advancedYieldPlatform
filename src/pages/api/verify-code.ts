import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// Replace with a strong, unique secret key stored securely in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_DEFAULT_SECRET'; // Use a secure secret!

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { accessCode } = req.body;

  // Replace with your actual server-side secret access code env variable
  const SERVER_SECRET_ACCESS_CODE = process.env.SERVER_SECRET_ACCESS_CODE;

  if (!SERVER_SECRET_ACCESS_CODE) {
    console.error("SERVER_SECRET_ACCESS_CODE is not defined!");
    return res.status(500).json({ message: 'Server configuration error' });
  }

  if (accessCode === SERVER_SECRET_ACCESS_CODE) {
    // Code is correct, generate JWT
    const token = jwt.sign({ verified: true }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

    // Set JWT as an HTTP-only cookie
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60}`); // Max-Age in seconds (1 hour)

    return res.status(200).json({ message: 'Verification successful' });
  } else {
    // Code is incorrect
    return res.status(401).json({ message: 'Invalid access code' });
  }
}