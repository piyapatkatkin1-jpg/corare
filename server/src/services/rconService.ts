import { Rcon } from 'rcon-client';
import { config } from '../config';

interface ServerRconOptions {
  host?: string | null;
  port?: number | null;
  password?: string | null;
}

export class RconService {
  /**
   * Execute an array of Minecraft console commands via RCON.
   * If RCON fails or is not enabled, returns false so callers can fallback to CommandQueue.
   */
  public static async executeCommands(
    commands: string[],
    player: { username: string; uuid?: string | null },
    customRcon?: ServerRconOptions
  ): Promise<{ success: boolean; results: string[] }> {
    const host = customRcon?.host || config.rcon.host;
    const port = customRcon?.port || config.rcon.port;
    const password = customRcon?.password || config.rcon.password;

    // Replace placeholders: %player% -> player.username, %uuid% -> player.uuid
    const processedCommands = commands.map((cmd) => {
      let c = cmd.replace(/%player%/g, player.username);
      if (player.uuid) {
        c = c.replace(/%uuid%/g, player.uuid);
      }
      return c;
    });

    if (!config.rcon.enabled && (!customRcon || !customRcon.host)) {
      console.log(`ℹ️ [RCON] RCON disabled. Enqueuing commands for player: ${player.username}`);
      return { success: false, results: ['RCON disabled in config'] };
    }

    try {
      const rcon = new Rcon({
        host,
        port,
        password,
        timeout: 4000,
      });

      await rcon.connect();
      const results: string[] = [];

      for (const cmd of processedCommands) {
        const response = await rcon.send(cmd);
        results.push(response);
        console.log(`⚡ [RCON] Executed: "${cmd}" -> "${response}"`);
      }

      await rcon.end();
      return { success: true, results };
    } catch (err: any) {
      console.warn(`⚠️ [RCON] Failed to connect/send command: ${err.message}`);
      return { success: false, results: [err.message] };
    }
  }

  /**
   * Test connection to RCON server
   */
  public static async testConnection(options?: ServerRconOptions): Promise<{ success: boolean; message: string }> {
    const host = options?.host || config.rcon.host;
    const port = options?.port || config.rcon.port;
    const password = options?.password || config.rcon.password;

    try {
      const rcon = new Rcon({
        host,
        port,
        password,
        timeout: 4000,
      });

      await rcon.connect();
      const response = await rcon.send('list');
      await rcon.end();
      return { success: true, message: `เชื่อมต่อสำเร็จ: ${response}` };
    } catch (err: any) {
      return { success: false, message: `เชื่อมต่อไม่สำเร็จ: ${err.message}` };
    }
  }
}
