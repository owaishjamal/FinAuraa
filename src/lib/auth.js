/**
 * Authentication service using Supabase
 */

import { supabase, isSupabaseConfigured } from './supabase';

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email, password, fullName = '') {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }

    try {
      console.log('Starting signup for:', email);
      
      // Add timeout to prevent hanging
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      // Wrap in a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup request timed out after 15 seconds. Please check your connection or try again.')), 15000)
      );

      let data, error;
      try {
        const result = await Promise.race([signupPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
        console.log('Signup response received:', { hasUser: !!data?.user, hasSession: !!data?.session, error: error?.message });
      } catch (raceError) {
        console.error('Signup promise race error:', raceError);
        throw raceError;
      }

      if (error) {
        // Handle specific errors
        let errorMessage = error.message;
        
        // Check if it's a server error (500) - might be trigger issue
        if (error.status === 500 || error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
          console.error('Server error during signup (likely trigger issue):', error);
          // Still check if user was created despite the error
          if (data?.user) {
            console.warn('User may have been created despite server error');
            errorMessage = 'Account may have been created but profile setup failed. Try signing in.';
          } else {
            errorMessage = 'Server error during signup. Please check database trigger configuration.';
          }
        } else if (error.message?.includes('email') || error.message?.includes('already')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message?.includes('password')) {
          errorMessage = 'Password does not meet requirements. Please use a stronger password.';
        }
        
        throw new Error(errorMessage);
      }

      // Create or update profile if user created and session exists
      // Note: Database trigger should create profile automatically, but we'll ensure it has full_name
      // Use non-blocking approach - don't wait for profile creation to complete
      if (data.user && data.session) {
        // Session exists, so we're authenticated - try to update profile with full_name
        // Do this asynchronously so it doesn't block signup
        (async () => {
          try {
            // Wait a bit for the database trigger to potentially fire first
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check if profile exists, then update it with full_name
            const profileData = {
              email: email,
              full_name: fullName || null,
              updated_at: new Date().toISOString()
            };

            // Try to update the profile (trigger should have created it)
            const { error: updateError } = await supabase
              .from('profiles')
              .update(profileData)
              .eq('id', data.user.id);

            if (updateError) {
              // If update fails, profile might not exist yet - try insert
              console.warn('Profile update failed, trying insert:', updateError.message);
              
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email: email,
                  full_name: fullName || null
                });
              
              if (insertError) {
                // Profile might already exist or trigger is handling it
                console.warn('Profile insert also failed (may be handled by trigger):', insertError.message);
              }
            }
          } catch (profileErr) {
            console.warn('Profile update encountered an error (user still created):', profileErr);
            // Don't fail the signup - user is created, profile will be created by trigger
          }
        })();
      } else if (data.user && !data.session) {
        // No session yet (email confirmation required)
        // The database trigger will create the profile automatically
        // We'll update it with full_name when they sign in
        console.log('User created, waiting for email confirmation. Profile will be created by trigger.');
      }

      return { ok: true, user: data.user, session: data.session };
    } catch (error) {
      console.error('Signup error:', error);
      // Even if there was an error, check if user was created
      // Sometimes Supabase creates the user but returns an error if trigger fails
      if (error.message?.includes('may have been created') || error.message?.includes('profile setup failed')) {
        // User might exist - return partial success
        return { ok: true, user: null, session: null, warning: error.message };
      }
      return { ok: false, error: error.message };
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(email, password) {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Provide more specific error messages
        let errorMessage = error.message;
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('Email not confirmed') || error.message.includes('confirm')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email. Please sign up first.';
        }
        
        throw new Error(errorMessage);
      }

      // Ensure profile exists after sign-in (in case it wasn't created during signup)
      if (data.user && data.session) {
        try {
          // Wait a moment for any trigger to potentially fire
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

          // If profile doesn't exist (no data or PGRST116 error), create it
          const profileNotFound = profileError && (
            profileError.code === 'PGRST116' || // Not found error code
            profileError.message?.includes('No rows') ||
            profileError.message?.includes('found')
          ) || (!profileError && !profile);
          
          if (profileNotFound) {
            console.log('Profile not found, creating it now...');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || email,
                full_name: data.user.user_metadata?.full_name || null
              });

            if (insertError) {
              console.error('Failed to create profile on sign-in:', insertError);
              console.error('Error details:', {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
              });
              
              // Try to get more details about the error
              if (insertError.code === '23505') {
                console.log('Profile might already exist (duplicate key error) - checking again...');
                // Profile might have been created by trigger between checks
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', data.user.id)
                  .maybeSingle();
                if (retryProfile) {
                  console.log('Profile found on retry!');
                }
              } else if (insertError.code === '42501') {
                console.error('RLS policy error - check your Row Level Security policies');
                console.error('Make sure you have INSERT policy with: USING (auth.uid() = id)');
              } else {
                // Try once more with a longer delay (trigger might still be processing)
                console.log('Retrying profile creation after delay...');
                await new Promise(resolve => setTimeout(resolve, 500));
                const { error: retryError } = await supabase
                  .from('profiles')
                  .insert({
                    id: data.user.id,
                    email: data.user.email || email,
                    full_name: data.user.user_metadata?.full_name || null
                  });
                if (retryError) {
                  console.error('Retry also failed:', retryError);
                } else {
                  console.log('Profile created successfully on retry');
                }
              }
            } else {
              console.log('Profile created successfully on sign-in');
            }
          } else {
            console.log('Profile exists for user');
          }
        } catch (profileErr) {
          console.error('Error checking/creating profile on sign-in:', profileErr);
          // Don't fail sign-in if profile creation fails - but log it
        }
      } else {
        console.warn('Sign-in succeeded but no user or session returned');
        if (!data.user) {
          throw new Error('Sign-in failed: No user data returned');
        }
        if (!data.session) {
          throw new Error('Sign-in failed: No session created. Please verify your email first.');
        }
      }

      return { ok: true, user: data.user, session: data.session };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut() {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    if (!isSupabaseConfigured()) {
      return { ok: false, user: null };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { ok: true, user };
    } catch (error) {
      return { ok: false, user: null, error: error.message };
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    if (!isSupabaseConfigured()) {
      return { ok: false, session: null };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { ok: true, session };
    } catch (error) {
      return { ok: false, session: null, error: error.message };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: null }, error: null };
    }

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Reset password
   */
  static async resetPassword(email) {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}

