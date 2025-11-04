import React from 'react';
import { WorkoutData } from '../types/workout';
import { UserProfile } from '../types/user';
import { generateSVG, generateWorkoutHeader } from '../utils/svgGenerator';

interface WorkoutChartProps {
    workoutData: WorkoutData;
    userProfile?: UserProfile;
    width?: number;
    height?: number;
}

const WorkoutChart: React.FC<WorkoutChartProps> = ({ 
    workoutData, 
    userProfile,
    width = 800, 
    height = 200 
}) => {
    return (
        <div style={{ width: '100%', height: height, backgroundColor: '#2a2a2a' }}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 3057 370.7"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: '100%' }}
            >
                {generateWorkoutHeader(workoutData, userProfile)}
                {generateSVG(workoutData, userProfile)}
            </svg>
        </div>
    );
};

export default WorkoutChart;