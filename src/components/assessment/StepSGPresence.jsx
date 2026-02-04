import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Building, MapPin, Banknote, UserCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateCompanyAge } from '@/components/scoring/scoringEngine';

export default function StepSGPresence({ data, counterparty, onChange }) {
  const companyAge = calculateCompanyAge(counterparty?.start_date);

  return (
    <div className="space-y-6">
      {/* Company Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            Company Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status with ACRA</Label>
            <Select
              value={data.company_status}
              onValueChange={(value) => onChange({ company_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="dormant">Dormant</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="struck_off">Struck Off</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Check ACRA BizFile for latest status</p>
          </div>

          {data.company_status === 'struck_off' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Hard Stop:</strong> Struck off companies cannot proceed. Assessment will result in automatic fail.
              </AlertDescription>
            </Alert>
          )}

          {companyAge !== null && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">
                <strong>Company Age:</strong> {companyAge.toFixed(1)} years
                {companyAge < 1 && ' (Very new - higher risk)'}
                {companyAge >= 1 && companyAge < 2 && ' (Relatively new)'}
                {companyAge >= 2 && companyAge < 5 && ' (Moderately established)'}
                {companyAge >= 5 && ' (Well established)'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Registered Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address Type</Label>
            <Select
              value={data.address_type}
              onValueChange={(value) => onChange({ address_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial">Commercial / Industrial Premises</SelectItem>
                <SelectItem value="residential">Residential / Virtual Office</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Commercial addresses indicate stronger local presence</p>
          </div>

          {counterparty?.registered_address && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Registered Address on file:</p>
              <p className="text-sm text-slate-700">{counterparty.registered_address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operating Footprint */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            Operating Footprint
          </CardTitle>
          <CardDescription>Evidence of actual operations in Singapore</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Has Singapore Bank Account?</Label>
              <Select
                value={data.has_sg_bank}
                onValueChange={(value) => onChange({ has_sg_bank: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Local DBS, OCBC, UOB, etc.</p>
            </div>

            <div className="space-y-2">
              <Label>Has Singapore Contract Signatory?</Label>
              <Select
                value={data.has_sg_signatory}
                onValueChange={(value) => onChange({ has_sg_signatory: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Director/officer based in SG</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Override */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Ownership & Control
          </CardTitle>
          <CardDescription>Pre-filled from record. Override if needed for this assessment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ownership Locale</Label>
              <Select
                value={data.ownership_locale}
                onValueChange={(value) => onChange({ ownership_locale: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sg_majority">Majority SG Citizen/PR</SelectItem>
                  <SelectItem value="mixed">Mixed Ownership</SelectItem>
                  <SelectItem value="foreign_majority">Majority Foreign</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shareholding Complexity</Label>
              <Select
                value={data.shareholding_complexity}
                onValueChange={(value) => onChange({ shareholding_complexity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple (≤3 shareholders)</SelectItem>
                  <SelectItem value="moderate">Moderate (4–10)</SelectItem>
                  <SelectItem value="complex">Complex (&gt;10 / multi-layer)</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Governance Changes (12 months)</Label>
              <Select
                value={data.governance_changes}
                onValueChange={(value) => onChange({ governance_changes: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No frequent changes</SelectItem>
                  <SelectItem value="yes">Yes, frequent changes</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>UBO Clarity</Label>
              <Select
                value={data.ubo_clarity}
                onValueChange={(value) => onChange({ ubo_clarity: value })}
              >
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
              <p className="text-xs text-slate-500">Ultimate Beneficial Owner identification</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}