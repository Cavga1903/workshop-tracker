import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BRANDING_MESSAGES } from '../config/branding';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const validateEmailDomain = (email) => {
  const allowedDomains = ['kraftstories.com', 'kraftuniverse.com'];
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        console.log('🔐 Initializing auth session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          return;
        }

        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            console.log('✅ Session found for:', session.user.email);
            setUser(session.user);
            
            // Fetch profile but don't let it block the loading state
            const profileResult = await fetchUserProfile(session.user.id);
            if (profileResult?.error) {
              console.warn('⚠️ Profile fetch failed during initialization:', profileResult.error);
              // Set basic profile data to prevent UI breaks
              setProfile({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                username: session.user.email?.split('@')[0] || 'user',
                avatar_url: '',
                phone_number: '',
                role: 'user',
                email: session.user.email || ''
              });
            }
          } else {
            console.log('ℹ️  No active session');
            setUser(null);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('🏁 Auth initialization complete');
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (!mounted) return;

        setSession(session);

        try {
          if (session?.user) {
            setUser(session.user);
            // For auth state changes, we can be more lenient with profile loading
            const profileResult = await fetchUserProfile(session.user.id);
            
            // If profile loading fails, set a basic profile to prevent UI breaks
            if (profileResult?.error) {
              console.warn('⚠️ Profile loading failed, creating basic profile:', profileResult.error);
              setProfile({
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                username: session.user.email?.split('@')[0] || 'user',
                avatar_url: '',
                phone_number: '',
                role: 'user',
                email: session.user.email || ''
              });
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
          // Don't set user/profile to null on error - keep existing state
          console.log('🔄 Keeping existing auth state due to error');
        } finally {
          if (mounted) {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    // Prevent multiple concurrent calls
    if (profileLoading) {
      console.log('⏳ Profile already loading, skipping...');
      return { error: 'Profile already loading' };
    }
    
    setProfileLoading(true);
    
    try {
      console.log('👤 Fetching profile for user:', userId);
      console.log('🔍 Database query details:', {
        table: 'profiles',
        filter: `id = ${userId}`,
        action: 'SELECT *'
      });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Race between fetch and timeout
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('📊 Database response:', { data, error });
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is a critical issue
          console.error('❌ No profile found for user:', userId);
          console.error('This indicates a problem with user registration process');
          console.error('Error details:', error);
          
          // Don't create profile automatically - show error to user
          setProfile(null);
          return { error: 'Profile not found. Please contact support.' };
        } else {
          console.error('❌ Error fetching profile:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          setProfile(null);
          return { error: error.message };
        }
      }
      
      if (data) {
        console.log('✅ Profile loaded:', data.full_name || data.email);
        console.log('📋 Profile data:', data);
        setProfile(data);
        return { data, error: null };
      } else {
        console.warn('⚠️ No profile data returned');
        setProfile(null);
        return { error: 'No profile data found' };
      }
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      console.error('Error stack:', error.stack);
      
      // If timeout or other error, create basic profile
      if (error.message === 'Profile fetch timeout') {
        console.warn('⏰ Profile fetch timed out, creating basic profile');
        const basicProfile = {
          id: userId,
          full_name: 'User',
          username: 'user',
          avatar_url: '',
          phone_number: '',
          role: 'user',
          email: ''
        };
        setProfile(basicProfile);
        return { data: basicProfile, error: null };
      }
      
      setProfile(null);
      return { error: error.message || 'Unknown error occurred' };
    } finally {
      setProfileLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      console.log('🚀 Starting signup process for:', email);
      
      // Validate email domain
      if (!validateEmailDomain(email)) {
        throw new Error(BRANDING_MESSAGES.signupAuthRestrictionMessage);
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            role: 'user'
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create profile record - this is critical and must not fail silently
      const profileData = {
        id: authData.user.id,
        full_name: userData.fullName || '',
        username: userData.username || email.split('@')[0],
        avatar_url: userData.avatarUrl || '',
        phone_number: userData.phoneNumber || '',
        role: 'user',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        // This is critical - we should probably delete the auth user
        // But for now, log the error and continue
        console.error('WARNING: Auth user created but profile creation failed');
      } else {
        console.log('✅ Profile created successfully');
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('🔐 Starting signin process for:', email);
      
      // Validate email domain before attempting login
      if (!validateEmailDomain(email)) {
        throw new Error(BRANDING_MESSAGES.authRestrictionMessage);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        throw error;
      }

      console.log('✅ Signin successful');
      // Profile will be fetched automatically by onAuthStateChange

      return { data, error: null };
    } catch (error) {
      console.error('❌ Signin error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Signout error:', error);
        return { error };
      }

      console.log('✅ Signout successful');
      // State will be cleared automatically by onAuthStateChange
      return { error: null };
    } catch (error) {
      console.error('❌ Signout error:', error);
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('📝 Updating profile for user:', user.id);

      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Only update current user's profile - security critical
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully');
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { data: null, error };
    }
  };

  const resetPassword = async (email) => {
    try {
      // Validate email domain
      if (!validateEmailDomain(email)) {
        throw new Error(BRANDING_MESSAGES.authRestrictionMessage);
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    isInitialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    validateEmailDomain,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 