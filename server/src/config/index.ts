import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'corare_secret_jwt_key_super_secure_2026_minecraft_store',
  serverSecretKey: process.env.SERVER_SECRET_KEY || 'corare_minecraft_secret_token_change_in_production',
  truemoneyPhone: process.env.TRUEMONEY_MOBILE_PHONE || '0812345678',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rcon: {
    enabled: process.env.RCON_ENABLED === 'true',
    host: process.env.RCON_HOST || 'corarevanilla.xyz',
    port: parseInt(process.env.RCON_PORT || '25575', 10),
    password: process.env.RCON_PASSWORD || '',
  },
  firebase: {
    useFirebase: process.env.USE_FIREBASE === 'true',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  },
};
