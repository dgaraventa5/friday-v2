'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingContext } from '../onboarding-context';
import { ONBOARDING_COPY } from '@/lib/onboarding-copy';
import { SunLogo } from '@/components/auth/sun-logo';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function OnboardingWelcomePage() {
  const { progress, isLoading, advanceToStep, navigateToCurrentStep } = useOnboardingContext();
  const router = useRouter();

  // If user is resuming and already past welcome, redirect to their current step
  useEffect(() => {
    if (!isLoading && progress && progress.current_step !== 'welcome') {
      navigateToCurrentStep(progress.current_step);
    }
  }, [isLoading, progress, navigateToCurrentStep]);

  if (isLoading) return null;

  const handleStart = async () => {
    await advanceToStep('task_input');
    router.push('/onboarding/task');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
      <motion.div
        className="flex flex-col items-center text-center max-w-md"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <SunLogo size={48} />
        </motion.div>

        <motion.h1
          className="mt-8 text-2xl md:text-3xl font-bold lowercase text-slate-900 dark:text-slate-100"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.welcome.headline}
        </motion.h1>

        <motion.p
          className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.welcome.body}
        </motion.p>

        <motion.div
          className="mt-8"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Button size="lg" onClick={handleStart}>
            {ONBOARDING_COPY.welcome.cta}
          </Button>
        </motion.div>

        <motion.p
          className="mt-4 text-sm text-slate-400 dark:text-slate-500"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {ONBOARDING_COPY.welcome.time_hint}
        </motion.p>
      </motion.div>
    </div>
  );
}
