import React, { createContext, useContext, ReactNode } from 'react';

// Define the possible tab IDs
export type TabId =
    | 'dashboard'
    | 'soap'
    | 'network'
    | 'plan'
    | 'forms'
    | 'anamnesis'
    | 'formulation'
    | 'curation'
    | 'evolution'
    | 'alchemy'
    | 'copilot'
    | 'eells'
    | 'prontuario'
    | 'library';

interface NavigationContextType {
    activeTab: TabId;
    navigateTo: (tab: TabId) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
    children: ReactNode;
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
    children,
    activeTab,
    setActiveTab
}) => {
    const navigateTo = (tab: TabId) => {
        setActiveTab(tab);
        // Scroll to top when navigating
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <NavigationContext.Provider value={{ activeTab, navigateTo }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

// Helper component for navigation buttons/links
interface NavigationLinkProps {
    to: TabId;
    children: ReactNode;
    className?: string;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({ to, children, className = '' }) => {
    const { navigateTo } = useNavigation();

    return (
        <button
            onClick={() => navigateTo(to)}
            className={`cursor-pointer hover:underline transition-colors ${className}`}
        >
            {children}
        </button>
    );
};
