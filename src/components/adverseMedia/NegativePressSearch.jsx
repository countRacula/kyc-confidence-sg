import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYWORD_OPTIONS = [
  'fraud', 'scam', 'lawsuit', 'investigation', 'bribery', 
  'tax', 'insolvency', 'winding up', 'liquidation', 'conviction'
];

export default function NegativePressSearch({ counterparty, onSearch, loading }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputs, setInputs] = useState({
    company_name: counterparty?.name || '',
    uen: counterparty?.uen || '',
    director_names: '',
    locale: 'Singapore',
    keywords: [],
    time_window: 'last_12_months',
    custom_terms: ''
  });

  const handleKeywordToggle = (keyword) => {
    setInputs(prev => ({
      ...prev,
      keywords: prev.keywords.includes(keyword)
        ? prev.keywords.filter(k => k !== keyword)
        : [...prev.keywords, keyword]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputs);
  };

  return (
    <Card>
      <CardHeader>
        <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Open-source notice:</strong> This search summarises publicly available reporting and may include allegations or disputed claims. Always verify using the original source. This is not legal, compliance, or regulatory advice.
          </AlertDescription>
        </Alert>
        
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Negative Press Check
        </CardTitle>
        <CardDescription>
          Search for adverse media coverage across public sources
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              value={inputs.company_name}
              onChange={(e) => setInputs({ ...inputs, company_name: e.target.value })}
              placeholder="Enter company legal name"
              required
            />
          </div>

          {/* UEN */}
          <div className="space-y-2">
            <Label htmlFor="uen">UEN (Optional)</Label>
            <Input
              id="uen"
              value={inputs.uen}
              onChange={(e) => setInputs({ ...inputs, uen: e.target.value })}
              placeholder="Enter UEN if available"
            />
            <p className="text-xs text-slate-500">Including UEN helps reduce false positives</p>
          </div>

          {/* Director Names */}
          <div className="space-y-2">
            <Label htmlFor="director_names">Director/Owner Names (Optional)</Label>
            <Input
              id="director_names"
              value={inputs.director_names}
              onChange={(e) => setInputs({ ...inputs, director_names: e.target.value })}
              placeholder="e.g., John Tan, Mary Lee"
            />
            <p className="text-xs text-slate-500">Separate multiple names with commas</p>
          </div>

          {/* Locale */}
          <div className="space-y-2">
            <Label htmlFor="locale">Search Locale</Label>
            <Select
              value={inputs.locale}
              onValueChange={(value) => setInputs({ ...inputs, locale: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Singapore">Singapore</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-3">
            <Label>Keywords to Include (Select relevant)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {KEYWORD_OPTIONS.map(keyword => (
                <div key={keyword} className="flex items-center space-x-2">
                  <Checkbox
                    id={keyword}
                    checked={inputs.keywords.includes(keyword)}
                    onCheckedChange={() => handleKeywordToggle(keyword)}
                  />
                  <label
                    htmlFor={keyword}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {keyword}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Leave blank to use default risk terms
            </p>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Options
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 pl-6 border-l-2 border-slate-200 dark:border-slate-700">
                {/* Time Window */}
                <div className="space-y-2">
                  <Label htmlFor="time_window">Time Window</Label>
                  <Select
                    value={inputs.time_window}
                    onValueChange={(value) => setInputs({ ...inputs, time_window: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_12_months">Last 12 months</SelectItem>
                      <SelectItem value="last_3_years">Last 3 years</SelectItem>
                      <SelectItem value="all_time">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Terms */}
                <div className="space-y-2">
                  <Label htmlFor="custom_terms">Custom Keywords (Free Text)</Label>
                  <Textarea
                    id="custom_terms"
                    value={inputs.custom_terms}
                    onChange={(e) => setInputs({ ...inputs, custom_terms: e.target.value })}
                    placeholder="Enter additional search terms..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading || !inputs.company_name}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Run Negative Press Check
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}