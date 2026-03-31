'use client'

import Link from 'next/link'
import { ArrowLeft, Star, TrendingUp, Share2, CheckCircle } from 'lucide-react'

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Priority Search Placement',
    description: 'Your shop appears at the top of all search results and map listings, above regular shops.',
  },
  {
    icon: Star,
    title: 'FEATURED Badge',
    description: 'A prominent gold FEATURED badge on your shop card and detail page to build trust and attract customers.',
  },
  {
    icon: Share2,
    title: 'Social Media Promotion',
    description: 'Your shop gets featured on our social media channels, reaching thousands of cannabis enthusiasts in Thailand.',
  },
]

export default function PremiumLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-950 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <span className="text-gray-600">|</span>
          <span className="font-bold text-white">Premium Listing</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/40 rounded-full px-4 py-1.5 text-yellow-300 text-sm font-medium">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            FEATURED LISTING
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Get More Customers<br />
            <span className="text-green-400">to Your Dispensary</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Stand out from hundreds of shops on KUSHMAP with a premium listing that puts your dispensary front and center.
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center space-y-3">
          <p className="text-gray-400 text-sm uppercase tracking-wider font-medium">Monthly Plan</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-black text-white">1,000</span>
            <span className="text-xl text-gray-400 font-medium">THB/mo</span>
          </div>
          <p className="text-gray-500 text-sm">Cancel anytime. No long-term commitment.</p>
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-lg bg-green-600/30 flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{b.title}</h3>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{b.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* What you get summary */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-white">What&apos;s included</h3>
          <ul className="space-y-2">
            {[
              'Top placement in search results and map',
              'Gold FEATURED badge on your listing',
              'Social media shoutout on launch',
              'Priority support via LINE',
              'Analytics dashboard (coming soon)',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <a
            href="https://line.me/ti/p/~@azg7040t"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-lg font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-green-500/25"
          >
            Contact via LINE
          </a>
          <p className="text-gray-500 text-sm">
            Or email us at{' '}
            <a href="mailto:hello@kushmap.app" className="text-green-400 hover:underline">
              hello@kushmap.app
            </a>
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-4 pb-8">
          <h2 className="font-bold text-white text-lg text-center">FAQ</h2>
          {[
            {
              q: 'How quickly will my listing go live?',
              a: 'Within 24 hours of payment confirmation, your shop will be featured.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Your premium features stay active until the end of your billing period.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'Bank transfer, PromptPay, and LINE Pay. We will send payment details after you contact us.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="font-semibold text-white text-sm">{q}</p>
              <p className="text-gray-400 text-sm mt-1">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
