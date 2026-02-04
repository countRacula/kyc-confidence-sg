// KYC Credit Confidence Scoring Engine for Singapore SMEs

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
  let score = 0;
  const missingData = [];

  const revenue = parseFloat(inputs.revenue) || 0;
  const cogs = inputs.is_service_business ? 0 : (parseFloat(inputs.cogs) || 0);
  const opex = parseFloat(inputs.operating_expenses) || 0;
  const currentAssets = parseFloat(inputs.current_assets) || 0;
  const currentLiabilities = parseFloat(inputs.current_liabilities) || 0;
  const totalLiabilities = parseFloat(inputs.total_liabilities) || 0;
  const totalAssets = parseFloat(inputs.total_assets) || 0;

  // Net Margin (max 10)
  if (revenue > 0) {
    const netMargin = ((revenue - cogs - opex) / revenue) * 100;
    metrics.net_margin = netMargin;
    
    if (netMargin > 10) {
      score += 10;
      reasons.push(`+10: Strong net margin (${netMargin.toFixed(1)}%)`);
    } else if (netMargin >= 5) {
      score += 7;
      reasons.push(`+7: Good net margin (${netMargin.toFixed(1)}%)`);
    } else if (netMargin >= 0) {
      score += 4;
      reasons.push(`+4: Low net margin (${netMargin.toFixed(1)}%)`);
    } else if (netMargin >= -10) {
      score += 1;
      reasons.push(`+1: Negative margin (${netMargin.toFixed(1)}%)`);
    } else {
      reasons.push(`+0: Severe loss (${netMargin.toFixed(1)}%)`);
    }
  } else {
    score += 4;
    missingData.push('Revenue');
    reasons.push('+4: Revenue data missing (conservative score)');
  }

  // Current Ratio (max 10)
  if (currentAssets > 0 || currentLiabilities > 0) {
    if (currentLiabilities === 0) {
      metrics.current_ratio = 999;
      score += 10;
      reasons.push('+10: No current liabilities declared');
    } else {
      const currentRatio = currentAssets / currentLiabilities;
      metrics.current_ratio = currentRatio;
      
      if (currentRatio >= 1.5) {
        score += 10;
        reasons.push(`+10: Strong liquidity (${currentRatio.toFixed(2)}x)`);
      } else if (currentRatio >= 1.2) {
        score += 7;
        reasons.push(`+7: Good liquidity (${currentRatio.toFixed(2)}x)`);
      } else if (currentRatio >= 1.0) {
        score += 5;
        reasons.push(`+5: Adequate liquidity (${currentRatio.toFixed(2)}x)`);
      } else if (currentRatio >= 0.8) {
        score += 2;
        reasons.push(`+2: Low liquidity (${currentRatio.toFixed(2)}x)`);
      } else {
        reasons.push(`+0: Very low liquidity (${currentRatio.toFixed(2)}x)`);
      }
    }
  } else {
    score += 4;
    missingData.push('Current Assets/Liabilities');
    reasons.push('+4: Liquidity data missing (conservative score)');
  }

  // Debt Ratio (max 10)
  if (totalLiabilities > 0) {
    let debtRatio, debtRatioType;
    
    if (totalAssets > 0) {
      debtRatio = totalLiabilities / totalAssets;
      debtRatioType = 'assets';
      metrics.debt_ratio = debtRatio;
      metrics.debt_ratio_type = 'assets';
      
      if (debtRatio < 0.4) {
        score += 10;
        reasons.push(`+10: Low leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
      } else if (debtRatio <= 0.6) {
        score += 7;
        reasons.push(`+7: Moderate leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
      } else if (debtRatio <= 0.8) {
        score += 4;
        reasons.push(`+4: High leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
      } else {
        score += 1;
        reasons.push(`+1: Very high leverage (${(debtRatio * 100).toFixed(0)}% debt/assets)`);
      }
    } else if (revenue > 0) {
      debtRatio = totalLiabilities / revenue;
      debtRatioType = 'revenue';
      metrics.debt_ratio = debtRatio;
      metrics.debt_ratio_type = 'revenue';
      
      if (debtRatio < 0.3) {
        score += 10;
        reasons.push(`+10: Low debt burden (${(debtRatio * 100).toFixed(0)}% debt/revenue)`);
      } else if (debtRatio <= 0.6) {
        score += 7;
        reasons.push(`+7: Moderate debt burden (${(debtRatio * 100).toFixed(0)}% debt/revenue)`);
      } else if (debtRatio <= 1.0) {
        score += 4;
        reasons.push(`+4: High debt burden (${(debtRatio * 100).toFixed(0)}% debt/revenue)`);
      } else {
        score += 1;
        reasons.push(`+1: Very high debt burden (${(debtRatio * 100).toFixed(0)}% debt/revenue)`);
      }
    } else {
      score += 4;
      missingData.push('Total Assets or Revenue for debt ratio');
      reasons.push('+4: Debt ratio cannot be calculated (conservative score)');
    }
  } else {
    score += 10;
    reasons.push('+10: No total liabilities reported');
  }

  // Operating Buffer (max 10)
  if (currentAssets > 0 && opex > 0) {
    const monthlyOpex = opex / 12;
    const bufferMonths = currentAssets / monthlyOpex;
    metrics.operating_buffer_months = bufferMonths;
    
    if (bufferMonths >= 6) {
      score += 10;
      reasons.push(`+10: Strong operating buffer (${bufferMonths.toFixed(1)} months)`);
    } else if (bufferMonths >= 3) {
      score += 7;
      reasons.push(`+7: Good operating buffer (${bufferMonths.toFixed(1)} months)`);
    } else if (bufferMonths >= 1) {
      score += 4;
      reasons.push(`+4: Limited operating buffer (${bufferMonths.toFixed(1)} months)`);
    } else {
      score += 1;
      reasons.push(`+1: Very limited buffer (${bufferMonths.toFixed(1)} months)`);
    }
  } else {
    score += 4;
    if (!currentAssets) missingData.push('Current Assets for buffer');
    if (!opex) missingData.push('Operating Expenses for buffer');
    reasons.push('+4: Operating buffer cannot be calculated (conservative score)');
  }

  return { 
    score: Math.min(score, 40), 
    reasons, 
    metrics,
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

  if (financialMetrics.current_ratio && financialMetrics.current_ratio < 1.2) {
    actions.push('Start with smaller credit limit and increase gradually');
  }

  if (financialMetrics.operating_buffer_months && financialMetrics.operating_buffer_months < 3) {
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
    reasons: allReasons,
    recommended_actions: recommendedActions,
    missing_data: financialResult.missingData
  };
}