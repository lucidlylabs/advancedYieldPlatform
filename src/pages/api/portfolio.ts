import { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userAddress } = req.query;

  if (!userAddress || typeof userAddress !== 'string') {
    return res.status(400).json({ error: 'Missing user address' });
  }

  try {
    // Join snapshots with share prices every 10 minutes
    const result = await db.query(
      `
      SELECT 
        h.address,
        h.snapshot_timestamp,
        h.balance,
        p.price,
        (h.balance * p.price) AS portfolio_value
      FROM 
        daily_token_holder_snapshots h
      JOIN 
        share_prices p
      ON 
        p.fetch_timestamp <= h.snapshot_timestamp
        AND p.fetch_timestamp >= h.snapshot_timestamp - INTERVAL '10 minutes'
      WHERE
        LOWER(h.address) = $1
      ORDER BY 
        h.snapshot_timestamp DESC;
      `,
      [userAddress.toLowerCase()]
    );

    res.status(200).json({
      portfolioData: result.rows.map(row => ({
        timestamp: row.snapshot_timestamp,
        value: parseFloat(row.portfolio_value),
      })),
    });
  } catch (error) {
    console.error('Error fetching portfolio value:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
