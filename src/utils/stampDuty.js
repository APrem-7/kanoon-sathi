export function calculateDelhiDuty(consideration, circleValue, buyer) {
  const assessableValue = Math.max(consideration, circleValue || 0);
  const rate = buyer === 'woman' ? 0.04 : 0.06;
  const stampDuty = Math.round(assessableValue * rate);
  const registrationFee = Math.round(assessableValue * 0.01) + 100;

  return { assessableValue, rate, stampDuty, registrationFee, total: stampDuty + registrationFee };
}
