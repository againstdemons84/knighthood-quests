import React, { useState } from 'react';
import { UserPowerProfile } from '../types/userProfile';
import { validatePowerProfile } from '../utils/userProfileHelpers';

interface UserProfileSetupProps {
    onProfileSave: (profile: UserPowerProfile) => void;
    initialProfile?: UserPowerProfile | null;
    isFirstTime?: boolean;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ 
    onProfileSave, 
    initialProfile,
    isFirstTime = false 
}) => {
    const [profile, setProfile] = useState<UserPowerProfile>(
        initialProfile || { nm: 0, ac: 0, map: 0, ftp: 0 }
    );
    const [errors, setErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: keyof UserPowerProfile, value: string) => {
        const numValue = parseInt(value) || 0;
        setProfile(prev => ({ ...prev, [field]: numValue }));
        setErrors([]); // Clear errors when user starts typing
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const validationErrors = validatePowerProfile(profile);
        
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            return;
        }

        onProfileSave(profile);
        setIsSubmitting(false);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: '40px',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '28px' }}>
                        {isFirstTime ? '🏰 Welcome to Knight of Sufferlandria!' : '⚙️ Power Profile Settings'}
                    </h1>
                    <p style={{ color: '#999', margin: 0, fontSize: '16px', lineHeight: '1.5' }}>
                        {isFirstTime 
                            ? 'To calculate accurate training metrics for your Knighthood challenge, we need your power profile values. These are typically determined through a 4DP (Four Dimensional Power) test in Wahoo SYSTM.'
                            : 'Update your power profile values to recalculate training metrics.'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '20px', marginBottom: '25px' }}>
                        {/* NM Input */}
                        <div>
                            <label style={{ 
                                display: 'block', 
                                color: '#FF1493', 
                                marginBottom: '8px', 
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                Neuromuscular Power (NM)
                            </label>
                            <input
                                type="number"
                                value={profile.nm || ''}
                                onChange={(e) => handleInputChange('nm', e.target.value)}
                                placeholder="e.g. 922"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#333',
                                    color: 'white',
                                    border: '2px solid #FF1493',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                            />
                            <p style={{ color: '#999', fontSize: '14px', margin: '5px 0 0 0' }}>
                                Peak power output (5-15 seconds) - Your maximum sprint power
                            </p>
                        </div>

                        {/* AC Input */}
                        <div>
                            <label style={{ 
                                display: 'block', 
                                color: '#FFA500', 
                                marginBottom: '8px', 
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                Anaerobic Capacity (AC)
                            </label>
                            <input
                                type="number"
                                value={profile.ac || ''}
                                onChange={(e) => handleInputChange('ac', e.target.value)}
                                placeholder="e.g. 503"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#333',
                                    color: 'white',
                                    border: '2px solid #FFA500',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                            />
                            <p style={{ color: '#999', fontSize: '14px', margin: '5px 0 0 0' }}>
                                Power at VO2max (1-2 minutes) - Your oxygen processing ability
                            </p>
                        </div>

                        {/* MAP Input */}
                        <div>
                            <label style={{ 
                                display: 'block', 
                                color: '#FFD700', 
                                marginBottom: '8px', 
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                Maximum Aerobic Power (MAP)
                            </label>
                            <input
                                type="number"
                                value={profile.map || ''}
                                onChange={(e) => handleInputChange('map', e.target.value)}
                                placeholder="e.g. 337"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#333',
                                    color: 'white',
                                    border: '2px solid #FFD700',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                            />
                            <p style={{ color: '#999', fontSize: '14px', margin: '5px 0 0 0' }}>
                                Sustainable power at MAP (3-8 minutes) - Your aerobic engine
                            </p>
                        </div>

                        {/* FTP Input */}
                        <div>
                            <label style={{ 
                                display: 'block', 
                                color: '#0BBEEB', 
                                marginBottom: '8px', 
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                Functional Threshold Power (FTP)
                            </label>
                            <input
                                type="number"
                                value={profile.ftp || ''}
                                onChange={(e) => handleInputChange('ftp', e.target.value)}
                                placeholder="e.g. 266"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#333',
                                    color: 'white',
                                    border: '2px solid #0BBEEB',
                                    borderRadius: '6px',
                                    fontSize: '16px'
                                }}
                            />
                            <p style={{ color: '#999', fontSize: '14px', margin: '5px 0 0 0' }}>
                                One-hour sustainable power - Your threshold endurance
                            </p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {errors.length > 0 && (
                        <div style={{
                            backgroundColor: '#3d1a1a',
                            border: '1px solid #d32f2f',
                            borderRadius: '6px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>
                                Please fix these issues:
                            </h4>
                            <ul style={{ color: '#ffcdd2', margin: 0, paddingLeft: '20px' }}>
                                {errors.map((error, index) => (
                                    <li key={index} style={{ marginBottom: '5px' }}>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Info Box */}
                    <div style={{
                        backgroundColor: '#1a3d1a',
                        border: '1px solid #4CAF50',
                        borderRadius: '6px',
                        padding: '15px',
                        marginBottom: '25px'
                    }}>
                        <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>
                            💡 Don't have these values yet?
                        </h4>
                        <p style={{ color: '#c8e6c9', margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                            These power values are determined through a 4DP test in Wahoo SYSTM. If you don't have them, 
                            you can estimate FTP and use these typical ratios: NM ≈ 150% of FTP, AC ≈ 120% of FTP, MAP ≈ 105% of FTP.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                        {!isFirstTime && (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#555',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: isSubmitting ? '#555' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                minWidth: '120px'
                            }}
                        >
                            {isSubmitting ? 'Saving...' : (isFirstTime ? 'Start Challenge Planning' : 'Update Profile')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfileSetup;