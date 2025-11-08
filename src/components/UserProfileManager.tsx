import React, { useState } from 'react';
import { UserPowerProfile } from '../types/userProfile';
import { getUserProfile, clearUserProfile, isUsingDefaultProfile } from '../utils/userProfileHelpers';
import UserProfileSetup from './UserProfileSetup';

interface UserProfileManagerProps {
    currentProfile: UserPowerProfile;
    onProfileUpdate: (profile: UserPowerProfile) => void;
}

const UserProfileManager: React.FC<UserProfileManagerProps> = ({ 
    currentProfile, 
    onProfileUpdate 
}) => {
    const [showSetup, setShowSetup] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const profileData = getUserProfile();

    const handleProfileSave = (profile: UserPowerProfile) => {
        onProfileUpdate(profile);
        setShowSetup(false);
    };

    const handleClearProfile = () => {
        if (window.confirm('Are you sure you want to clear your power profile? This will refresh the app and you\'ll need to set up your profile again.')) {
            clearUserProfile();
            window.location.reload();
        }
        setShowDeleteConfirm(false);
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', padding: '20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ color: 'white', marginBottom: '10px' }}>
                    Power Profile Settings
                </h1>
                <p style={{ color: '#999', marginBottom: isUsingDefaultProfile() ? '15px' : '30px' }}>
                    Manage your 4DP power profile values used for training metrics calculations
                </p>
                
                {isUsingDefaultProfile() && (
                    <div style={{
                        backgroundColor: '#2a1a00',
                        border: '2px solid #FF9800',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>⚡</span>
                            <strong style={{ color: '#FF9800' }}>Using Default Power Profile</strong>
                        </div>
                        <p style={{ color: '#FFA726', margin: '0', fontSize: '14px', lineHeight: '1.4' }}>
                            You're currently using default power values (FTP: 200W, MAP: 260W, AC: 340W, NM: 450W). 
                            These are typical for recreational cyclists. For more accurate training metrics, 
                            customize these values based on your actual power profile or 4DP test results.
                        </p>
                    </div>
                )}

                {/* Current Profile Display */}
                <div style={{
                    backgroundColor: '#2a2a2a',
                    padding: '25px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #333'
                }}>
                    <h3 style={{ color: 'white', margin: '0 0 20px 0' }}>Current Power Profile</h3>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                        gap: '20px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            backgroundColor: '#333',
                            padding: '20px',
                            borderRadius: '6px',
                            border: '2px solid #FF1493',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#FF1493', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Neuromuscular Power
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {currentProfile.nm}W
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>NM</div>
                        </div>

                        <div style={{
                            backgroundColor: '#333',
                            padding: '20px',
                            borderRadius: '6px',
                            border: '2px solid #FFA500',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#FFA500', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Anaerobic Capacity
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {currentProfile.ac}W
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>AC</div>
                        </div>

                        <div style={{
                            backgroundColor: '#333',
                            padding: '20px',
                            borderRadius: '6px',
                            border: '2px solid #FFD700',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Maximum Aerobic Power
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {currentProfile.map}W
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>MAP</div>
                        </div>

                        <div style={{
                            backgroundColor: '#333',
                            padding: '20px',
                            borderRadius: '6px',
                            border: '2px solid #0BBEEB',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#0BBEEB', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                                Functional Threshold Power
                            </div>
                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                                {currentProfile.ftp}W
                            </div>
                            <div style={{ color: '#999', fontSize: '12px' }}>FTP</div>
                        </div>
                    </div>

                    {profileData && (
                        <div style={{ borderTop: '1px solid #444', paddingTop: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#999' }}>
                                <span>Created: {new Date(profileData.createdAt).toLocaleDateString()}</span>
                                <span>Last Updated: {new Date(profileData.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginBottom: '30px' }}>
                    <button
                        onClick={() => setShowSetup(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Update Power Profile
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#d32f2f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Clear Profile
                    </button>
                </div>

                {/* Information Section */}
                <div style={{
                    backgroundColor: '#2a2a2a',
                    padding: '25px',
                    borderRadius: '8px',
                    border: '1px solid #333'
                }}>
                    <h3 style={{ color: 'white', margin: '0 0 15px 0' }}>About 4DP Power Profile</h3>
                    <div style={{ color: '#999', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '15px' }}>
                            The Four Dimensional Power (4DP) profile captures your power across different energy systems:
                        </p>
                        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                            <li style={{ marginBottom: '8px' }}>
                                <strong style={{ color: '#FF1493' }}>NM (Neuromuscular Power):</strong> Peak 5-15 second power output
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <strong style={{ color: '#FFA500' }}>AC (Anaerobic Capacity):</strong> Power at VO2max (1-2 minutes)
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <strong style={{ color: '#FFD700' }}>MAP (Maximum Aerobic Power):</strong> Sustainable aerobic power (3-8 minutes)
                            </li>
                            <li style={{ marginBottom: '8px' }}>
                                <strong style={{ color: '#0BBEEB' }}>FTP (Functional Threshold Power):</strong> One-hour sustainable power
                            </li>
                        </ul>
                        <p>
                            These values are used throughout the app to calculate Training Stress Score (TSS), 
                            Intensity Factor (IF), and Normalized Power (NP) for each workout in your Knighthood challenge scenarios.
                        </p>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: '#2a2a2a',
                            padding: '30px',
                            borderRadius: '8px',
                            maxWidth: '400px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: 'white', marginBottom: '15px' }}>Clear Power Profile?</h3>
                            <p style={{ color: '#999', marginBottom: '25px' }}>
                                This will permanently delete your power profile and refresh the app. 
                                You'll need to set up your profile again.
                            </p>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#555',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearProfile}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Clear Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Setup Modal */}
            {showSetup && (
                <UserProfileSetup
                    onProfileSave={handleProfileSave}
                    initialProfile={currentProfile}
                    isFirstTime={false}
                />
            )}
        </div>
    );
};

export default UserProfileManager;