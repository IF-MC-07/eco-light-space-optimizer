import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Max reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, etc.
      return Math.min(retries * 100, 3000);
    },
  },
});

// Error handling untuk mencegah crash
redis.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
  // Jangan crash aplikasi, hanya log error
});

redis.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redis.on('ready', () => {
  console.log('✅ Redis: Ready');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redis.on('end', () => {
  console.log('⚠️ Redis: Connection ended');
});

export const testRedisConnection = async () => {
  try {
    // Cek apakah sudah terhubung
    if (redis.isOpen) {
      console.log('✅ Redis already connected');
      return redis;
    }
    
    await redis.connect();
    console.log('✅ Redis connected successfully');
    return redis;
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    // Return null tapi jangan crash - aplikasi bisa tetap berjalan tanpa Redis
    // (tapi fitur yang membutuhkan Redis akan gagal)
    return null;
  }
};

// Helper function untuk safe Redis operations
export const safeRedisOperation = async (operation, fallback = null) => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    return await operation();
  } catch (err) {
    console.error('⚠️ Redis operation failed:', err.message);
    return fallback;
  }
};

export default redis;