// Usage: npx tsx scripts-create-admin.ts <username> <password>
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getFirestoreDb } from './src/services/firebaseService';

(async () => {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) throw new Error('usage: <username> <password>');
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore not configured');
  await db.collection('admins').doc(username).set({
    username,
    password: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  });
  console.log('admin created:', username);
  process.exit(0);
})();
