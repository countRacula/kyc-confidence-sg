import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Users, FileCheck, BarChart3, ArrowRight, CheckCircle } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Comprehensive credit confidence scoring without external bureaus"
    },
    {
      icon: Users,
      title: "Multi-User Teams",
      description: "Invite your team with role-based access control"
    },
    {
      icon: FileCheck,
      title: "KYC Records",
      description: "Manage vendors, suppliers and clients in one place"
    },
    {
      icon: BarChart3,
      title: "Actionable Reports",
      description: "Track risk distribution and make informed decisions"
    }
  ];

  const benefits = [
    "No external credit bureau fees",
    "Singapore-specific scoring criteria",
    "Explainable risk assessments",
    "Team collaboration built-in",
    "PDF export for records",
    "ACRA-aligned data fields"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">KYC Confidence</h1>
              <p className="text-xs text-slate-500">Singapore Edition</p>
            </div>
          </div>
          <Link to={createPageUrl('Onboarding')}>
            <Button variant="ghost">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Built for Singapore SMEs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Assess Vendor & Client Risk
            <span className="text-emerald-600"> with Confidence</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            A standalone KYC credit scoring tool designed for Singapore SMEs. 
            Evaluate counterparty risk without expensive credit bureau fees, 
            using local business criteria that matter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Onboarding')}>
              <Button 
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-base px-8"
              >
                Create Your Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="p-6 border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Why SMEs Choose Us
              </h2>
              <p className="text-slate-600 mb-8">
                Make informed credit decisions using Singapore-specific criteria, 
                transparent scoring, and actionable recommendations.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-6 md:p-8 bg-white">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-emerald-600 mb-2">0-100</div>
                <div className="text-slate-600 mb-6 text-sm md:text-base">Credit Confidence Score</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-left">80-100: Green – Proceed</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-4 h-4 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-left">60-79: Amber – With Limits</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-left">40-59: Red – Mitigations Required</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-800 flex-shrink-0" />
                    <span className="text-xs md:text-sm text-left">&lt;40: High Risk – Manual Approval</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Assess Your Counterparties?
          </h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Join Singapore SMEs who use KYC Confidence to make better credit decisions.
          </p>
          <div className="flex justify-center">
            <Link to={createPageUrl('Onboarding')}>
              <Button 
                size="lg"
                variant="secondary"
                className="bg-white text-emerald-700 hover:bg-emerald-50"
              >
                Create Your Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>© 2024 KYC Confidence (SG). Built for Singapore SMEs.</p>
        </div>
      </footer>
    </div>
  );
}