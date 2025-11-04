import { WorkoutData } from '../types/workout';

export const processWorkoutData = (data: { indoor: WorkoutData; outdoor: WorkoutData }) => {
    const indoorData = data.indoor;
    const outdoorData = data.outdoor;

    // Calculate scales for the SVG rendering
    const maxIndoorValue = Math.max(...indoorData.value);
    const maxOutdoorValue = Math.max(...outdoorData.value);

    const indoorScale = (value: number) => (value / maxIndoorValue) * 100; // Scale to percentage
    const outdoorScale = (value: number) => (value / maxOutdoorValue) * 100; // Scale to percentage

    return {
        indoor: {
            scaledValues: indoorData.value.map(indoorScale),
            time: indoorData.time,
            type: indoorData.type,
        },
        outdoor: {
            scaledValues: outdoorData.value.map(outdoorScale),
            time: outdoorData.time,
            type: outdoorData.type,
        },
    };
};

export const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};