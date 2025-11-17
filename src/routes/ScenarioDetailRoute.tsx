import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ScenarioDetailsView from '../components/ScenarioDetailsView';
import { Scenario } from '../types/scenario';
import { UserPowerProfile } from '../types/userProfile';
import { loadScenarios, saveScenarios } from '../utils/scenarioHelpers';

interface ScenarioDetailRouteProps {
    userProfile: UserPowerProfile;
    scenarios: Scenario[];
    onScenariosUpdate: (scenarios: Scenario[]) => void;
}

const ScenarioDetailRoute: React.FC<ScenarioDetailRouteProps> = ({ 
    userProfile, 
    scenarios, 
    onScenariosUpdate 
}) => {
    const { scenarioId } = useParams<{ scenarioId: string }>();
    const navigate = useNavigate();
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (scenarioId && scenarios.length > 0) {
            const scenario = scenarios.find(s => s.id === scenarioId);
            if (scenario) {
                setSelectedScenario(scenario);
                setLoading(false);
            } else {
                // If scenario not found, try reloading scenarios from localStorage
                const savedScenarios = loadScenarios();
                const foundScenario = savedScenarios.find(s => s.id === scenarioId);
                if (foundScenario) {
                    setSelectedScenario(foundScenario);
                    // Update parent component with fresh scenarios
                    onScenariosUpdate(savedScenarios);
                } else {
                    // Scenario doesn't exist, redirect to scenarios page
                    console.warn(`Scenario ${scenarioId} not found, redirecting to scenarios page`);
                    navigate('/scenarios');
                }
                setLoading(false);
            }
        } else if (scenarioId && scenarios.length === 0) {
            // Scenarios not loaded yet, try loading from localStorage
            const savedScenarios = loadScenarios();
            const foundScenario = savedScenarios.find(s => s.id === scenarioId);
            if (foundScenario) {
                setSelectedScenario(foundScenario);
                onScenariosUpdate(savedScenarios);
            } else {
                navigate('/scenarios');
            }
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [scenarioId, scenarios, navigate, onScenariosUpdate]);

    const handleScenarioUpdate = (updatedScenario: Scenario) => {
        setSelectedScenario(updatedScenario);
        // Update the scenarios list in case we go back
        const updatedScenarios = scenarios.map(s => 
            s.id === updatedScenario.id ? updatedScenario : s
        );
        onScenariosUpdate(updatedScenarios);
        saveScenarios(updatedScenarios);
    };

    if (loading) {
        return <div>Loading scenario...</div>;
    }

    if (!selectedScenario) {
        return <div>Scenario not found</div>;
    }

    return (
        <ScenarioDetailsView
            scenario={selectedScenario}
            userProfile={userProfile}
            onBack={() => navigate('/scenarios')}
            onScenarioUpdate={handleScenarioUpdate}
        />
    );
};

export default ScenarioDetailRoute;