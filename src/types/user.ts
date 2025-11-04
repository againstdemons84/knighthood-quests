export interface UserProfile {
    nm: number;
    ac: number;
    map: number;
    ftp: number;
    lthr: number;
    cadenceThreshold: number;
    __typename: string;
}

export interface User {
    id: string;
    fullName: string;
    weightKg: number;
    heightCm: number;
    profiles: {
        riderProfile: UserProfile;
        __typename: string;
    };
    __typename: string;
}

export interface UserResponse {
    data: {
        impersonateUser: {
            user: User;
            __typename: string;
        };
    };
}