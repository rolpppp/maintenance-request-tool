import 'server-only';

/** Company name and emergency number, read on the server and passed down as props. */
export const COMPANY_NAME = process.env.COMPANY_NAME ?? 'Property';

export function emergencyPhone() {
  return {
    display: process.env.EMERGENCY_PHONE_DISPLAY ?? '(000) 000-0000',
    tel: process.env.EMERGENCY_PHONE_TEL ?? '0000000000',
  };
}
