import React from 'react';
import { createRoot } from 'react-dom/client';
import WorkoutChart from './components/WorkoutChart';
import sampleData from './examples/sample-data.json';

const App = () => {
    return (
        <div>
            <h1>Workout SVG Generator</h1>
            <WorkoutChart data={sampleData.data.workoutGraphTriggers.indoor} />
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);