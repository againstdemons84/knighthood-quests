import React from 'react';
import { createRoot } from 'react-dom/client';
import WorkoutChart from './components/WorkoutChart';
import sampleData from './data/sample-data.json';
import userData from './data/user.json';

const App = () => {
    const workoutData = sampleData.data.workoutGraphTriggers.indoor;
    const userProfile = userData.data.impersonateUser.user.profiles.riderProfile;
    
    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
            <h1 style={{ color: 'white', marginBottom: '20px' }}>Workout SVG Generator</h1>
            <WorkoutChart 
                workoutData={workoutData} 
                userProfile={userProfile}
                height={300}
            />
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);