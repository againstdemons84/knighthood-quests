#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Script to fetch workout data from SYSTM GraphQL API
 * Usage: node fetch-workouts.js <BEARER_TOKEN>
 */

// Check if bearer token is provided
const bearerToken = process.argv[2];
if (!bearerToken) {
    console.error('Usage: node fetch-workouts.js <BEARER_TOKEN>');
    process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'data', 'workouts');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Load knighthood workouts
const knighthoodWorkoutsPath = path.join(__dirname, 'data', 'knighthood-workouts.json');
let knighthoodWorkouts;

try {
    const data = fs.readFileSync(knighthoodWorkoutsPath, 'utf8');
    knighthoodWorkouts = JSON.parse(data);
} catch (error) {
    console.error('Error reading knighthood-workouts.json:', error.message);
    process.exit(1);
}

// Load all workouts to find workoutId mappings
const allWorkoutsPath = path.join(__dirname, 'data', 'workouts.json');
let allWorkouts;

try {
    const data = fs.readFileSync(allWorkoutsPath, 'utf8');
    allWorkouts = JSON.parse(data);
} catch (error) {
    console.error('Error reading workouts.json:', error.message);
    process.exit(1);
}

/**
 * Find workoutId by matching the id from knighthood-workouts.json with workouts.json
 */
function findWorkoutId(contentId) {
    const workout = allWorkouts.data.library.content.find(item => item.id === contentId);
    if (workout && workout.workoutId) {
        return workout.workoutId;
    }
    console.warn(`⚠️  Could not find workoutId for content id: ${contentId}`);
    return null;
}

// GraphQL query
const query = `query workoutGraphTriggers($workoutId: ID!) {
  workoutGraphTriggers(workoutId: $workoutId) {
    indoor {
      time
      value
      type
      __typename
    }
    __typename
  }
}`;

/**
 * Make GraphQL request to fetch workout data
 */
function fetchWorkoutData(workoutId) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            operationName: "workoutGraphTriggers",
            variables: { workoutId },
            query
        });

        console.log(postData);

        const options = {
            hostname: 'api.thesufferfest.com',
            port: 443,
            path: '/graphql',
            method: 'POST',
            headers: {
                'accept': '*/*',
                'accept-language': 'en-GB,en;q=0.9,fr;q=0.8',
                'authorization': `Bearer ${bearerToken}`,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(postData),
                'dnt': '1',
                'origin': 'https://systm.wahoofitness.com',
                'priority': 'u=1, i',
                'referer': 'https://systm.wahoofitness.com/',
                'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON response: ${error.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Save workout data to file
 */
function saveWorkoutData(originalId, data, workoutName, workoutId, contentId) {
    const filename = `${originalId}.json`;
    const filepath = path.join(outputDir, filename);
    
    // Add metadata to the saved file
    const enrichedData = {
        ...data,
        metadata: {
            id: originalId, // Original id from knighthood-workouts.json
            contentId, // Content id (same as id in this case, but keeping for clarity)
            workoutId, // Actual workout id used for GraphQL query
            workoutName,
            fetchedAt: new Date().toISOString(),
            source: 'SYSTM GraphQL API'
        }
    };

    try {
        fs.writeFileSync(filepath, JSON.stringify(enrichedData, null, 2));
        console.log(`✅ Saved ${workoutName} (${originalId}) to ${filename}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to save ${workoutName} (${originalId}): ${error.message}`);
        return false;
    }
}

/**
 * Add delay between requests to be respectful to the API
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to process all workouts
 */
async function processWorkouts() {
    console.log(`Starting to fetch ${knighthoodWorkouts.workouts.length} Knighthood workouts...`);
    console.log(`Output directory: ${outputDir}`);
    console.log('─────────────────────────────────────────────────────');

    let successful = 0;
    let failed = 0;

    for (let i = 0; i < knighthoodWorkouts.workouts.length; i++) {
        const workout = knighthoodWorkouts.workouts[i];
        const { id: contentId, name: workoutName } = workout;

        // Find the actual workoutId from the content id
        const workoutId = findWorkoutId(contentId);
        
        if (!workoutId) {
            console.error(`❌ Skipping ${workoutName} - no workoutId found for content id: ${contentId}`);
            failed++;
            continue;
        }

        try {
            console.log(`[${i + 1}/${knighthoodWorkouts.workouts.length}] Fetching: ${workoutName} (content: ${contentId} → workout: ${workoutId})...`);
            
            const data = await fetchWorkoutData(workoutId);
            
            if (saveWorkoutData(workout.id, data, workoutName, workoutId, contentId)) {
                successful++;
            } else {
                failed++;
            }

        } catch (error) {
            console.error(`❌ Failed to fetch ${workoutName} (${workoutId}): ${error.message}`);
            failed++;
        }

        // Add delay between requests (1 second) to be respectful
        if (i < knighthoodWorkouts.workouts.length - 1) {
            await delay(1000);
        }
    }

    console.log('─────────────────────────────────────────────────────');
    console.log(`✅ Successfully fetched: ${successful} workouts`);
    console.log(`❌ Failed: ${failed} workouts`);
    console.log(`📁 Files saved to: ${outputDir}`);
}

// Run the script
processWorkouts().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
});