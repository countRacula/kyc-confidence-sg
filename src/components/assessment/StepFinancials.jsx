import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, TrendingUp, Wallet, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StepFinancials({ data, onChange }) {
  const handleNumberChange = (field, value) => {
    // Allow empty or valid numbers
    if (value === '' || !isNaN(parseFloat(value))) {
      onChange({ [field]: value });
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Enter financial data from the <strong>last fiscal year</strong> or <strong>last 12 months</strong>. 
          Leave fields blank if data is not available - a conservative estimate will be used.
        </AlertDescription>
      </Alert>

      {/* Revenue & Costs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Revenue & Costs
          </CardTitle>
          <CardDescription>Operating performance indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="revenue">Annual Revenue (SGD)</Label>
            <Input
              id="revenue"
              type="number"
              min="0"
              step="1000"
              value={data.revenue}
              onChange={(e) => handleNumberChange('revenue', e.target.value)}
              placeholder="e.g., 1000000"
            />
            <p className="text-xs text-slate-500">Total sales/revenue for the period</p>
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="service_business"
              checked={data.is_service_business}
              onCheckedChange={(checked) => onChange({ is_service_business: checked, cogs: checked ? '0' : data.cogs })}
            />
            <Label htmlFor="service_business" className="text-sm font-normal cursor-pointer">
              Service business (no cost of goods sold)
            </Label>
          </div>

          {!data.is_service_business && (
            <div className="space-y-2">
              <Label htmlFor="cogs">Cost of Goods Sold (SGD)</Label>
              <Input
                id="cogs"
                type="number"
                min="0"
                step="1000"
                value={data.cogs}
                onChange={(e) => handleNumberChange('cogs', e.target.value)}
                placeholder="e.g., 600000"
              />
              <p className="text-xs text-slate-500">Direct costs of products/services sold</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="operating_expenses">Operating Expenses (SGD)</Label>
            <Input
              id="operating_expenses"
              type="number"
              min="0"
              step="1000"
              value={data.operating_expenses}
              onChange={(e) => handleNumberChange('operating_expenses', e.target.value)}
              placeholder="e.g., 200000"
            />
            <p className="text-xs text-slate-500">Rent, salaries, utilities, admin costs, etc.</p>
          </div>
        </CardContent>
      </Card>

      {/* Liquidity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            Liquidity Position
          </CardTitle>
          <CardDescription>Short-term financial health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_assets">Current Assets (SGD)</Label>
              <Input
                id="current_assets"
                type="number"
                min="0"
                step="1000"
                value={data.current_assets}
                onChange={(e) => handleNumberChange('current_assets', e.target.value)}
                placeholder="e.g., 500000"
              />
              <p className="text-xs text-slate-500">Cash, receivables, inventory</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_liabilities">Current Liabilities (SGD)</Label>
              <Input
                id="current_liabilities"
                type="number"
                min="0"
                step="1000"
                value={data.current_liabilities}
                onChange={(e) => handleNumberChange('current_liabilities', e.target.value)}
                placeholder="e.g., 300000"
              />
              <p className="text-xs text-slate-500">Payables, short-term debt due within 12 months</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Leverage & Assets
          </CardTitle>
          <CardDescription>Overall financial structure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_liabilities">Total Liabilities (SGD)</Label>
              <Input
                id="total_liabilities"
                type="number"
                min="0"
                step="1000"
                value={data.total_liabilities}
                onChange={(e) => handleNumberChange('total_liabilities', e.target.value)}
                placeholder="e.g., 400000"
              />
              <p className="text-xs text-slate-500">All debts and obligations</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_assets">Total Assets (SGD) <span className="text-slate-400">(Optional)</span></Label>
              <Input
                id="total_assets"
                type="number"
                min="0"
                step="1000"
                value={data.total_assets}
                onChange={(e) => handleNumberChange('total_assets', e.target.value)}
                placeholder="e.g., 800000"
              />
              <p className="text-xs text-slate-500">All assets (property, equipment, etc.)</p>
            </div>
          </div>

          <Alert className="bg-slate-50 border-slate-200">
            <AlertCircle className="h-4 w-4 text-slate-600" />
            <AlertDescription className="text-slate-700">
              If Total Assets is not provided, the debt ratio will be calculated against Revenue as a fallback method.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Check */}
      {data.revenue && data.current_assets && data.current_liabilities && (
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="pt-6">
            <h4 className="font-medium text-emerald-900 mb-3">Quick Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {data.revenue > 0 && (
                <div>
                  <p className="text-emerald-700">Net Margin</p>
                  <p className="font-semibold text-emerald-900">
                    {(((parseFloat(data.revenue) - (data.is_service_business ? 0 : parseFloat(data.cogs || 0)) - parseFloat(data.operating_expenses || 0)) / parseFloat(data.revenue)) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
              {parseFloat(data.current_liabilities) > 0 && (
                <div>
                  <p className="text-emerald-700">Current Ratio</p>
                  <p className="font-semibold text-emerald-900">
                    {(parseFloat(data.current_assets) / parseFloat(data.current_liabilities)).toFixed(2)}x
                  </p>
                </div>
              )}
              {parseFloat(data.operating_expenses) > 0 && (
                <div>
                  <p className="text-emerald-700">Op. Buffer</p>
                  <p className="font-semibold text-emerald-900">
                    {(parseFloat(data.current_assets) / (parseFloat(data.operating_expenses) / 12)).toFixed(1)} months
                  </p>
                </div>
              )}
              {parseFloat(data.total_assets) > 0 && parseFloat(data.total_liabilities) > 0 && (
                <div>
                  <p className="text-emerald-700">Debt Ratio</p>
                  <p className="font-semibold text-emerald-900">
                    {((parseFloat(data.total_liabilities) / parseFloat(data.total_assets)) * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}