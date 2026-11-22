import axios from 'axios';
import { config } from '../config';

export interface VoucherRedeemResult {
  success: boolean;
  amount: number;
  message: string;
  voucherCode: string;
}

export class TruemoneyService {
  /**
   * Extract voucher code from URL or return bare code
   * Example: https://gift.truemoney.com/campaign/?v=a1b2c3d4e5f6
   */
  public static extractVoucherHash(rawInput: string): string {
    const trimmed = rawInput.trim();
    const match = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Check if the input is already a hash
    const hashMatch = trimmed.match(/^[a-zA-Z0-9_-]{10,40}$/);
    if (hashMatch) {
      return trimmed;
    }
    return trimmed;
  }

  /**
   * Redeem TrueMoney gift voucher
   */
  public static async redeemVoucher(
    voucherInput: string,
    phoneNumber?: string
  ): Promise<VoucherRedeemResult> {
    const voucherHash = this.extractVoucherHash(voucherInput);
    const mobile = phoneNumber || config.truemoneyPhone;

    if (!voucherHash) {
      return {
        success: false,
        amount: 0,
        message: 'ลิงก์ซองของขวัญไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง',
        voucherCode: voucherInput,
      };
    }

    // 1. Sandbox / Testing Mode Handling
    if (voucherHash.startsWith('TEST_') || voucherHash.startsWith('SANDBOX_') || voucherHash.startsWith('DEMO_')) {
      const parts = voucherHash.split('_');
      const testAmount = parts[1] ? parseFloat(parts[1]) : 50;
      return {
        success: true,
        amount: isNaN(testAmount) ? 50 : testAmount,
        message: `(Sandbox Test) เติมเงินสำเร็จ ${testAmount} บาท`,
        voucherCode: voucherHash,
      };
    }

    // 2. Real TrueMoney Gift API Call
    try {
      const url = `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`;
      const response = await axios.post(
        url,
        {
          mobile: mobile.replace(/[^0-9]/g, ''),
          voucher_hash: voucherHash,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
          timeout: 10000,
        }
      );

      const resData = response.data;
      if (resData?.status?.code === 'SUCCESS' && resData?.data?.voucher) {
        const amountBaht = parseFloat(resData.data.voucher.redeemed_amount_baht);
        return {
          success: true,
          amount: amountBaht,
          message: `รับเงินเข้ากระเป๋าสำเร็จ ${amountBaht} บาท`,
          voucherCode: voucherHash,
        };
      } else {
        const errorMsg = resData?.status?.message || 'ซองของขวัญถูกใช้งานไปแล้ว หรือหมดอายุ';
        return {
          success: false,
          amount: 0,
          message: errorMsg,
          voucherCode: voucherHash,
        };
      }
    } catch (err: any) {
      const errorResponse = err.response?.data?.status?.message;
      return {
        success: false,
        amount: 0,
        message: errorResponse || 'ไม่สามารถเชื่อมต่อกับระบบ TrueMoney ได้ หรือซองของขวัญไม่ถูกต้อง',
        voucherCode: voucherHash,
      };
    }
  }

  /**
   * Calculate Points & Bonus for a top-up amount
   */
  public static calculatePoints(amount: number): { basePoints: number; bonusPoints: number; totalPoints: number } {
    const base = Math.floor(amount);
    let bonus = 0;

    if (amount >= 1000) {
      bonus = Math.floor(amount * 0.25); // 25% bonus for 1000+
    } else if (amount >= 500) {
      bonus = Math.floor(amount * 0.20); // 20% bonus for 500+
    } else if (amount >= 300) {
      bonus = Math.floor(amount * 0.15); // 15% bonus for 300+
    } else if (amount >= 100) {
      bonus = Math.floor(amount * 0.10); // 10% bonus for 100+
    } else if (amount >= 50) {
      bonus = Math.floor(amount * 0.05); // 5% bonus for 50+
    }

    return {
      basePoints: base,
      bonusPoints: bonus,
      totalPoints: base + bonus,
    };
  }
}
