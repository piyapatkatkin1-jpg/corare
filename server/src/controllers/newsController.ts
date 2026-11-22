import { Request, Response } from 'express';
import prisma from '../prisma';

export class NewsController {
  // ================= Promotions =================
  public static async getPromotions(req: Request, res: Response) {
    try {
      const promotions = await prisma.promotion.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
      return res.json({ promotions });
    } catch (err: any) {
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลโปรโมชันได้' });
    }
  }

  public static async getAllPromotionsAdmin(req: Request, res: Response) {
    try {
      const promotions = await prisma.promotion.findMany({
        orderBy: { order: 'asc' },
      });
      return res.json({ promotions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async createPromotion(req: Request, res: Response) {
    try {
      const { title, subtitle, badge, image, link, order, isActive } = req.body;
      const promotion = await prisma.promotion.create({
        data: {
          title,
          subtitle,
          badge,
          image,
          link,
          order: order ? parseInt(order, 10) : 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
      return res.json({ success: true, promotion });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async updatePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (data.order !== undefined) data.order = parseInt(data.order, 10);
      const promotion = await prisma.promotion.update({
        where: { id },
        data,
      });
      return res.json({ success: true, promotion });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deletePromotion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.promotion.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ================= News =================
  public static async getNews(req: Request, res: Response) {
    try {
      const news = await prisma.news.findMany({
        orderBy: { publishedAt: 'desc' },
      });
      return res.json({ news });
    } catch (err: any) {
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลข่าวสารได้' });
    }
  }

  public static async getNewsById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const article = await prisma.news.findUnique({ where: { id } });
      if (!article) return res.status(404).json({ error: 'ไม่พบบทความ' });
      return res.json({ article });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async createNews(req: Request, res: Response) {
    try {
      const { title, excerpt, content, category, coverImage } = req.body;
      const article = await prisma.news.create({
        data: {
          title,
          excerpt,
          content,
          category: category || 'ทั่วไป',
          coverImage,
        },
      });
      return res.json({ success: true, article });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async updateNews(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const article = await prisma.news.update({
        where: { id },
        data: req.body,
      });
      return res.json({ success: true, article });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deleteNews(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.news.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ================= Rules =================
  public static async getRules(req: Request, res: Response) {
    try {
      const rules = await prisma.rule.findMany({
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      });
      return res.json({ rules });
    } catch (err: any) {
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลกฎได้' });
    }
  }

  public static async createRule(req: Request, res: Response) {
    try {
      const { category, title, content, order } = req.body;
      const rule = await prisma.rule.create({
        data: {
          category,
          title,
          content,
          order: order ? parseInt(order, 10) : 0,
        },
      });
      return res.json({ success: true, rule });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async deleteRule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.rule.delete({ where: { id } });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
