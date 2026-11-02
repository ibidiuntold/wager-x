'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LayoutSelector from '@/components/common/LayoutSelector';
import {
  Shield, Zap, Users, ArrowLeft, CheckCircle,
  TrendingUp, Globe, HeartHandshake, Lightbulb,
  Star, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: '50K+',  label: 'Registered Users' },
  { value: '₦2B+',  label: 'Total Wagered'     },
  { value: '99.9%', label: 'Uptime'             },
  { value: '24/7',  label: 'Support'            },
];

const pillars = [
  {
    icon: CheckCircle,
    color: 'bg-purple-600',
    title: 'Fair Play',
    desc: 'Peer-to-peer pools — the house never bets against you. Winners split exactly what losers staked, minus a small platform fee.',
  },
  {
    icon: Zap,
    color: 'bg-blue-600',
    title: 'Instant Payouts',
    desc: 'Winnings hit your wallet the moment a wager resolves. No manual reviews, no waiting periods for standard payouts.',
  },
  {
    icon: Users,
    color: 'bg-indigo-600',
    title: 'Community First',
    desc: 'Create wagers, invite friends, comment, react, and build a public prediction record. WagerX is social at its core.',
  },
];

const differentiators = [
  'Tailored for the Nigerian market — local sports, politics & entertainment',
  'Peer-to-peer model: you wager against other users, not the house',
  'State-of-the-art platform — fast, secure, works on any device',
  'Responsible gaming tools: deposit limits and self-exclusion',
  '24/7 support in multiple Nigerian languages',
  'Any topic: if you can predict it, you can wager on it',
];

const values = [
  {
    icon: Shield,
    accent: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    title: 'Integrity',
    desc: 'Transparent fee structures, public wager pools, honest communication — always.',
  },
  {
    icon: Globe,
    accent: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    title: 'Inclusion',
    desc: 'From Kano to Lagos, beginner to veteran — low minimums, local payment methods, local languages.',
  },
  {
    icon: Lightbulb,
    accent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    title: 'Innovation',
    desc: 'We ship fast, iterate constantly, and listen. The platform today is better than it was last month — guaranteed.',
  },
  {
    icon: HeartHandshake,
    accent: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    title: 'Responsibility',
    desc: 'Gambling can be harmful. Deposit limits, self-exclusion tools, and proactive outreach to at-risk users.',
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function AboutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [showAuth, setShowAuth] = useState(false);

  return (
    <LayoutSelector layoutType="main">
      <AuthModal isOpen={showAuth} initialMode="register" onClose={() => setShowAuth(false)} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600 pt-32 pb-24 px-4">
          {/* dot-grid decoration */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* back button */}
          <div className="relative z-10 max-w-5xl mx-auto mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-white/70 hover:text-white hover:bg-white/10 -ml-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-5 uppercase tracking-widest"
            >
              Est. 2024 · Lagos, Nigeria
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-5"
            >
              Nigeria's boldest<br className="hidden md:block" /> wagering platform
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-purple-100 text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
            >
              WagerX was built to bring the thrill of prediction, community, and
              reward to every Nigerian — from your first bet to your biggest win.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/wagers"
                className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-6 py-3 rounded-full hover:bg-purple-50 transition-colors shadow-lg"
              >
                Browse Wagers
                <Star className="h-4 w-4" />
              </Link>
              {!isAuthenticated && (
                <button
                  onClick={() => setShowAuth(true)}
                  className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/25 transition-colors border border-white/30"
                >
                  Create an Account
                </button>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center shadow-sm"
              >
                <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-20 space-y-20">

          {/* ── Our Story ──────────────────────────────────────────────────── */}
          <motion.section
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          >
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 block">Our Story</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
                  Built by Nigerians,<br />for Nigerians
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  Founded in 2024, WagerX set out to build something different —
                  a platform where <strong className="text-gray-900 dark:text-white">you bet against other people, not the house</strong>.
                  No hidden edges. No rigged odds. Just pure prediction, skill, and community.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  From a small team in Lagos, we grew rapidly because we built what Nigerians
                  actually wanted: a fast, transparent, and genuinely fun wagering experience
                  that works on any device and pays out instantly.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
                  <Award className="h-8 w-8 mb-3 opacity-80" />
                  <p className="font-bold text-lg">NLRC Licensed</p>
                  <p className="text-purple-200 text-sm mt-1">Fully regulated & compliant</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <TrendingUp className="h-8 w-8 mb-3 opacity-80" />
                  <p className="font-bold text-lg">Growing Fast</p>
                  <p className="text-blue-200 text-sm mt-1">50K+ users and counting</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white col-span-2">
                  <Users className="h-8 w-8 mb-3 opacity-80" />
                  <p className="font-bold text-lg">Community-Powered</p>
                  <p className="text-indigo-200 text-sm mt-1">Every wager is created by users, resolved by creators</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Mission + Pillars ──────────────────────────────────────────── */}
          <section>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center mb-12"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 block">Our Mission</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                Fair, transparent, and accessible wagering
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                We believe the best wager is one where the playing field is level — where your
                knowledge and instinct determine your outcome, not a bookmaker's margin.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    custom={i}
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-7 shadow-sm"
                  >
                    <div className={`w-11 h-11 ${p.color} rounded-xl flex items-center justify-center mb-5`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{p.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{p.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ── What Sets Us Apart ─────────────────────────────────────────── */}
          <motion.section
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-12 shadow-sm"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 block">What Sets Us Apart</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
              Built different, by design
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {differentiators.map((d, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{d}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── Our Values ─────────────────────────────────────────────────── */}
          <section>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="text-center mb-12"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 block">Our Values</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                What we stand for
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-5">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  custom={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                  className="flex gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm"
                >
                  <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${v.accent}`}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{v.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── Community + Compliance ─────────────────────────────────────── */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-7 shadow-sm"
            >
              <HeartHandshake className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Community Engagement</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                WagerX sponsors grassroots football tournaments across six Nigerian states, funds
                coding bootcamps through the <strong className="text-gray-900 dark:text-white">WagerX Tech Fund</strong>, and partners
                with the NLRC on national responsible-gaming awareness campaigns.
              </p>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              custom={1}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-7 shadow-sm"
            >
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Regulatory Compliance</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Fully licensed by the <strong className="text-gray-900 dark:text-white">National Lottery Regulatory Commission (NLRC)</strong>{' '}
                under licence <strong className="text-gray-900 dark:text-white">NLRC/WG/0123/2024</strong>. Quarterly audits, published
                compliance reports, and strict adherence to all applicable Nigerian law.
              </p>
            </motion.div>
          </div>

          {/* ── Looking Ahead ──────────────────────────────────────────────── */}
          <motion.section
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 border border-gray-700 rounded-3xl p-8 md:p-12"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3 block">Looking Ahead</span>
            <h2 className="text-3xl font-extrabold text-white mb-5">What's coming...</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Live In-Play Wagering', icon: Zap },
                { label: 'Native Mobile App', icon: TrendingUp },
                { label: 'Fantasy Sports', icon: Star },
                { label: 'WagerX Leagues', icon: Award },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <Icon className="h-5 w-5 text-purple-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-200">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <motion.section
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 p-10 md:p-16 text-center"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold text-white mb-4">
                Ready to join the community?
              </h2>
              <p className="text-purple-100 mb-8 max-w-md mx-auto leading-relaxed">
                Over 50,000 Nigerians are already predicting, winning, and having fun on WagerX.
                Your turn.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/wagers"
                  className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-8 py-3 rounded-full hover:bg-purple-50 transition-colors shadow-lg"
                >
                  Browse Wagers
                </Link>
                {!isAuthenticated && (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/25 transition-colors border border-white/30"
                  >
                    Create an Account
                  </button>
                )}
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </LayoutSelector>
  );
}
