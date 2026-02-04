import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Newspaper, FileQuestion, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StepRedFlags({ data, onChange }) {
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
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-amber-600" />
            Adverse Media
          </CardTitle>
          <CardDescription>Negative news and reputation concerns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Any adverse media or negative news?</Label>
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
              Search for news about fraud, lawsuits, regulatory issues, etc.
            </p>
          </div>

          {data.adverse_media === 'yes' && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
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