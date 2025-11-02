/**
 * Main App component
 * FinAura NeuroFin Dashboard
 */

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi } from "lucide-react";
import { Header } from "@/components/Header";
import { AccentBg } from "@/components/AccentBg";
import { AuthModal } from "@/components/auth/AuthModal";
import { Dashboard } from "@/components/tabs/Dashboard";
import { Planner } from "@/components/tabs/Planner";
import { Insights } from "@/components/tabs/Insights";
import { Settings } from "@/components/tabs/Settings";
import { AuthService } from "@/lib/auth";
import { SupabaseService } from "@/services/supabaseService";
import { localComputeNFI, localExplain, localNudges, loadNudgeScores, saveNudgeScores } from "@/utils/nfi";
import { clamp } from "@/utils/sentiment";
import { apiJSON } from "@/utils/api";

export default function NeuroFinDashboard() {
  console.log('NeuroFinDashboard component rendering...');
  
  // finance
  const [income, setIncome] = useState(70000);
  const [spend, setSpend] = useState(52000);
  const [savings, setSavings] = useState(95000);
  const [debt, setDebt] = useState(60000);
  const [od, setOd] = useState(0);
  const [vol, setVol] = useState(0.35);
  const [adh, setAdh] = useState(0.7);
  // emotion
  const [text, setText] = useState("Feeling a bit stressed about bills but optimistic about saving this month");
  const [stress, setStress] = useState(4);
  const [sleep, setSleep] = useState(6);
  // prefs
  const [dark, setDark] = useState(true);
  const [autoExplain, setAutoExplain] = useState(true);
  const [forceMode, setForceMode] = useState("auto"); // auto | remote | local
  const [theme, setTheme] = useState("indigo"); // indigo | emerald | amber
  // outputs
  const [res, setRes] = useState(null);
  const [explain, setExplain] = useState(null);
  const [nudges, setNudges] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(3);
  const [backendOnline, setBackendOnline] = useState(null);
  const [netError, setNetError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // planner / simulator
  const [deltaAdh, setDeltaAdh] = useState(0.05);
  const [deltaSpend, setDeltaSpend] = useState(-1000);
  const [deltaVol, setDeltaVol] = useState(-0.05);
  const [simNfi, setSimNfi] = useState(null);

  // insights / csv parsing
  const [csv, setCsv] = useState("");
  const [catTotals, setCatTotals] = useState([]); // [{name, value}]

  // Authentication & user state
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);

  // Load user profile
  const loadUserProfile = React.useCallback(async (userId) => {
    const result = await SupabaseService.getProfile(userId);
    if (result.ok && result.data) {
      setProfile(result.data);
      // Load saved preferences
      if (result.data.theme) setTheme(result.data.theme);
      if (result.data.dark_mode !== undefined) setDark(result.data.dark_mode);
      if (result.data.auto_explain !== undefined) setAutoExplain(result.data.auto_explain);
      // Load financial data
      if (result.data.monthly_income) setIncome(result.data.monthly_income);
      if (result.data.monthly_spend) setSpend(result.data.monthly_spend);
      if (result.data.savings_balance) setSavings(result.data.savings_balance);
      if (result.data.debt_balance) setDebt(result.data.debt_balance);
      if (result.data.journal_streak) setStreak(result.data.journal_streak);
      
      // Load NFI history
      const historyResult = await SupabaseService.getNFIHistory(userId, 20);
      if (historyResult.ok && historyResult.data) {
        const formatted = historyResult.data.map(h => ({
          t: new Date(h.computed_at).toLocaleTimeString(),
          nfi: h.nfi
        }));
        setHistory(formatted);
      }
    }
  }, []);

  // Load user profile on mount and auth state changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    
    // Check Supabase availability
    const checkSupabase = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        setIsSupabaseAvailable(supabase !== null);
        
        if (supabase) {
          try {
            // Get current user
            const { data: { user }, error } = await supabase.auth.getUser();
            if (!error) {
              setUser(user);
              
              // Load profile if user exists
              if (user) {
                await loadUserProfile(user.id);
              }
            }
          } catch (err) {
            console.error("Error getting user:", err);
          }
          
          // Listen to auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            try {
              setUser(session?.user ?? null);
              if (session?.user) {
                await loadUserProfile(session.user.id);
              } else {
                setProfile(null);
              }
            } catch (err) {
              console.error("Error in auth state change:", err);
            }
          });
        }
      } catch (err) {
        console.error("Error loading Supabase:", err);
        setIsSupabaseAvailable(false);
      }
    };
    
    checkSupabase();
  }, [dark, loadUserProfile]);


  // Save profile preferences
  const savePreferences = async () => {
    if (user && profile) {
      await SupabaseService.updateProfile(user.id, {
        theme,
        dark_mode: dark,
        auto_explain: autoExplain
      });
    }
  };

  // Auto-save preferences when they change
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => savePreferences(), 1000);
      return () => clearTimeout(timer);
    }
  }, [theme, dark, autoExplain, user]);

  const payload = useMemo(() => ({
    monthly_income: income,
    monthly_spend: spend,
    savings_balance: savings,
    debt_balance: debt,
    overdraft_count_90d: od,
    spend_volatility_30d: vol,
    budget_adherence_30d: adh,
    recent_text: text,
    self_reported_stress_0_10: stress,
    sleep_quality_0_10: sleep,
  }), [income, spend, savings, debt, od, vol, adh, text, stress, sleep]);

  async function compute() {
    console.log('Compute function called', { forceMode, isSupabaseAvailable, user: !!user });
    setLoading(true); 
    setNetError("");
    
    const doLocal = () => {
      console.log('Computing locally with payload:', payload);
      const result = localComputeNFI(payload);
      console.log('Local computation result:', result);
      return result;
    };
    
    const useSupabase = isSupabaseAvailable && user && forceMode !== "local";

    try {
      let data = null;
      let usedRemote = false;

      if (forceMode === "local") {
        console.log('Using local mode');
        data = doLocal();
        setBackendOnline(false);
      } else if (useSupabase) {
        console.log('Using Supabase service');
        try {
          // Use Supabase service with enhanced mathematical logic
          data = await SupabaseService.computeNFI(payload, false);
          console.log('Supabase computation result:', data);
          usedRemote = true;
          setBackendOnline(true);
          
          // Save to database (non-blocking)
          SupabaseService.saveNFIHistory(user.id, payload, data, 'remote').catch(err => {
            console.warn("Failed to save NFI history:", err);
          });
          
          // Update journal streak if text entry exists (non-blocking)
          if (text && text.trim().length > 10) {
            SupabaseService.updateJournalStreak(user.id, true).then(streakResult => {
              if (streakResult.ok && streakResult.streak) {
                setStreak(streakResult.streak);
              }
            }).catch(err => {
              console.warn("Failed to update streak:", err);
            });
          }
          
          // Update profile with current state (non-blocking)
          SupabaseService.updateProfile(user.id, {
            monthly_income: income,
            monthly_spend: spend,
            savings_balance: savings,
            debt_balance: debt,
            overdraft_count_90d: od,
            spend_volatility_30d: vol,
            budget_adherence_30d: adh,
            recent_text: text,
            self_reported_stress_0_10: stress,
            sleep_quality_0_10: sleep
          }).catch(err => {
            console.warn("Failed to update profile:", err);
          });
        } catch (supabaseError) {
          console.error("Supabase computation error, falling back to local:", supabaseError);
          data = doLocal();
          setBackendOnline(false);
        }
      } else {
        console.log('Trying remote API or local fallback');
        // Fallback to old API or local
        try {
          const r = await Promise.race([
            apiJSON("/nfi", { method: "POST", body: payload }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout')), 5000))
          ]);
          if (r.ok && r.json) { 
            data = r.json; 
            usedRemote = true; 
            setBackendOnline(true);
            console.log('Remote API result:', data);
          } else {
            throw new Error('API not available');
          }
        } catch (apiError) {
          console.log('API failed, using local:', apiError);
          data = doLocal();
          setBackendOnline(false);
        }
      }

      // Ensure we have valid data
      if (!data || typeof data.nfi !== 'number') {
        console.error('Invalid computation result, using local:', data);
        data = doLocal();
      }

      console.log('Setting result:', data);
      setRes(data);

      if (text && text.trim().length > 10 && !useSupabase) {
        setStreak((s) => s + 1);
      }

      const a = [];
      if (data.triggers?.high_spend) a.push("High Spend > 80% income");
      if (data.triggers?.high_debt_ratio) a.push("Debt heavy vs savings");
      if (data.triggers?.high_volatility) a.push("Volatile spending");
      if (data.triggers?.high_stress) a.push("Elevated stress");
      if (data.triggers?.low_sleep) a.push("Low sleep");
      if (data.triggers?.low_budget_adherence) a.push("Low budget adherence");
      setAlerts(a);

      const now = new Date();
      setHistory((h) => [...h.slice(-19), { t: now.toLocaleTimeString(), nfi: data.nfi }]);

      const canRemote = (usedRemote || useSupabase) && forceMode !== "local";

      // Get explanations (non-blocking - use local if fails)
      let exp = null;
      if (autoExplain) {
        try {
          if (useSupabase) {
            exp = await Promise.race([
              SupabaseService.getExplain(payload),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
          } else if (canRemote) {
            const ex = await Promise.race([
              apiJSON("/explain", { method: "POST", body: payload }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
            ]);
            exp = ex.ok ? (ex.json.contributions) : localExplain(payload);
          } else {
            exp = localExplain(payload);
          }
        } catch (explainError) {
          console.warn("Explain failed, using local:", explainError);
          exp = localExplain(payload);
        }
        setExplain(exp || null);
      }

      // Get nudges (non-blocking - use local if fails)
      let nud = null;
      console.log('Getting nudges for:', { nfi: data.nfi, triggers: data.triggers });
      
      try {
        if (useSupabase && user) {
          nud = await Promise.race([
            SupabaseService.getNudges(data.nfi, data.triggers || {}, user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          console.log('Supabase nudges result:', nud);
        } else if (canRemote) {
          const rr = await Promise.race([
            apiJSON("/nudges", { method: "POST", body: { nfi: data.nfi, triggers: data.triggers || {} } }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          nud = rr.ok ? rr.json : localNudges(data.nfi, data.triggers || {});
          console.log('API nudges result:', nud);
        } else {
          nud = localNudges(data.nfi, data.triggers || {});
          console.log('Local nudges result:', nud);
        }
      } catch (nudgeError) {
        console.warn("Nudges failed, using local:", nudgeError);
        nud = localNudges(data.nfi, data.triggers || {});
      }
      
      // Ensure we have nudges
      if (!nud || !nud.nudges || nud.nudges.length === 0) {
        console.warn('No nudges generated, creating default');
        nud = {
          nudges: data.nfi >= 70 
            ? ["Great balance! Consider nudging NFI +5 with a small, auto-scheduled investment today."]
            : ["Review your financial inputs and emotional state to improve your NFI score."],
          learned_scores: {}
        };
      }
      
      console.log('Setting nudges:', nud);
      setNudges(nud.nudges || []);
      setScores(nud.learned_scores || {});
    } catch (e) {
      console.error('Compute error:', e);
      // Always compute locally as fallback
      const loc = doLocal();
      console.log('Fallback local computation:', loc);
      
      setRes(loc);
      setExplain(localExplain(payload));
      const ln = localNudges(loc.nfi, loc.triggers || {});
      
      // Ensure we have nudges even in error case
      if (!ln || !ln.nudges || ln.nudges.length === 0) {
        const defaultNudges = {
          nudges: loc.nfi >= 70 
            ? ["Great balance! Consider nudging NFI +5 with a small, auto-scheduled investment today."]
            : ["Review your financial inputs and emotional state to improve your NFI score."],
          learned_scores: {}
        };
        setNudges(defaultNudges.nudges);
        setScores(defaultNudges.learned_scores);
      } else {
        setNudges(ln.nudges || []);
        setScores(ln.learned_scores || {});
      }
      setBackendOnline(false);
      setNetError(String(e?.message || e));
      
      // Still save locally computed result if user is logged in (non-blocking)
      if (user && isSupabaseAvailable) {
        SupabaseService.saveNFIHistory(user.id, payload, loc, 'local').catch(err => {
          console.warn("Failed to save locally:", err);
        });
      }
    } finally {
      setLoading(false);
      
      // Trigger unique features calculations after compute (non-blocking)
      // Don't await these - they run in background and won't block UI
      if (user && isSupabaseAvailable) {
        // Run these asynchronously without blocking
        setTimeout(async () => {
          try {
            // Calculate emotional risk score (with timeout)
            Promise.race([
              SupabaseService.calculateEmotionalRiskScore(user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]).catch(err => {
              console.warn("Risk score calculation timeout or error:", err);
            });
            
            // Check recovery mode (with timeout)
            Promise.race([
              SupabaseService.checkRecoveryMode(user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]).catch(err => {
              console.warn("Recovery mode check timeout or error:", err);
            });
            
            // Calculate emotion-spend correlations (async, don't wait)
            SupabaseService.calculateEmotionSpendCorrelation(user.id, 'stress', 30).catch(err => {
              console.warn("Correlation calculation error:", err);
            });
          } catch (err) {
            console.error("Error in unique features calculation:", err);
          }
        }, 100); // Small delay to ensure UI updates first
      }
    }
  }

  // Handler for profile updates (used by unique features)
  const handleProfileUpdate = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  }

  async function sendFeedback(key, reward) {
    if (user && isSupabaseAvailable) {
      await SupabaseService.saveFeedback(user.id, key, reward);
    } else {
      const r = await apiJSON("/feedback", { method: "POST", body: { nudge_key: key, reward } });
      if (!r.ok) {
        const scores = loadNudgeScores();
        scores[key] = (scores[key] || 0) + reward;
        saveNudgeScores(scores);
      }
    }
    await compute();
  }

  const handleAuthSuccess = async () => {
    const { data: { user } } = await (await import("@/lib/supabase")).supabase.auth.getUser();
    if (user) {
      setUser(user);
      await loadUserProfile(user.id);
    }
  };

  const handleSignOut = async () => {
    try {
      // Call the auth service to sign out
      const { supabase } = await import("@/lib/supabase");
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Error signing out:", err);
    }
    
    // Clear local state
    setUser(null);
    setProfile(null);
    setHistory([]);
    setStreak(0);
    setRes(null);
    setExplain(null);
    setNudges([]);
    setScores({});
    setAlerts([]);
  };

  return (
    <div className="relative mx-auto max-w-7xl p-4 md:p-6 space-y-4">
      <AccentBg theme={theme} />
      <Header 
        dark={dark} 
        setDark={setDark} 
        theme={theme} 
        setTheme={setTheme}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
        onAuthClick={() => setAuthModalOpen(true)}
        onSettingsClick={() => setActiveTab("settings")}
      />
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Connectivity banner */}
      {backendOnline === false && (
        <div className="rounded-xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 text-xs flex items-center gap-2">
          <WifiOff className="h-3.5 w-3.5"/> Remote API unreachable; running <b>Local Compute Mode</b>.
          {netError && <span className="text-muted-foreground"> · {String(netError)}</span>}
        </div>
      )}
      {backendOnline === true && (
        <div className="rounded-xl border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 text-xs flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5"/> Connected to remote API.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="dashboard">
        <TabsList className="mt-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard
            income={income} setIncome={setIncome}
            spend={spend} setSpend={setSpend}
            savings={savings} setSavings={setSavings}
            debt={debt} setDebt={setDebt}
            od={od} setOd={setOd}
            vol={vol} setVol={setVol}
            adh={adh} setAdh={setAdh}
            text={text} setText={setText}
            stress={stress} setStress={setStress}
            sleep={sleep} setSleep={setSleep}
            res={res}
            explain={explain}
            nudges={nudges}
            scores={scores}
            loading={loading}
            alerts={alerts}
            history={history}
            streak={streak}
            compute={compute}
            sendFeedback={sendFeedback}
            forceMode={forceMode}
            setForceMode={setForceMode}
            autoExplain={autoExplain}
            setAutoExplain={setAutoExplain}
            theme={theme}
            user={user}
            onProfileUpdate={handleProfileUpdate}
          />
        </TabsContent>

        {/* PLANNER */}
        <TabsContent value="planner" className="space-y-4">
          <Planner
            payload={payload}
            deltaAdh={deltaAdh}
            setDeltaAdh={setDeltaAdh}
            deltaSpend={deltaSpend}
            setDeltaSpend={setDeltaSpend}
            deltaVol={deltaVol}
            setDeltaVol={setDeltaVol}
            simNfi={simNfi}
            setSimNfi={setSimNfi}
            res={res}
            adh={adh}
            setAdh={setAdh}
            theme={theme}
          />
        </TabsContent>

        {/* INSIGHTS */}
        <TabsContent value="insights" className="space-y-4">
          <Insights
            csv={csv}
            setCsv={setCsv}
            catTotals={catTotals}
            setCatTotals={setCatTotals}
            setSpend={setSpend}
            setVol={setVol}
            theme={theme}
            user={user}
            isSupabaseAvailable={isSupabaseAvailable}
          />
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4">
          <Settings />
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground text-center pt-4">
        Prototype v0.8.6 • Fixed missing &lt;/Badge&gt; close in Planner → Simulated banner • Completed JSX • Added diagnostics • Pro palettes • CSV Insights • Quick actions • Connectivity-safe compute()
      </div>
    </div>
  );
}

