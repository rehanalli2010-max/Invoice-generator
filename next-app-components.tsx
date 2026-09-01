"use client";

import React from "react";
import SwitchButton from "@/components/switch-button";
import Particles from "@/components/particles";
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-cyan-500/30 selection:text-white font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-100">InvoiceGen</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
            <a href="#demo" className="hover:text-zinc-100 transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="/index.html" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Sign in</a>
            <a href="/index.html" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-zinc-950 hover:from-cyan-400 hover:to-cyan-500 rounded-full transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-2">
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
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto text-zinc-50"
          >
            Unleash the power of <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500">intuitive invoicing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
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
            <a href="/index.html" className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-zinc-950 font-semibold rounded-full hover:from-cyan-400 hover:to-cyan-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Start creating free <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/index.html" className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-100 font-semibold rounded-full hover:bg-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-center">
              See demo
            </a>
          </motion.div>

          {/* Product UI Preview / Dashboard Mockup with parallax */}
          <motion.div
            style={{ y }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10 top-1/2" />
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-sm overflow-hidden ring-1 ring-white/10 ring-inset">
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
      <section id="features" className="py-24 relative border-t border-zinc-900 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-50">Everything you need to <br className="hidden md:block"/>manage receivables.</h2>
            <p className="text-zinc-400 text-lg max-w-xl">A complete toolkit designed to eliminate friction between your work and your wallet.</p>
          </div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Feature 1 - Large Card */}
            <motion.div variants={fadeIn} className="col-span-1 md:col-span-2 group bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-700 transition-all overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 w-full h-full flex flex-col">
                <div className="mb-auto pb-12">
                  <div className="w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                    <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-zinc-100 mb-3">Insights at your fingertips</h3>
                  <p className="text-zinc-400 text-base leading-relaxed max-w-md">
                    All your invoicing data in one place. Track revenue, view pending payments, and identify top clients instantly with our powerful dashboard.
                  </p>
                </div>
                {/* Abstract UI Representation */}
                <div className="w-full bg-zinc-950 rounded-xl border border-zinc-800/80 p-4 pt-6 mt-8 relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px]" />
                  <div className="flex gap-4 relative z-10">
                    <div className="w-1/3 space-y-3">
                      <div className="h-2 w-full bg-zinc-800 rounded-full"></div>
                      <div className="h-6 w-3/4 bg-zinc-700 rounded-md"></div>
                    </div>
                    <div className="w-2/3 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/10"></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 - Tall Card */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-700 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                  <BellRing className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-semibold text-zinc-100 mb-3">Real-time Alerts</h3>
                <p className="text-zinc-400 text-base leading-relaxed">
                  Know the exact moment a client views your invoice or makes a payment.
                </p>

                <div className="mt-12 space-y-4">
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-start gap-4 transform transition-all group-hover:-translate-y-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Invoice #104 Paid</p>
                      <p className="text-xs text-zinc-500 mt-1">Acme Corp just paid $4,200</p>
                    </div>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-start gap-4 opacity-70 transform transition-all group-hover:-translate-y-1 group-hover:opacity-90 transition-delay-75">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Invoice Viewed</p>
                      <p className="text-xs text-zinc-500 mt-1">Globex viewed #105</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-700 transition-all relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                  <FileCheck2 className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-3">Smart Templates</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Choose from professional themes that automatically calculate taxes, discounts, and totals without manual math.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-700 transition-all relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-3">Multi-Currency</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Invoice global clients effortlessly. Deep support for USD, EUR, GBP, CAD, AUD, INR, and JPY currencies.
                </p>
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={fadeIn} className="col-span-1 group bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-8 hover:border-zinc-700 transition-all flex flex-col justify-between relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-3">You're in control</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Export to JSON/CSV, save PDFs locally, or persist data in your browser. Complete data ownership always.
                </p>
               </div>
               <div className="mt-8 flex items-center gap-2 text-xs text-zinc-500 relative z-10">
                 <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-800 flex items-center justify-center rounded text-zinc-300 font-mono">⌘</kbd>
                 <span>+</span>
                 <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-800 flex items-center justify-center rounded text-zinc-300 font-mono">K</kbd>
                 <span className="ml-2 font-medium">to open command menu</span>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI / Smart Features Section */}
      <section className="py-24 border-y border-zinc-800/50 bg-gradient-to-b from-zinc-950 to-zinc-900/30 overflow-hidden relative">
        {/* Subtle background mesh or glow */}
        <div className="absolute -right-1/4 top-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sm font-medium text-sky-400">
                <Zap className="w-4 h-4" /> Smart Assistant
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-zinc-50">
                Say goodbye to <br/>manual entry.
              </h2>
              <p className="text-lg text-zinc-400 max-w-md">
                Our smart system remembers your clients, predicts line items based on history, and flags missing essential information before you send.
              </p>

              <ul className="space-y-5 pt-4">
                {[
                  "Saved client directory for 1-click loading",
                  "Auto-calculating tax and discount logic",
                  "Smart required-field highlighting"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex-1 w-full relative"
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 blur-[80px] rounded-full" />
               <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl ring-1 ring-white/5">
                 <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-inner">
                       <Zap className="w-5 h-5 text-white" />
                     </div>
                     <div>
                       <p className="font-medium text-zinc-100">System Alert</p>
                       <p className="text-xs text-zinc-500">Smart Validation</p>
                     </div>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 border-l-2 border-l-orange-500/80">
                     <p className="text-zinc-200 text-sm">You usually apply a 10% discount to <strong>Acme Corp</strong>. Would you like to apply it now?</p>
                     <div className="mt-3 flex gap-2">
                       <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium rounded-md transition-colors border border-zinc-700">Apply 10%</button>
                       <button className="px-3 py-1.5 hover:bg-zinc-800 text-zinc-400 text-xs font-medium rounded-md transition-colors">Dismiss</button>
                     </div>
                   </div>
                   <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                     <div className="h-2 w-1/3 bg-zinc-800 rounded-full mb-3" />
                     <div className="h-2 w-full bg-zinc-800/50 rounded-full mb-2" />
                     <div className="h-2 w-4/5 bg-zinc-800/50 rounded-full" />
                   </div>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden border-t border-zinc-900">
        <div className="absolute inset-0 bg-cyan-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-[100px]" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-zinc-50"
          >
            See where financial automation <br className="hidden sm:block"/>can take your business.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto"
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
            <a href="/index.html" className="w-full sm:w-auto px-8 py-4 bg-zinc-100 text-zinc-950 font-semibold rounded-full hover:bg-white transition-all text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2">
              Create your first invoice <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-100">InvoiceGen</span>
          </div>

          <div className="flex gap-8 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-100 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Contact</a>
          </div>

          <div className="text-sm text-zinc-500 flex items-center gap-2">
            <Lock className="w-3 h-3" />
            © {new Date().getFullYear()} InvoiceGen. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
