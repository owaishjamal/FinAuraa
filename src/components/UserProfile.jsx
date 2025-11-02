/**
 * User Profile Component
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Settings, Trophy, TrendingUp } from "lucide-react";
import { AuthService } from "@/lib/auth";

export function UserProfile({ user, profile, onSignOut, onSettingsClick }) {
  const initials = user?.email?.substring(0, 2).toUpperCase() || "U";
  const name = profile?.full_name || user?.email?.split("@")[0] || "User";
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleSignOut = async () => {
    setDropdownOpen(false); // Close dropdown
    try {
      const result = await AuthService.signOut();
      if (result.ok || !result.error) {
        onSignOut?.();
      } else {
        console.error("Sign out error:", result.error);
        // Still clear local state even if Supabase sign out fails
        onSignOut?.();
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Still clear local state even if sign out fails
      onSignOut?.();
    }
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false); // Close dropdown
    onSettingsClick?.();
  };

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profile && (
          <>
            <DropdownMenuItem>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Average NFI: {profile.average_nfi?.toFixed(1) || "N/A"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trophy className="mr-2 h-4 w-4" />
              <span>Streak: {profile.journal_streak || 0} days</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

