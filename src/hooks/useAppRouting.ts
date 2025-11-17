import { useNavigate, useLocation, useParams } from 'react-router-dom';

export type AppPage = 'intro' | 'selector' | 'scenarios' | 'scenario-detail' | 'profile-setup' | 'profile-manager' | 'profile' | 'shared-scenario';

interface UseAppRoutingResult {
    currentPage: AppPage;
    scenarioId: string | null;
    sharedScenarioData: { workoutIds: string[]; name: string } | null;
    setPage: (page: AppPage, scenarioId?: string) => void;
}

export const useAppRouting = (): UseAppRoutingResult => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    // Determine current page from pathname
    const getCurrentPage = (): AppPage => {
        const path = location.pathname;
        
        if (path === '/' || path === '') {
            return 'intro';
        } else if (path === '/plan') {
            return 'selector';
        } else if (path === '/scenarios') {
            return 'scenarios';
        } else if (path === '/profile') {
            return 'profile';
        } else if (path.startsWith('/scenario/')) {
            return 'scenario-detail';
        } else if (path.startsWith('/share/')) {
            return 'shared-scenario';
        }
        
        return 'intro';
    };

    // Get scenario ID from URL params
    const getScenarioId = (): string | null => {
        if (params.scenarioId) {
            return params.scenarioId;
        }
        return null;
    };

    // Parse shared scenario data from URL search params
    const getSharedScenarioData = (): { workoutIds: string[]; name: string } | null => {
        if (location.pathname.startsWith('/share/')) {
            const searchParams = new URLSearchParams(location.search);
            const workoutsParam = searchParams.get('workouts');
            const nameParam = searchParams.get('name');
            
            if (workoutsParam && nameParam) {
                try {
                    const workoutIds = workoutsParam.split(',');
                    return {
                        workoutIds,
                        name: decodeURIComponent(nameParam)
                    };
                } catch (error) {
                    console.error('Error parsing shared scenario data:', error);
                }
            }
        }
        return null;
    };

    const setPage = (page: AppPage, scenarioId?: string) => {
        switch (page) {
            case 'intro':
                navigate('/');
                break;
            case 'selector':
                navigate('/plan');
                break;
            case 'scenarios':
                navigate('/scenarios');
                break;
            case 'profile':
                navigate('/profile');
                break;
            case 'scenario-detail':
                if (scenarioId) {
                    navigate(`/scenario/${scenarioId}`);
                } else {
                    navigate('/scenarios');
                }
                break;
            default:
                navigate('/');
                break;
        }
    };

    return {
        currentPage: getCurrentPage(),
        scenarioId: getScenarioId(),
        sharedScenarioData: getSharedScenarioData(),
        setPage
    };
};