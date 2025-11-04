import React from 'react';
import { WorkoutData } from '../types/workout';
import { UserProfile } from '../types/user';

const getColorByType = (type: string, intensity: number): string => {
    switch (type) {
        case 'NM':
            return '#FF1493'; // Pink/magenta for Neuromuscular Power
        case 'AC':
            return '#FFA500'; // Orange for Anaerobic Capacity
        case 'MAP':
            return '#FFD700'; // Gold for Maximum Aerobic Power
        case 'FTP':
        default:
            return '#0BBEEB'; // Blue for Functional Threshold Power
    }
};

export const generateSVG = (workoutData: WorkoutData, userProfile?: UserProfile) => {
    const { time, value, type } = workoutData;
    const maxTime = Math.max(...time);
    const svgWidth = 3057;
    const svgHeight = 370.7;
    const chartHeight = 250; // Height available for the chart
    const chartTop = 50; // Top margin for the chart
    
    const elements = [];
    
    // Add dark background
    elements.push(
        React.createElement('rect', {
            key: 'background',
            x: 0,
            y: 0,
            width: svgWidth,
            height: svgHeight,
            fill: '#2a2a2a'
        })
    );
    
    // Generate workout bars
    for (let i = 0; i < time.length - 1; i++) {
        const startTime = time[i];
        const endTime = time[i + 1];
        const intensity = value[i];
        const workoutType = type[i];
        
        // Calculate position and dimensions
        const x = (startTime / maxTime) * svgWidth;
        const rectWidth = Math.max(1, ((endTime - startTime) / maxTime) * svgWidth);
        
        // Calculate height based on intensity
        const rectHeight = intensity * chartHeight;
        const y = chartTop + chartHeight - rectHeight;
        
        // Get color based on workout type
        const fillColor = getColorByType(workoutType, intensity);
        
        elements.push(
            React.createElement('rect', {
                key: `bar-${i}`,
                x: x,
                y: y,
                width: rectWidth,
                height: rectHeight,
                fill: fillColor
            })
        );
    }
    
    // Add baseline
    elements.push(
        React.createElement('rect', {
            key: 'baseline',
            x: 0,
            y: chartTop + chartHeight,
            width: svgWidth,
            height: 2,
            fill: '#666'
        })
    );
    
    // Add power zones indicators if user profile is available
    if (userProfile) {
        const ftp = userProfile.ftp;
        
        // Add FTP reference line
        const ftpY = chartTop + chartHeight - (chartHeight * 1.0); // FTP at 100%
        elements.push(
            React.createElement('line', {
                key: 'ftp-line',
                x1: 0,
                y1: ftpY,
                x2: svgWidth,
                y2: ftpY,
                stroke: '#0BBEEB',
                strokeWidth: 1,
                strokeDasharray: '5,5'
            })
        );
        
        // Add power text
        elements.push(
            React.createElement('text', {
                key: 'power-text',
                x: 50,
                y: chartTop + chartHeight + 30,
                fill: '#fff',
                fontSize: '24',
                fontFamily: 'Arial, sans-serif'
            }, `${ftp} W`)
        );
    }
    
    return elements;
};

export const generateWorkoutHeader = (workoutData: WorkoutData, userProfile?: UserProfile) => {
    const maxTime = Math.max(...workoutData.time);
    const duration = Math.floor(maxTime / 60); // Convert to minutes
    const avgIntensity = workoutData.value.reduce((a, b) => a + b, 0) / workoutData.value.length;
    
    const headerElements = [];
    
    // Duration
    headerElements.push(
        React.createElement('text', {
            key: 'duration-label',
            x: 50,
            y: 30,
            fill: '#999',
            fontSize: '14',
            fontFamily: 'Arial, sans-serif'
        }, 'Duration')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'duration-value',
            x: 50,
            y: 50,
            fill: '#fff',
            fontSize: '24',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`)
    );
    
    // TSS (Training Stress Score) - approximated
    const tss = Math.round(avgIntensity * 100);
    headerElements.push(
        React.createElement('text', {
            key: 'tss-label',
            x: 200,
            y: 30,
            fill: '#999',
            fontSize: '14',
            fontFamily: 'Arial, sans-serif'
        }, 'TSS®')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'tss-value',
            x: 200,
            y: 50,
            fill: '#fff',
            fontSize: '24',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, tss.toString())
    );
    
    // IF (Intensity Factor)
    headerElements.push(
        React.createElement('text', {
            key: 'if-label',
            x: 350,
            y: 30,
            fill: '#999',
            fontSize: '14',
            fontFamily: 'Arial, sans-serif'
        }, 'IF®')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'if-value',
            x: 350,
            y: 50,
            fill: '#fff',
            fontSize: '24',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, avgIntensity.toFixed(2))
    );
    
    return headerElements;
};