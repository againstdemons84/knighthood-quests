import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScenarioManager from '../../components/ScenarioManager';
import { UserPowerProfile } from '../../types/userProfile';
import { Scenario } from '../../types/scenario';

// Mock the scenarioHelpers module
jest.mock('../../utils/scenarioHelpers', () => ({
    loadScenarios: jest.fn(),
    saveScenarios: jest.fn(),
    formatDuration: jest.fn((seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }),
    calculateCombinedMetricsDynamic: jest.fn(),
}));

describe('ScenarioManager', () => {
    const mockUserProfile: UserPowerProfile = {
        nm: 1000,
        ac: 400,
        map: 320,
        ftp: 250
    };

    const mockScenarios: Scenario[] = [
        {
            id: 'scenario1',
            name: 'Test Scenario 1',
            createdAt: '2025-11-06T10:00:00Z',
            workouts: [
                { id: 'workout1', name: 'Workout 1', metrics: null },
                { id: 'workout2', name: 'Workout 2', metrics: null }
            ]
        },
        {
            id: 'scenario2', 
            name: 'Test Scenario 2',
            createdAt: '2025-11-06T11:00:00Z',
            workouts: [
                { id: 'workout3', name: 'Workout 3', metrics: null }
            ]
        }
    ];

    const mockProps = {
        onEditScenario: jest.fn(),
        onViewScenario: jest.fn(),
        userProfile: mockUserProfile
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock the helper functions
        const { 
            loadScenarios, 
            calculateCombinedMetricsDynamic 
        } = require('../../utils/scenarioHelpers');
        
        loadScenarios.mockReturnValue(mockScenarios);
        calculateCombinedMetricsDynamic.mockResolvedValue({
            totalDuration: 3600,
            totalElapsedDuration: 4200,
            totalTSS: 100,
            averageIF: 0.8,
            totalNP: 250
        });
    });

    it('should render scenario manager with title', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });
        
        expect(screen.getByText('Your Arsenal of KNIGHTHOOD Quests')).toBeInTheDocument();
        expect(screen.getByText(/Manage and compare your different recipes for SUFFERING/)).toBeInTheDocument();
    });

    it('should display scenarios after loading', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });
        
        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
            expect(screen.getByText('Test Scenario 2')).toBeInTheDocument();
        });
    });

    it('should display scenario metrics', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            // Check that metrics are displayed
            expect(screen.getAllByText('100')).toHaveLength(2); // TSS for both scenarios
            expect(screen.getAllByText('0.80')).toHaveLength(2); // IF for both scenarios
        });
        
        // Check that "250 W" appears (NP values)
        expect(screen.getAllByText(/250/)).toHaveLength(2); // NP values (may have "W" separately)
    });

    it('should handle sorting by different columns', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        // Test sorting by name
        const sortSelect = screen.getByDisplayValue('Sort by Created Date');
        await userEvent.selectOptions(sortSelect, 'name');
        
        expect(sortSelect).toHaveValue('name');
    });

    it('should handle scenario selection', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        // Find and click a checkbox
        const checkboxes = screen.getAllByRole('checkbox');
        await userEvent.click(checkboxes[0]);

        // Should show comparison section
        await waitFor(() => {
            expect(screen.getByText(/Comparing 1 Scenario/)).toBeInTheDocument();
        });
    });

    it('should call onViewScenario when view button is clicked', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        const viewButtons = screen.getAllByText('View');
        await userEvent.click(viewButtons[0]);

        // Since scenarios might be sorted, just check that the callback was called
        expect(mockProps.onViewScenario).toHaveBeenCalledTimes(1);
        expect(mockProps.onViewScenario).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String)
            })
        );
    });    it('should call onEditScenario when edit button is clicked', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByText('Edit');
        await userEvent.click(editButtons[0]);

        // Since scenarios might be sorted, just check that the callback was called
        expect(mockProps.onEditScenario).toHaveBeenCalledTimes(1);
        expect(mockProps.onEditScenario).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String)
            })
        );
    });

    it('should show empty state when no scenarios exist', async () => {
        const { loadScenarios } = require('../../utils/scenarioHelpers');
        loadScenarios.mockReturnValue([]);

        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('No Scenarios Yet')).toBeInTheDocument();
            expect(screen.getByText(/Forge your first path to KNIGHTHOOD/)).toBeInTheDocument();
        });
    });

    it('should handle delete scenario with confirmation', async () => {
        // Mock window.confirm
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        await userEvent.click(deleteButtons[0]);

        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this scenario?');
        
        confirmSpy.mockRestore();
    });

    it('should handle duplicate scenario', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        const copyButtons = screen.getAllByText('Copy');
        await userEvent.click(copyButtons[0]);

        // Should call saveScenarios with the duplicated scenario
        const { saveScenarios } = require('../../utils/scenarioHelpers');
        expect(saveScenarios).toHaveBeenCalled();
    });

    it('should handle calculation errors gracefully', async () => {
        const { calculateCombinedMetricsDynamic } = require('../../utils/scenarioHelpers');
        calculateCombinedMetricsDynamic.mockRejectedValue(new Error('Calculation failed'));
        
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });
        
        // Should still render with zero metrics
        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });
    });

    it('should toggle sort order when clicking same column', async () => {
        await act(async () => {
            render(<ScenarioManager {...mockProps} />);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Scenario 1')).toBeInTheDocument();
        });

        // Click on a sortable header - use getByRole to find the header button
        const nameHeader = screen.getByRole('columnheader', { name: /Scenario/ });
        await userEvent.click(nameHeader);
        
        // Should show sort indicator
        await waitFor(() => {
            expect(screen.getByText(/Scenario.*↑/)).toBeInTheDocument();
        });

        // Click again to reverse sort
        await userEvent.click(nameHeader);
        await waitFor(() => {
            expect(screen.getByText(/Scenario.*↓/)).toBeInTheDocument();
        });
    });
});