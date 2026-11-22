import { Request, Response } from 'express';
import prisma from '../prisma';
import { RconService } from '../services/rconService';
import { getFirestoreDb, testFirestoreCredentials, initFirebase } from '../services/firebaseService';

export class SettingsController {
  /**
   * Get public store configuration (Store name, server IP, announcement, discord, theme)
   */
  public static async getPublicSettings(req: Request, res: Response) {
    try {
      const db = getFirestoreDb();
      if (db) {
        try {
          const doc = await db.collection('settings').doc('default').get();
          if (doc.exists) {
            const data = doc.data();
            return res.json({
              settings: {
                storeName: data?.storeName || 'corarevanilla',
                logoUrl: data?.logoUrl || '',
                logoIcon: data?.logoIcon || '💎',
                tagline: data?.tagline || 'Official Web Store',
                serverIp: data?.serverIp || 'corarevanilla.xyz',
                discordUrl: data?.discordUrl || 'https://discord.gg/corarevanilla',
                announcement: data?.announcement || '',
                themeColor: data?.themeColor || 'light-blue',
                truemoneyPhone: data?.truemoneyPhone || '0812345678',
                promptpayEnabled: data?.promptpayEnabled !== undefined ? Boolean(data.promptpayEnabled) : true,
                promptpayNumber: data?.promptpayNumber || '0812345678',
                promptpayName: data?.promptpayName || 'corarevanilla Store',
              },
            });
          }
        } catch (e) {
          console.warn('⚠️ [Firebase] Could not fetch settings from Firestore, using Prisma:', e);
        }
      }

      let settings = await prisma.systemSetting.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        settings = await prisma.systemSetting.create({
          data: {
            id: 'default',
            storeName: 'corarevanilla',
            serverIp: 'corarevanilla.xyz',
            discordUrl: 'https://discord.gg/corarevanilla',
            announcement: 'ยินดีต้อนรับสู่ corarevanilla SMP - สังคมเอาชีวิตรอด คอมมูนิตี้มายคราฟแท้ IP: corarevanilla.xyz',
            themeColor: 'light-blue',
          },
        });
      }

      return res.json({
        settings: {
          storeName: settings.storeName,
          logoUrl: settings.logoUrl || '',
          logoIcon: settings.logoIcon || '💎',
          tagline: settings.tagline || 'Official Web Store',
          serverIp: settings.serverIp,
          discordUrl: settings.discordUrl,
          announcement: settings.announcement,
          themeColor: settings.themeColor,
          truemoneyPhone: settings.truemoneyPhone,
          promptpayEnabled: settings.promptpayEnabled,
          promptpayNumber: settings.promptpayNumber,
          promptpayName: settings.promptpayName,
        },
      });
    } catch (err: any) {
      console.error('Error fetching public settings:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' });
    }
  }

  /**
   * Admin: Get all configurations including RCON, Secret Keys, TrueMoney
   */
  public static async getAdminSettings(req: Request, res: Response) {
    try {
      const db = getFirestoreDb();
      if (db) {
        try {
          const doc = await db.collection('settings').doc('default').get();
          if (doc.exists) {
            return res.json({ settings: doc.data() });
          }
        } catch (e) {
          console.warn('⚠️ [Firebase] Could not fetch admin settings from Firestore, using Prisma:', e);
        }
      }

      let settings = await prisma.systemSetting.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        settings = await prisma.systemSetting.create({
          data: { id: 'default' },
        });
      }

      return res.json({ settings });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Admin: Update all system configurations
   */
  public static async updateSettings(req: Request, res: Response) {
    try {
      const {
        storeName,
        logoUrl,
        logoIcon,
        tagline,
        serverIp,
        discordUrl,
        truemoneyPhone,
        promptpayEnabled,
        promptpayNumber,
        promptpayName,
        serverSecretKey,
        linkExpiryMinutes,
        maxLinkAttempts,
        rconEnabled,
        rconHost,
        rconPort,
        rconPassword,
        announcement,
        themeColor,
        useFirebase,
        firebaseProjectId,
        firebaseClientEmail,
        firebasePrivateKey,
      } = req.body;

      const payload = {
        storeName: storeName || 'corarevanilla',
        logoUrl: logoUrl !== undefined ? logoUrl : '',
        logoIcon: logoIcon || '💎',
        tagline: tagline || 'Official Web Store',
        serverIp: serverIp || 'corarevanilla.xyz',
        discordUrl: discordUrl || '',
        truemoneyPhone: truemoneyPhone || '0812345678',
        promptpayEnabled: promptpayEnabled !== undefined ? Boolean(promptpayEnabled) : true,
        promptpayNumber: promptpayNumber || '0812345678',
        promptpayName: promptpayName || 'corarevanilla Store',
        serverSecretKey: serverSecretKey || 'corare_minecraft_secret_token_change_in_production',
        linkExpiryMinutes: linkExpiryMinutes ? parseInt(linkExpiryMinutes, 10) : 5,
        maxLinkAttempts: maxLinkAttempts ? parseInt(maxLinkAttempts, 10) : 5,
        rconEnabled: Boolean(rconEnabled),
        rconHost: rconHost || 'corarevanilla.xyz',
        rconPort: rconPort ? parseInt(rconPort, 10) : 25575,
        rconPassword: rconPassword !== undefined ? rconPassword : '',
        announcement: announcement || '',
        themeColor: themeColor || 'light-blue',
        useFirebase: Boolean(useFirebase),
        firebaseProjectId: firebaseProjectId || '',
        firebaseClientEmail: firebaseClientEmail || '',
        firebasePrivateKey: firebasePrivateKey !== undefined ? firebasePrivateKey : '',
      };

      // 1. If Firebase enabled or credentials provided, try initializing
      if (payload.useFirebase && payload.firebaseProjectId && payload.firebaseClientEmail && payload.firebasePrivateKey) {
        initFirebase({
          projectId: payload.firebaseProjectId,
          clientEmail: payload.firebaseClientEmail,
          privateKey: payload.firebasePrivateKey,
        });
      }

      // 2. Sync to Firebase Firestore if connected
      const db = getFirestoreDb();
      if (db && payload.useFirebase) {
        try {
          await db.collection('settings').doc('default').set(payload, { merge: true });
          console.log('🔥 [Firebase] Settings synced to Firestore');
        } catch (fbErr: any) {
          console.warn('⚠️ [Firebase] Failed to write settings to Firestore:', fbErr.message);
        }
      }

      // 3. Upsert in Prisma
      const updated = await prisma.systemSetting.upsert({
        where: { id: 'default' },
        update: payload,
        create: {
          id: 'default',
          ...payload,
        },
      });

      console.log('⚙️ [Settings] System configurations updated by admin');
      return res.json({ success: true, message: 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว', settings: updated });
    } catch (err: any) {
      console.error('Error updating settings:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * Admin: Test RCON connection with provided credentials
   */
  public static async testRconConnection(req: Request, res: Response) {
    try {
      const { host, port, password } = req.body;

      const testResult = await RconService.testConnection({
        host: host || 'corarevanilla.xyz',
        port: port ? parseInt(port, 10) : 25575,
        password: password || '',
      });

      return res.json(testResult);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Admin: Test Firebase Firestore connection with provided credentials
   */
  public static async testFirebaseConnection(req: Request, res: Response) {
    try {
      const { projectId, clientEmail, privateKey } = req.body;

      const testResult = await testFirestoreCredentials({
        projectId,
        clientEmail,
        privateKey,
      });

      return res.json(testResult);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
