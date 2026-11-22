/**
 * PromptPay EMVCo QR Code Payload Generator
 * Zero-dependency implementation for standard PromptPay QR payments
 */

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Sanitize target (strip dashes, spaces)
  const cleaned = target.replace(/[^0-9]/g, '');

  let subtag: string;
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Mobile phone number: convert 08x-xxx-xxxx -> 00668xxxxxxxx
    const mobileFormatted = `0066${cleaned.substring(1)}`;
    subtag = formatField('00', 'A000000677010111') + formatField('01', mobileFormatted);
  } else if (cleaned.length === 13) {
    // National ID or Tax ID
    subtag = formatField('00', 'A000000677010111') + formatField('02', cleaned);
  } else {
    // Fallback as mobile or id
    const mobileFormatted = cleaned.startsWith('0') ? `0066${cleaned.substring(1)}` : cleaned;
    subtag = formatField('00', 'A000000677010111') + formatField('01', mobileFormatted);
  }

  const tag00 = formatField('00', '01');
  const tag01 = formatField('01', amount && amount > 0 ? '12' : '11');
  const tag29 = formatField('29', subtag);
  const tag53 = formatField('53', '764'); // THB currency code
  const tag54 = amount && amount > 0 ? formatField('54', amount.toFixed(2)) : '';
  const tag58 = formatField('58', 'TH');

  const raw = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(raw);

  return `${raw}${checksum}`;
}

export function getPromptPayQrImageUrl(payload: string, size: number = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payload)}`;
}
