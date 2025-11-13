import React, { useState } from 'react';
import { UserPowerProfile } from '../types/userProfile';
import { validatePowerProfile } from '../utils/userProfileHelpers';
import { useViewport } from '../hooks/useViewport';
import styles from './UserProfileSetup.module.css';

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
    const viewport = useViewport();
    const [profile, setProfile] = useState<UserPowerProfile>(
        initialProfile || { nm: 0, ac: 0, map: 0, ftp: 0, targetIntensity: 70 }
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
        <div className={`${styles.modalOverlay} ${viewport.isMobile ? styles.modalOverlayMobile : styles.modalOverlayDesktop}`}>
            <div className={`${styles.modalContainer} ${viewport.isMobile ? styles.modalContainerMobile : styles.modalContainerDesktop}`}>
                <div className={`${styles.headerSection} ${viewport.isMobile ? styles.headerSectionMobile : styles.headerSectionDesktop}`}>
                    <h1 className={`${styles.title} ${viewport.isMobile ? styles.titleMobile : styles.titleDesktop}`}>
                        {isFirstTime ? 
                            (viewport.isMobile ? '🏰 Welcome!' : '🏰 Welcome to Knight of Sufferlandria!') : 
                            '⚙️ Power Profile Settings'
                        }
                    </h1>
                    <p className={`${styles.subtitle} ${viewport.isMobile ? styles.subtitleMobile : styles.subtitleDesktop}`}>
                        {isFirstTime 
                            ? (viewport.isMobile 
                                ? 'Enter your power profile values to calculate accurate training metrics.'
                                : 'To calculate accurate training metrics for your Knighthood challenge, we need your power profile values. These are typically determined through a 4DP (Four Dimensional Power) test in Wahoo SYSTM.'
                              )
                            : 'Update your power profile values to recalculate training metrics.'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        {/* NM Input */}
                        <div className={styles.inputGroup}>
                            <label className={`${styles.label} ${styles.labelNM}`}>
                                Neuromuscular Power (NM)
                            </label>
                            <input
                                type="number"
                                value={profile.nm || ''}
                                onChange={(e) => handleInputChange('nm', e.target.value)}
                                placeholder="e.g. 922"
                                className={`${styles.input} ${styles.inputNM}`}
                            />
                            <p className={styles.helpText}>
                                Peak power output (5-15 seconds) - Your maximum sprint power
                            </p>
                        </div>

                        {/* AC Input */}
                        <div className={styles.inputGroup}>
                            <label className={`${styles.label} ${styles.labelAC}`}>
                                Anaerobic Capacity (AC)
                            </label>
                            <input
                                type="number"
                                value={profile.ac || ''}
                                onChange={(e) => handleInputChange('ac', e.target.value)}
                                placeholder="e.g. 503"
                                className={`${styles.input} ${styles.inputAC}`}
                            />
                            <p className={styles.helpText}>
                                Power at VO2max (1-2 minutes) - Your oxygen processing ability
                            </p>
                        </div>

                        {/* MAP Input */}
                        <div className={styles.inputGroup}>
                            <label className={`${styles.label} ${styles.labelMAP}`}>
                                Maximum Aerobic Power (MAP)
                            </label>
                            <input
                                type="number"
                                value={profile.map || ''}
                                onChange={(e) => handleInputChange('map', e.target.value)}
                                placeholder="e.g. 337"
                                className={`${styles.input} ${styles.inputMAP}`}
                            />
                            <p className={styles.helpText}>
                                Sustainable power at MAP (3-8 minutes) - Your aerobic engine
                            </p>
                        </div>

                        {/* FTP Input */}
                        <div className={styles.inputGroup}>
                            <label className={`${styles.label} ${styles.labelFTP}`}>
                                Functional Threshold Power (FTP)
                            </label>
                            <input
                                type="number"
                                value={profile.ftp || ''}
                                onChange={(e) => handleInputChange('ftp', e.target.value)}
                                placeholder="e.g. 266"
                                className={`${styles.input} ${styles.inputFTP}`}
                            />
                            <p className={styles.helpText}>
                                One-hour sustainable power - Your threshold endurance
                            </p>
                        </div>

                        {/* Target Intensity Input */}
                        <div className={styles.inputGroup}>
                            <label className={`${styles.label} ${styles.labelTarget}`}>
                                Target Intensity (%)
                            </label>
                            <input
                                type="number"
                                min="30"
                                max="100"
                                value={profile.targetIntensity || ''}
                                onChange={(e) => handleInputChange('targetIntensity', e.target.value)}
                                placeholder="e.g. 70"
                                className={`${styles.input} ${styles.inputTarget}`}
                            />
                            <p className={styles.helpText}>
                                Your preferred training intensity level (30-100%)
                            </p>
                        </div>
                    </div>

                    {/* Error Display */}
                    {errors.length > 0 && (
                        <div className={styles.errorDisplay}>
                            <h4 className={styles.errorTitle}>
                                Please fix these issues:
                            </h4>
                            <ul className={styles.errorList}>
                                {errors.map((error, index) => (
                                    <li key={index} className={styles.errorItem}>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className={styles.infoBox}>
                        <h4 className={styles.infoTitle}>
                            💡 Don't have these values yet?
                        </h4>
                        <p className={styles.infoText}>
                            These power values are determined through a 4DP test in Wahoo SYSTM. If you don't have them, 
                            you can estimate FTP and use these typical ratios: NM ≈ 150% of FTP, AC ≈ 120% of FTP, MAP ≈ 105% of FTP.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        {!isFirstTime && (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ''}`}
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