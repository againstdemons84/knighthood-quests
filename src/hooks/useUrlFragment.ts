import { useState, useEffect } from 'react';

export type AppPage = 'intro' | 'selector' | 'scenarios' | 'scenario-detail' | 'profile-setup' | 'profile-manager' | 'profile' | 'shared-scenario';

interface UseUrlFragmentResult {
    currentPage: AppPage;
    scenarioId: string | null;
    sharedScenarioData: { workoutIds: string[]; name: string } | null;
    setPage: (page: AppPage, scenarioId?: string) => void;
}

export const useUrlFragment = (): UseUrlFragmentResult => {
    const [currentPage, setCurrentPage] = useState<AppPage>('intro');
    const [scenarioId, setScenarioId] = useState<string | null>(null);
    const [sharedScenarioData, setSharedScenarioData] = useState<{ workoutIds: string[]; name: string } | null>(null);

    // Parse the current hash on mount and hash changes
    useEffect(() => {
        const parseHash = () => {
            const hash = window.location.hash.substring(1); // Remove the '#'
            
            if (!hash) {
                setCurrentPage('intro');
                setScenarioId(null);
                setSharedScenarioData(null);
                return;
            }

            // Handle different fragment patterns
            if (hash === 'plan') {
                setCurrentPage('selector');
                setScenarioId(null);
            } else if (hash === 'scenarios') {
                setCurrentPage('scenarios');
                setScenarioId(null);
            } else if (hash === 'profile') {
                setCurrentPage('profile');
                setScenarioId(null);
            } else if (hash.startsWith('scenario/')) {
                const id = hash.replace('scenario/', '');
                setCurrentPage('scenario-detail');
                setScenarioId(id);
            } else if (hash.startsWith('shared/')) {
                // Handle shared scenario format: shared/workoutId1,workoutId2,.../ScenarioName
                const parts = hash.replace('shared/', '').split('/');
                if (parts.length >= 2) {
                    const workoutIds = parts[0].split(',').filter(id => id.trim());
                    const scenarioName = decodeURIComponent(parts.slice(1).join('/'));
                    setSharedScenarioData({ workoutIds, name: scenarioName });
                    setCurrentPage('shared-scenario');
                    setScenarioId(null);
                }
            } else {
                // Default to intro for unrecognized hashes
                setCurrentPage('intro');
                setScenarioId(null);
                setSharedScenarioData(null);
            }
        };

        // Parse hash on mount
        parseHash();

        // Listen for hash changes
        const handleHashChange = () => {
            parseHash();
        };

        window.addEventListener('hashchange', handleHashChange);
        
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    const setPage = (page: AppPage, id?: string) => {
        let hash = '';
        
        switch (page) {
            case 'intro':
                hash = '';
                break;
            case 'selector':
                hash = 'plan';
                break;
            case 'scenarios':
                hash = 'scenarios';
                break;
            case 'profile':
                hash = 'profile';
                break;
            case 'scenario-detail':
                if (id) {
                    hash = `scenario/${id}`;
                } else {
                    hash = 'scenarios'; // Fallback to scenarios list
                }
                break;
            case 'shared-scenario':
                // This should be set directly via URL, not through navigation
                break;
            default:
                hash = '';
        }

        // Update URL without triggering a page reload
        if (hash) {
            window.location.hash = hash;
        } else {
            // Remove hash entirely for intro page
            window.history.replaceState('', document.title, window.location.pathname + window.location.search);
            // Manually trigger state update since replaceState doesn't trigger hashchange
            setCurrentPage('intro');
            setScenarioId(null);
            setSharedScenarioData(null);
        }
    };

    return {
        currentPage,
        scenarioId,
        sharedScenarioData,
        setPage
    };
};