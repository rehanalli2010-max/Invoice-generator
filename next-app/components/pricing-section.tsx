"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check } from "lucide-react";

interface CurrencyData {
  symbol: string;
  code: string;
  rate: number;
  dec: number;
}

interface CountryData {
  country_code: string;
  country_name: string;
}

const CURRENCIES: Record<string, CurrencyData> = {
  IN: { symbol: "₹", code: "INR", rate: 1, dec: 0 },
  PK: { symbol: "Rs", code: "PKR", rate: 3.5, dec: 0 },
  BD: { symbol: "৳", code: "BDT", rate: 1.3, dec: 0 },
  LK: { symbol: "Rs", code: "LKR", rate: 3.8, dec: 0 },
  NP: { symbol: "Rs", code: "NPR", rate: 1.6, dec: 0 },
  US: { symbol: "$", code: "USD", rate: 0.012, dec: 2 },
  CA: { symbol: "CA$", code: "CAD", rate: 0.016, dec: 2 },
  AU: { symbol: "A$", code: "AUD", rate: 0.018, dec: 2 },
  GB: { symbol: "£", code: "GBP", rate: 0.0095, dec: 2 },
  DE: { symbol: "€", code: "EUR", rate: 0.011, dec: 2 },
  FR: { symbol: "€", code: "EUR", rate: 0.011, dec: 2 },
  IT: { symbol: "€", code: "EUR", rate: 0.011, dec: 2 },
  ES: { symbol: "€", code: "EUR", rate: 0.011, dec: 2 },
  NL: { symbol: "€", code: "EUR", rate: 0.011, dec: 2 },
  AE: { symbol: "AED", code: "AED", rate: 0.044, dec: 2 },
  SA: { symbol: "SAR", code: "SAR", rate: 0.045, dec: 2 },
  JP: { symbol: "¥", code: "JPY", rate: 1.8, dec: 0 },
  CN: { symbol: "¥", code: "CNY", rate: 0.087, dec: 2 },
  KR: { symbol: "₩", code: "KRW", rate: 16, dec: 0 },
  SG: { symbol: "S$", code: "SGD", rate: 0.016, dec: 2 },
  MY: { symbol: "RM", code: "MYR", rate: 0.056, dec: 2 },
  ID: { symbol: "Rp", code: "IDR", rate: 192, dec: 0 },
  TH: { symbol: "฿", code: "THB", rate: 0.42, dec: 2 },
  NG: { symbol: "₦", code: "NGN", rate: 18, dec: 0 },
  ZA: { symbol: "R", code: "ZAR", rate: 0.22, dec: 2 },
  KE: { symbol: "KSh", code: "KES", rate: 1.56, dec: 0 },
  BR: { symbol: "R$", code: "BRL", rate: 0.062, dec: 2 },
  MX: { symbol: "MX$", code: "MXN", rate: 0.21, dec: 2 },
};

const DEFAULT_CURRENCY: CurrencyData = { symbol: "$", code: "USD", rate: 0.012, dec: 2 };

const BASE = { freelancer: 0, startup: 300, enterprise: 600 };
const YEARLY_BASE = { freelancer: 0, startup: 2500, enterprise: 6000 };

interface Plan {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  isPopular: boolean;
  buttonText: string;
  buttonVariant: "primary" | "outline";
}

const plansData: Plan[] = [
  {
    id: "freelancer",
    name: "Freelancer",
    description: "The essentials to provide your best work for clients.",
    basePrice: BASE.freelancer,
    features: [
      "20 invoices per day",
      "48-hour support response time",
      "Ad supported",
    ],
    isPopular: false,
    buttonText: "Get started",
    buttonVariant: "outline",
  },
  {
    id: "startup",
    name: "Startup",
    description: "A plan that scales with your rapidly growing business.",
    basePrice: BASE.startup,
    features: [
      "500 invoices per day",
      "24-hour support response time",
      "No ads",
    ],
    isPopular: true,
    buttonText: "Buy plan",
    buttonVariant: "primary",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Dedicated support and infrastructure for your company.",
    basePrice: BASE.enterprise,
    features: [
      "Unlimited invoices",
      "12-hour, dedicated support response time",
      "No ads",
    ],
    isPopular: false,
    buttonText: "Buy plan",
    buttonVariant: "outline",
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<CurrencyData>(DEFAULT_CURRENCY);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  useEffect(() => {
    // Load saved preference
    const savedBilling = localStorage.getItem("pricing-billing");
    if (savedBilling) {
      setIsYearly(savedBilling === "yearly");
    }

    // Detect country via IP geolocation
    detectCountry();
  }, []);

  const detectCountry = async () => {
    // Default to INR immediately
    applyPrices(CURRENCIES.IN, null);
    setIsLoading(false);

    try {
      const res = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(4000),
      });
      const data: CountryData = await res.json();
      const cc = (data.country_code || "").toUpperCase();
      const detectedCurrency = CURRENCIES[cc] || DEFAULT_CURRENCY;
      applyPrices(detectedCurrency, data.country_name || cc);
    } catch {
      // Keep INR default silently
      document.getElementById("currencyNotice")?.textContent
        ? (document.getElementById("currencyNotice")!.textContent =
            "Prices shown in INR")
        : null;
    }
  };

  const applyPrices = (curr: CurrencyData, country: string | null) => {
    setCurrency(curr);
    setCountryName(country);
    localStorage.setItem("pricing-currency", JSON.stringify(curr));
    if (country) localStorage.setItem("pricing-country", country);
  };

  const formatPrice = (
    inrAmount: number,
    curr: CurrencyData,
    isYearlyPlan: boolean
  ): { symbol: string; amount: string; period: string } => {
    if (inrAmount === 0) return { symbol: "", amount: "Free", period: "" };

    let amountToConvert = inrAmount;
    let periodText = isYearlyPlan
      ? "/month, billed yearly"
      : "/month";

    if (isYearlyPlan) {
      amountToConvert = inrAmount / 12;
    }

    const converted = amountToConvert * curr.rate;
    const display =
      curr.dec === 0
        ? Math.round(converted).toLocaleString()
        : converted.toFixed(curr.dec);

    return { symbol: curr.symbol, amount: display, period: periodText };
  };

  const toggleBilling = () => {
    const newValue = !isYearly;
    setIsYearly(newValue);
    localStorage.setItem("pricing-billing", newValue ? "yearly" : "monthly");
  };

  const prices = isYearly ? YEARLY_BASE : BASE;

  return (
    <section
      id="pricing"
      className="py-24 relative border-t border-border bg-background/50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-medium text-cyan-400 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Simple, transparent pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Pricing that grows <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500">
              with you
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Choose an affordable plan packed with the best features for engaging
            your audience, creating customer loyalty, and driving sales.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-10"
        >
          <span
            className={`billing-label font-semibold text-sm transition-colors cursor-pointer text-white`}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </span>
          <label className="switch relative inline-block w-11 h-6">
            <input
              type="checkbox"
              checked={isYearly}
              onChange={toggleBilling}
              className="opacity-0 w-0 h-0"
            />
            <span
              className={`slider absolute inset-0 cursor-pointer transition-colors rounded-full ${
                isYearly
                  ? "bg-white"
                  : "bg-white"
              }`}
            >
              <span
                className={`absolute h-4 w-4 rounded-full bg-cyan-500 shadow-lg transition-transform ${
                  isYearly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
          </label>
          <span
            className={`billing-label font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 text-white`}
            onClick={() => setIsYearly(true)}
          >
            Yearly
            <span className="px-2 py-0.5 text-xs font-bold text-primary-foreground bg-cyan-500 rounded-full">
              Save ~17%
            </span>
          </span>
        </motion.div>

        {/* Currency Notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10 min-h-[1.5rem]"
        >
          {countryName && (
            <p className="text-sm text-muted-foreground">
              Prices shown in {currency.code} for {countryName}
            </p>
          )}
          {!countryName && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Prices shown in {currency.code}
            </p>
          )}
        </motion.div>

        {/* Pricing Grid */}
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {plansData.map((plan, index) => (
            <motion.div
              key={plan.id}
              variants={fadeIn}
              className={`relative bg-card border rounded-2xl p-8 transition-all ${
                plan.isPopular
                  ? "border-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/20"
                  : "border-border hover:border-border"
              }`}
              style={{
                transform: plan.isPopular ? "translateY(-8px)" : "translateY(0)",
              }}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-2 ${
                  plan.isPopular ? "text-primary" : "text-foreground"
                }`}>
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-bold ${
                      plan.isPopular ? "text-primary" : "text-foreground"
                    }`}
                    style={{ fontSize: "2.5rem" }}
                  >
                    {(() => {
                      const { symbol, amount } = formatPrice(
                        plan.basePrice,
                        currency,
                        isYearly
                      );
                      return `${symbol}${amount}`;
                    })()}
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">
                    {(() => {
                      const { period } = formatPrice(
                        plan.basePrice,
                        currency,
                        isYearly
                      );
                      return period;
                    })()}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                      plan.isPopular
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    }`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="mt-0.5">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  plan.buttonVariant === "primary"
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                    : "bg-background border border-border/80 text-foreground hover:border-border hover:bg-muted"
                }`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-muted-foreground"
        >
          <p>
            All prices are approximate conversions from INR base prices. Actual
            charges may vary based on exchange rates and local taxes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}