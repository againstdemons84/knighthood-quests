import React from 'react';
import { WorkoutData } from '../types/workout';
import { UserProfile } from '../types/user';

const getColorByType = (type: string): string => {
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

const getPowerZoneMultiplier = (type: string): number => {
    switch (type) {
        case 'NM':
            return 3; // NM is typically 300% of FTP
        case 'AC':
            return 1.75; // AC is typically 175% of FTP
        case 'MAP':
            return 1.25; // MAP is typically 106% of FTP
        case 'FTP':
        default:
            return 1.0; // FTP is 100% baseline
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
    
    // Calculate max power for scaling (find the highest power zone)
    let maxPowerMultiplier = 1.0;
    for (let i = 0; i < type.length; i++) {
        const multiplier = getPowerZoneMultiplier(type[i]) * value[i];
        if (multiplier > maxPowerMultiplier) {
            maxPowerMultiplier = multiplier;
        }
    }
    
    // Generate workout bars
    for (let i = 0; i < time.length - 1; i++) {
        const startTime = time[i];
        const endTime = time[i + 1];
        const intensity = value[i];
        const workoutType = type[i];
        
        // Calculate position and dimensions
        const x = (startTime / maxTime) * svgWidth;
        const rectWidth = Math.max(1, ((endTime - startTime) / maxTime) * svgWidth);
        
        // Calculate actual power multiplier for this segment
        const powerZoneMultiplier = getPowerZoneMultiplier(workoutType);
        const actualPowerRatio = (powerZoneMultiplier * intensity) / maxPowerMultiplier;
        
        // Calculate height based on the actual power ratio
        const rectHeight = actualPowerRatio * chartHeight;
        const y = chartTop + chartHeight - rectHeight;
        
        // Get color based on workout type
        const fillColor = getColorByType(workoutType);
        
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
        
        // Add FTP reference line (100% line)
        const ftpRatio = 1.0 / maxPowerMultiplier;
        const ftpY = chartTop + chartHeight - (chartHeight * ftpRatio);
        elements.push(
            React.createElement('line', {
                key: 'ftp-line',
                x1: 0,
                y1: ftpY,
                x2: svgWidth,
                y2: ftpY,
                stroke: '#0BBEEB',
                strokeWidth: 1,
                strokeDasharray: '5,5',
                opacity: 0.7
            })
        );
        
        // Add FTP power annotation with background
        elements.push(
            React.createElement('rect', {
                key: 'ftp-annotation-bg',
                x: 20,
                y: ftpY - 25,
                width: 80,
                height: 20,
                fill: '#444',
                rx: 10,
                ry: 10
            })
        );
        
        elements.push(
            React.createElement('text', {
                key: 'ftp-annotation',
                x: 60,
                y: ftpY - 10,
                fill: '#fff',
                fontSize: '14',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                textAnchor: 'middle'
            }, `${ftp} W`)
        );
    }
    
    return elements;
};

export const generateWorkoutHeader = (workoutData: WorkoutData, userProfile?: UserProfile) => {
    const maxTime = Math.max(...workoutData.time);
    const duration = Math.floor(maxTime); // Keep in seconds for now
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
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    headerElements.push(
        React.createElement('text', {
            key: 'duration-value',
            x: 50,
            y: 50,
            fill: '#fff',
            fontSize: '24',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, `${minutes}:${seconds.toString().padStart(2, '0')}`)
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