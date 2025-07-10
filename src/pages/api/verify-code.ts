import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success?: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { accessCode } = req.body;
    
    // Get the access code from environment variables
    const validAccessCode = process.env.NEXT_PUBLIC_SERVER_SECRET_ACCESS_CODE;
    
    if (!validAccessCode) {
      console.error('NEXT_PUBLIC_SERVER_SECRET_ACCESS_CODE environment variable is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    if (accessCode === validAccessCode) {
      return res.status(200).json({ success: true });
    }
    
    return res.status(401).json({ message: 'Invalid access code' });
  } catch (error) {
    console.error('Error in verify-code route:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}