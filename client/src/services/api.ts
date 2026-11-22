const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err: any) {
    throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้ (${err.message}) กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดอยู่ (Port 5000)`);
  }

  const text = await response.text();
  let data: any = {};
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth & Linking
  requestLink: (username: string) =>
    request<{ success: boolean; code: string; username: string; expiresAt: string; command: string; instruction: string }>(
      '/link/request',
      { method: 'POST', body: JSON.stringify({ username }) }
    ),

  checkLinkStatus: (code: string) =>
    request<{ status: string; message?: string; token?: string; user?: any }>(
      `/link/status/${code}`
    ),

  simulateLink: (code: string) =>
    request<{ success: boolean; message: string }>('/link/simulate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  adminLogin: (credentials: { username: string; password: string }) =>
    request<{ success: boolean; token: string; admin: any }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request<{ user: any }>('/me'),

  // Servers & Products
  getServers: () => request<{ servers: any[] }>('/servers'),
  getServerBySlug: (slug: string) => request<{ server: any }>(`/servers/${slug}`),
  getProducts: (params?: { serverId?: string; categoryId?: string; featured?: boolean; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.serverId) query.append('serverId', params.serverId);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.featured) query.append('featured', 'true');
    if (params?.search) query.append('search', params.search);
    return request<{ products: any[] }>(`/products?${query.toString()}`);
  },
  getProductById: (id: string) => request<{ product: any }>(`/products/${id}`),

  // Orders
  purchaseProduct: (productId: string) =>
    request<{ success: boolean; message: string; remainingBalance: number; order: any }>(
      '/orders/purchase',
      { method: 'POST', body: JSON.stringify({ productId }) }
    ),
  getMyOrders: () => request<{ orders: any[] }>('/orders/my-orders'),
  getRecentPurchases: () => request<{ recent: any[] }>('/orders/recent'),

  // Top-up
  getTopupPackages: () => request<{ packages: any[]; settings?: any }>('/topup/packages'),
  redeemVoucher: (voucherUrl: string) =>
    request<{ success: boolean; message: string; amount: number; pointsAdded: number; newBalance: number }>(
      '/topup/voucher',
      { method: 'POST', body: JSON.stringify({ voucherUrl }) }
    ),
  createPromptPayQr: (amount: number) =>
    request<{
      success: boolean;
      transactionId: string;
      amount: number;
      pointsData: { basePoints: number; bonusPoints: number; totalPoints: number };
      promptpayPayload: string;
      qrImageUrl: string;
      recipient: { number: string; name: string };
      expiresAt: string;
    }>('/topup/promptpay/create', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  confirmPromptPay: (transactionId: string) =>
    request<{ success: boolean; message: string; amount: number; pointsAdded: number; newBalance: number }>(
      '/topup/promptpay/confirm',
      { method: 'POST', body: JSON.stringify({ transactionId }) }
    ),
  testTopup: (amount: number) =>
    request<{ success: boolean; message: string; amount: number; pointsAdded: number; bonusPoints: number; newBalance: number }>(
      '/topup/test',
      { method: 'POST', body: JSON.stringify({ amount }) }
    ),
  getTopupHistory: () => request<{ history: any[] }>('/topup/history'),

  // Redeem Code
  redeemCode: (code: string) =>
    request<{ success: boolean; message: string; rewardType: string; rewardSummary: string; newBalance: number }>(
      '/redeem',
      { method: 'POST', body: JSON.stringify({ code }) }
    ),
  getMyRedemptions: () => request<{ redemptions: any[] }>('/redeem/my-redemptions'),

  // Public Settings
  getPublicSettings: () => request<{ settings: any }>('/settings/public'),

  // News, Promos & Rules
  getPromotions: () => request<{ promotions: any[] }>('/promotions'),
  getNews: () => request<{ news: any[] }>('/news'),
  getNewsById: (id: string) => request<{ article: any }>(`/news/${id}`),
  getRules: () => request<{ rules: any[] }>('/rules'),

  // Admin APIs
  admin: {
    getStats: () => request<any>('/admin/dashboard-stats'),
    getLinkingLogs: (search?: string) =>
      request<{ total: number; logs: any[] }>(`/admin/linking-logs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    getAllOrders: (search?: string, status?: string) => {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (status) q.append('status', status);
      return request<{ total: number; orders: any[] }>(`/orders/admin?${q.toString()}`);
    },
    getAllTopups: (search?: string, status?: string) => {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (status) q.append('status', status);
      return request<{ total: number; transactions: any[] }>(`/topup/admin?${q.toString()}`);
    },
    getUsers: (search?: string) =>
      request<{ users: any[] }>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    adjustBalance: (userId: string, amount: number, reason: string) =>
      request<any>('/admin/users/adjust-balance', {
        method: 'POST',
        body: JSON.stringify({ userId, amount, reason }),
      }),
    testRcon: (command: string, serverId?: string) =>
      request<{ success: boolean; output: string }>('/admin/rcon-test', {
        method: 'POST',
        body: JSON.stringify({ command, serverId }),
      }),

    // System Settings & RCON Configs
    getSettings: () => request<{ settings: any }>('/settings/admin'),
    updateSettings: (data: any) => request<any>('/settings/admin', { method: 'PUT', body: JSON.stringify(data) }),
    testRconConnection: (data: { host?: string; port?: number; password?: string }) =>
      request<{ success: boolean; message: string }>('/settings/admin/test-rcon', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    testFirebaseConnection: (data: { projectId?: string; clientEmail?: string; privateKey?: string }) =>
      request<{ success: boolean; message: string }>('/settings/admin/test-firebase', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Products & Categories CRUD
    createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),

    createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

    createServer: (data: any) => request<any>('/servers', { method: 'POST', body: JSON.stringify(data) }),
    updateServer: (id: string, data: any) => request<any>(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteServer: (id: string) => request<any>(`/servers/${id}`, { method: 'DELETE' }),

    // Redeem Codes CRUD
    getCodes: () => request<{ codes: any[] }>('/redeem/admin'),
    createCode: (data: any) => request<any>('/redeem/admin', { method: 'POST', body: JSON.stringify(data) }),
    deleteCode: (id: string) => request<any>(`/redeem/admin/${id}`, { method: 'DELETE' }),

    // News & Promotions CRUD
    getPromotions: () => request<{ promotions: any[] }>('/promotions/admin'),
    createPromotion: (data: any) => request<any>('/promotions', { method: 'POST', body: JSON.stringify(data) }),
    updatePromotion: (id: string, data: any) => request<any>(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePromotion: (id: string) => request<any>(`/promotions/${id}`, { method: 'DELETE' }),

    createNews: (data: any) => request<any>('/news', { method: 'POST', body: JSON.stringify(data) }),
    updateNews: (id: string, data: any) => request<any>(`/news/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteNews: (id: string) => request<any>(`/news/${id}`, { method: 'DELETE' }),

    createRule: (data: any) => request<any>('/rules', { method: 'POST', body: JSON.stringify(data) }),
    deleteRule: (id: string) => request<any>(`/rules/${id}`, { method: 'DELETE' }),
  },
};
