import React from 'react';
import { WorkoutData } from '../types/workout';
import generateSVG from '../utils/svgGenerator';

interface WorkoutChartProps {
    data: WorkoutData;
}

const WorkoutChart: React.FC<WorkoutChartProps> = ({ data }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 3057 370.7"
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
        >
            {generateSVG({ indoorData: data, outdoorData: data }, 'indoor')}
        </svg>
    );
};

export default WorkoutChart;