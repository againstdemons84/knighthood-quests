import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReorderableWorkoutList from '../../components/ReorderableWorkoutList';
import { UserPowerProfile } from '../../types/userProfile';
import { WorkoutSelection } from '../../types/scenario';

// Mock fetch for workout data
global.fetch = jest.fn();

// Mock the WorkoutChart component
jest.mock('../../components/WorkoutChart', () => {
    return function MockWorkoutChart({ workoutData }: { workoutData: any }) {
        return <div data-testid="workout-chart">Mock Workout Chart</div>;
    };
});

// Mock the workouts data
jest.mock('../../data/workouts.json', () => ({
    data: {
        library: {
            content: [
                { id: 'workout1', name: 'Test Workout 1' },
                { id: 'workout2', name: 'Test Workout 2' }
            ]
        }
    }
}));

const mockUserProfile: UserPowerProfile = {
    nm: 1000,
    ac: 400,
    map: 320,
    ftp: 250
};

const mockWorkouts: WorkoutSelection[] = [
    {
        id: 'workout1',
        name: 'Test Workout 1',
        metrics: {
            duration: 3600,
            tss: 100,
            intensityFactor: 0.8,
            normalizedPower: 250
        }
    },
    {
        id: 'workout2',
        name: 'Test Workout 2',
        metrics: {
            duration: 1800,
            tss: 50,
            intensityFactor: 0.6,
            normalizedPower: 200
        }
    }
];

describe('ReorderableWorkoutList', () => {
    const mockOnReorder = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                data: {
                    workoutGraphTriggers: {
                        indoor: {
                            time: [0, 60, 120],
                            value: [100, 200, 150],
                            type: ['power', 'power', 'power'],
                            __typename: 'FourDPWorkoutGraph'
                        }
                    }
                }
            })
        });
    });

    it('should render workout list with drag handles and SVG charts', async () => {
        await act(async () => {
            render(
                <ReorderableWorkoutList
                    workouts={mockWorkouts}
                    userProfile={mockUserProfile}
                    onReorder={mockOnReorder}
                />
            );
        });

        // Wait for workouts to load
        await waitFor(() => {
            expect(screen.getByText('Challenge Workouts')).toBeInTheDocument();
        });

        // Should show drag handles
        expect(screen.getAllByText('⋮⋮')).toHaveLength(2);
        
        // Should show order numbers
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        
        // Should show workout names
        expect(screen.getByText('Test Workout 1')).toBeInTheDocument();
        expect(screen.getByText('Test Workout 2')).toBeInTheDocument();

        // Should show workout charts
        expect(screen.getAllByTestId('workout-chart')).toHaveLength(2);
    });

    it('should show instructions for drag and drop', async () => {
        await act(async () => {
            render(
                <ReorderableWorkoutList
                    workouts={mockWorkouts}
                    userProfile={mockUserProfile}
                    onReorder={mockOnReorder}
                />
            );
        });

        await waitFor(() => {
            expect(screen.getByText('💡 Drag & Drop Instructions')).toBeInTheDocument();
        });

        expect(screen.getByText(/Grab the ⋮⋮ handle/)).toBeInTheDocument();
        expect(screen.getByText(/Changes are automatically saved/)).toBeInTheDocument();
    });

    it('should display custom title and subtitle', async () => {
        await act(async () => {
            render(
                <ReorderableWorkoutList
                    workouts={mockWorkouts}
                    userProfile={mockUserProfile}
                    onReorder={mockOnReorder}
                    title="Custom Title"
                    subtitle="Custom subtitle text"
                />
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Custom Title')).toBeInTheDocument();
            expect(screen.getByText('Custom subtitle text')).toBeInTheDocument();
        });
    });
});