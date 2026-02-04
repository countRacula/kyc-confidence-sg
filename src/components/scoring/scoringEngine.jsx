// KYC Credit Confidence Scoring Engine for Singapore SMEs

import { getRangeMidpoint, generateFinancialRanges, generateMonthlyExpenseRanges, parseNumericInput } from '../assessment/financialRanges';

export function calculateCompanyAge(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  const years = (now - start) / (365.25 * 24 * 60 * 60 * 1000);
  return years;
}

export function calculateSGPresenceScore(inputs, counterparty) {
  const reasons = [];
  let score = 0;
  
  // Company Status (max 8)
  if (inputs.company_status === 'struck_off') {
    return { score: 0, hardStop: true, hardStopReason: 'Company has been struck off - do not onboard', reasons: ['Company struck off'] };
  }
  if (inputs.company_status === 'active') {
    score += 8;
    reasons.push('+8: Company is active');
  } else if (inputs.company_status === 'dormant' || inputs.company_status === 'unknown') {
    score += 3;
    reasons.push('+3: Company status is dormant/unknown');
  }

  // Company Age (max 8)
  const age = calculateCompanyAge(counterparty?.start_date);
  if (age !== null) {
    if (age >= 5) {
      score += 8;
      reasons.push('+8: Established company (5+ years)');
    } else if (age >= 2) {
      score += 5;
      reasons.push('+5: Moderately established (2-5 years)');
    } else if (age >= 1) {
      score += 3;
      reasons.push('+3: Relatively new company (1-2 years)');
    } else {
      score += 1;
      reasons.push('+1: Very new company (<1 year)');
    }
  } else {
    score += 2;
    reasons.push('+2: Company age unknown');
  }

  // Address Type (max 5)
  if (inputs.address_type === 'commercial') {
    score += 5;
    reasons.push('+5: Commercial/Industrial address');
  } else if (inputs.address_type === 'residential') {
    score += 2;
    reasons.push('+2: Residential/Virtual address');
  } else {
    score += 1;
    reasons.push('+1: Address type unknown');
  }

  // Operating Footprint (max 9)
  if (inputs.has_sg_bank === 'yes') {
    score += 4;
    reasons.push('+4: Has Singapore bank account');
  } else if (inputs.has_sg_bank === 'unknown') {
    score += 2;
    reasons.push('+2: SG bank account status unknown');
  } else {
    reasons.push('+0: No Singapore bank account');
  }

  if (inputs.has_sg_signatory === 'yes') {
    score += 5;
    reasons.push('+5: Has Singapore contract signatory');
  } else if (inputs.has_sg_signatory === 'unknown') {
    score += 2;
    reasons.push('+2: SG signatory status unknown');
  } else {
    reasons.push('+0: No Singapore signatory');
  }

  return { score: Math.min(score, 30), reasons, hardStop: false };
}

export function calculateOwnershipScore(inputs) {
  const reasons = [];
  let score = 0;

  // Ownership Locale (max 10)
  if (inputs.ownership_locale === 'sg_majority') {
    score += 10;
    reasons.push('+10: Majority SG Citizen/PR ownership');
  } else if (inputs.ownership_locale === 'mixed') {
    score += 6;
    reasons.push('+6: Mixed ownership structure');
  } else if (inputs.ownership_locale === 'foreign_majority') {
    score += 3;
    reasons.push('+3: Majority foreign ownership');
  } else {
    score += 4;
    reasons.push('+4: Ownership locale unknown');
  }

  // Shareholding Complexity (max 6)
  if (inputs.shareholding_complexity === 'simple') {
    score += 6;
    reasons.push('+6: Simple shareholding structure');
  } else if (inputs.shareholding_complexity === 'moderate') {
    score += 3;
    reasons.push('+3: Moderate shareholding complexity');
  } else if (inputs.shareholding_complexity === 'complex') {
    reasons.push('+0: Complex shareholding structure');
  } else {
    score += 2;
    reasons.push('+2: Shareholding complexity unknown');
  }

  // Governance Changes (max 4)
  if (inputs.governance_changes === 'no') {
    score += 4;
    reasons.push('+4: No frequent governance changes');
  } else if (inputs.governance_changes === 'yes') {
    score += 1;
    reasons.push('+1: Frequent governance changes noted');
  } else {
    score += 2;
    reasons.push('+2: Governance change history unknown');
  }

  // UBO Clarity (max 10)
  if (inputs.ubo_clarity === 'clear') {
    score += 10;
    reasons.push('+10: Clear UBO identification');
  } else if (inputs.ubo_clarity === 'partial') {
    score += 6;
    reasons.push('+6: Partial UBO clarity');
  } else if (inputs.ubo_clarity === 'unclear') {
    score += 2;
    reasons.push('+2: Unclear UBO structure');
  } else {
    score += 4;
    reasons.push('+4: UBO clarity unknown');
  }

  return { score: Math.min(score, 30), reasons };
}

export function calculateFinancialScore(inputs) {
  const reasons = [];
  const metrics = {};
  const subscores = {};
  let score = 0;
  const missingData = [];

  const financialRanges = generateFinancialRanges();
  const monthlyExpenseRanges = generateMonthlyExpenseRanges();

  // Extract numeric values from ranges or direct inputs
  const revenue = inputs.revenue_range 
    ? getRangeMidpoint(inputs.revenue_range, financialRanges)
    : parseNumericInput(inputs.revenue);
  
  const profitFlag = inputs.profit_flag;
  const profitAmount = inputs.profit_amount_range
    ? getRangeMidpoint(inputs.profit_amount_range, financialRanges)
    : parseNumericInput(inputs.profit_amount);

  const cash = inputs.cash_range
    ? getRangeMidpoint(inputs.cash_range, financialRanges)
    : parseNumericInput(inputs.cash);

  const receivables = inputs.receivables_range
    ? getRangeMidpoint(inputs.receivables_range, financialRanges)
    : parseNumericInput(inputs.receivables);

  const currentAssets = inputs.current_assets_range
    ? getRangeMidpoint(inputs.current_assets_range, financialRanges)
    : parseNumericInput(inputs.current_assets);

  const totalAssets = inputs.total_assets_range
    ? getRangeMidpoint(inputs.total_assets_range, financialRanges)
    : parseNumericInput(inputs.total_assets);

  const billsDueSoon = inputs.bills_due_soon_range
    ? getRangeMidpoint(inputs.bills_due_soon_range, financialRanges)
    : parseNumericInput(inputs.bills_due_soon);

  const totalLiabilities = inputs.total_liabilities_range
    ? getRangeMidpoint(inputs.total_liabilities_range, financialRanges)
    : parseNumericInput(inputs.total_liabilities);

  const monthlyExpenses = inputs.monthly_expenses_range
    ? getRangeMidpoint(inputs.monthly_expenses_range, monthlyExpenseRanges)
    : parseNumericInput(inputs.monthly_expenses);

  // 1. PROFITABILITY SCORE (0-10)
  let profitabilityScore = 4; // default
  if (profitFlag && revenue > 0 && profitAmount > 0) {
    // Have both flag and amount
    const actualProfit = profitFlag === 'loss' ? -profitAmount : profitAmount;
    const margin = (actualProfit / revenue) * 100;
    metrics.profit_margin = margin;

    if (margin > 10) {
      profitabilityScore = 10;
      reasons.push(`Profitability: Strong margin (${margin.toFixed(1)}%) - excellent`);
    } else if (margin >= 5) {
      profitabilityScore = 8;
      reasons.push(`Profitability: Good margin (${margin.toFixed(1)}%)`);
    } else if (margin >= 0) {
      profitabilityScore = 6;
      reasons.push(`Profitability: Low margin (${margin.toFixed(1)}%)`);
    } else if (margin >= -10) {
      profitabilityScore = 3;
      reasons.push(`Profitability: Small loss (${margin.toFixed(1)}%)`);
    } else {
      profitabilityScore = 1;
      reasons.push(`Profitability: Significant loss (${margin.toFixed(1)}%)`);
    }
  } else if (profitFlag) {
    // Only have flag
    if (profitFlag === 'profit') {
      profitabilityScore = 8;
      reasons.push('Profitability: You indicated Profit (healthy)');
    } else if (profitFlag === 'breakeven') {
      profitabilityScore = 6;
      reasons.push('Profitability: Break-even (acceptable)');
    } else if (profitFlag === 'loss') {
      profitabilityScore = 2;
      reasons.push('Profitability: You indicated Loss (concern)');
    } else {
      profitabilityScore = 4;
      reasons.push('Profitability: Unknown (conservative score)');
    }
  } else {
    missingData.push('Profit/Loss status');
    reasons.push('Profitability: Missing data (conservative score)');
  }
  subscores.profitability = profitabilityScore;

  // 2. LIQUIDITY SCORE (0-10)
  let liquidityScore = 4; // default
  let liquidityRatio = null;

  // Preferred: Current Assets vs Bills Due Soon
  if (currentAssets > 0 && billsDueSoon > 0) {
    liquidityRatio = currentAssets / billsDueSoon;
    metrics.liquidity_ratio = liquidityRatio;

    if (liquidityRatio >= 1.5) {
      liquidityScore = 10;
      reasons.push(`Liquidity: Strong buffer (${liquidityRatio.toFixed(2)}x)`);
    } else if (liquidityRatio >= 1.2) {
      liquidityScore = 7;
      reasons.push(`Liquidity: Good buffer (${liquidityRatio.toFixed(2)}x)`);
    } else if (liquidityRatio >= 1.0) {
      liquidityScore = 5;
      reasons.push(`Liquidity: Adequate buffer (${liquidityRatio.toFixed(2)}x)`);
    } else if (liquidityRatio >= 0.8) {
      liquidityScore = 2;
      reasons.push(`Liquidity: Tight buffer (${liquidityRatio.toFixed(2)}x)`);
    } else {
      liquidityScore = 0;
      reasons.push(`Liquidity: Very tight buffer (${liquidityRatio.toFixed(2)}x)`);
    }
  } else if ((cash > 0 || receivables > 0) && billsDueSoon > 0) {
    // Fallback: Cash + Receivables vs Bills Due Soon
    const liquidAssets = (cash || 0) + (receivables || 0);
    liquidityRatio = liquidAssets / billsDueSoon;
    metrics.liquidity_ratio = liquidityRatio;

    if (liquidityRatio >= 1.5) {
      liquidityScore = 10;
      reasons.push(`Liquidity: Strong cash position (${liquidityRatio.toFixed(2)}x)`);
    } else if (liquidityRatio >= 1.2) {
      liquidityScore = 7;
      reasons.push(`Liquidity: Good cash position (${liquidityRatio.toFixed(2)}x)`);
    } else if (liquidityRatio >= 1.0) {
      liquidityScore = 5;
      reasons.push(`Liquidity: Adequate cash position (${liquidityRatio.toFixed(2)}x)`);
    } else if (liquidityRatio >= 0.8) {
      liquidityScore = 2;
      reasons.push(`Liquidity: Tight cash position (${liquidityRatio.toFixed(2)}x)`);
    } else {
      liquidityScore = 0;
      reasons.push(`Liquidity: Very tight cash position (${liquidityRatio.toFixed(2)}x)`);
    }
  } else if (billsDueSoon === 0 && (currentAssets > 0 || cash > 0)) {
    liquidityScore = 10;
    reasons.push('Liquidity: No bills due soon declared (strong position)');
  } else {
    missingData.push('Assets or Bills Due Soon');
    reasons.push('Liquidity: Missing data (conservative score)');
  }
  subscores.liquidity = liquidityScore;

  // 3. SOLVENCY SCORE (0-10)
  let solvencyScore = 4; // default
  let debtRatio = null;

  if (totalAssets > 0 && totalLiabilities > 0) {
    // Preferred: Debt Ratio
    debtRatio = totalLiabilities / totalAssets;
    metrics.debt_ratio = debtRatio;
    metrics.debt_ratio_type = 'assets';

    if (debtRatio < 0.4) {
      solvencyScore = 10;
      reasons.push(`Solvency: Low leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
    } else if (debtRatio <= 0.6) {
      solvencyScore = 7;
      reasons.push(`Solvency: Moderate leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
    } else if (debtRatio <= 0.8) {
      solvencyScore = 4;
      reasons.push(`Solvency: High leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
    } else {
      solvencyScore = 1;
      reasons.push(`Solvency: Very high leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
    }
  } else if (totalLiabilities > 0 && revenue > 0) {
    // Fallback: Debt Load (liabilities/revenue)
    const debtLoad = totalLiabilities / revenue;
    metrics.debt_load = debtLoad;
    metrics.debt_ratio_type = 'revenue';

    if (debtLoad < 0.3) {
      solvencyScore = 10;
      reasons.push(`Solvency: Low debt burden (${(debtLoad * 100).toFixed(0)}% debt/revenue)`);
    } else if (debtLoad <= 0.6) {
      solvencyScore = 7;
      reasons.push(`Solvency: Moderate debt burden (${(debtLoad * 100).toFixed(0)}% debt/revenue)`);
    } else if (debtLoad <= 1.0) {
      solvencyScore = 4;
      reasons.push(`Solvency: High debt burden (${(debtLoad * 100).toFixed(0)}% debt/revenue)`);
    } else {
      solvencyScore = 1;
      reasons.push(`Solvency: Very high debt burden (${(debtLoad * 100).toFixed(0)}% debt/revenue)`);
    }
  } else if (totalLiabilities === 0 || !totalLiabilities) {
    solvencyScore = 10;
    reasons.push('Solvency: No liabilities reported (strong position)');
  } else {
    missingData.push('Assets or Liabilities for solvency');
    reasons.push('Solvency: Missing data (conservative score)');
  }
  subscores.solvency = solvencyScore;

  // 4. CASH BUFFER SCORE (0-10)
  let cashBufferScore = 4; // default
  if (cash > 0 && monthlyExpenses > 0) {
    const bufferMonths = cash / monthlyExpenses;
    metrics.cash_buffer_months = bufferMonths;

    if (bufferMonths >= 6) {
      cashBufferScore = 10;
      reasons.push(`Cash Buffer: Excellent (${bufferMonths.toFixed(1)} months)`);
    } else if (bufferMonths >= 3) {
      cashBufferScore = 7;
      reasons.push(`Cash Buffer: Good (${bufferMonths.toFixed(1)} months)`);
    } else if (bufferMonths >= 1) {
      cashBufferScore = 4;
      reasons.push(`Cash Buffer: Limited (${bufferMonths.toFixed(1)} months)`);
    } else {
      cashBufferScore = 1;
      reasons.push(`Cash Buffer: Very limited (${bufferMonths.toFixed(1)} months)`);
    }
  } else {
    if (!cash) missingData.push('Cash balance');
    if (!monthlyExpenses) missingData.push('Monthly expenses');
    reasons.push('Cash Buffer: Missing data (conservative score)');
  }
  subscores.cash_buffer = cashBufferScore;

  // TOTAL FINANCIAL SCORE (out of 40)
  score = profitabilityScore + liquidityScore + solvencyScore + cashBufferScore;

  return {
    score: Math.min(score, 40),
    reasons,
    metrics,
    subscores,
    missingData
  };
}

export function calculateRedFlagsScore(inputs) {
  const reasons = [];
  let score = 10;

  // Sanctions check (hard stop)
  if (inputs.sanctions_concern === 'yes') {
    return { 
      score: 0, 
      hardStop: true, 
      hardStopReason: 'Sanctions/Watchlist concern flagged - manual review required',
      reasons: ['Sanctions/Watchlist concern'] 
    };
  }

  // Adverse Media
  if (inputs.adverse_media === 'yes') {
    score -= 5;
    reasons.push('-5: Adverse media concerns flagged');
  } else if (inputs.adverse_media === 'unknown') {
    score -= 2;
    reasons.push('-2: Adverse media status unknown');
  } else {
    reasons.push('+0: No adverse media concerns');
  }

  // Inconsistencies
  if (inputs.inconsistencies === 'yes') {
    score -= 5;
    reasons.push('-5: Major inconsistencies found');
  } else if (inputs.inconsistencies === 'unknown') {
    score -= 2;
    reasons.push('-2: Inconsistency check incomplete');
  } else {
    reasons.push('+0: No major inconsistencies');
  }

  return { score: Math.max(score, 0), reasons, hardStop: false };
}

export function getRiskBand(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  if (score >= 40) return 'red';
  return 'high_risk';
}

export function generateRecommendedActions(componentScores, financialMetrics, inputs) {
  const actions = [];

  // Financial health actions
  if (componentScores.financial < 25) {
    actions.push('Require upfront deposit or milestone-based payments');
    actions.push('Consider shorter payment terms (Net 7-14 instead of Net 30)');
  }

  if (financialMetrics.liquidity_ratio && financialMetrics.liquidity_ratio < 1.2) {
    actions.push('Start with smaller credit limit and increase gradually');
  }

  if (financialMetrics.cash_buffer_months && financialMetrics.cash_buffer_months < 3) {
    actions.push('Monitor payment behavior closely for first 3 months');
  }

  if (financialMetrics.debt_ratio && financialMetrics.debt_ratio > 0.6) {
    actions.push('Require personal guarantee from directors');
  }

  // Ownership actions
  if (componentScores.ownership < 20) {
    actions.push('Request UBO declaration and supporting documents');
    actions.push('Verify signatory authority with board resolution');
  }

  if (inputs.ubo_clarity === 'unclear' || inputs.ubo_clarity === 'unknown') {
    actions.push('Conduct enhanced due diligence on beneficial owners');
  }

  // SG Presence actions
  if (componentScores.sg_presence < 20) {
    actions.push('Verify Singapore operating presence with utility bills or lease');
    actions.push('Request bank statements from Singapore-based account');
  }

  // Red flags actions
  if (inputs.adverse_media === 'unknown' || inputs.inconsistencies === 'unknown') {
    actions.push('Complete manual review before onboarding');
  }

  // Age-based actions
  const age = calculateCompanyAge(inputs.counterparty_start_date);
  if (age !== null && age < 2) {
    actions.push('Start with trial purchase order before extending credit');
    actions.push('Request delivery verification for first transactions');
  }

  return actions.slice(0, 6); // Return top 6 actions
}

export function runFullAssessment(inputs, counterparty) {
  const sgResult = calculateSGPresenceScore(inputs, counterparty);
  
  if (sgResult.hardStop) {
    return {
      total_score: 0,
      risk_band: 'fail',
      hard_stop_flag: true,
      hard_stop_reason: sgResult.hardStopReason,
      component_scores: { sg_presence: 0, ownership: 0, financial: 0, red_flags: 0 },
      computed_metrics: {},
      reasons: sgResult.reasons,
      recommended_actions: ['Do not proceed with onboarding', 'Flag for compliance review']
    };
  }

  const ownershipResult = calculateOwnershipScore(inputs);
  const financialResult = calculateFinancialScore(inputs);
  const redFlagsResult = calculateRedFlagsScore(inputs);

  if (redFlagsResult.hardStop) {
    return {
      total_score: 0,
      risk_band: 'fail',
      hard_stop_flag: true,
      hard_stop_reason: redFlagsResult.hardStopReason,
      component_scores: { 
        sg_presence: sgResult.score, 
        ownership: ownershipResult.score, 
        financial: financialResult.score, 
        red_flags: 0 
      },
      computed_metrics: financialResult.metrics,
      reasons: [...sgResult.reasons, ...ownershipResult.reasons, ...financialResult.reasons, ...redFlagsResult.reasons],
      recommended_actions: ['Manual review required before any credit decision', 'Escalate to compliance team']
    };
  }

  const componentScores = {
    sg_presence: sgResult.score,
    ownership: ownershipResult.score,
    financial: financialResult.score,
    red_flags: redFlagsResult.score
  };

  const totalScore = Math.min(
    componentScores.sg_presence + 
    componentScores.ownership + 
    componentScores.financial + 
    componentScores.red_flags,
    100
  );

  const riskBand = getRiskBand(totalScore);

  const allReasons = [
    ...sgResult.reasons,
    ...ownershipResult.reasons,
    ...financialResult.reasons,
    ...redFlagsResult.reasons
  ];

  const recommendedActions = generateRecommendedActions(
    componentScores, 
    financialResult.metrics, 
    { ...inputs, counterparty_start_date: counterparty?.start_date }
  );

  return {
    total_score: totalScore,
    risk_band: riskBand,
    hard_stop_flag: false,
    hard_stop_reason: null,
    component_scores: componentScores,
    computed_metrics: financialResult.metrics,
    financial_subscores: financialResult.subscores,
    reasons: allReasons,
    recommended_actions: recommendedActions,
    missing_data: financialResult.missingData
  };
}