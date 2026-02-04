// Financial range generation utilities for SME-friendly inputs

export function generateFinancialRanges() {
  const ranges = [];
  
  // 0 to S$100k: S$10k bands
  for (let i = 0; i < 100000; i += 10000) {
    ranges.push({
      value: `${i}-${i + 9999}`,
      label: `S$${formatNumber(i)} - S$${formatNumber(i + 9999)}`,
      midpoint: i + 5000
    });
  }
  
  // S$100k to S$1M: S$50k bands
  for (let i = 100000; i < 1000000; i += 50000) {
    ranges.push({
      value: `${i}-${i + 49999}`,
      label: `S$${formatNumber(i)} - S$${formatNumber(i + 49999)}`,
      midpoint: i + 25000
    });
  }
  
  // S$1M to S$10M: S$100k bands
  for (let i = 1000000; i < 10000000; i += 100000) {
    ranges.push({
      value: `${i}-${i + 99999}`,
      label: `S$${formatNumber(i)} - S$${formatNumber(i + 99999)}`,
      midpoint: i + 50000
    });
  }
  
  // S$10M+
  ranges.push({
    value: '10000000+',
    label: 'S$10,000,000+',
    midpoint: 10000000
  });
  
  return ranges;
}

export function generateMonthlyExpenseRanges() {
  const ranges = [];
  
  // Under S$100k: S$1k bands
  for (let i = 0; i < 100000; i += 1000) {
    ranges.push({
      value: `${i}-${i + 999}`,
      label: `S$${formatNumber(i)} - S$${formatNumber(i + 999)}`,
      midpoint: i + 500
    });
  }
  
  // S$100k to S$500k: S$10k bands
  for (let i = 100000; i < 500000; i += 10000) {
    ranges.push({
      value: `${i}-${i + 9999}`,
      label: `S$${formatNumber(i)} - S$${formatNumber(i + 9999)}`,
      midpoint: i + 5000
    });
  }
  
  // S$500k+
  ranges.push({
    value: '500000+',
    label: 'S$500,000+',
    midpoint: 500000
  });
  
  return ranges;
}

function formatNumber(num) {
  return num.toLocaleString('en-SG');
}

export function getRangeMidpoint(rangeValue, ranges) {
  if (!rangeValue || rangeValue === 'unknown' || rangeValue === 'not_applicable') {
    return null;
  }
  
  const range = ranges.find(r => r.value === rangeValue);
  return range ? range.midpoint : null;
}

export function parseNumericInput(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  // Remove commas and parse
  return parseFloat(value.toString().replace(/,/g, '')) || 0;
}