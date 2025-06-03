import { createClient } from 'redis';

let redis;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on('error', (err) => console.error('Redis Client Error', err));
    await redis.connect();
  }
  return redis;
}

export default async function handler(req, res) {
  const client = await getRedisClient();

  // Use IP address as a simple user identifier
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Add the user IP to a Redis set
  await client.sAdd('unique_users', userIp);

  // Get the total unique users
  const userCount = await client.sCard('unique_users');

  res.status(200).json({ uniqueUsers: userCount });
}