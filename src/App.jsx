import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Calendar, BarChart3, Settings, LogOut, Plus, X, Brain,
  Clock, CheckCircle2, Circle, AlertCircle, ChevronRight, Sparkles,
  User, Lock, Mail, Zap, Target, TrendingUp, Bell, Star, Layers,
  ArrowRight, RefreshCw, Send, ChevronLeft, ChevronDown, Flame
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── helpers ────────────────────────────────────────────────────────────────
const STORAGE = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

const PRIORITY_COLOR = { high: 'red', medium: 'orange', low: 'green' };
const STATUS_LABEL   = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };

const today = () => new Date().toISOString().slice(0, 10);

function daysLeft(deadline) {
  const d = Math.ceil((new Date(deadline) - new Date(today())) / 86400000);
  return d;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getWeekDays() {
  const days = [];
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

// ─── Gemini call ────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  // Auto-detect available model
  const listRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const listData = await listRes.json();
  if (listData.error) throw new Error(listData.error.message);
  const model = listData.models?.find(m =>
    m.supportedGenerationMethods?.includes('generateContent') &&
    m.name.includes('gemini')
  );
  if (!model) throw new Error('No Gemini model available for this key');
  const modelId = model.name.replace('models/', '');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const SEED_TASKS = [
  { id: 1, title: 'Prepare hackathon presentation', deadline: today(), priority: 'high', status: 'inprogress', category: 'Work', subtasks: ['Outline slides', 'Add AI demo', 'Practice delivery'], aiNote: '' },
  { id: 2, title: 'Submit project report', deadline: new Date(Date.now()+86400000).toISOString().slice(0,10), priority: 'high', status: 'todo', category: 'Academic', subtasks: ['Write intro', 'Add results section'], aiNote: '' },
  { id: 3, title: 'Review pull requests', deadline: new Date(Date.now()+2*86400000).toISOString().slice(0,10), priority: 'medium', status: 'todo', category: 'Work', subtasks: [], aiNote: '' },
  { id: 4, title: 'Read cryptography chapter 5', deadline: new Date(Date.now()+3*86400000).toISOString().slice(0,10), priority: 'low', status: 'done', category: 'Academic', subtasks: [], aiNote: '' },
];

const SEED_USER = { name: 'Tarun', email: 'tarun@nitw.ac.in' };

// ═══════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    if (mode === 'signup') {
      if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
      STORAGE.set('tm_user', { name: form.name, email: form.email });
      onLogin({ name: form.name, email: form.email });
    } else {
      const saved = STORAGE.get('tm_user', null);
      if (saved && saved.email === form.email) {
        onLogin(saved);
      } else if (form.email === SEED_USER.email) {
        onLogin(SEED_USER);
      } else {
        onLogin({ name: form.email.split('@')[0], email: form.email });
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 20 }}>
      {/* bg glow */}
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(124,106,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'linear-gradient(135deg, #7c6aff, #9580ff)', borderRadius: 16, marginBottom: 16, boxShadow: '0 8px 32px rgba(124,106,255,0.4)' }}>
            <Brain size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>TaskMind</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>AI-powered productivity companion</p>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 10, padding: 4, marginBottom: 28, border: '1px solid var(--border)' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-secondary)', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', textTransform: 'capitalize' }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* form */}
        <form onSubmit={handle} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {mode === 'signup' && (
            <FormField icon={<User size={16} />} placeholder="Full name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          )}
          <FormField icon={<Mail size={16} />} placeholder="Email address" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <FormField icon={<Lock size={16} />} placeholder="Password" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />

          {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }} disabled={loading}>
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* demo note */}
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          Demo: use any email · no real auth needed
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FormField({ icon, placeholder, type = 'text', value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px 12px 40px', color: 'var(--text-primary)', fontSize: 14, transition: 'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════
const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'board',     icon: Layers,          label: 'Board' },
  { id: 'calendar',  icon: Calendar,        label: 'Calendar' },
  { id: 'schedule',  icon: Clock,           label: 'AI Schedule' },
  { id: 'drafts',    icon: Send,            label: 'AI Email Draft' },
  { id: 'analytics', icon: BarChart3,       label: 'Analytics' },
  { id: 'settings',  icon: Settings,        label: 'Settings' },
];

function Sidebar({ active, setActive, user, onLogout, tasks }) {
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      {/* logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#7c6aff,#9580ff)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>TaskMind</span>
        </div>
      </div>

      {/* nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActive(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: active === id ? 'var(--accent-glow)' : 'transparent', color: active === id ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: active === id ? 600 : 400, fontSize: 14, transition: 'all 0.15s', textAlign: 'left', border: active === id ? '1px solid rgba(124,106,255,0.2)' : '1px solid transparent' }}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {/* progress widget */}
      <div style={{ margin: '0 12px 16px', background: 'var(--bg-card)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c6aff,#9580ff)', borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{done}/{tasks.length} tasks completed</p>
      </div>

      {/* user */}
      <div style={{ padding: '16px 12px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c6aff,#9580ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
          <button onClick={onLogout} style={{ background: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'color 0.2s' }} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
function Dashboard({ tasks, user, apiKey, onAddTask }) {
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const urgent = tasks.filter(t => t.status !== 'done' && t.priority === 'high');
  const dueSoon = tasks.filter(t => t.status !== 'done' && daysLeft(t.deadline) <= 2 && daysLeft(t.deadline) >= 0);
  const inProg  = tasks.filter(t => t.status === 'inprogress');
  const done    = tasks.filter(t => t.status === 'done');

  const analyzeDay = async () => {
    if (!apiKey) { setAiOutput('⚠️ Please add your Gemini API key in Settings first.'); return; }
    setAiLoading(true);
    try {
      const list = tasks.filter(t => t.status !== 'done').map(t =>
        `- "${t.title}" (priority: ${t.priority}, due: ${t.deadline}, status: ${t.status})`
      ).join('\n');
      const prompt = `You are a productivity AI. Analyze these pending tasks and give a sharp, actionable daily plan for ${user.name}. Be specific and concise (max 180 words). Use bullet points. Highlight the 3 most critical tasks to tackle first.\n\nTasks:\n${list}`;
      const out = await callGemini(apiKey, prompt);
      setAiOutput(out);
    } catch (e) {
      setAiOutput('⚠️ Gemini error: ' + e.message);
    }
    setAiLoading(false);
  };

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: <Target size={18} />, color: '#7c6aff' },
    { label: 'In Progress', value: inProg.length, icon: <Zap size={18} />, color: '#3b82f6' },
    { label: 'Due Soon',    value: dueSoon.length, icon: <Bell size={18} />, color: '#f97316' },
    { label: 'Completed',   value: done.length,    icon: <CheckCircle2 size={18} />, color: '#22c55e' },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1100, width: '100%' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]} 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn-primary" onClick={onAddTask}><Plus size={16} /> New Task</button>
      </div>

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* AI analysis panel */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: 16 }}>AI Day Analysis</span>
              <span style={{ fontSize: 11, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>Gemini</span>
            </div>
            <button className="btn-primary" onClick={analyzeDay} disabled={aiLoading} style={{ padding: '8px 16px', fontSize: 13 }}>
              {aiLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={14} />}
              {aiLoading ? 'Analyzing...' : 'Analyze My Day'}
            </button>
          </div>
          {aiOutput ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, padding: 18, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiOutput}</div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              <Brain size={36} style={{ marginBottom: 10, opacity: 0.3 }} /><br />
              Click "Analyze My Day" to get your personalized AI schedule
            </div>
          )}
        </div>

        {/* urgent tasks */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Flame size={16} color="var(--red)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Urgent Tasks</span>
            {urgent.length > 0 && <span style={{ background: 'var(--red-bg)', color: 'var(--red)', fontSize: 11, padding: '1px 7px', borderRadius: 100, fontWeight: 700 }}>{urgent.length}</span>}
          </div>
          {urgent.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No urgent tasks. Great job! 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {urgent.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--red-bg)' }}>
                  <AlertCircle size={15} color="var(--red)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{daysLeft(t.deadline) < 0 ? 'Overdue!' : `${daysLeft(t.deadline)}d left`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* in progress */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={16} color="var(--blue)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>In Progress</span>
          </div>
          {inProg.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nothing in progress yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {inProg.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--blue-bg)' }}>
                  <RefreshCw size={14} color="var(--blue)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due {formatDate(t.deadline)}</p>
                  </div>
                  <span className="tag tag-progress">active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KANBAN BOARD
// ═══════════════════════════════════════════════════════════════════════════
function Board({ tasks, setTasks, apiKey }) {
  const [aiLoading, setAiLoading] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  const columns = [
    { id: 'todo',       label: 'To Do',       color: 'var(--text-muted)' },
    { id: 'inprogress', label: 'In Progress',  color: 'var(--blue)' },
    { id: 'done',       label: 'Done',         color: 'var(--green)' },
  ];

  const move = (taskId, status) => {
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const breakDown = async (task) => {
    if (!apiKey) { alert('Add API key in Settings first.'); return; }
    setAiLoading(task.id);
    try {
      const prompt = `Break down this task into 3-5 clear, actionable subtasks. Return ONLY a JSON array of strings, no markdown, no explanation.\nTask: "${task.title}"`;
      const out = await callGemini(apiKey, prompt);
      const clean = out.replace(/```json|```/g, '').trim();
      const subtasks = JSON.parse(clean);
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, subtasks: Array.isArray(subtasks) ? subtasks : [] } : t));
    } catch { alert('AI breakdown failed. Check API key.'); }
    setAiLoading(null);
  };

  const toggleSubtask = (taskId, idx) => {
    setTasks(ts => ts.map(t => {
      if (t.id !== taskId) return t;
      const done = t.subtasksDone || [];
      const next = done.includes(idx) ? done.filter(i => i !== idx) : [...done, idx];
      return { ...t, subtasksDone: next };
    }));
  };

  return (
    <div style={{ padding: 32, flex: 1, overflow: 'auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Task Board</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* col header */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 100 }}>{colTasks.length}</span>
              </div>
              {/* tasks */}
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
                {colTasks.map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    expanded={expandedTask === task.id}
                    onExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    onMove={move}
                    onBreakDown={breakDown}
                    aiLoading={aiLoading === task.id}
                    onToggleSubtask={toggleSubtask}
                    columns={columns}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ task, expanded, onExpand, onMove, onBreakDown, aiLoading, onToggleSubtask, columns }) {
  const dl = daysLeft(task.deadline);
  const overdue = dl < 0 && task.status !== 'done';

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, padding: 14, transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      {/* title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }} onClick={onExpand}>
        <span className={`tag tag-${task.priority}`} style={{ flexShrink: 0 }}>{task.priority}</span>
        <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>{task.title}</p>
        <ChevronDown size={14} color="var(--text-muted)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: 2 }} />
      </div>

      {/* deadline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <Clock size={11} color={overdue ? 'var(--red)' : 'var(--text-muted)'} />
        <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
          {overdue ? `Overdue by ${Math.abs(dl)}d` : dl === 0 ? 'Due today!' : `${dl}d left`}
        </span>
        {task.category && <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4 }}>{task.category}</span>}
      </div>

      {/* subtask progress */}
      {task.subtasks?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${((task.subtasksDone?.length || 0) / task.subtasks.length) * 100}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{task.subtasksDone?.length || 0}/{task.subtasks.length} subtasks</p>
        </div>
      )}

      {/* expanded */}
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {/* subtasks */}
          {task.subtasks?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subtasks</p>
              {task.subtasks.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }} onClick={() => onToggleSubtask(task.id, i)}>
                  {task.subtasksDone?.includes(i) ? <CheckCircle2 size={14} color="var(--green)" /> : <Circle size={14} color="var(--text-muted)" />}
                  <span style={{ fontSize: 12, color: task.subtasksDone?.includes(i) ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: task.subtasksDone?.includes(i) ? 'line-through' : 'none' }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI break down */}
          <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 12px', marginBottom: 10 }} onClick={() => onBreakDown(task)} disabled={aiLoading}>
            {aiLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={12} />}
            {aiLoading ? 'Breaking down...' : 'AI Break Down'}
          </button>

          {/* move actions */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {columns.filter(c => c.id !== task.status).map(c => (
              <button key={c.id} onClick={() => onMove(task.id, c.id)} style={{ flex: 1, padding: '6px 8px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                Move → {STATUS_LABEL[c.id]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
function CalendarView({ tasks, onAddTask }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today();

  const tasksByDay = {};
  tasks.forEach(t => {
    if (t.deadline) {
      if (!tasksByDay[t.deadline]) tasksByDay[t.deadline] = [];
      tasksByDay[t.deadline].push(t);
    }
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day, e) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasksByDay[dateStr] || [];
    if (dayTasks.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopupPos({ x: rect.right + 8, y: rect.top });
      setSelectedDay({ date: dateStr, tasks: dayTasks });
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ padding: 32, flex: 1, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Calendar</h2>
        <button className="btn-primary" onClick={onAddTask}><Plus size={16} /> New Task</button>
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', maxWidth: 900 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={prevMonth} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /></button>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{monthName}</h3>
          <button onClick={nextMonth} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={16} /></button>
        </div>

        {/* days of week */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {days.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '10px 0', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>

        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} style={{ height: 90, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', opacity: 0.4 }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasksByDay[dateStr] || [];
            const isToday = dateStr === todayStr;
            return (
              <div key={day}
                onClick={e => handleDayClick(day, e)}
                style={{ height: 90, borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 8, cursor: dayTasks.length > 0 ? 'pointer' : 'default', background: isToday ? 'var(--accent-glow)' : 'transparent', transition: 'background 0.15s', position: 'relative' }}
                onMouseEnter={e => { if (dayTasks.length) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'var(--accent-glow)' : 'transparent'; }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: isToday ? 'var(--accent)' : 'transparent', color: isToday ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: isToday ? 700 : 400 }}>{day}</span>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: PRIORITY_COLOR[t.priority] === 'red' ? 'var(--red-bg)' : PRIORITY_COLOR[t.priority] === 'orange' ? 'var(--orange-bg)' : 'var(--green-bg)', color: PRIORITY_COLOR[t.priority] === 'red' ? 'var(--red)' : PRIORITY_COLOR[t.priority] === 'orange' ? 'var(--orange)' : 'var(--green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{dayTasks.length - 2} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* task popup */}
      {selectedDay && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setSelectedDay(null)} />
          <div style={{ position: 'fixed', left: Math.min(popupPos.x, window.innerWidth - 300), top: Math.min(popupPos.y, window.innerHeight - 300), width: 280, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 50, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(selectedDay.date)}</p>
              <button onClick={() => setSelectedDay(null)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={14} /></button>
            </div>
            {selectedDay.tasks.map(t => (
              <div key={t.id} style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span className={`tag tag-${t.priority}`}>{t.priority}</span>
                  <p style={{ fontSize: 13, flex: 1 }}>{t.title}</p>
                </div>
                <span className={`tag tag-${t.status}`} style={{ marginTop: 6 }}>{STATUS_LABEL[t.status]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════
function Analytics({ tasks }) {
  const statuses = ['todo', 'inprogress', 'done'];
  const pieData = statuses.map(s => ({ name: STATUS_LABEL[s], value: tasks.filter(t => t.status === s).length }));
  const PIE_COLORS = ['#55556a', '#3b82f6', '#22c55e'];

  const priorities = ['high', 'medium', 'low'];
  const barData = priorities.map(p => ({
    priority: p,
    Total: tasks.filter(t => t.priority === p).length,
    Done: tasks.filter(t => t.priority === p && t.status === 'done').length,
  }));

  // weekly trend (simulate)
  const weekDays = getWeekDays();
  const weekData = weekDays.map((d, i) => {
    const ds = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      tasks: tasks.filter(t => t.deadline === ds).length,
      completed: tasks.filter(t => t.deadline === ds && t.status === 'done').length,
    };
  });

  const completionRate = tasks.length ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  const TOOLTIP_STYLE = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 };

  return (
    <div style={{ padding: 32, flex: 1, overflow: 'auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Analytics</h2>

      {/* top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Completion Rate', value: `${completionRate}%`, icon: <TrendingUp size={18} />, color: '#22c55e' },
          { label: 'High Priority Pending', value: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length, icon: <AlertCircle size={18} />, color: '#ef4444' },
          { label: 'Overdue Tasks', value: tasks.filter(t => t.status !== 'done' && daysLeft(t.deadline) < 0).length, icon: <Clock size={18} />, color: '#f97316' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>{m.icon}</div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{m.value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* status pie */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* priority bar */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={4}>
              <XAxis dataKey="priority" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="Total" fill="#55556a" radius={[4,4,0,0]} />
              <Bar dataKey="Done"  fill="#7c6aff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* weekly area chart */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>This Week — Deadlines & Completions</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weekData}>
            <defs>
              <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6aff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c6aff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="tasks"     stroke="#7c6aff" fill="url(#gt)" strokeWidth={2} name="Deadlines" />
            <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#gc)" strokeWidth={2} name="Completed" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function SettingsView({ apiKey, setApiKey }) {
  const [input, setInput] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(input);
    STORAGE.set('tm_apikey', input);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 32, flex: 1, maxWidth: 600 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Settings</h2>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
        <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Gemini API Key</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.6 }}>
          TaskMind uses Google's Gemini AI to analyze tasks, build schedules, and generate AI plans.
          Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>aistudio.google.com/apikey</a>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="password"
            placeholder="AIza..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text-primary)', fontSize: 14 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button className="btn-primary" onClick={save}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
        {apiKey && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 10 }}>✓ API key is configured</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD TASK MODAL
// ═══════════════════════════════════════════════════════════════════════════
function AddTaskModal({ onClose, onAdd, apiKey }) {
  const [form, setForm] = useState({ title: '', deadline: today(), priority: 'medium', category: 'Work', status: 'todo' });
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiNote, setAiNote] = useState('');

  const suggest = async () => {
    if (!form.title.trim()) return;
    if (!apiKey) { setAiNote('Add API key in Settings to use AI.'); return; }
    setAiSuggesting(true);
    try {
      const prompt = `For this task: "${form.title}" (due ${form.deadline}, priority: ${form.priority}), give ONE sharp productivity tip in under 30 words.`;
      const out = await callGemini(apiKey, prompt);
      setAiNote(out);
    } catch { setAiNote('Could not get AI suggestion.'); }
    setAiSuggesting(false);
  };

  const submit = () => {
    if (!form.title.trim()) return;
    onAdd({ ...form, id: Date.now(), subtasks: [], aiNote });
    onClose();
  };

  const Field = ({ label, children }) => (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = { width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--text-primary)', fontSize: 14 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>New Task</h3>
          <button onClick={onClose} style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Task title">
            <input style={inputStyle} placeholder="What do you need to do?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Deadline">
              <input type="date" style={inputStyle} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Priority">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Category">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['Work', 'Academic', 'Personal', 'Health', 'Finance'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </Field>
          </div>

          {/* AI tip */}
          {aiNote && <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <Sparkles size={13} color="var(--accent)" style={{ display: 'inline', marginRight: 6 }} />{aiNote}
          </div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn-secondary" onClick={suggest} disabled={aiSuggesting} style={{ flex: 1, justifyContent: 'center' }}>
              {aiSuggesting ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
              AI Tip
            </button>
            <button className="btn-primary" onClick={submit} style={{ flex: 2, justifyContent: 'center' }}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI SCHEDULE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
function AISchedule({ tasks, apiKey, user }) {
  const [schedule, setSchedule] = useState('');
  const [loading, setLoading] = useState(false);
  const [wakeTime, setWakeTime] = useState('08:00');
  const [workHours, setWorkHours] = useState('8');

  const generate = async () => {
    if (!apiKey) { setSchedule('⚠️ Add your Gemini API key in Settings first.'); return; }
    setLoading(true);
    try {
      const pending = tasks.filter(t => t.status !== 'done');
      const list = pending.map(t =>
        `- "${t.title}" (priority: ${t.priority}, due: ${t.deadline}, status: ${t.status})`
      ).join('\n');
      const prompt = `You are a productivity AI assistant. Create a detailed hour-by-hour schedule for ${user.name} for today.

Wake time: ${wakeTime}
Available work hours: ${workHours} hours
Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

Pending tasks:
${list}

Create a realistic schedule with specific time slots (e.g. 8:00 AM - 9:30 AM). Include:
- Focused work blocks for high priority tasks
- Short breaks every 90 minutes (15 min)
- Lunch break (45 min)
- Buffer time for unexpected issues
- End-of-day review (15 min)

Format each block as: TIME | TASK | DURATION
Be specific and actionable. Max 300 words.`;
      const out = await callGemini(apiKey, prompt);
      setSchedule(out);
    } catch (e) {
      setSchedule('⚠️ Gemini error: ' + e.message);
    }
    setLoading(false);
  };

  const blocks = schedule ? schedule.split('\n').filter(l => l.trim()) : [];

  return (
    <div style={{ padding: 32, flex: 1, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#7c6aff,#9580ff)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Clock size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>AI Schedule Generator</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Gemini builds your personalized hour-by-hour plan</p>
        </div>
      </div>

      {/* config */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginTop: 24, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Configure Your Day</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Wake / Start Time</label>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--text-primary)', fontSize: 14 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Available Hours</label>
            <select value={workHours} onChange={e => setWorkHours(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer' }}>
              {['4','5','6','7','8','9','10'].map(h => <option key={h} value={h}>{h} hours</option>)}
            </select>
          </div>
        </div>

        {/* pending tasks preview */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 14, marginBottom: 18, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tasks to schedule ({tasks.filter(t => t.status !== 'done').length})</p>
          {tasks.filter(t => t.status !== 'done').slice(0, 5).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span className={`tag tag-${t.priority}`}>{t.priority}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.title}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(t.deadline)}</span>
            </div>
          ))}
        </div>

        <button className="btn-primary" onClick={generate} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}>
          {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
          {loading ? 'Gemini is building your schedule...' : 'Generate My Schedule'}
        </button>
      </div>

      {/* schedule output */}
      {schedule && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Sparkles size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Your AI-Generated Schedule</span>
            <span style={{ fontSize: 11, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>Gemini</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blocks.map((line, i) => {
              const isTimeBlock = line.includes('|') || /^\d/.test(line.trim());
              const isBreak = line.toLowerCase().includes('break') || line.toLowerCase().includes('lunch');
              return (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: isBreak ? 'var(--green-bg)' : isTimeBlock ? 'var(--bg-card)' : 'transparent',
                  border: isTimeBlock ? `1px solid ${isBreak ? 'rgba(34,197,94,0.2)' : 'var(--border)'}` : 'none',
                  fontSize: 13,
                  color: isBreak ? 'var(--green)' : 'var(--text-secondary)',
                  lineHeight: 1.5,
                  fontWeight: isTimeBlock ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  {isTimeBlock && <Clock size={13} color={isBreak ? 'var(--green)' : 'var(--accent)'} style={{ flexShrink: 0 }} />}
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI EMAIL DRAFT
// ═══════════════════════════════════════════════════════════════════════════
function AIEmailDraft({ tasks, apiKey, user }) {
  const [selectedTask, setSelectedTask] = useState('');
  const [emailType, setEmailType] = useState('extension');
  const [extraContext, setExtraContext] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const EMAIL_TYPES = [
    { id: 'extension', label: 'Request Deadline Extension', icon: '📅' },
    { id: 'update',    label: 'Send Progress Update',       icon: '📊' },
    { id: 'help',      label: 'Ask for Help / Resources',   icon: '🤝' },
    { id: 'reschedule',label: 'Reschedule a Meeting',       icon: '🔄' },
  ];

  const generate = async () => {
    if (!apiKey) { setDraft('⚠️ Add your Gemini API key in Settings first.'); return; }
    if (!selectedTask) { setDraft('⚠️ Please select a task first.'); return; }
    setLoading(true);
    const task = tasks.find(t => String(t.id) === selectedTask);
    try {
      const prompts = {
        extension: `Write a professional email from ${user.name} requesting a deadline extension for the task "${task?.title}" (originally due ${task?.deadline}). ${extraContext ? 'Additional context: ' + extraContext : ''} Make it polite, professional, and include a proposed new deadline. Subject line + email body. Max 150 words.`,
        update: `Write a professional progress update email from ${user.name} about the task "${task?.title}" (due ${task?.deadline}, currently ${task?.status}). ${extraContext ? 'Context: ' + extraContext : ''} Be concise and professional. Subject line + email body. Max 150 words.`,
        help: `Write a professional email from ${user.name} asking for help or additional resources for the task "${task?.title}" (due ${task?.deadline}). ${extraContext ? 'Context: ' + extraContext : ''} Be specific about what help is needed. Subject line + email body. Max 150 words.`,
        reschedule: `Write a professional email from ${user.name} requesting to reschedule a meeting or deadline related to "${task?.title}". ${extraContext ? 'Context: ' + extraContext : ''} Be polite and suggest alternative times. Subject line + email body. Max 150 words.`,
      };
      const out = await callGemini(apiKey, prompts[emailType]);
      setDraft(out);
    } catch (e) {
      setDraft('⚠️ Gemini error: ' + e.message);
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: 32, flex: 1, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#3b82f6,#7c6aff)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>AI Email Draft</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Gemini writes professional emails for your tasks</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20 }}>
        {/* email type */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {EMAIL_TYPES.map(et => (
            <button key={et.id} onClick={() => setEmailType(et.id)}
              style={{ padding: '12px 14px', borderRadius: 10, background: emailType === et.id ? 'var(--accent-glow)' : 'var(--bg-card)', border: `1px solid ${emailType === et.id ? 'rgba(124,106,255,0.4)' : 'var(--border)'}`, color: emailType === et.id ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: emailType === et.id ? 600 : 400, fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {et.icon} {et.label}
            </button>
          ))}
        </div>

        {/* task selector */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Related Task</label>
        <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}
          style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--text-primary)', fontSize: 14, marginBottom: 16, cursor: 'pointer' }}>
          <option value="">— Select a task —</option>
          {tasks.map(t => <option key={t.id} value={t.id}>{t.title} (due {formatDate(t.deadline)})</option>)}
        </select>

        {/* extra context */}
        <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Extra Context (optional)</label>
        <textarea value={extraContext} onChange={e => setExtraContext(e.target.value)}
          placeholder="e.g. Need 3 more days, facing technical issues, propose Thursday 3PM..."
          rows={3}
          style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', marginBottom: 18 }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />

        <button className="btn-primary" onClick={generate} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}>
          {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
          {loading ? 'Gemini is drafting your email...' : 'Generate Email Draft'}
        </button>
      </div>

      {/* draft output */}
      {draft && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: 15 }}>Your Email Draft</span>
              <span style={{ fontSize: 11, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>Gemini</span>
            </div>
            <button className="btn-secondary" onClick={copy} style={{ fontSize: 12, padding: '7px 14px' }}>
              {copied ? '✓ Copied!' : 'Copy Email'}
            </button>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 10, padding: 20, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
            {draft}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>✏️ Review and personalize before sending</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]       = useState(() => STORAGE.get('tm_user', null));
  const [tasks, setTasks]     = useState(() => STORAGE.get('tm_tasks', SEED_TASKS));
  const [apiKey, setApiKey]   = useState(() => STORAGE.get('tm_apikey', ''));
  const [page, setPage]       = useState('dashboard');
  const [showAdd, setShowAdd] = useState(false);

  // persist tasks
  useEffect(() => { STORAGE.set('tm_tasks', tasks); }, [tasks]);

  if (!user) return <AuthScreen onLogin={u => { setUser(u); STORAGE.set('tm_user', u); }} />;

  const addTask = (task) => setTasks(ts => [task, ...ts]);
  const logout = () => { setUser(null); STORAGE.set('tm_user', null); };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard tasks={tasks} user={user} apiKey={apiKey} onAddTask={() => setShowAdd(true)} />;
      case 'board':     return <Board tasks={tasks} setTasks={setTasks} apiKey={apiKey} />;
      case 'calendar':  return <CalendarView tasks={tasks} onAddTask={() => setShowAdd(true)} />;
      case 'schedule':  return <AISchedule tasks={tasks} apiKey={apiKey} user={user} />;
      case 'drafts':    return <AIEmailDraft tasks={tasks} apiKey={apiKey} user={user} />;
      case 'analytics': return <Analytics tasks={tasks} />;
      case 'settings':  return <SettingsView apiKey={apiKey} setApiKey={setApiKey} />;
      default:          return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={page} setActive={setPage} user={user} onLogout={logout} tasks={tasks} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {renderPage()}
      </main>
      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={addTask} apiKey={apiKey} />}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: #1c1c28; color: #f0f0f8; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
      `}</style>
    </div>
  );
}
