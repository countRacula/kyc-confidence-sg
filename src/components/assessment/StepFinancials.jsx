import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Wallet, Info, HelpCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateFinancialRanges, generateMonthlyExpenseRanges, parseNumericInput } from './financialRanges';

export default function StepFinancials({ data, onChange, orgSizeType = 'SME' }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [assetInputMode, setAssetInputMode] = useState('simple'); // 'simple' or 'balance_sheet'
  
  const isSME = orgSizeType === 'SME';
  const financialRanges = generateFinancialRanges();
  const monthlyExpenseRanges = generateMonthlyExpenseRanges();

  const handleChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleNumberChange = (field, value) => {
    // For enterprise mode, allow free-text numbers
    if (value === '' || !isNaN(parseFloat(value.replace(/,/g, '')))) {
      onChange({ [field]: value });
    }
  };

  const ExamplesList = ({ examples }) => (
    <ul className="text-xs text-slate-600 space-y-1 mt-2">
      {examples.map((ex, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-emerald-600">•</span>
          <span>{ex}</span>
        </li>
      ))}
    </ul>
  );

  const HintBox = ({ hint }) => (
    <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
      <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
      <span>{hint}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Provide estimates from your <strong>last fiscal year or last 12 months</strong>. 
          {isSME && " Select ranges that best match your figures - precision is less important than having a general picture."}
          {!isSME && " Enter actual figures for more accurate scoring."}
        </AlertDescription>
      </Alert>

      {/* Card 1: Sales & Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Sales & Costs (Simple)
          </CardTitle>
          <CardDescription>How much you earned and whether you made a profit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Revenue */}
          <div className="space-y-2">
            <Label htmlFor="revenue">1. Annual Sales / Revenue *</Label>
            <p className="text-sm text-slate-700">How much you billed/earned in the last FY (or last 12 months).</p>
            
            {isSME ? (
              <Select 
                value={data.revenue_range || ''} 
                onValueChange={(v) => handleChange('revenue_range', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="unknown">Prefer not to say / Unknown</SelectItem>
                  {financialRanges.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="revenue"
                type="text"
                value={data.revenue || ''}
                onChange={(e) => handleNumberChange('revenue', e.target.value)}
                placeholder="e.g., 2,500,000"
              />
            )}
            
            <ExamplesList examples={[
              "Café: total takings from food & drinks for the year",
              "Renovation firm: total invoiced project value recognised",
              "Tuition centre: total fees collected/earned"
            ]} />
            <HintBox hint="From your P&L, accounting software, or last FY management accounts" />
          </div>

          {/* Profit/Loss */}
          <div className="space-y-2">
            <Label>2. Profit or Loss *</Label>
            <p className="text-sm text-slate-700">Did you make an overall profit or loss last FY?</p>
            
            <Select 
              value={data.profit_flag || ''} 
              onValueChange={(v) => handleChange('profit_flag', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select profit/loss status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="breakeven">Break-even / roughly zero</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            
            <ExamplesList examples={[
              "Profit = you ended the year positive after all expenses",
              "Loss = expenses exceeded sales (even if cash in bank looks okay)"
            ]} />

            {/* Optional profit/loss amount */}
            {data.profit_flag && data.profit_flag !== 'unknown' && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <Label>Profit/Loss Amount (Optional)</Label>
                {isSME ? (
                  <Select 
                    value={data.profit_amount_range || ''} 
                    onValueChange={(v) => handleChange('profit_amount_range', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select amount range" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="unknown">Prefer not to say</SelectItem>
                      {financialRanges.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={data.profit_amount || ''}
                    onChange={(e) => handleNumberChange('profit_amount', e.target.value)}
                    placeholder="e.g., 400,000"
                  />
                )}
              </div>
            )}
          </div>

          {/* Advanced toggle for enterprise */}
          {!isSME && (
            <div className="pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {showAdvanced ? '− Hide' : '+ Show'} Advanced: COGS & Operating Expenses
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Cost of Goods Sold (COGS)</Label>
                    <Input
                      type="text"
                      value={data.cogs || ''}
                      onChange={(e) => handleNumberChange('cogs', e.target.value)}
                      placeholder="e.g., 1,500,000"
                    />
                    <p className="text-xs text-slate-500">Direct costs of products/services sold</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Operating Expenses</Label>
                    <Input
                      type="text"
                      value={data.operating_expenses || ''}
                      onChange={(e) => handleNumberChange('operating_expenses', e.target.value)}
                      placeholder="e.g., 600,000"
                    />
                    <p className="text-xs text-slate-500">Rent, salaries, utilities, admin costs</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Assets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            What You OWN (Assets)
          </CardTitle>
          <CardDescription>Your business resources and what's owed to you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2">
            <Badge 
              variant={assetInputMode === 'simple' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setAssetInputMode('simple')}
            >
              I'm not sure (Recommended)
            </Badge>
            <Badge 
              variant={assetInputMode === 'balance_sheet' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setAssetInputMode('balance_sheet')}
            >
              I know my balance sheet
            </Badge>
          </div>

          {assetInputMode === 'simple' ? (
            <>
              {/* Cash */}
              <div className="space-y-2">
                <Label>3. Cash / Bank Balance *</Label>
                <p className="text-sm text-slate-700">Money in your bank accounts and cash on hand right now.</p>
                
                {isSME ? (
                  <Select 
                    value={data.cash_range || ''} 
                    onValueChange={(v) => handleChange('cash_range', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cash range" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="unknown">Prefer not to say / Unknown</SelectItem>
                      {financialRanges.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={data.cash || ''}
                    onChange={(e) => handleNumberChange('cash', e.target.value)}
                    placeholder="e.g., 150,000"
                  />
                )}
                
                <ExamplesList examples={[
                  "Your DBS/OCBC/UOB business account balance",
                  "Cash in register (if you track it)"
                ]} />
              </div>

              {/* Receivables */}
              <div className="space-y-2">
                <Label>4. Money Customers Owe You (Optional)</Label>
                <p className="text-sm text-slate-700">Unpaid invoices from customers that should be paid soon (usually within 30–90 days).</p>
                
                {isSME ? (
                  <Select 
                    value={data.receivables_range || ''} 
                    onValueChange={(v) => handleChange('receivables_range', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select receivables range" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="not_applicable">Not applicable</SelectItem>
                      {financialRanges.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={data.receivables || ''}
                    onChange={(e) => handleNumberChange('receivables', e.target.value)}
                    placeholder="e.g., 80,000"
                  />
                )}
                
                <ExamplesList examples={[
                  "Issued invoice last month, customer hasn't paid yet",
                  "Outstanding tuition fees"
                ]} />
              </div>
            </>
          ) : (
            <>
              {/* Current Assets */}
              <div className="space-y-2">
                <Label>3. Current Assets *</Label>
                <p className="text-sm text-slate-700">Things you own that can turn into cash within 12 months.</p>
                
                {isSME ? (
                  <Select 
                    value={data.current_assets_range || ''} 
                    onValueChange={(v) => handleChange('current_assets_range', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select current assets range" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="unknown">Prefer not to say / Unknown</SelectItem>
                      {financialRanges.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={data.current_assets || ''}
                    onChange={(e) => handleNumberChange('current_assets', e.target.value)}
                    placeholder="e.g., 800,000"
                  />
                )}
                
                <ExamplesList examples={[
                  "Cash + unpaid customer invoices + inventory you expect to sell soon",
                  "Short-term deposits that mature within a year"
                ]} />
                <HintBox hint="From your balance sheet under 'Current Assets'" />
              </div>

              {/* Total Assets */}
              <div className="space-y-2">
                <Label>4. Total Assets (Optional)</Label>
                <p className="text-sm text-slate-700">Everything the business owns (current assets + long-term assets).</p>
                
                {isSME ? (
                  <Select 
                    value={data.total_assets_range || ''} 
                    onValueChange={(v) => handleChange('total_assets_range', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select total assets range" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="unknown">Unknown</SelectItem>
                      {financialRanges.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={data.total_assets || ''}
                    onChange={(e) => handleNumberChange('total_assets', e.target.value)}
                    placeholder="e.g., 1,500,000"
                  />
                )}
                
                <ExamplesList examples={[
                  "Company vehicle, machinery, renovation equipment",
                  "Office renovation assets (if capitalised), long-term deposits"
                ]} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Liabilities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            What You OWE (Liabilities)
          </CardTitle>
          <CardDescription>Bills and debts the business needs to pay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Bills Due Soon */}
          <div className="space-y-2">
            <Label>5. Bills & Loans Due Soon (within 12 months) *</Label>
            <p className="text-sm text-slate-700">What you must pay in the next 12 months.</p>
            
            {isSME ? (
              <Select 
                value={data.bills_due_soon_range || ''} 
                onValueChange={(v) => handleChange('bills_due_soon_range', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bills due soon range" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="unknown">Prefer not to say / Unknown</SelectItem>
                  {financialRanges.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="text"
                value={data.bills_due_soon || ''}
                onChange={(e) => handleNumberChange('bills_due_soon', e.target.value)}
                placeholder="e.g., 400,000"
              />
            )}
            
            <ExamplesList examples={[
              "Supplier invoices due next month",
              "Short-term loan instalments due this year",
              "GST payable / CPF payable (if any)"
            ]} />
            <HintBox hint="From your balance sheet under 'Current Liabilities'" />
          </div>

          {/* Total Liabilities */}
          <div className="space-y-2">
            <Label>6. Total Liabilities (Recommended)</Label>
            <p className="text-sm text-slate-700">Everything the business owes (due soon + long-term loans).</p>
            
            {isSME ? (
              <Select 
                value={data.total_liabilities_range || ''} 
                onValueChange={(v) => handleChange('total_liabilities_range', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select total liabilities range" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="unknown">Unknown</SelectItem>
                  {financialRanges.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="text"
                value={data.total_liabilities || ''}
                onChange={(e) => handleNumberChange('total_liabilities', e.target.value)}
                placeholder="e.g., 500,000"
              />
            )}
            
            <ExamplesList examples={[
              "Bank term loan outstanding (even if payable over 3–5 years)",
              "Hire purchase / equipment financing balance"
            ]} />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Monthly Expenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Cash Buffer Check
          </CardTitle>
          <CardDescription>One more question to assess your financial cushion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>7. Monthly Business Expenses (Optional, but recommended)</Label>
            <p className="text-sm text-slate-700">Roughly how much you spend each month to keep the business running (rent, salaries, utilities, subscriptions).</p>
            
            {isSME ? (
              <Select 
                value={data.monthly_expenses_range || ''} 
                onValueChange={(v) => handleChange('monthly_expenses_range', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select monthly expenses range" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="unknown">Prefer not to say / Unknown</SelectItem>
                  {monthlyExpenseRanges.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type="text"
                value={data.monthly_expenses || ''}
                onChange={(e) => handleNumberChange('monthly_expenses', e.target.value)}
                placeholder="e.g., 50,000"
              />
            )}
            
            <ExamplesList examples={[
              "Rent + staff wages + telco bills + software subscriptions"
            ]} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}