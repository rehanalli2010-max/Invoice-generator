"use client";

import React from "react";
import SwitchButton from "@/components/switch-button";
import Particles from "@/components/particles";
import PricingSection from "@/components/pricing-section";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  LayoutDashboard,
  BellRing,
  FileCheck2,
  Wallet,
  ShieldCheck,
  Zap,
  ChevronRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const [btnState, setBtnState] = React.useState<"idle" | "signUp" | "leaving">("idle");

  function handleStartBtn() {
    if (btnState !== "idle") return;
    setBtnState("signUp");
    setTimeout(() => setBtnState("leaving"), 350);
    setTimeout(() => { window.location.href = "/index.html"; }, 700);
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">InvoiceGen</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <SwitchButton variant="square" size="sm" className="hidden sm:block" />
            <a href="/index.html" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</a>
            <a href="/index.html" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-primary-foreground hover:from-cyan-400 hover:to-cyan-500 rounded-full transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-2">
              Start Free <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden">
        {/* Particles Background */}
        <div className="absolute inset-0 z-0">
          <Particles
            particleCount={150}
            particleColors={['#06b6d4', '#6366f1', '#27272a']}
            alphaParticles={true}
            speed={0.15}
            particleBaseSize={80}
            moveParticlesOnHover={true}
          />
        </div>

        {/* Abstract Background Glow (Cobalt inspired) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-sm font-medium text-cyan-400 mb-8 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Invoice Generator v2.0 is live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto text-foreground"
          >
            Unleash the power of <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500">intuitive invoicing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Stop chasing payments and focus on what matters. Create, manage, and get paid
            faster with intelligent automation designed for modern professionals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleStartBtn}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-primary-foreground font-semibold rounded-full hover:from-cyan-400 hover:to-cyan-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
              style={{ transform: btnState === "signUp" ? "scale(1.05)" : "scale(1)", transition: "transform 0.2s ease" }}
            >
              <span
                style={{
                  opacity: btnState === "idle" ? 1 : btnState === "signUp" ? 1 : 0,
                  transform: btnState === "signUp" ? "scale(1.05)" : "scale(1)",
                  transition: "opacity 0.15s ease, transform 0.2s ease",
                  display: "flex", alignItems: "center", gap: "0.5rem"
                }}
              >
                {btnState === "idle" ? <><span>Start creating free</span><ArrowRight className="w-5 h-5" /></> : <span>Sign up</span>}
              </span>
            </button>
          </motion.div>

          {/* Product UI Preview / Dashboard Mockup with parallax */}
          <motion.div
            style={{ y }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10 top-1/2" />
            <div className="rounded-2xl border border-border/50 bg-card/50 p-2 shadow-2xl backdrop-blur-sm overflow-hidden ring-1 ring-white/10 ring-inset">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=2670"
                alt="Dashboard Preview"
                className="rounded-xl w-full object-cover object-top h-[400px] md:h-[600px] opacity-80"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid (Cobalt Style Modular Cards) */}
      <section id="features" className="py-24 relative border-t border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">Everything you need to <br className="hidden md:block"/>manage receivables.</h2>
            <p className="text-muted-foreground text-lg max-w-xl">A complete toolkit designed to eliminate friction between your work and your wallet.</p>
          </div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Feature 1 - Large Card */}
            <motion.div variants={fadeIn} className="col-span-1 md:col-span-2 group bg-card/80 border border-border/80 rounded-2xl p-8 hover:border-border transition-all overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 w-full h-full flex flex-col">
                <div className="mb-auto pb-12">
                  <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center mb-6 shadow-inner">
                    <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-3">Insights at your fingertips</h3>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                    All your invoicing data in one place. Track revenue, view pending payments, and identify top clients instantly with our powerful dashboard.
                  </p>
                </div>
                {/* Abstract UI Representation */}
                <div className="w-full bg-background rounded-xl border border-border/80 p-4 pt-6 mt-8 relative overflow-hidden group-hover:border-border transition-colors">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px]" />
                  <div className="flex gap-4 relative z-10">
                    <div className="w-1/3 space-y-3">
                      <div className="h-2 w-full bg-muted rounded-full"></div>
                      <div className="h-6 w-3/4 bg-muted-foreground/30 rounded-md"></div>
                    </div>
                    <div className="w-2/3 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/10"></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 - Tall Card */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-card/80 border border-border/80 rounded-2xl p-8 hover:border-border transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center mb-6 shadow-inner">
                  <BellRing className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Real-time Alerts</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Know the exact moment a client views your invoice or makes a payment.
                </p>

                <div className="mt-12 space-y-4">
                  <div className="bg-background/80 border border-border p-4 rounded-xl flex items-start gap-4 transform transition-all group-hover:-translate-y-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Invoice #104 Paid</p>
                      <p className="text-xs text-muted-foreground mt-1">Acme Corp just paid $4,200</p>
                    </div>
                  </div>
                  <div className="bg-background/80 border border-border p-4 rounded-xl flex items-start gap-4 opacity-70 transform transition-all group-hover:-translate-y-1 group-hover:opacity-90 transition-delay-75">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Invoice Viewed</p>
                      <p className="text-xs text-muted-foreground mt-1">Globex viewed #105</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-card/80 border border-border/80 rounded-2xl p-8 hover:border-border transition-all relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center mb-6 shadow-inner">
                  <FileCheck2 className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Smart Templates</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Choose from professional themes that automatically calculate taxes, discounts, and totals without manual math.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-card/80 border border-border/80 rounded-2xl p-8 hover:border-border transition-all relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center mb-6 shadow-inner">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Multi-Currency</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Invoice global clients effortlessly. Deep support for USD, EUR, GBP, CAD, AUD, INR, and JPY currencies.
                </p>
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-card/80 border border-border/80 rounded-2xl p-8 hover:border-border transition-all flex flex-col justify-between relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center mb-6 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">You're in control</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Export to JSON/CSV, save PDFs locally, or persist data in your browser. Complete data ownership always.
                </p>
               </div>
               <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground relative z-10">
                 <kbd className="px-2 py-1 bg-background border border-border flex items-center justify-center rounded text-muted-foreground font-mono">⌘</kbd>
                 <span>+</span>
                 <kbd className="px-2 py-1 bg-background border border-border flex items-center justify-center rounded text-muted-foreground font-mono">K</kbd>
                 <span className="ml-2 font-medium">to open command menu</span>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI / Smart Features Section */}
      <section className="py-24 border-y border-border/50 bg-gradient-to-b from-background to-card/30 overflow-hidden relative">
        {/* Subtle background mesh or glow */}
        <div className="absolute -right-1/4 top-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sm font-medium text-sky-400">
              <Zap className="w-4 h-4" /> Smart Assistant
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight text-foreground">
              Say goodbye to manual entry.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Our smart system remembers your clients, predicts line items based on history, and flags missing essential information before you send.
            </p>

            <ul className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              {[
                "Saved client directory for 1-click loading",
                "Auto-calculating tax and discount logic",
                "Smart required-field highlighting"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-cyan-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-[100px]" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-foreground"
          >
            See where financial automation <br className="hidden sm:block"/>can take your business.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Join thousands of freelancers, agencies, and small businesses who get paid faster with InvoiceGen. No credit card required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="/index.html" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-all text-base shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2">
              Create your first invoice <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">InvoiceGen</span>
          </div>

          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Lock className="w-3 h-3" />
            © {new Date().getFullYear()} InvoiceGen. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
