import arcjet, { detectBot, shield } from '@arcjet/next';

const key = process.env.ARCJET_KEY;
if (!key) {
  throw new Error('ARCJET_KEY environment variable must be set');
}

export const aj = arcjet({
  key,
  characteristics: ['ip.src'],
  rules: [
    // Protect against common attacks
    shield({
      mode: 'LIVE',
    }),
    // Bot detection
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    }),
  ],
});

export default aj;
