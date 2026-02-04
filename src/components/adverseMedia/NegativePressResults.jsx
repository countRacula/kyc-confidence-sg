import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Download, AlertCircle, Info, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SIGNAL_CONFIG = {
  'None': { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Info },
  'Informational': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Info },
  'Potential Risk': { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle },
  'High Risk': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle }
};

const SEVERITY_COLORS = {
  'Low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'High': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export default function NegativePressResults({ check, onExportPDF, canExport }) {
  const { rollup_summary, results, executed_at, inputs } = check;
  const SignalIcon = SIGNAL_CONFIG[rollup_summary?.overall_signal]?.icon || Info;

  const isCached = check.cached_until && new Date(check.cached_until) > new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Negative Press Check
          </h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>
              Checked on: {format(new Date(executed_at), 'dd MMM yyyy, HH:mm')} (SGT)
            </span>
            {isCached && (
              <Badge variant="outline" className="ml-2">
                Cached result
              </Badge>
            )}
          </div>
        </div>
        {canExport && (
          <Button
            onClick={onExportPDF}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Search Parameters */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Company:</span>
              <span className="ml-2 text-slate-600 dark:text-slate-400">{inputs.company_name}</span>
            </div>
            {inputs.uen && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">UEN:</span>
                <span className="ml-2 text-slate-600 dark:text-slate-400">{inputs.uen}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Locale:</span>
              <span className="ml-2 text-slate-600 dark:text-slate-400">{inputs.locale}</span>
            </div>
            {inputs.keywords?.length > 0 && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Keywords:</span>
                <span className="ml-2 text-slate-600 dark:text-slate-400">
                  {inputs.keywords.join(', ')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg">What We Found</CardTitle>
              <CardDescription className="mt-2 text-base leading-relaxed">
                {rollup_summary?.summary_text}
              </CardDescription>
            </div>
            <Badge className={cn("px-4 py-2 text-sm flex items-center gap-2", SIGNAL_CONFIG[rollup_summary?.overall_signal]?.color)}>
              <SignalIcon className="w-4 h-4" />
              {rollup_summary?.overall_signal}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            {rollup_summary?.most_recent_date && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Most Recent Hit:</span>
                <span className="ml-2 text-slate-600 dark:text-slate-400">
                  {format(new Date(rollup_summary.most_recent_date), 'dd MMM yyyy')}
                </span>
              </div>
            )}
            {rollup_summary?.counts_by_severity && (
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-700 dark:text-slate-300">Severity:</span>
                {rollup_summary.counts_by_severity.high > 0 && (
                  <Badge className={SEVERITY_COLORS.High}>
                    {rollup_summary.counts_by_severity.high} High
                  </Badge>
                )}
                {rollup_summary.counts_by_severity.medium > 0 && (
                  <Badge className={SEVERITY_COLORS.Medium}>
                    {rollup_summary.counts_by_severity.medium} Medium
                  </Badge>
                )}
                {rollup_summary.counts_by_severity.low > 0 && (
                  <Badge className={SEVERITY_COLORS.Low}>
                    {rollup_summary.counts_by_severity.low} Low
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              No results does not mean no risk. Online coverage may be incomplete or unavailable.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Results List */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Articles Found ({results.length})
          </h3>
          
          {results.map((result, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-snug">
                      {result.title}
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                      <span>{result.publisher}</span>
                      <span>•</span>
                      <span>{format(new Date(result.published_date), 'dd MMM yyyy')}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={SEVERITY_COLORS[result.severity]}>
                      {result.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {result.tag}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  {result.per_article_summary}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  asChild
                >
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    Read original article
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Legal Footer */}
      <Alert className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
        <AlertDescription className="text-xs text-slate-600 dark:text-slate-400">
          <strong>Disclaimer:</strong> This output is informational only and based on public sources at the time of search. Users remain responsible for verification and final decisions.
        </AlertDescription>
      </Alert>
    </div>
  );
}