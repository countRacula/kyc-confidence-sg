import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

export default function StepSelectCounterparty({ counterparties, selectedCounterparty, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = counterparties.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.uen?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCounterparties = filtered.filter(c => c.status === 'active');
  const otherCounterparties = filtered.filter(c => c.status !== 'active');

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or UEN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activeCounterparties.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Active Records</p>
              {activeCounterparties.map(cp => (
                <CounterpartyCard
                  key={cp.id}
                  counterparty={cp}
                  isSelected={selectedCounterparty?.id === cp.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}

          {otherCounterparties.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Other Records</p>
              {otherCounterparties.map(cp => (
                <CounterpartyCard
                  key={cp.id}
                  counterparty={cp}
                  isSelected={selectedCounterparty?.id === cp.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No counterparties found</p>
          <p className="text-sm">Add a record first to run an assessment</p>
        </div>
      )}
    </div>
  );
}

function CounterpartyCard({ counterparty, isSelected, onSelect }) {
  const isIncomplete = !counterparty.uen || counterparty.uen === 'PENDING';

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected 
          ? "ring-2 ring-emerald-600 bg-emerald-50/50" 
          : "hover:border-emerald-300"
      )}
      onClick={() => onSelect(counterparty)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isSelected ? "bg-emerald-100" : "bg-slate-100"
            )}>
              {isSelected ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Building2 className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">{counterparty.name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">
                  UEN: {counterparty.uen || 'Not provided'}
                </span>
                {counterparty.start_date && (
                  <span className="text-sm text-slate-400">
                    • Since {format(new Date(counterparty.start_date), 'yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isIncomplete && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <AlertCircle className="w-3 h-3 mr-1" />
                Incomplete
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}