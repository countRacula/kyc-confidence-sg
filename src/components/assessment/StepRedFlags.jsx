import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Newspaper, FileQuestion, Info, Search, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { performNegativePressSearch } from '@/components/adverseMedia/adverseMediaService';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const SEVERITY_COLORS = {
  'Low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'High': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

const TAG_COLORS = {
  'Allegation': 'bg-amber-100 text-amber-700',
  'Investigation': 'bg-orange-100 text-orange-700',
  'Civil dispute': 'bg-blue-100 text-blue-700',
  'Enforcement': 'bg-red-100 text-red-700',
  'Conviction': 'bg-red-200 text-red-800',
  'Insolvency': 'bg-purple-100 text-purple-700',
  'Other': 'bg-slate-100 text-slate-700'
};

export default function StepRedFlags({ data, onChange, counterparty }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchInputs, setSearchInputs] = useState({
    company_name: counterparty?.name || '',
    uen: counterparty?.uen || '',
    director_names: '',
    locale: 'Singapore',
    keywords: [],
    time_window: 'last_12_months',
    custom_terms: ''
  });

  const handleRunCheck = async () => {
    setSearching(true);
    try {
      const results = await performNegativePressSearch(searchInputs);
      setSearchResults(results);
      
      // Auto-update adverse media field based on results
      if (results.results.length > 0) {
        onChange({ adverse_media: 'yes' });
      } else {
        onChange({ adverse_media: 'no' });
      }
      
      toast.success('Check completed');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          These questions help identify critical risk indicators. Answer based on your due diligence findings.
          If unsure, select "Unknown" rather than guessing.
        </AlertDescription>
      </Alert>

      {/* Sanctions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-600" />
            Sanctions & Watchlists
          </CardTitle>
          <CardDescription>Critical compliance check</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Any sanctions or watchlist concerns?</Label>
            <Select
              value={data.sanctions_concern}
              onValueChange={(value) => onChange({ sanctions_concern: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No concerns identified</SelectItem>
                <SelectItem value="yes">Yes, concerns identified</SelectItem>
                <SelectItem value="unknown">Unknown / Not checked</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Check against MAS, UN, OFAC, and relevant sanctions lists
            </p>
          </div>

          {data.sanctions_concern === 'yes' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Hard Stop:</strong> Sanctions concern flagged. Assessment will result in mandatory manual review.
                Do not proceed without compliance team approval.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Adverse Media */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-amber-600" />
                Adverse Media
              </CardTitle>
              <CardDescription>Negative news and reputation concerns</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4 mr-2" />
              {showSearch ? 'Hide' : 'Run'} Check
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inline Search Form */}
          {showSearch && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Open-source notice:</strong> This search summarises publicly available reporting and may include allegations or disputed claims. Always verify using the original source.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Company Name</Label>
                  <Input
                    value={searchInputs.company_name}
                    onChange={(e) => setSearchInputs({ ...searchInputs, company_name: e.target.value })}
                    placeholder="Company name"
                    className="h-9"
                  />
                  <p className="text-xs text-slate-500">
                    Results will be automatically categorized
                  </p>
                </div>

                <Button
                  onClick={handleRunCheck}
                  disabled={searching || !searchInputs.company_name}
                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  {searching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Public Sources
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {searchResults.rollup_summary?.summary_text}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Found {searchResults.results.length} article{searchResults.results.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge className={cn("text-xs", 
                  searchResults.results.length === 0 
                    ? "bg-green-100 text-green-700" 
                    : "bg-amber-100 text-amber-700"
                )}>
                  {searchResults.rollup_summary?.overall_signal || 'No Risk'}
                </Badge>
              </div>

              {searchResults.results.length > 0 && (
                <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
                  {searchResults.results.slice(0, 5).map((result, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded border text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 flex-1">
                          {result.title}
                        </p>
                        <Badge className={cn("text-xs flex-shrink-0", SEVERITY_COLORS[result.severity])}>
                          {result.severity}
                        </Badge>
                      </div>
                      
                      {result.tag && (
                        <Badge variant="outline" className={cn("text-xs", TAG_COLORS[result.tag] || TAG_COLORS['Other'])}>
                          {result.tag}
                        </Badge>
                      )}
                      
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                        {result.per_article_summary}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500">
                          {result.published_date ? format(new Date(result.published_date), 'dd MMM yyyy') : 'Date unknown'} • {result.publisher || 'Unknown source'}
                        </span>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                  {searchResults.results.length > 5 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      + {searchResults.results.length - 5} more article{searchResults.results.length - 5 !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual Selection */}
          <div className="space-y-2">
            <Label>Assessment Result</Label>
            <Select
              value={data.adverse_media}
              onValueChange={(value) => onChange({ adverse_media: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No adverse media found</SelectItem>
                <SelectItem value="yes">Yes, adverse media found</SelectItem>
                <SelectItem value="unknown">Unknown / Not checked</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Auto-updated based on search results, or select manually
            </p>
          </div>

          {data.adverse_media === 'yes' && (
            <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Adverse media will reduce the score. Document findings and consider enhanced due diligence.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Inconsistencies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-amber-600" />
            Data Inconsistencies
          </CardTitle>
          <CardDescription>Documentation and information quality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Major inconsistencies in provided information?</Label>
            <Select
              value={data.inconsistencies}
              onValueChange={(value) => onChange({ inconsistencies: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No major inconsistencies</SelectItem>
                <SelectItem value="yes">Yes, inconsistencies found</SelectItem>
                <SelectItem value="unknown">Unknown / Unable to verify</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Mismatched addresses, conflicting financials, unverifiable claims, etc.
            </p>
          </div>

          {data.inconsistencies === 'yes' && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Inconsistencies reduce confidence. Request clarification before onboarding.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Guidance */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-600" />
            Due Diligence Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">•</span>
              <span>Check MAS sanctions list and UN consolidated list</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">•</span>
              <span>Search company and director names on Google News</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">•</span>
              <span>Verify UEN and registered address on ACRA BizFile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">•</span>
              <span>Cross-check financial figures with bank statements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600">•</span>
              <span>Request references from existing clients/suppliers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}