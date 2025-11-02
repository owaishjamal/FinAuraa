/**
 * Header component
 */

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Brain, Shield, Paintbrush, Sun, Moon, LogIn } from "lucide-react";
import { palette } from "@/constants/palette";
import { UserProfile } from "./UserProfile";

export function Header({ dark, setDark, theme, setTheme, user, profile, onSignOut, onAuthClick, onSettingsClick }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${palette[theme].grad} flex items-center justify-center ${palette[theme].ring}`}>
            <Brain className="h-5 w-5 text-white" />
          </div>
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FinAura NeuroFin</h1>
          <p className="text-sm text-muted-foreground">Emotion-aware financial wellness • AI-Powered</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="hidden md:flex">
          <Shield className="mr-1 h-3 w-3" />Privacy-First
        </Badge>
        <div className="hidden md:flex items-center gap-2 mr-2 text-xs text-muted-foreground">
          <Paintbrush className="h-4 w-4"/>
          <select className="bg-transparent outline-none" value={theme} onChange={(e)=>setTheme(e.target.value)}>
            <option value="indigo">Indigo</option>
            <option value="emerald">Emerald</option>
            <option value="amber">Amber</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <Switch checked={dark} onCheckedChange={setDark} />
          <Moon className="h-4 w-4" />
        </div>
        {user ? (
          <UserProfile user={user} profile={profile} onSignOut={onSignOut} onSettingsClick={onSettingsClick} />
        ) : (
          <Button variant="outline" onClick={onAuthClick} className="ml-2">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}

