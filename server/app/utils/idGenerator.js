import crypto from 'crypto';

export const generateCustomId = (prefix) => {
  // Generates prefix-8randomhex (e.g. USR-a1b2c3d4)
  return `${prefix.toUpperCase()}-${crypto.randomBytes(4).toString('hex')}`;
};
