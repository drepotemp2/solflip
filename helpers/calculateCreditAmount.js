module.exports = calculateCreditAmount = (price) => {
  const totalAmount = price * 2;
  const charges = totalAmount * 0.02;
  return totalAmount - charges;
};
