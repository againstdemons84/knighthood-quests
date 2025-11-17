// Wahoo Systm API Service for authentication and workout scheduling

interface AppInformation {
    platform: string;
    version: string;
    installId: string;
}

interface LoginRequest {
    operationName: string;
    variables: {
        appInformation: AppInformation;
        username: string;
        password: string;
    };
    query: string;
}

interface LoginResponse {
    data: {
        loginUser: {
            status: string;
            message: string;
            token: string;
            failureId: string | null;
            __typename: string;
        };
    };
}

interface ScheduleRequest {
    operationName: string;
    variables: {
        contentId: string;
        date: string;
        timeZone: string;
        rank: number;
    };
    query: string;
}

interface ScheduleResponse {
    data: {
        addAgenda: {
            status: string;
            message: string | null;
            agendaId: string;
            __typename: string;
        };
    };
}

export interface SystmCredentials {
    username: string;
    password: string;
}

export interface WorkoutScheduleItem {
    contentId: string;
    date: string; // ISO string
    timeZone: string;
    rank: number;
}

export class SystmApiError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'SystmApiError';
    }
}

class SystmApiService {
    private readonly endpoint = 'https://api.thesufferfest.com/graphql';
    private readonly appInfo: AppInformation = {
        platform: 'web',
        version: '7.101.1-web.3480-7-g4802ce80',
        installId: '7BC7E6377390574C8E6C95782C087C7A' // TODO: Generate unique per session if needed
    };

    private readonly loginQuery = `
        mutation Login($appInformation: AppInformation!, $username: String!, $password: String!) {
            loginUser(
                appInformation: $appInformation
                username: $username
                password: $password
            ) {
                status
                message
                token
                failureId
                __typename
            }
        }
    `;

    private readonly scheduleQuery = `
        mutation AddUserPlanItem($contentId: ID!, $date: Date!, $timeZone: TimeZone!, $rank: Int) {
            addAgenda(contentId: $contentId, date: $date, timeZone: $timeZone, rank: $rank) {
                status
                message
                agendaId
                __typename
            }
        }
    `;

    private getHeaders(authToken?: string): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'Referer': 'https://systm.wahoofitness.com/',
            'DNT': '1',
            'sec-ch-ua-platform': '"macOS"',
            'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'accept': '*/*'
        };

        if (authToken) {
            headers['authorization'] = `Bearer ${authToken}`;
        }

        return headers;
    }

    /**
     * Authenticate user and get access token
     */
    async authenticate(credentials: SystmCredentials): Promise<string> {
        const request: LoginRequest = {
            operationName: 'Login',
            variables: {
                appInformation: this.appInfo,
                username: credentials.username,
                password: credentials.password
            },
            query: this.loginQuery
        };

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new SystmApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    'HTTP_ERROR'
                );
            }

            const data: LoginResponse = await response.json();

            // Check for GraphQL errors
            if (!data.data?.loginUser) {
                throw new SystmApiError('Invalid response format', 'INVALID_RESPONSE');
            }

            const loginResult = data.data.loginUser;

            if (loginResult.status !== 'Success') {
                throw new SystmApiError(
                    loginResult.message || 'Authentication failed',
                    'AUTH_FAILED'
                );
            }

            if (loginResult.failureId) {
                throw new SystmApiError(
                    `Authentication failed: ${loginResult.failureId}`,
                    'AUTH_FAILED'
                );
            }

            if (!loginResult.token) {
                throw new SystmApiError('No token received', 'NO_TOKEN');
            }

            return loginResult.token;
        } catch (error) {
            if (error instanceof SystmApiError) {
                throw error;
            }

            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new SystmApiError(
                    'Unable to connect to Wahoo Systm. Please check your internet connection.',
                    'NETWORK_ERROR'
                );
            }

            throw new SystmApiError(
                `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'UNKNOWN_ERROR'
            );
        }
    }

    /**
     * Schedule a single workout
     */
    async scheduleWorkout(
        authToken: string,
        scheduleItem: WorkoutScheduleItem
    ): Promise<string> {
        const request: ScheduleRequest = {
            operationName: 'AddUserPlanItem',
            variables: {
                contentId: scheduleItem.contentId,
                date: scheduleItem.date,
                timeZone: scheduleItem.timeZone,
                rank: scheduleItem.rank
            },
            query: this.scheduleQuery
        };

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: this.getHeaders(authToken),
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new SystmApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    'HTTP_ERROR'
                );
            }

            const data: ScheduleResponse = await response.json();

            // Check for GraphQL errors
            if (!data.data?.addAgenda) {
                throw new SystmApiError('Invalid response format', 'INVALID_RESPONSE');
            }

            const scheduleResult = data.data.addAgenda;

            if (scheduleResult.status !== 'Success') {
                throw new SystmApiError(
                    scheduleResult.message || 'Scheduling failed',
                    'SCHEDULE_FAILED'
                );
            }

            if (!scheduleResult.agendaId) {
                throw new SystmApiError('No agenda ID received', 'NO_AGENDA_ID');
            }

            return scheduleResult.agendaId;
        } catch (error) {
            if (error instanceof SystmApiError) {
                throw error;
            }

            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new SystmApiError(
                    'Unable to connect to Wahoo Systm. Please check your internet connection.',
                    'NETWORK_ERROR'
                );
            }

            throw new SystmApiError(
                `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'UNKNOWN_ERROR'
            );
        }
    }

    /**
     * Get user's timezone (browser timezone as default)
     */
    getUserTimeZone(): string {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return 'UTC'; // Fallback
        }
    }
}

// Export singleton instance
export const systmApi = new SystmApiService();