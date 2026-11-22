import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import prisma from '../prisma';
import { RconService } from '../services/rconService';

export class OrdersController {
  /**
   * Purchase an item using Points balance
   */
  public static async purchaseProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ' });
      }

      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: 'ไม่ได้ระบุรหัสสินค้า' });
      }

      // 1. Fetch user with latest balance
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
      }

      // 2. Fetch product details with server
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { server: true },
      });

      if (!product || !product.isActive) {
        return res.status(404).json({ error: 'สินค้าไม่พร้อมจำหน่าย หรือถูกปิดการขายแล้ว' });
      }

      // Check stock
      if (product.stock !== -1 && product.stock <= 0) {
        return res.status(400).json({ error: 'ขออภัย สินค้านี้หมดสต็อกแล้ว' });
      }

      // Check balance
      if (user.balance < product.price) {
        const needed = product.price - user.balance;
        return res.status(400).json({
          error: `Point ไม่เพียงพอ (คุณมี ${user.balance.toLocaleString()} Points, ขาดอีก ${needed.toLocaleString()} Points)`,
          needTopup: true,
          shortfall: needed,
        });
      }

      // 3. Parse commands to execute
      let commandsList: string[] = [];
      try {
        commandsList = JSON.parse(product.commands);
      } catch (e) {
        commandsList = product.commands ? [product.commands] : [];
      }

      // 4. Execute commands via RCON if configured
      let rconSuccess = false;
      let executionResults: string[] = [];

      if (product.server.rconHost && product.server.rconPassword) {
        const rconRes = await RconService.executeCommands(
          commandsList,
          { username: user.username, uuid: user.uuid },
          {
            host: product.server.rconHost,
            port: product.server.rconPort,
            password: product.server.rconPassword,
          }
        );
        rconSuccess = rconRes.success;
        executionResults = rconRes.results;
      } else {
        const rconRes = await RconService.executeCommands(commandsList, {
          username: user.username,
          uuid: user.uuid,
        });
        rconSuccess = rconRes.success;
        executionResults = rconRes.results;
      }

      // 5. Database transaction: Deduct balance, create Order, OrderItem, CommandQueue, and RecentPurchase
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await prisma.$transaction(async (tx) => {
        // Deduct balance
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            balance: { decrement: product.price },
            totalSpent: { increment: product.price },
          },
        });

        // Decrement stock if limited
        if (product.stock > 0) {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: 1 } },
          });
        }

        // Create Order
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            totalPoints: product.price,
            status: 'SUCCESS',
          },
        });

        // Create OrderItem
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            price: product.price,
            commandsExecuted: JSON.stringify(commandsList),
            status: rconSuccess ? 'SUCCESS' : 'QUEUED',
          },
        });

        // Queue commands for in-game execution
        for (const rawCmd of commandsList) {
          let cmd = rawCmd.replace(/%player%/g, user.username);
          if (user.uuid) {
            cmd = cmd.replace(/%uuid%/g, user.uuid);
          }

          await tx.commandQueue.create({
            data: {
              orderId: order.id,
              serverId: product.serverId,
              playerUsername: user.username,
              playerUuid: user.uuid,
              command: cmd,
              status: rconSuccess ? 'EXECUTED' : 'PENDING',
              executedAt: rconSuccess ? new Date() : null,
            },
          });
        }

        // Create RecentPurchase entry
        await tx.recentPurchase.create({
          data: {
            username: user.username,
            uuid: user.uuid,
            productName: product.name,
            serverName: product.server.name,
            price: product.price,
          },
        });

        return { order, updatedUser };
      });

      console.log(`✅ [Order] User "${user.username}" purchased "${product.name}" for ${product.price} Points (RCON: ${rconSuccess})`);

      return res.json({
        success: true,
        message: rconSuccess
          ? `สั่งซื้อสำเร็จ! ระบบได้ส่ง "${product.name}" เข้าตัวละครของคุณในเกมแล้ว`
          : `สั่งซื้อสำเร็จ! คำสั่งส่งไอเทมถูกส่งไปยังคิวเซิร์ฟเวอร์เกม และจะประมวลผลทันทีเมื่อเข้าเกม`,
        order: result.order,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
        },
        remainingBalance: result.updatedUser.balance,
      });
    } catch (err: any) {
      console.error('Error during purchase:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสั่งซื้อสินค้า กรุณาลองใหม่อีกครั้ง' });
    }
  }

  /**
   * Get Recent Purchases feed for homepage marquee
   */
  public static async getRecentPurchases(req: any, res: Response) {
    try {
      const recent = await prisma.recentPurchase.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ recent });
    } catch (err: any) {
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลประวัติการซื้อล่าสุดได้' });
    }
  }

  /**
   * Get current user's order history
   */
  public static async getMyOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'ไม่ได้เข้าสู่ระบบ' });
      }

      const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true, server: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      return res.json({ orders });
    } catch (err: any) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการสั่งซื้อ' });
    }
  }

  /**
   * Admin: View all orders with filters
   */
  public static async getAllOrdersAdmin(req: any, res: Response) {
    try {
      const { search, status, page = '1', limit = '20' } = req.query;
      const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

      const where: any = {};
      if (status && typeof status === 'string') {
        where.status = status;
      }
      if (search && typeof search === 'string') {
        where.OR = [
          { orderNumber: { contains: search } },
          { user: { username: { contains: search } } },
        ];
      }

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          include: {
            user: { select: { username: true, uuid: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string, 10),
        }),
      ]);

      return res.json({ total, orders, page: parseInt(page as string, 10) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
