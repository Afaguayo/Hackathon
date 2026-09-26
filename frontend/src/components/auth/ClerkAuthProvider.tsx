import React, { createContext, useContext, useState } from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface DemoAuthContextType {
  isSignedIn: boolean;
  userName: string;
  login: () => void;
  logout: () => void;
}

const DemoAuthContext = createContext<DemoAuthContextType>({
  isSignedIn: true,
  userName: 'Gael',
  login: () => {},
  logout: () => {},
});

export const useDemoAuth = () => useContext(DemoAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState(true);

  if (CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        {children}
      </ClerkProvider>
    );
  }

  // Fallback de desarrollo amigable cuando aún no se ha configurado la clave en .env.local
  return (
    <DemoAuthContext.Provider
      value={{
        isSignedIn,
        userName: 'Gael (Lector)',
        login: () => setIsSignedIn(true),
        logout: () => setIsSignedIn(false),
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
};

export const UserAuthControls: React.FC = () => {
  if (CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    return (
      <div className="flex items-center gap-2">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-3 py-1.5 text-sm font-semibold rounded-md border border-line-strong text-ink hover:bg-paper-sunk transition-colors duration-states">
              Iniciar sesión
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    );
  }

  // Render demo auth controls
  return <DemoUserControls />;
};

const DemoUserControls: React.FC = () => {
  const { isSignedIn, userName, login, logout } = useDemoAuth();

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-reed-soft text-ink flex items-center justify-center font-bold text-xs border border-line">
            {userName.charAt(0)}
          </span>
          <span className="text-sm font-medium text-ink hidden sm:inline">{userName}</span>
        </div>
        <button
          onClick={logout}
          title="Simular cerrar sesión de Clerk"
          className="text-xs text-ink-muted hover:text-ink transition-colors underline"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-3 py-1.5 text-sm font-semibold rounded-md border border-line-strong text-ink hover:bg-paper-sunk transition-colors duration-states"
    >
      Iniciar sesión
    </button>
  );
};
