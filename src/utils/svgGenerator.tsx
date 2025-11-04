import React from 'react';
import { WorkoutData } from '../types/workout';

interface SvgGeneratorProps {
    indoorData: WorkoutData;
    outdoorData: WorkoutData;
}

const SvgGenerator: React.FC<SvgGeneratorProps> = ({ indoorData, outdoorData }) => {
    const renderRectangles = (data: { time: number[]; value: number[] }, color: string) => {
        return data.time.map((t, index) => (
            <rect
                key={index}
                x={t}
                y={300 - data.value[index] * 300} // Scale value for SVG height
                width={10}
                height={data.value[index] * 300}
                fill={color}
            />
        ));
    };

    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3057 370" preserveAspectRatio="none">
            {renderRectangles(indoorData, '#0BBEEB')}
            {renderRectangles(outdoorData, '#FFC500')}
        </svg>
    );
};

export default SvgGenerator;