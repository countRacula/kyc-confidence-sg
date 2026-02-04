import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { runFullAssessment } from '../components/scoring/scoringEngine';
import ScoreGauge from '../components/ui/ScoreGauge';
import RiskBadge from '../components/ui/RiskBadge';

export default function FreeAssessment() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: '',
    company_status: 'active',
    address_type: 'commercial',
    start_date: '',
    has_sg_bank: 'unknown',
    has_sg_signatory: 'unknown',
    ownership_locale: 'unknown',
    shareholding_complexity: 'unknown',
    governance_changes: 'unknown',
    ubo_clarity: 'unknown',
    revenue: '',
    cogs: '',
    operating_expenses: '',
    current_assets: '',
    current_liabilities: '',
    total_assets: '',
    total_liabilities: '',
    sanctions_concern: 'no',
    adverse_media: 'no',
    inconsistencies: 'no',
  });
  const [result, setResult] = useState(null);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const inputs = {
      ...formData,
      revenue: parseFloat(formData.revenue) || 0,
      cogs: parseFloat(formData.cogs) || 0,
      operating_expenses: parseFloat(formData.operating_expenses) || 0,
      current_assets: parseFloat(formData.current_assets) || 0,
      current_liabilities: parseFloat(formData.current_liabilities) || 0,
      total_assets: parseFloat(formData.total_assets) || 0,
      total_liabilities: parseFloat(formData.total_liabilities) || 0,
    };

    const assessment = runFullAssessment(inputs);
    setResult(assessment);
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Landing')} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">KYC Confidence</h1>
              <p className="text-xs text-slate-500">Free Assessment</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="text-sm text-slate-600">Step {step} of 4</p>
          </div>
        )}

        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input 
                    value={formData.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    placeholder="e.g., TechParts Asia Pte Ltd"
                  />
                </div>
                <div>
                  <Label>Incorporation Date</Label>
                  <Input 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateField('start_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Company Status</Label>
                  <Select value={formData.company_status} onValueChange={(v) => updateField('company_status', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active/Live</SelectItem>
                      <SelectItem value="struck_off">Struck Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Registered Address Type</Label>
                  <Select value={formData.address_type} onValueChange={(v) => updateField('address_type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial/Industrial</SelectItem>
                      <SelectItem value="residential">Residential/Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Has Singapore Bank Account?</Label>
                  <Select value={formData.has_sg_bank} onValueChange={(v) => updateField('has_sg_bank', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Has Singapore Contract Signatory?</Label>
                  <Select value={formData.has_sg_signatory} onValueChange={(v) => updateField('has_sg_signatory', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Ownership & Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Ownership Locale</Label>
                  <Select value={formData.ownership_locale} onValueChange={(v) => updateField('ownership_locale', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sg_majority">Majority SG Citizen/PR</SelectItem>
                      <SelectItem value="mixed">Mixed (SG + Foreign)</SelectItem>
                      <SelectItem value="foreign_majority">Majority Foreign</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shareholding Complexity</Label>
                  <Select value={formData.shareholding_complexity} onValueChange={(v) => updateField('shareholding_complexity', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple (1-3 shareholders)</SelectItem>
                      <SelectItem value="moderate">Moderate (4-6 shareholders)</SelectItem>
                      <SelectItem value="complex">Complex (7+ or corp structures)</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequent Governance Changes (past 12 months)?</Label>
                  <Select value={formData.governance_changes} onValueChange={(v) => updateField('governance_changes', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>UBO Clarity</Label>
                  <Select value={formData.ubo_clarity} onValueChange={(v) => updateField('ubo_clarity', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unclear">Unclear</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Annual Revenue (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => updateField('revenue', e.target.value)}
                    placeholder="e.g., 2500000"
                  />
                </div>
                <div>
                  <Label>Cost of Goods Sold (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.cogs}
                    onChange={(e) => updateField('cogs', e.target.value)}
                    placeholder="e.g., 1500000"
                  />
                </div>
                <div>
                  <Label>Operating Expenses (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.operating_expenses}
                    onChange={(e) => updateField('operating_expenses', e.target.value)}
                    placeholder="e.g., 600000"
                  />
                </div>
                <div>
                  <Label>Current Assets (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.current_assets}
                    onChange={(e) => updateField('current_assets', e.target.value)}
                    placeholder="e.g., 800000"
                  />
                </div>
                <div>
                  <Label>Current Liabilities (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.current_liabilities}
                    onChange={(e) => updateField('current_liabilities', e.target.value)}
                    placeholder="e.g., 400000"
                  />
                </div>
                <div>
                  <Label>Total Assets (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.total_assets}
                    onChange={(e) => updateField('total_assets', e.target.value)}
                    placeholder="e.g., 1500000"
                  />
                </div>
                <div>
                  <Label>Total Liabilities (SGD)</Label>
                  <Input 
                    type="number"
                    value={formData.total_liabilities}
                    onChange={(e) => updateField('total_liabilities', e.target.value)}
                    placeholder="e.g., 500000"
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>Risk Flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sanctions Concern?</Label>
                  <Select value={formData.sanctions_concern} onValueChange={(v) => updateField('sanctions_concern', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Adverse Media?</Label>
                  <Select value={formData.adverse_media} onValueChange={(v) => updateField('adverse_media', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Document Inconsistencies?</Label>
                  <Select value={formData.inconsistencies} onValueChange={(v) => updateField('inconsistencies', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {step === 5 && result && (
            <>
              <CardHeader>
                <CardTitle>Assessment Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Credit Confidence Score</p>
                  <ScoreGauge score={result.total_score} size="lg" />
                  <RiskBadge band={result.risk_band} showDescription size="lg" />
                </div>

                {result.hard_stop_flag && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Hard Stop</p>
                    <p className="text-sm text-red-700">{result.hard_stop_reason}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Component Scores</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SG Presence</span>
                      <span className="font-medium">{result.component_scores.sg_presence}/30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Ownership & Control</span>
                      <span className="font-medium">{result.component_scores.ownership}/30</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Financial Health</span>
                      <span className="font-medium">{result.component_scores.financial}/40</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Red Flags</span>
                      <span className="font-medium">{result.component_scores.red_flags}/10</span>
                    </div>
                  </div>
                </div>

                {result.recommended_actions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Recommended Actions</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                      {result.recommended_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600 mb-4">
                    Want to save this assessment and manage all your counterparties?
                  </p>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => window.location.href = createPageUrl('Landing')}
                  >
                    Create Free Account
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {step < 5 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Calculate Score
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}