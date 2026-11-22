import { Request, Response } from 'express';
import prisma from '../prisma';

export class ProductsController {
  // ================= Public Endpoints =================

  public static async getServers(req: Request, res: Response) {
    try {
      const servers = await prisma.gameServer.findMany({
        where: { isActive: true },
        include: {
          categories: {
            orderBy: { order: 'asc' },
            include: {
              _count: { select: { products: true } },
            },
          },
          _count: { select: { products: true } },
        },
      });
      return res.json({ servers });
    } catch (err: any) {
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์ได้' });
    }
  }

  public static async getServerBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const server = await prisma.gameServer.findUnique({
        where: { slug },
        include: {
          categories: {
            orderBy: { order: 'asc' },
            include: {
              products: {
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!server) {
        return res.status(404).json({ error: 'ไม่พบเซิร์ฟเวอร์ที่ระบุ' });
      }

      return res.json({ server });
    } catch (err: any) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเซิร์ฟเวอร์' });
    }
  }

  public static async getProducts(req: Request, res: Response) {
    try {
      const { serverId, categoryId, featured, search } = req.query;

      const whereClause: any = { isActive: true };

      if (serverId && typeof serverId === 'string') {
        whereClause.serverId = serverId;
      }
      if (categoryId && typeof categoryId === 'string') {
        whereClause.categoryId = categoryId;
      }
      if (featured === 'true') {
        whereClause.isFeatured = true;
      }
      if (search && typeof search === 'string') {
        whereClause.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
        ];
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          server: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      });

      return res.json({ products });
    } catch (err: any) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรายการสินค้า' });
    }
  }

  public static async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          server: true,
          category: true,
        },
      });

      if (!product) {
        return res.status(404).json({ error: 'ไม่พบสินค้าที่ระบุ' });
      }

      return res.json({ product });
    } catch (err: any) {
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงรายละเอียดสินค้า' });
    }
  }

  // ================= Admin Endpoints =================

  public static async createServer(req: Request, res: Response) {
    try {
      const { name, slug, description, icon, banner, rconHost, rconPort, rconPassword } = req.body;
      const server = await prisma.gameServer.create({
        data: {
          name,
          slug,
          description,
          icon,
          banner,
          rconHost,
          rconPort: rconPort ? parseInt(rconPort, 10) : null,
          rconPassword,
        },
      });
      return res.json({ success: true, server });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async updateServer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (data.rconPort) data.rconPort = parseInt(data.rconPort, 10);
      const server = await prisma.gameServer.update({
        where: { id },
        data,
      });
      return res.json({ success: true, server });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deleteServer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.gameServer.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async createCategory(req: Request, res: Response) {
    try {
      const { name, slug, icon, serverId, order } = req.body;
      const category = await prisma.category.create({
        data: {
          name,
          slug,
          icon,
          serverId,
          order: order ? parseInt(order, 10) : 0,
        },
      });
      return res.json({ success: true, category });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (data.order) data.order = parseInt(data.order, 10);
      const category = await prisma.category.update({
        where: { id },
        data,
      });
      return res.json({ success: true, category });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.category.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async createProduct(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        price,
        originalPrice,
        image,
        serverId,
        categoryId,
        commands,
        isFeatured,
        stock,
      } = req.body;

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseInt(price, 10),
          originalPrice: originalPrice ? parseInt(originalPrice, 10) : null,
          image: image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
          serverId,
          categoryId,
          commands: typeof commands === 'string' ? commands : JSON.stringify(commands || []),
          isFeatured: Boolean(isFeatured),
          stock: stock !== undefined ? parseInt(stock, 10) : -1,
        },
      });

      return res.json({ success: true, product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (data.price !== undefined) data.price = parseInt(data.price, 10);
      if (data.originalPrice !== undefined) {
        data.originalPrice = data.originalPrice ? parseInt(data.originalPrice, 10) : null;
      }
      if (data.stock !== undefined) data.stock = parseInt(data.stock, 10);
      if (data.commands && typeof data.commands !== 'string') {
        data.commands = JSON.stringify(data.commands);
      }

      const product = await prisma.product.update({
        where: { id },
        data,
      });

      return res.json({ success: true, product });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
