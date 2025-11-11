import React from 'react';
import { WorkoutData } from '../types/workout';
import { UserProfile } from '../types/user';
import { UserPowerProfile } from '../types/userProfile';
import { 
    calculateAllTrainingMetrics, 
    getPowerValue 
} from './trainingMetrics';

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



export const generateSVG = (workoutData: WorkoutData, userProfile?: UserProfile | UserPowerProfile, showMetrics: boolean = false) => {
    const { time, value, type } = workoutData;
    const maxTime = Math.max(...time);
    const svgWidth = 3057;
    const svgHeight = 370.7;
    const chartHeight = 250; // Height available for the chart
    const chartTop = 50; // Top margin for the chart
    
    const elements = [];
    
    // Calculate max power for scaling (find the highest actual power value)
    let maxPower = 1.0;
    for (let i = 0; i < type.length; i++) {
        const actualPower = getPowerValue(type[i], value[i], userProfile);
        if (actualPower > maxPower) {
            maxPower = actualPower;
        }
    }
    
    // Generate workout bars
    let currentX = 0; // Track cumulative X position to ensure gapless rendering
    for (let i = 0; i < time.length - 1; i++) {
        const startTime = time[i];
        const endTime = time[i + 1];
        const intensity = value[i];
        const workoutType = type[i];
        
        // Calculate position and dimensions
        // Use cumulative X position to ensure gapless rendering: Rect1.x + Rect1.width = Rect2.x
        const x = Math.round(currentX); // Ensure integer x position
        const rectWidthFloat = ((endTime - startTime) / maxTime) * svgWidth;
        const rectWidth = Math.max(1, Math.round(rectWidthFloat)); // Ensure integer width
        currentX += rectWidth; // Update for next rectangle using precise float value
        
        // Calculate actual power for this segment
        const actualPower = getPowerValue(workoutType, intensity, userProfile);
        const actualPowerRatio = actualPower / maxPower;
        
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
        
        // Add FTP reference line (100% FTP line)
        const ftpPower = userProfile.ftp; // 100% FTP intensity
        const ftpRatio = ftpPower / maxPower;
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



export const generateWorkoutHeader = (workoutData: WorkoutData, userProfile?: UserProfile | UserPowerProfile, showMetrics: boolean = false) => {
    const maxTime = Math.max(...workoutData.time);
    const duration = Math.floor(maxTime);
    
    // Return empty array if metrics are disabled
    if (!showMetrics) {
        return [];
    }
    
    const headerElements = [];
    
    // Calculate duration formatting
    const totalSeconds = duration;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let durationText;
    if (hours > 0) {
        durationText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        durationText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Font sizes for the header text (scaled for SVG coordinates)
    const labelFontSize = '24';
    const valueFontSize = '36';
    const legendFontSize = '20';
    
    // Left side metrics - positioned above the chart area with better spacing
    const metricsY = 30;
    const valuesY = 65;
    
    // Duration
    headerElements.push(
        React.createElement('text', {
            key: 'duration-label',
            x: 30,
            y: metricsY,
            fill: '#999',
            fontSize: labelFontSize,
            fontFamily: 'Arial, sans-serif'
        }, 'Duration')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'duration-value',
            x: 30,
            y: valuesY,
            fill: '#fff',
            fontSize: valueFontSize,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, durationText)
    );
    
    // Calculate all training metrics using the library
    const metrics = calculateAllTrainingMetrics(workoutData, userProfile);
    const { normalizedPower: np, intensityFactor, trainingStressScore: tss } = metrics;
    headerElements.push(
        React.createElement('text', {
            key: 'tss-label',
            x: 200,
            y: metricsY,
            fill: '#999',
            fontSize: labelFontSize,
            fontFamily: 'Arial, sans-serif'
        }, 'TSS®')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'tss-value',
            x: 200,
            y: valuesY,
            fill: '#fff',
            fontSize: valueFontSize,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, `${tss}`)
    );
    headerElements.push(
        React.createElement('text', {
            key: 'if-label',
            x: 320,
            y: metricsY,
            fill: '#999',
            fontSize: labelFontSize,
            fontFamily: 'Arial, sans-serif'
        }, 'IF®')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'if-value',
            x: 320,
            y: valuesY,
            fill: '#fff',
            fontSize: valueFontSize,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, intensityFactor.toFixed(2))
    );
    
    // NP (Normalised Power) - calculated value
    headerElements.push(
        React.createElement('text', {
            key: 'np-label',
            x: 440,
            y: metricsY,
            fill: '#999',
            fontSize: labelFontSize,
            fontFamily: 'Arial, sans-serif'
        }, 'NP®')
    );
    
    headerElements.push(
        React.createElement('text', {
            key: 'np-value',
            x: 440,
            y: valuesY,
            fill: '#fff',
            fontSize: valueFontSize,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif'
        }, `${np}`)
    );
    
    // Right side power zone legend
    const legendStartX = 2200;
    const legendSpacing = 200;
    const circleRadius = 8;
    const circleY = 40;
    
    // Power zone legend items
    const powerZones = [
        { label: 'NM', color: '#FF1493' },
        { label: 'AC', color: '#FFA500' },
        { label: 'MAP', color: '#FFD700' },
        { label: 'FTP', color: '#0BBEEB' }
    ];
    
    powerZones.forEach((zone, index) => {
        const xPos = legendStartX + (index * legendSpacing);
        
        // Zone label
        headerElements.push(
            React.createElement('text', {
                key: `legend-${zone.label}`,
                x: xPos,
                y: 25,
                fill: '#999',
                fontSize: legendFontSize,
                fontFamily: 'Arial, sans-serif',
                textAnchor: 'middle'
            }, zone.label)
        );
        
        // Create 5 circles for each zone
        for (let i = 0; i < 5; i++) {
            headerElements.push(
                React.createElement('circle', {
                    key: `circle-${zone.label}-${i}`,
                    cx: xPos - 40 + (i * 20),
                    cy: circleY,
                    r: circleRadius,
                    fill: zone.color
                })
            );
        }
    });
    
    return headerElements;
};