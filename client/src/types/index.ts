export interface User {
  id: string;
  username: string;
  uuid?: string | null;
  role: 'USER' | 'ADMIN';
  balance: number;
  totalSpent?: number;
  isLinked?: boolean;
  linkedAt?: string;
  createdAt?: string;
}

export interface GameServer {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  banner?: string;
  isActive: boolean;
  categories?: Category[];
  _count?: {
    products: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  serverId: string;
  order: number;
  products?: Product[];
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  serverId: string;
  categoryId: string;
  commands: string;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  server?: {
    id: string;
    name: string;
    slug: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface RecentPurchase {
  id: string;
  username: string;
  uuid?: string | null;
  productName: string;
  serverName: string;
  price: number;
  createdAt: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  image: string;
  link: string;
  order: number;
  isActive: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage?: string;
  publishedAt: string;
}

export interface Rule {
  id: string;
  category: string;
  title: string;
  content: string;
  order: number;
}

export interface TopupPackage {
  amount: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  popular: boolean;
  tag: string;
}

export interface TopupTransaction {
  id: string;
  transactionId: string;
  amount: number;
  pointsCredited: number;
  bonusPoints: number;
  method: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  voucherCode?: string;
  reference?: string;
  createdAt: string;
  user?: {
    username: string;
    uuid?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  totalPoints: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    price: number;
    status: string;
    product?: {
      id: string;
      name: string;
      image: string;
      server?: { name: string };
    };
  }>;
  user?: {
    username: string;
    uuid?: string;
  };
}

export interface RedeemCode {
  id: string;
  code: string;
  type: 'POINTS' | 'COMMAND';
  pointReward: number;
  commandReward?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    redemptions: number;
  };
}

export interface LinkLog {
  id: string;
  username: string;
  uuid?: string;
  code: string;
  status: string;
  ipAddress?: string;
  serverIdentifier?: string;
  createdAt: string;
}
