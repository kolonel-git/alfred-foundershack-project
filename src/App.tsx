/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  AlertCircle,
  CheckCircle2, 
  Circle, 
  Moon, 
  Footprints, 
  Calendar, 
  Settings, 
  History, 
  BarChart3, 
  Plus, 
  ArrowRight, 
  ChevronRight, 
  Lock, 
  X, 
  Bolt, 
  Smile, 
  Heart, 
  Bell, 
  MapPin, 
  BookOpen, 
  Activity, 
  Sun,
  Rocket,
  Menu,
  Home,
  MessageSquare,
  Sparkles,
  Filter,
  SortAsc,
  Tag,
  Trash2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI, GenerateContentParameters } from "@google/genai";

async function callGenAI(params: GenerateContentParameters, maxRetries = 3): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response.text || "";
    } catch (error: any) {
      lastError = error;
      // Check if it's a 429 error
      const errorStr = JSON.stringify(error);
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, i) * 1000;
        console.warn(`Gemini API rate limited (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // If it's not a 429, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
import { Priority, UserProfile, Task, DailyMetrics } from './types';

// --- Mock Data ---
const INITIAL_PROFILE: UserProfile = {
  name: '',
  role: '',
  priorities: [],
  onboarded: false,
  checkInCompleted: false,
  lastCheckInDate: '',
};

const MOCK_METRICS: DailyMetrics = {
  steps: 1200,
  stepGoal: 8000,
  sleepHours: 6,
  sleepMinutes: 1,
  mood: undefined,
};

const MOCK_UPCOMING = [
  { id: '1', title: 'MATH1062 Assignment', date: 'Oct 24', time: '11:59 PM', detail: 'Submit via Canvas Portal', status: 'Due soon' },
  { id: '2', title: 'ELEC Lecture: Circuits II', date: 'Oct 25', time: '10:00 AM', detail: 'Engineering Building, Hall B' },
];

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  onClick, 
  icon: Icon,
  disabled
}: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: 'primary' | 'secondary' | 'tertiary' | 'black'; 
  onClick?: () => void | Promise<void>;
  icon?: any;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-primary text-on-primary shadow-md shadow-primary/10',
    secondary: 'bg-surface-container-highest text-on-surface',
    tertiary: 'bg-primary/10 text-primary',
    black: 'bg-on-surface text-surface shadow-md shadow-black/5',
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-12 px-6 rounded-full font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        className
      )}
    >
      {children}
      {Icon && <Icon className="w-4 h-4" />}
    </button>
  );
};

const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  badge, 
  color = 'primary',
  progress
}: { 
  icon: any; 
  label: string; 
  value: string; 
  subValue?: string; 
  badge?: string; 
  color?: 'primary' | 'secondary' | 'tertiary' | 'error';
  progress?: number;
}) => {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    error: 'bg-error-container/10 text-error',
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col justify-between aspect-square hover:bg-surface-container-low transition-colors group border border-surface-container shadow-sm">
      <div className="flex justify-between items-start">
        <div className={cn('p-1.5 rounded-lg', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="text-error font-bold text-[9px] flex items-center gap-1 bg-error-container/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
            {badge} <X className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <div>
        <p className="font-label text-on-surface-variant uppercase tracking-widest text-[9px] mb-0.5">{label}</p>
        <p className="font-headline font-extrabold text-xl">
          {value} {subValue && <span className="text-on-surface-variant font-medium text-xs">{subValue}</span>}
        </p>
        {progress !== undefined && (
          <div className="flex gap-1 mt-2">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  'h-1 w-full rounded-full', 
                  i < Math.ceil(progress * 4) ? `bg-${color}-container` : 'bg-surface-container-highest'
                )} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Screens ---

const Onboarding = ({ onNext }: { onNext: () => void }) => {
  const [step, setStep] = useState(0);
  
  const content = [
    {
      title: 'Meet Alfred.',
      description: 'One morning ritual. Your full context — sleep, steps, deadlines, energy — turned into 5 tasks you can actually do today.',
      color: 'bg-[#FFF2EF]',
      icon: Smile,
      accentIcons: [Moon, Bolt],
    },
    {
      title: 'Stop switching between 5 apps.',
      description: 'Gmail. Calendar. Apple Health. Notion. Todoist. None of them talk to each other. Alfred does.',
      color: 'bg-[#FFFBF0]',
      icon: Lock,
      accentIcons: [CheckCircle2, Calendar],
    },
    {
      title: '30 seconds. Perfect day.',
      description: 'One check-in each morning. Alfred reads your sleep, your schedule, your energy — and tells you exactly what to focus on.',
      color: 'bg-[#F2F2FD]',
      icon: CheckCircle2,
      accentIcons: [Bolt, Heart],
    }
  ];

  const current = content[step];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('h-screen w-full flex flex-col', current.color)}
    >
      <div className="flex justify-end p-6 z-10">
        <button onClick={onNext} className="font-label font-bold text-sm text-secondary hover:opacity-70 transition-opacity uppercase tracking-widest">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="relative w-full max-w-[280px] aspect-square mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-secondary-fixed opacity-20 rounded-2xl rotate-3" />
          <div className="absolute inset-4 bg-secondary-fixed opacity-30 rounded-xl -rotate-6" />
          <div className="relative w-32 h-32 bg-secondary rounded-full flex items-center justify-center shadow-xl">
            <current.icon className="w-16 h-16 text-on-secondary" />
          </div>
          {current.accentIcons.map((Icon, i) => (
            <div 
              key={i}
              className={cn(
                'absolute bg-surface-container-lowest p-3 rounded-xl shadow-lg border border-secondary-fixed/20',
                i === 0 ? 'top-4 right-4 -rotate-12' : 'bottom-4 left-2 rotate-6'
              )}
            >
              <Icon className="w-5 h-5 text-secondary" />
            </div>
          ))}
        </div>

        <div className="space-y-4 text-center max-w-sm">
          <h1 className="font-headline font-extrabold text-2xl leading-tight text-on-surface tracking-tight">
            {current.title}
          </h1>
          <p className="font-body text-on-surface-variant text-sm leading-relaxed">
            {current.description}
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {content.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-secondary' : 'w-2 bg-secondary-fixed'
              )} 
            />
          ))}
        </div>
        <Button 
          className="w-full" 
          onClick={() => step < 2 ? setStep(step + 1) : onNext()}
          icon={ArrowRight}
        >
          {step === 2 ? 'Get Started' : 'Continue'}
        </Button>
      </div>
    </motion.div>
  );
};

const Setup = ({ onNext }: { onNext: (profile: Partial<UserProfile>) => void }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Working Professional');
  const [priorities, setPriorities] = useState<Priority[]>(['Academics', 'Mental Health']);

  const roles = ['Student', 'Working Professional', 'Freelancer', 'Stay-at-home', 'Other'];
  const priorityOptions: { label: string; value: Priority; icon: any }[] = [
    { label: 'Study & deadlines', value: 'Academics', icon: BookOpen },
    { label: 'Sleep & recovery', value: 'Sleep', icon: Moon },
    { label: 'Fitness & movement', value: 'Fitness', icon: Activity },
    { label: 'Mental wellbeing', value: 'Mental Health', icon: Heart },
    { label: 'Staying on schedule', value: 'Schedule', icon: Calendar },
  ];

  const togglePriority = (p: Priority) => {
    setPriorities(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen flex flex-col bg-surface"
    >
      <header className="w-full px-6 pt-6 pb-2 sticky top-0 bg-surface z-10">
        <div className="segmented-progress h-1.5 w-full max-w-md mx-auto">
          <div className="h-full rounded-full bg-tertiary-container" />
          <div className="h-full rounded-full bg-surface-container-highest" />
          <div className="h-full rounded-full bg-surface-container-highest" />
          <div className="h-full rounded-full bg-surface-container-highest" />
        </div>
      </header>

      <main className="flex-grow px-6 pb-24 max-w-md mx-auto w-full">
        <section className="mt-6 mb-8">
          <h1 className="font-headline font-extrabold text-3xl leading-tight tracking-tight text-on-surface">
            First, a little about you.
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-[90%]">
            This helps Alfred understand your life right away.
          </p>
        </section>

        <div className="space-y-8">
          <div className="space-y-2">
            <label className="font-headline font-bold text-base block px-1">Name</label>
            <input 
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-base placeholder:text-outline-variant text-on-surface"
              placeholder="What should Alfred call you?"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="font-headline font-bold text-base block px-1">Primary Role</label>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <button 
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'px-4 py-2 rounded-full font-bold transition-all text-xs',
                    role === r ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-headline font-bold text-base block px-1">Priorities</label>
            <div className="grid grid-cols-1 gap-2">
              {priorityOptions.map(opt => (
                <div 
                  key={opt.value}
                  onClick={() => togglePriority(opt.value)}
                  className={cn(
                    'group flex items-center justify-between p-4 rounded-xl border-2 border-transparent transition-all cursor-pointer',
                    priorities.includes(opt.value) ? 'bg-surface-container-lowest shadow-sm border-primary/10' : 'bg-surface-container-low hover:bg-surface-container-lowest'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <opt.icon className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm text-on-surface">{opt.label}</span>
                  </div>
                  {priorities.includes(opt.value) ? (
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary text-white" />
                  ) : (
                    <Plus className="w-5 h-5 text-outline-variant" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 glass-nav flex flex-col items-center">
        <Button 
          className="w-full max-w-md" 
          onClick={() => onNext({ name, role, priorities })}
          icon={ArrowRight}
        >
          Continue
        </Button>
        <div className="mt-3 w-24 h-1 bg-on-surface/10 rounded-full" />
      </footer>
    </motion.div>
  );
};

const Permissions = ({ onNext }: { onNext: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen flex flex-col bg-surface"
    >
      <header className="fixed top-0 w-full z-50 glass-nav flex justify-between items-center px-6 py-3">
        <span className="text-2xl font-black text-on-surface uppercase tracking-tighter">Alfred</span>
        <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
          <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" />
        </div>
      </header>

      <main className="flex-1 mt-20 px-6 pb-24 max-w-md mx-auto w-full">
        <div className="mb-8">
          <div className="segmented-progress h-1.5 w-full">
            <div className="bg-tertiary-container rounded-full" />
            <div className="bg-tertiary-container rounded-full" />
            <div className="bg-surface-container-high rounded-full" />
            <div className="bg-surface-container-high rounded-full" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mt-3 opacity-60">Step 2 of 4</p>
        </div>

        <div className="mb-8">
          <h1 className="font-headline font-extrabold text-3xl leading-tight tracking-tight mb-2">
            Alfred needs a few things.
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-xs">
            We only ask for what's actually useful. You can change these any time in Settings.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { title: 'Calendar Access', desc: 'Sync your schedule and tasks', icon: Calendar, color: 'bg-tertiary-container/20 text-tertiary', active: true },
            { title: 'Health & Activity', desc: 'Track your daily movement goals', icon: Heart, color: 'bg-secondary-container/20 text-secondary', active: false },
            { title: 'Notifications', desc: 'Timely nudges for your tasks', icon: Bell, color: 'bg-primary-container/20 text-primary', active: false },
            { title: 'Location', desc: 'Smart context-aware reminders', icon: MapPin, color: 'bg-secondary-container/20 text-secondary', active: false, optional: true },
          ].map((p, i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between group transition-all active:scale-[0.98] border border-surface-container shadow-sm">
              <div className="flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', p.color)}>
                  <p.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-headline font-bold text-sm">{p.title}</h3>
                    {p.optional && <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-[8px] font-bold uppercase tracking-wider text-on-surface-variant">Optional</span>}
                  </div>
                  <p className="font-body text-[11px] text-on-surface-variant">{p.desc}</p>
                </div>
              </div>
              <div className={cn('w-10 h-6 rounded-full flex items-center px-0.5 transition-colors', p.active ? 'bg-primary' : 'bg-surface-container-high')}>
                <div className={cn('w-5 h-5 rounded-full bg-white shadow-sm transition-transform', p.active ? 'translate-x-4' : 'translate-x-0')} />
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="fixed bottom-0 w-full px-6 pb-8 pt-4 bg-gradient-to-t from-surface via-surface/90 to-transparent flex flex-col items-center gap-4">
        <Button className="w-full max-w-md" onClick={onNext} icon={ArrowRight}>
          Continue
        </Button>
        <div className="flex items-center gap-2 opacity-50">
          <Lock className="w-3.5 h-3.5" />
          <p className="font-label text-[9px] font-bold uppercase tracking-widest">All data stays on-device by default.</p>
        </div>
      </footer>
    </motion.div>
  );
};

const Success = ({ name, onNext }: { name: string; onNext: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-between pt-12 pb-8 px-6 max-w-md mx-auto bg-surface"
    >
      <div className="w-full flex justify-center items-end h-24 relative mb-6">
        <div className="flex items-end gap-2 translate-y-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white -rotate-12 shadow-md">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-white -translate-y-4 shadow-lg">
            <Sun className="w-6 h-6 fill-white" />
          </div>
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white -translate-y-6 shadow-xl scale-110">
            <Rocket className="w-7 h-7 fill-white" />
          </div>
          <div className="w-12 h-12 rounded-full bg-[#ec4899] flex items-center justify-center text-white -translate-y-4 shadow-lg">
            <Smile className="w-6 h-6 fill-white" />
          </div>
          <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white rotate-12 shadow-md">
            <Bolt className="w-5 h-5 fill-white" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl font-headline font-extrabold leading-tight tracking-tight text-on-surface">
          You're all set, <span className="text-primary">{name || 'Alex'}</span>.
        </h1>
        <p className="text-on-surface-variant text-base max-w-[240px] mx-auto leading-relaxed">
          Here's what your morning looks like. Let's make it real.
        </p>
      </div>

      <div className="w-full bg-surface-container-low rounded-2xl p-5 space-y-5 relative overflow-hidden shadow-xl border border-white/40">
        <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center gap-3 shadow-sm border border-surface-container">
          <div className="w-10 h-10 bg-tertiary-container/20 rounded-full flex items-center justify-center">
            <Sun className="w-5 h-5 text-tertiary fill-tertiary" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest">Daily Focus</p>
            <p className="text-on-surface font-bold text-sm">Morning Check-In</p>
          </div>
          <ChevronRight className="ml-auto w-4 h-4 text-outline-variant" />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-md border-2 border-primary/20" />
            <span className="text-on-surface font-bold text-sm">Hydration Goal: 500ml</span>
            <span className="ml-auto text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">8:30 AM</span>
          </div>
          <div className="flex items-center gap-4 opacity-60">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-on-surface line-through text-sm font-medium">Deep Breathing (5 min)</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['Energy 84%', 'Focus High', 'Tasks 3/8'].map((m, i) => (
            <div key={i} className="bg-surface-container p-2 rounded-xl text-center border border-surface-container-highest/10">
              <p className="text-[8px] text-on-surface-variant font-bold uppercase tracking-tight">{m.split(' ')[0]}</p>
              <p className="text-sm font-headline font-extrabold text-primary">{m.split(' ')[1]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full pt-6">
        <button 
          onClick={onNext}
          className="w-full h-12 rounded-full bg-gradient-to-r from-secondary via-tertiary to-primary text-white font-headline font-bold text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          Open Alfred
          <Rocket className="w-5 h-5" />
        </button>
        <p className="text-center mt-4 text-on-surface-variant text-xs font-medium tracking-tight opacity-50">
          Setup complete • Syncing your preferences
        </p>
      </div>
    </motion.div>
  );
};

const CheckInModal = ({ 
  onClose, 
  onAccept, 
  profile 
}: { 
  onClose: () => void; 
  onAccept: (tasks: Task[], focus: Priority) => void;
  profile: UserProfile;
}) => {
  const [step, setStep] = useState(0);
  const [selectedFocus, setSelectedFocus] = useState<Priority>(profile.focusArea || profile.priorities[0] || 'Academics');
  const [mood, setMood] = useState<string | null>(null);
  const [journal, setJournal] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const priorityOptions: { label: string; value: Priority; icon: any }[] = [
    { label: 'Study & deadlines', value: 'Academics', icon: BookOpen },
    { label: 'Sleep & recovery', value: 'Sleep', icon: Moon },
    { label: 'Fitness & movement', value: 'Fitness', icon: Activity },
    { label: 'Mental wellbeing', value: 'Mental Health', icon: Heart },
    { label: 'Staying on schedule', value: 'Schedule', icon: Calendar },
  ];

  const generateTasks = async (focus: Priority) => {
    setLoading(true);
    try {
      const prompt = `Generate 4-5 specific, actionable tasks for a ${profile.role} named ${profile.name} for today. 
      Their main focus today is ${focus}. 
      Their general priorities are ${profile.priorities.join(', ')}.
      They are currently feeling ${mood || 'neutral'}.
      ${journal ? `They wrote this in their journal: "${journal}"` : ''}
      Return the tasks as a JSON array of objects with 'title' and 'category' (one of: Academics, Fitness, Sleep, Mental Health, Schedule).
      Example: [{"title": "Complete 2 modules of ELEC tutorial", "category": "Academics"}]`;
      
      const text = await callGenAI({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const tasksData = JSON.parse(text || "[]");
      const formattedTasks = tasksData.map((t: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: t.title,
        category: t.category as Priority,
        completed: false,
        suggested: true
      }));
      
      setSuggestedTasks(formattedTasks);
      setSelectedTaskIds(new Set(formattedTasks.map((t: any) => t.id)));

      // Generate insight too
      const insightText = await callGenAI({
        model: "gemini-3-flash-preview",
        contents: `Generate a short, encouraging 1-sentence insight for ${profile.name} based on their focus: ${focus}, mood: ${mood || 'neutral'}, and journal entry: "${journal || 'N/A'}".`,
      });
      setInsight(insightText || "Focusing on your goals today will bring clarity and progress.");
      
      setStep(3); // Go to final step
    } catch (e) {
      console.error(e);
      // Fallback
      const fallbackTasks = [
        { id: '1', title: `Focus on ${focus} goals`, category: focus, completed: false, suggested: true },
        { id: '2', title: 'Quick 15min walk', category: 'Fitness', completed: false, suggested: true },
        { id: '3', title: 'Review tomorrow\'s schedule', category: 'Schedule', completed: false, suggested: true },
        { id: '4', title: 'Wind down by 10pm', category: 'Sleep', completed: false, suggested: true },
      ];
      setSuggestedTasks(fallbackTasks);
      setSelectedTaskIds(new Set(fallbackTasks.map(t => t.id)));
      setInsight("Let's make today count by staying focused on what matters most.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const swapTask = async (taskId: string) => {
    setSwappingId(taskId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const taskToReplace = suggestedTasks.find(t => t.id === taskId);
      const prompt = `Generate ONE new actionable task to replace "${taskToReplace?.title}" for a ${profile.role} focusing on ${selectedFocus}.
      Return as a JSON object with 'title' and 'category'.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const newTaskData = JSON.parse(response.text || "{}");
      const newId = Math.random().toString(36).substr(2, 9);
      
      setSuggestedTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        id: newId,
        title: newTaskData.title || "New task",
        category: (newTaskData.category as Priority) || selectedFocus
      } : t));

      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) {
          next.delete(taskId);
          next.add(newId);
        }
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSwappingId(null);
    }
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === suggestedTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(suggestedTasks.map(t => t.id)));
    }
  };

  const handleAccept = () => {
    const finalTasks = suggestedTasks.filter(t => selectedTaskIds.has(t.id));
    onAccept(finalTasks, selectedFocus);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-50 flex flex-col bg-surface rounded-t-xl shadow-2xl overflow-hidden"
    >
      <div className="w-full flex justify-center py-4">
        <div className="w-12 h-1.5 bg-surface-container rounded-full" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="mt-4">
                <h2 className="text-2xl font-headline font-bold text-on-surface leading-tight">What's your focus today?</h2>
                <p className="text-on-surface-variant text-sm font-medium mt-1">Alfred will tailor your tasks to this area.</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {priorityOptions.map(opt => (
                  <div 
                    key={opt.value}
                    onClick={() => setSelectedFocus(opt.value)}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer',
                      selectedFocus === opt.value ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface-container-low border-transparent hover:bg-surface-container-lowest'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon className={cn('w-5 h-5', selectedFocus === opt.value ? 'text-primary' : 'text-outline-variant')} />
                      <span className={cn('font-bold text-sm', selectedFocus === opt.value ? 'text-on-surface' : 'text-on-surface-variant')}>{opt.label}</span>
                    </div>
                    {selectedFocus === opt.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="mt-4">
                <h2 className="text-2xl font-headline font-bold text-on-surface leading-tight">How are you feeling, {profile.name}?</h2>
                <p className="text-on-surface-variant text-sm font-medium mt-1">Checking in with yourself is the first step to a great day.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Energized', icon: Rocket, color: 'text-primary' },
                  { label: 'Focused', icon: Target, color: 'text-secondary' },
                  { label: 'Stressed', icon: Activity, color: 'text-error' },
                  { label: 'Tired', icon: Moon, color: 'text-tertiary' },
                  { label: 'Calm', icon: Sun, color: 'text-primary' },
                  { label: 'Overwhelmed', icon: AlertCircle, color: 'text-error' },
                ].map(m => (
                  <button 
                    key={m.label}
                    onClick={() => setMood(m.label)}
                    className={cn(
                      'flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3',
                      mood === m.label ? 'bg-surface-container-highest border-primary shadow-md' : 'bg-surface-container-low border-transparent hover:bg-surface-container-lowest'
                    )}
                  >
                    <m.icon className={cn('w-8 h-8', mood === m.label ? m.color : 'text-outline-variant')} />
                    <span className={cn('font-bold text-sm', mood === m.label ? 'text-on-surface' : 'text-on-surface-variant')}>{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="mt-4">
                <h2 className="text-2xl font-headline font-bold text-on-surface leading-tight">Here's your plan. ✓</h2>
                <p className="text-on-surface-variant text-sm font-medium mt-1">Focus: <span className="text-primary font-bold">{selectedFocus}</span></p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Suggested Tasks</span>
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest"
                  >
                    {selectedTaskIds.size === suggestedTasks.length ? 'Deselect All' : 'Select All'}
                    <div className={cn(
                      'w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center',
                      selectedTaskIds.size === suggestedTasks.length ? 'bg-primary border-primary' : 'border-outline-variant'
                    )}>
                      {selectedTaskIds.size === suggestedTasks.length && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                </div>

                {suggestedTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={cn(
                      "p-3 rounded-xl bg-surface-container-lowest flex items-center justify-between shadow-sm border transition-all cursor-pointer",
                      selectedTaskIds.has(task.id) ? "border-primary/30 ring-1 ring-primary/10" : "border-surface-container"
                    )}
                    onClick={() => toggleTaskSelection(task.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 mr-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                        selectedTaskIds.has(task.id) ? "bg-primary border-primary" : "border-outline-variant"
                      )}>
                        {selectedTaskIds.has(task.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface leading-tight">{task.title}</span>
                        <span className="text-[9px] font-bold text-outline-variant uppercase tracking-wider">{task.category}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        swapTask(task.id);
                      }}
                      disabled={swappingId === task.id}
                      className="p-1.5 rounded-full hover:bg-surface-container-high text-outline-variant transition-colors disabled:opacity-50"
                    >
                      {swappingId === task.id ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <History className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-primary-container/10 relative overflow-hidden border border-primary/5">
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bolt className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-[10px] font-bold uppercase text-primary tracking-widest">Alfred Insight</span>
                  </div>
                  <p className="text-sm leading-relaxed text-on-primary-container italic">"{insight}"</p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-surface/90 backdrop-blur-md flex flex-col gap-2 border-t border-surface-container">
        {step === 0 ? (
          <Button 
            className="w-full" 
            onClick={() => setStep(1)} 
            icon={ArrowRight}
          >
            Next
          </Button>
        ) : step === 1 ? (
          <Button 
            className="w-full" 
            onClick={() => generateTasks(selectedFocus)} 
            icon={ArrowRight}
            disabled={!mood}
          >
            Continue
          </Button>
        ) : (
          <Button 
            className="w-full" 
            variant="black" 
            onClick={handleAccept} 
            icon={Bolt}
            disabled={selectedTaskIds.size === 0}
          >
            Accept {selectedTaskIds.size > 0 ? `(${selectedTaskIds.size})` : ''}
          </Button>
        )}
        <button onClick={onClose} className="w-full h-10 text-on-surface-variant font-bold text-sm hover:text-on-surface transition-colors uppercase tracking-widest">
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

const TasksScreen = ({ 
  tasks, 
  toggleTask, 
  onAddTask,
  onClearCompleted
}: { 
  tasks: Task[]; 
  toggleTask: (id: string) => void; 
  onAddTask: () => void;
  onClearCompleted: () => void;
}) => {
  const [filterCategory, setFilterCategory] = useState<Priority | 'All'>('All');
  const [filterTag, setFilterTag] = useState<string | 'All'>('All');
  const [sortBy, setSortBy] = useState<'title' | 'category' | 'none'>('none');
  const [showFilters, setShowFilters] = useState(false);

  const completedCount = tasks.filter(t => t.completed).length;

  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));
  const categories: Priority[] = ['Academics', 'Fitness', 'Sleep', 'Mental Health', 'Schedule'];

  const filteredTasks = tasks
    .filter(t => filterCategory === 'All' || t.category === filterCategory)
    .filter(t => filterTag === 'All' || (t.tags && t.tags.includes(filterTag)))
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });
  
  return (
    <div className="space-y-6 pb-24">
      <section className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold leading-none tracking-tight text-on-surface font-headline">
            Tasks
          </h1>
          <div className="flex items-center gap-2">
            {completedCount > 0 && (
              <button 
                onClick={onClearCompleted}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error rounded-full text-[10px] font-bold hover:bg-error/20 transition-colors"
                title="Clear completed tasks"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Done
              </button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-full transition-colors',
                showFilters ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
              )}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-on-surface-variant font-medium text-sm">
          {tasks.length > 0 ? `${tasks.length - completedCount} items left to tackle.` : 'No tasks yet. Start your check-in!'}
        </p>
      </section>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4 bg-surface-container-low p-4 rounded-2xl border border-surface-container"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Filter by Category</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFilterCategory('All')}
                  className={cn('px-3 py-1 rounded-full text-[10px] font-bold', filterCategory === 'All' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-surface-container')}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn('px-3 py-1 rounded-full text-[10px] font-bold', filterCategory === cat ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-surface-container')}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Filter by Tag</label>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setFilterTag('All')}
                    className={cn('px-3 py-1 rounded-full text-[10px] font-bold', filterTag === 'All' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-surface-container')}
                  >
                    All
                  </button>
                  {allTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={cn('px-3 py-1 rounded-full text-[10px] font-bold', filterTag === tag ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-surface-container')}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Sort by</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSortBy(sortBy === 'title' ? 'none' : 'title')}
                  className={cn('flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold', sortBy === 'title' ? 'bg-secondary text-white' : 'bg-white text-on-surface-variant border border-surface-container')}
                >
                  <SortAsc className="w-3 h-3" />
                  Title
                </button>
                <button 
                  onClick={() => setSortBy(sortBy === 'category' ? 'none' : 'category')}
                  className={cn('flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold', sortBy === 'category' ? 'bg-secondary text-white' : 'bg-white text-on-surface-variant border border-surface-container')}
                >
                  <SortAsc className="w-3 h-3" />
                  Category
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => toggleTask(task.id)}
            className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 group transition-all active:scale-98 shadow-sm cursor-pointer border border-surface-container"
          >
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center transition-all',
              task.completed ? 'bg-primary' : 'border-2 border-outline-variant'
            )}>
              {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={cn('font-bold text-sm text-on-surface', task.completed && 'line-through opacity-40')}>
                  {task.title}
                </p>
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter',
                  task.category === 'Academics' ? 'bg-primary/10 text-primary' :
                  task.category === 'Fitness' ? 'bg-tertiary/10 text-tertiary' :
                  task.category === 'Sleep' ? 'bg-primary-container/30 text-on-primary-container' :
                  'bg-secondary-container/50 text-on-secondary-container'
                )}>
                  {task.category}
                </span>
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {task.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded text-[8px] font-bold">
                      <Tag className="w-2 h-2" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        <button 
          onClick={onAddTask}
          className="w-full p-4 rounded-xl border-2 border-dashed border-outline-variant/30 flex items-center justify-center gap-2 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Custom Task
        </button>
      </div>
    </div>
  );
};

const ConnectScreen = () => {
  const [integrations, setIntegrations] = useState([
    { name: 'Google Calendar', status: 'Connected', icon: Calendar, color: 'text-blue-500', syncing: false },
    { name: 'Apple Health', status: 'Connected', icon: Heart, color: 'text-red-500', syncing: false },
    { name: 'Gmail', status: 'Not Connected', icon: Bell, color: 'text-gray-400', syncing: false },
    { name: 'Notion', status: 'Not Connected', icon: BookOpen, color: 'text-gray-400', syncing: false },
  ]);

  const handleConnect = (index: number) => {
    setIntegrations(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      if (item.status === 'Connected') {
        // Start syncing simulation
        setTimeout(() => {
          setIntegrations(current => current.map((it, idx) => 
            idx === index ? { ...it, syncing: false } : it
          ));
        }, 2000);
        return { ...item, syncing: true };
      } else {
        // Connect simulation
        return { 
          ...item, 
          status: 'Connected', 
          color: index === 2 ? 'text-red-500' : (index === 3 ? 'text-black' : item.color) 
        };
      }
    }));
  };

  return (
    <div className="space-y-6 pb-24">
      <section className="space-y-1">
        <h1 className="text-3xl font-extrabold leading-none tracking-tight text-on-surface font-headline">
          Connect
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">Alfred works best when he knows your world.</p>
      </section>

      <div className="grid grid-cols-1 gap-3">
        {integrations.map((item, i) => (
          <div key={i} className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between shadow-sm border border-surface-container">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-full bg-surface-container flex items-center justify-center', item.color)}>
                {item.syncing ? <Activity className="w-5 h-5 animate-spin" /> : <item.icon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">{item.name}</h3>
                <p className={cn('text-[10px] font-bold uppercase tracking-widest', item.status === 'Connected' ? 'text-primary' : 'text-outline-variant')}>
                  {item.syncing ? 'Syncing...' : item.status}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleConnect(i)}
              disabled={item.syncing}
              className={cn(
                'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all',
                item.status === 'Connected' ? 'bg-surface-container-high text-on-surface' : 'bg-primary text-white'
              )}
            >
              {item.status === 'Connected' ? (item.syncing ? 'Wait' : 'Sync') : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MeScreen = ({ profile, tasks }: { profile: UserProfile; tasks: Task[] }) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);

  useEffect(() => {
    const generateMeInsight = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const prompt = `Based on ${profile.name}'s profile (Role: ${profile.role}, Focus: ${profile.focusArea}) and their progress today (${completedCount} tasks completed), provide a short, 1-sentence personalized growth insight or tip.`;
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        setInsight(response.text || "Keep pushing towards your goals!");
      } catch (e) {
        console.error(e);
        setInsight("Consistency is the key to long-term success.");
      } finally {
        setLoading(false);
      }
    };
    generateMeInsight();
  }, [profile.name, profile.role, profile.focusArea, completedCount]);
  
  return (
    <div className="space-y-6 pb-24">
      <section className="space-y-1">
        <h1 className="text-3xl font-extrabold leading-none tracking-tight text-on-surface font-headline">
          Me
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">Your growth, at a glance.</p>
      </section>

      <div className="bg-primary-container/10 p-6 rounded-2xl space-y-5 border border-primary/5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
            <img src={`https://picsum.photos/seed/${profile.name}/200/200`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{profile.name}</h2>
            <p className="text-sm text-on-surface-variant font-medium">{profile.role}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Growth Metrics</h3>
            <button onClick={() => setShowMetrics(!showMetrics)} className="text-primary text-[10px] font-bold uppercase tracking-widest">
              {showMetrics ? 'Hide' : 'Show'}
            </button>
          </div>
          {showMetrics && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-surface-container">
                <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest">Streak</p>
                <p className="text-xl font-bold text-primary">12 Days</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-surface-container">
                <p className="text-[9px] font-bold text-outline-variant uppercase tracking-widest">Tasks Done</p>
                <p className="text-xl font-bold text-secondary">{completedCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="bg-surface-container-low p-5 rounded-2xl border border-surface-container space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Alfred's Growth Tip</h3>
        </div>
        {loading ? (
          <div className="h-12 flex items-center gap-2">
            <Activity className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-on-surface-variant">Analyzing your progress...</span>
          </div>
        ) : (
          <p className="text-sm text-on-surface leading-relaxed italic">"{insight}"</p>
        )}
      </section>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-on-surface">Your Priorities</h3>
        <div className="flex flex-wrap gap-2">
          {profile.priorities.map(p => (
            <span key={p} className="px-3 py-1.5 bg-surface-container-low rounded-full text-xs font-bold text-on-surface border border-surface-container">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsScreen = ({ 
  profile, 
  onClose, 
  onUpdate,
  onSignOut
}: { 
  profile: UserProfile; 
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => void;
  onSignOut: () => void;
}) => {
  const [name, setName] = useState(profile.name);
  
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-[100] bg-surface flex flex-col"
    >
      <header className="px-6 py-4 flex items-center justify-between border-b border-surface-container bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-surface-container rounded-full transition-colors">
          <X className="w-5 h-5 text-on-surface" />
        </button>
        <h2 className="text-base font-bold text-on-surface">Settings</h2>
        <button 
          onClick={() => {
            onUpdate({ name });
            onClose();
          }}
          className="text-primary font-bold text-sm px-2 py-1 hover:bg-primary/5 rounded-lg transition-colors"
        >
          Save
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="space-y-3">
          <label className="font-bold text-sm text-on-surface px-1">Display Name</label>
          <input 
            className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-on-surface text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-on-surface px-1">Account</h3>
          <div className="bg-surface-container-low rounded-xl overflow-hidden">
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container-high transition-colors">
              <span className="text-sm text-on-surface">Notifications</span>
              <ChevronRight className="w-4 h-4 text-outline-variant" />
            </button>
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container-high transition-colors border-t border-surface-container">
              <span className="text-sm text-on-surface">Privacy & Security</span>
              <ChevronRight className="w-4 h-4 text-outline-variant" />
            </button>
          </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={onSignOut}
            className="w-full h-12 rounded-full bg-error-container/10 text-error font-bold text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ChatModal = ({ onClose, profile }: { onClose: () => void; profile: UserProfile }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Hi ${profile.name}! I'm Alfred, your personal assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const text = await callGenAI({
        model: "gemini-3-flash-preview",
        contents: [...history, { role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: `You are Alfred, a highly sophisticated and supportive personal assistant for ${profile.name}, who is a ${profile.role}. 
          Your goal is to help them stay productive, healthy, and focused. 
          Be concise, professional yet warm, and proactive. 
          If they seem stressed, offer support and suggest journaling or a break.
          If they ask about tasks, help them organize.
          Current focus: ${profile.focusArea || 'General productivity'}.`
        }
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: text || "I'm here to help." }]);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having a bit of trouble connecting right now. How else can I assist you?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-surface w-full max-w-md h-[80vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Smile className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">Alfred</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Always Active</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-5 h-5 text-outline-variant" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-surface-container-low text-on-surface rounded-tl-none border border-surface-container"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-primary">
              <Activity className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Alfred is thinking...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-container bg-surface">
          <div className="flex gap-2">
            <input 
              autoFocus
              className="flex-1 h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-on-surface text-sm"
              placeholder="Message Alfred..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AddTaskModal = ({ 
  onClose, 
  onAdd 
}: { 
  onClose: () => void; 
  onAdd: (title: string, category: Priority, tags: string[]) => void;
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Priority>('Academics');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const categories: Priority[] = ['Academics', 'Fitness', 'Sleep', 'Mental Health', 'Schedule'];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="bg-surface w-full max-w-md rounded-2xl p-6 space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-on-surface">Add Task</h2>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-5 h-5 text-outline-variant" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Task Title</label>
            <input 
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-bold transition-all',
                    category === cat ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Tags</label>
            <div className="flex gap-2">
              <input 
                className="flex-1 h-10 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-on-surface text-sm"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <button 
                onClick={handleAddTag}
                className="px-4 bg-surface-container-high text-on-surface rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button 
          className="w-full" 
          disabled={!title.trim()}
          onClick={() => {
            onAdd(title, category, tags);
            onClose();
          }}
        >
          Create Task
        </Button>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = ({ 
  profile, 
  onUpdateProfile,
  onSignOut
}: { 
  profile: UserProfile; 
  onUpdateProfile: (data: Partial<UserProfile>) => void;
  onSignOut: () => void;
}) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('alfred_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load tasks', e);
        return [];
      }
    }
    return [];
  });
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('today');

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (title: string, category: Priority, tags: string[]) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      completed: false,
      suggested: false,
      tags
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const clearCompletedTasks = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  useEffect(() => {
    localStorage.setItem('alfred_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (profile.checkInCompleted && suggestedTasks.length === 0) {
      const generateSuggestions = async () => {
        try {
          const prompt = `Generate 2 quick, low-effort "bonus" tasks for ${profile.name} (a ${profile.role}) that align with their focus on ${profile.focusArea}. 
          These should be small things they can do if they have extra time.
          Return as a JSON array of objects with 'title' and 'category'.`;
          
          const text = await callGenAI({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          
          const data = JSON.parse(text || "[]");
          setSuggestedTasks(data.map((t: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            title: t.title,
            category: t.category as Priority,
            completed: false,
            suggested: true
          })));
        } catch (e) {
          console.error("Failed to generate suggestions:", e);
        }
      };
      generateSuggestions();
    }
  }, [profile.checkInCompleted, profile.focusArea]);

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TasksScreen 
            tasks={tasks} 
            toggleTask={toggleTask} 
            onAddTask={() => setShowAddTask(true)} 
            onClearCompleted={clearCompletedTasks}
          />
        );
      case 'connect':
        return <ConnectScreen />;
      case 'me':
        return <MeScreen profile={profile} tasks={tasks} />;
      default:
        return (
          <div className="space-y-8 pb-24">
            <section className="space-y-1">
              <h1 className="text-3xl font-extrabold leading-none tracking-tight text-on-surface font-headline">
                Good morning, <br/>{profile.name || 'Alex'}
              </h1>
              <p className="text-on-surface-variant font-medium text-sm">Your day is taking shape beautifully.</p>
            </section>

            {!profile.checkInCompleted ? (
              <section className="relative">
                <div className="bg-primary text-on-primary rounded-2xl p-6 shadow-xl overflow-hidden relative group">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-container opacity-20 rounded-full blur-3xl" />
                  <div className="relative z-10 space-y-3 max-w-[85%]">
                    <h2 className="font-headline font-extrabold text-2xl leading-tight tracking-tight">Complete your check-in</h2>
                    <p className="font-body text-sm opacity-90">30 seconds → your perfect day</p>
                    <Button variant="black" onClick={() => setShowCheckIn(true)} icon={ArrowRight} className="h-10 px-5 text-sm">
                      Start Now
                    </Button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="bg-tertiary-container/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <BookOpen className="w-8 h-8 text-tertiary opacity-20" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-tertiary text-on-tertiary px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">Focus Area</span>
                  </div>
                  <h2 className="text-2xl font-bold text-on-tertiary-container">{profile.focusArea || profile.priorities[0] || 'Academics'}</h2>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={cn('w-2 h-2 rounded-full', i < 4 ? 'bg-tertiary' : 'bg-outline-variant/30')} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-on-tertiary-container/70">4/5 priorities set</span>
                    </div>
                    <button 
                      onClick={() => setShowCheckIn(true)}
                      className="text-tertiary font-bold text-xs underline underline-offset-4"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-surface-container-low rounded-2xl p-5 border border-surface-container space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smile className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Alfred Assistant</p>
                  <p className="text-sm font-medium text-on-surface">"How can I help you today, {profile.name}?"</p>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button 
                  onClick={() => setShowAddTask(true)}
                  className="px-4 py-2 bg-white rounded-full text-xs font-bold text-on-surface border border-surface-container whitespace-nowrap hover:bg-surface-container-lowest transition-colors"
                >
                  Add a task
                </button>
                <button 
                  onClick={() => setShowCheckIn(true)}
                  className="px-4 py-2 bg-white rounded-full text-xs font-bold text-on-surface border border-surface-container whitespace-nowrap hover:bg-surface-container-lowest transition-colors"
                >
                  Recalibrate day
                </button>
                <button 
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 bg-white rounded-full text-xs font-bold text-on-surface border border-surface-container whitespace-nowrap hover:bg-surface-container-lowest transition-colors"
                >
                  Feeling stressed?
                </button>
              </div>
            </section>

            {suggestedTasks.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold tracking-tight text-on-surface flex items-center gap-2">
                  <Bolt className="w-5 h-5 text-primary" />
                  Alfred's Suggestions
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {suggestedTasks.map(task => (
                    <div 
                      key={task.id}
                      className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{task.title}</span>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{task.category}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setTasks(prev => [task, ...prev]);
                          setSuggestedTasks(prev => prev.filter(t => t.id !== task.id));
                        }}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight text-on-surface flex items-center justify-between">
                Today's List
                {tasks.length > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
                    {tasks.length - completedCount} left
                  </span>
                )}
              </h3>
              
              {tasks.length === 0 ? (
                <div className="bg-surface-container-low rounded-2xl p-8 border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center text-outline">
                    <Lock className="w-6 h-6" />
                  </div>
                  <p className="font-body text-sm text-on-surface-variant max-w-[200px]">Complete your check-in to build today's list.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 3).map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTask(task.id)}
                      className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 group transition-all active:scale-98 shadow-sm cursor-pointer border border-surface-container"
                    >
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                        task.completed ? 'bg-primary' : 'border-2 border-outline-variant'
                      )}>
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-bold text-sm text-on-surface', task.completed && 'line-through opacity-40')}>
                          {task.title}
                        </p>
                        <p className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          task.completed ? 'text-on-surface-variant' : 'text-secondary'
                        )}>
                          {task.completed ? 'Completed' : task.category}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tasks.length > 3 && (
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="w-full py-2 text-primary font-bold text-xs hover:underline"
                    >
                      View all {tasks.length} tasks
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight text-on-surface">Vitality</h3>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard 
                  icon={Moon} 
                  label="Sleep" 
                  value={`${MOCK_METRICS.sleepHours}h ${MOCK_METRICS.sleepMinutes}m`} 
                  badge="Low" 
                  color="error" 
                />
                <MetricCard 
                  icon={Footprints} 
                  label="Steps" 
                  value="1.2k" 
                  subValue="/ 8k" 
                  color="tertiary" 
                  progress={0.15} 
                />
              </div>
            </section>

            <section className="bg-primary/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold tracking-tight text-on-surface">Upcoming</h3>
              <div className="space-y-4">
                {MOCK_UPCOMING.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center min-w-[32px]">
                      <span className="text-[9px] font-black text-primary uppercase">{item.date.split(' ')[0]}</span>
                      <span className="text-lg font-bold text-on-surface">{item.date.split(' ')[1]}</span>
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-on-surface">{item.title}</p>
                        {item.status && <span className="text-[9px] font-bold text-error uppercase tracking-tighter">{item.status}</span>}
                      </div>
                      <p className="text-xs text-on-surface-variant">{item.detail} • {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="fixed top-0 w-full z-50 glass-nav flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          <Menu className="w-5 h-5 text-on-surface" />
          <span className="text-2xl font-black text-on-surface uppercase tracking-tighter">Alfred</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5 text-on-surface-variant hover:text-primary transition-colors" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="pt-20 px-5 max-w-md mx-auto">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 w-full flex justify-around items-center px-4 pb-6 z-50">
        <div className="w-full rounded-full max-w-md bg-white/90 backdrop-blur-md flex justify-around items-center p-1.5 shadow-xl border border-surface-container">
          {[
            { id: 'today', icon: Home, label: 'Today' },
            { id: 'tasks', icon: CheckCircle2, label: 'Tasks' },
            { id: 'connect', icon: Bolt, label: 'Connect' },
            { id: 'me', icon: Smile, label: 'Me' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center rounded-full transition-all duration-300',
                activeTab === tab.id ? 'bg-primary text-white w-12 h-12' : 'text-on-surface/40 px-3 py-1 hover:text-primary'
              )}
            >
              <tab.icon className={cn('w-5 h-5', activeTab === tab.id ? 'mb-0' : 'mb-0.5')} />
              {activeTab !== tab.id && <span className="font-headline font-semibold text-[9px] uppercase tracking-widest">{tab.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <button 
        onClick={() => setShowChat(true)}
        className="fixed left-6 bottom-24 w-12 h-12 bg-surface-container-highest text-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 border border-surface-container"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <button 
        onClick={() => setShowAddTask(true)}
        className="fixed right-6 bottom-24 w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {showCheckIn && (
          <CheckInModal 
            profile={profile}
            onClose={() => setShowCheckIn(false)} 
            onAccept={(newTasks, focus) => {
              setTasks(prev => [...newTasks, ...prev]);
              onUpdateProfile({ 
                focusArea: focus,
                checkInCompleted: true,
                lastCheckInDate: new Date().toISOString().split('T')[0]
              });
              setShowCheckIn(false);
            }} 
          />
        )}
        {showSettings && (
          <SettingsScreen 
            profile={profile} 
            onClose={() => setShowSettings(false)}
            onUpdate={onUpdateProfile}
            onSignOut={onSignOut}
          />
        )}
        {showAddTask && (
          <AddTaskModal 
            onClose={() => setShowAddTask(false)}
            onAdd={addTask}
          />
        )}
        {showChat && (
          <ChatModal 
            profile={profile}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<'onboarding' | 'setup' | 'permissions' | 'success' | 'dashboard'>('onboarding');
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);

  // Persistence simulation
  useEffect(() => {
    const saved = localStorage.getItem('alfred_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.onboarded) {
        setProfile(parsed);
        setScreen('dashboard');
      }
    }
  }, []);

  const handleOnboarded = () => setScreen('setup');
  
  const handleSetupComplete = (data: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
    setScreen('permissions');
  };

  const handlePermissionsComplete = () => setScreen('success');

  const handleStartApp = () => {
    const finalProfile = { ...profile, onboarded: true };
    setProfile(finalProfile);
    localStorage.setItem('alfred_profile', JSON.stringify(finalProfile));
    setScreen('dashboard');
  };

  const handleSignOut = () => {
    localStorage.removeItem('alfred_profile');
    setProfile(INITIAL_PROFILE);
    setScreen('onboarding');
  };

  return (
    <div className="min-h-screen bg-surface">
      <AnimatePresence mode="wait">
        {screen === 'onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Onboarding onNext={handleOnboarded} />
          </motion.div>
        )}
        {screen === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Setup onNext={handleSetupComplete} />
          </motion.div>
        )}
        {screen === 'permissions' && (
          <motion.div key="permissions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Permissions onNext={handlePermissionsComplete} />
          </motion.div>
        )}
        {screen === 'success' && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Success name={profile.name} onNext={handleStartApp} />
          </motion.div>
        )}
        {screen === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard 
              profile={profile} 
              onUpdateProfile={(data) => {
                const updated = { ...profile, ...data };
                setProfile(updated);
                localStorage.setItem('alfred_profile', JSON.stringify(updated));
              }}
              onSignOut={handleSignOut}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
