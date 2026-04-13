import React, { useState } from 'react';
import { Check } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  
  const plans = [
    {
      name: "Free",
      price: "₹0",
      description: "For testing the waters",
      features: [
        "Gemini, LLaMA, Mixtral",
        "10 messages per day",
        "Basic connector tools",
        "Standard chat history"
      ],
      cta: "Get Started Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: isAnnual ? "₹1999" : "₹199",
      description: "Everything for professionals",
      features: [
        "GPT-4o, Claude 3.5, Gemini 2.0",
        "Unlimited messages",
        "All 40+ dynamic connectors",
        "AI Agent & Code builder",
        "Compare multiple models instantly"
      ],
      cta: "Upgrade to Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and businesses",
      features: [
        "All pro features",
        "Custom deployment & APIs",
        "Dedicated account manager",
        "Enterprise-level support",
        "Custom tool integrations",
        "SSO and admin controls"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="bg-[#09090b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Plans and Pricing
          </h1>
          <p className="text-lg text-neutral-400 mb-8">
            Receive unlimited runs when you pay yearly, and save on your plan.
          </p>

          <div className="inline-flex items-center bg-white/5 rounded-full p-1 border border-white/10">
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${!isAnnual
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
                }`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${isAnnual
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
                }`}
              onClick={() => setIsAnnual(true)}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border ${plan.highlighted
                  ? 'border-purple-500/40 bg-purple-500/5 scale-[1.02] shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                } p-8 flex flex-col transition-all duration-300`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-[4px]" />
                    <div className="relative px-4 py-1.5 bg-zinc-900 border border-purple-500/50 rounded-full flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Most Popular</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8 mt-2">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-sm text-neutral-500 font-medium">
                      /{isAnnual ? 'yr' : 'mo'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-400 mt-4 leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-purple-400' : 'text-neutral-500'}`} />
                    <span className="text-sm text-neutral-300 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.name === 'Pro' ? (
                <CheckoutButton 
                  amount={isAnnual ? 1999 : 199} 
                  plan="pro"
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                />
              ) : plan.name === 'Free' ? (
                <a
                  href="/login"
                  className="w-full py-3 px-4 rounded-xl text-center text-sm font-bold transition-all bg-white/5 border border-white/10 hover:bg-white/10 text-white inline-block"
                >
                  {plan.cta}
                </a>
              ) : (
                <button
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${plan.highlighted
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                    }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>

          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
