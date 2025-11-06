# Workout SVG Generator

## Overview
The Workout SVG Generator is a React application that visualizes workout data in the form of SVG graphics. It allows users to generate dynamic charts based on workout data fetched from an API or provided as sample data.

## Features
- Generates SVG charts based on workout data.
- Supports swappable data sources for flexibility.
- TypeScript integration for type safety and better development experience.

## Project Structure
```
workout-svg-generator
├── src
│   ├── components
│   │   ├── WorkoutChart.tsx       # Main component for rendering workout charts
│   │   └── index.ts                # Exports components for easier imports
│   ├── types
│   │   ├── workout.ts               # Type definitions for workout data
│   │   └── index.ts                 # Centralized type exports
│   ├── utils
│   │   ├── svgGenerator.ts          # Utility functions for SVG generation
│   │   └── chartHelpers.ts          # Helper functions for data processing
│   └── index.ts                     # Entry point for the application
├── data
│   └── sample-data.json             # Sample workout data for testing
├── package.json                      # NPM configuration file
├── tsconfig.json                    # TypeScript configuration file
└── README.md                        # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd workout-svg-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application:
   ```
   npm start
   ```

## Usage
To use the WorkoutChart component, import it into your desired file and pass the workout data as props. The component can handle both indoor and outdoor workout data.

### Example
```tsx
import WorkoutChart from './components/WorkoutChart';
import sampleData from '../data/sample-data.json';

const App = () => {
    return (
        <div>
            <h1>Workout Chart</h1>
            <WorkoutChart data={sampleData.data.workoutGraphTriggers.indoor} />
        </div>
    );
};
```

## API Response Structure
The API response should be structured as follows:
```json
{
    "data": {
        "workoutGraphTriggers": {
            "indoor": {
                "time": [ ... ],
                "value": [ ... ],
                "type": [ ... ],
                "__typename": "FourDPWorkoutGraph"
            },
            "outdoor": {
                "time": [ ... ],
                "value": [ ... ],
                "type": [ ... ],
                "__typename": "FourDPWorkoutGraph"
            },
            "__typename": "PlanGraphTriggers"
        }
    }
}
```

## Swapping Data Sources
To swap data sources, simply provide a different dataset to the `WorkoutChart` component. This allows for easy testing and flexibility in visualizing different workout data.

## License
This project is licensed under the MIT License.