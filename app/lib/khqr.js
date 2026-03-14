// KHQR EMVCo QR Code Payload Generator
// Based on KHQR Content Guideline v1.3 by National Bank of Cambodia

function padLength(id, value) {
  const len = String(value).length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Currency codes (ISO 4217)
const CURRENCY = {
  USD: '840',
  KHR: '116',
};

// Exchange rate (approximate)
export const USD_TO_KHR = 4100;

export function generateKHQR({
  merchantName = 'Batto Pharmacy',
  merchantCity = 'Phnom Penh',
  merchantId = 'globalrx@devb',
  acquiringBank = 'Dev Bank',
  amount = 0,
  currency = 'USD',
  billNumber = '',
  storeLabel = 'Batto Pharmacy',
  terminalLabel = 'Online',
  mcc = '5912', // MCC for Drug Stores and Pharmacies
}) {
  let payload = '';

  // 00 - Payload Format Indicator
  payload += padLength('00', '01');

  // 01 - Point of Initiation Method (12 = Dynamic QR)
  payload += padLength('01', amount > 0 ? '12' : '11');

  // 29 - Merchant Account Information (Individual)
  let merchantAccInfo = '';
  merchantAccInfo += padLength('00', 'bakong');
  merchantAccInfo += padLength('01', merchantId);
  merchantAccInfo += padLength('02', acquiringBank);
  payload += padLength('29', merchantAccInfo);

  // 52 - Merchant Category Code
  payload += padLength('52', mcc);

  // 53 - Transaction Currency
  payload += padLength('53', CURRENCY[currency] || CURRENCY.USD);

  // 54 - Transaction Amount (if specified)
  if (amount > 0) {
    payload += padLength('54', amount.toFixed(2));
  }

  // 58 - Country Code
  payload += padLength('58', 'KH');

  // 59 - Merchant Name
  payload += padLength('59', merchantName.substring(0, 25));

  // 60 - Merchant City
  payload += padLength('60', merchantCity);

  // 62 - Additional Data Field Template
  if (billNumber || storeLabel || terminalLabel) {
    let additionalData = '';
    if (billNumber) additionalData += padLength('01', billNumber);
    if (storeLabel) additionalData += padLength('03', storeLabel);
    if (terminalLabel) additionalData += padLength('07', terminalLabel);
    payload += padLength('62', additionalData);
  }

  // 63 - CRC (must be last)
  const crcInput = payload + '6304';
  const checksum = crc16(crcInput);
  payload += `6304${checksum}`;

  return payload;
}

export function formatKHR(usdAmount) {
  const khrAmount = Math.round(usdAmount * USD_TO_KHR);
  return khrAmount.toLocaleString('en-US');
}
