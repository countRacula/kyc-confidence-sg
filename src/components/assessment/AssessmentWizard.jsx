import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ArrowRight, ArrowLeft, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

import StepSelectCounterparty from './StepSelectCounterparty';
import StepSGPresence from './StepSGPresence';
import StepFinancials from './StepFinancials';
import StepRedFlags from './StepRedFlags';
import StepResults from './StepResults';

const STEPS = [
  { id: 'counterparty', title: 'Select Counterparty', description: 'Choose who to assess' },
  { id: 'sg_presence', title: 'SG Presence', description: 'Legitimacy & presence' },
  { id: 'financials', title: 'Financials', description: 'Financial health inputs' },
  { id: 'red_flags', title: 'Red Flags', description: 'Risk indicators' },
  { id: 'results', title: 'Results', description: 'Score & recommendations' }
];

export default function AssessmentWizard({ 
  counterparties, 
  preselectedCounterpartyId,
  user,
  organisation,
  onComplete 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCounterparty, setSelectedCounterparty] = useState(null);
  const [assessmentData, setAssessmentData] = useState({
    // SG Presence
    company_status: 'active',
    address_type: 'commercial',
    has_sg_bank: 'unknown',
    has_sg_signatory: 'unknown',
    // Ownership (pulled from counterparty, can override)
    ownership_locale: 'unknown',
    shareholding_complexity: 'unknown',
    governance_changes: 'unknown',
    ubo_clarity: 'unknown',
    // Financials
    revenue: '',
    cogs: '',
    is_service_business: false,
    operating_expenses: '',
    current_assets: '',
    current_liabilities: '',
    total_liabilities: '',
    total_assets: '',
    // Red Flags
    sanctions_concern: 'no',
    adverse_media: 'unknown',
    inconsistencies: 'unknown'
  });
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (preselectedCounterpartyId) {
      const cp = counterparties.find(c => c.id === preselectedCounterpartyId);
      if (cp) {
        handleCounterpartySelect(cp);
        setCurrentStep(1);
      }
    }
  }, [preselectedCounterpartyId, counterparties]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleCounterpartySelect = (counterparty) => {
    setSelectedCounterparty(counterparty);
    // Pre-fill ownership data from counterparty
    setAssessmentData(prev => ({
      ...prev,
      ownership_locale: counterparty.ownership_locale || 'unknown',
      shareholding_complexity: counterparty.shareholding_complexity || 'unknown',
      governance_changes: counterparty.governance_changes || 'unknown',
      ubo_clarity: counterparty.ubo_clarity || 'unknown'
    }));
  };

  const handleDataChange = (newData) => {
    setAssessmentData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleResultsCalculated = (calculatedResults) => {
    setResults(calculatedResults);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedCounterparty !== null;
      case 1:
      case 2:
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepSelectCounterparty
            counterparties={counterparties}
            selectedCounterparty={selectedCounterparty}
            onSelect={handleCounterpartySelect}
          />
        );
      case 1:
        return (
          <StepSGPresence
            data={assessmentData}
            counterparty={selectedCounterparty}
            onChange={handleDataChange}
          />
        );
      case 2:
        return (
          <StepFinancials
            data={assessmentData}
            onChange={handleDataChange}
            orgSizeType={organisation?.org_size_type || 'SME'}
          />
        );
      case 3:
        return (
          <StepRedFlags
            data={assessmentData}
            onChange={handleDataChange}
            counterparty={selectedCounterparty}
          />
        );
      case 4:
        return (
          <StepResults
            data={assessmentData}
            counterparty={selectedCounterparty}
            user={user}
            onResultsCalculated={handleResultsCalculated}
            onSave={onComplete}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < STEPS.length - 1 && "flex-1"
                )}
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    index < currentStep 
                      ? "bg-emerald-600 text-white"
                      : index === currentStep
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-600"
                      : "bg-slate-100 text-slate-400"
                  )}>
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 hidden sm:block",
                    index === currentStep ? "text-emerald-700 font-medium" : "text-slate-500"
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-3",
                    index < currentStep ? "bg-emerald-600" : "bg-slate-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </CardContent>
      </Card>

      {/* Selected Counterparty Badge */}
      {selectedCounterparty && currentStep > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-900">{selectedCounterparty.name}</p>
            <p className="text-xs text-emerald-600">
              UEN: {selectedCounterparty.uen || 'Not provided'}
            </p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
          >
            {currentStep === 3 ? 'Calculate Score' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}