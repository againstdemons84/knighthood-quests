import React, { useState } from 'react';
import { UserPowerProfile } from '../types/userProfile';
import { getUserProfile, clearUserProfile, isUsingDefaultProfile } from '../utils/userProfileHelpers';
import UserProfileSetup from './UserProfileSetup';
import styles from './UserProfileManager.module.css';
import { formatTargetIntensity } from '../utils/targetIntensityUtils';

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
        <div className={styles.container}>
            <div className={styles.containerInner}>
                <h1 className={styles.title}>
                    Power Profile Settings
                </h1>
                <p className={isUsingDefaultProfile() ? styles.subtitleWithWarning : styles.subtitle}>
                    Manage your 4DP power profile values used for training metrics calculations
                </p>
                
                {isUsingDefaultProfile() && (
                    <div className={styles.warningBanner}>
                        <div className={styles.warningHeader}>
                            <span className={styles.warningIcon}>⚡</span>
                            <strong className={styles.warningTitle}>Using Default Power Profile</strong>
                        </div>
                        <p className={styles.warningText}>
                            You're currently using default power values (FTP: 200W, MAP: 260W, AC: 340W, NM: 450W). 
                            These are typical for recreational cyclists. For more accurate training metrics, 
                            customize these values based on your actual power profile or 4DP test results.
                        </p>
                    </div>
                )}

                {/* Current Profile Display */}
                <div className={styles.profileContainer}>
                    <h3 className={styles.profileTitle}>Current Power Profile</h3>
                    
                    <div className={styles.profileGrid}>
                        <div className={`${styles.powerCard} ${styles.powerCardNM}`}>
                            <div className={`${styles.powerCardLabel} ${styles.powerCardLabelNM}`}>
                                Neuromuscular Power
                            </div>
                            <div className={styles.powerCardValue}>
                                {currentProfile.nm}W
                            </div>
                            <div className={styles.powerCardUnit}>NM</div>
                        </div>

                        <div className={`${styles.powerCard} ${styles.powerCardAC}`}>
                            <div className={`${styles.powerCardLabel} ${styles.powerCardLabelAC}`}>
                                Anaerobic Capacity
                            </div>
                            <div className={styles.powerCardValue}>
                                {currentProfile.ac}W
                            </div>
                            <div className={styles.powerCardUnit}>AC</div>
                        </div>

                        <div className={`${styles.powerCard} ${styles.powerCardMAP}`}>
                            <div className={`${styles.powerCardLabel} ${styles.powerCardLabelMAP}`}>
                                Maximum Aerobic Power
                            </div>
                            <div className={styles.powerCardValue}>
                                {currentProfile.map}W
                            </div>
                            <div className={styles.powerCardUnit}>MAP</div>
                        </div>

                        <div className={`${styles.powerCard} ${styles.powerCardFTP}`}>
                            <div className={`${styles.powerCardLabel} ${styles.powerCardLabelFTP}`}>
                                Functional Threshold Power
                            </div>
                            <div className={styles.powerCardValue}>
                                {currentProfile.ftp}W
                            </div>
                            <div className={styles.powerCardUnit}>FTP</div>
                        </div>

                        <div className={`${styles.powerCard} ${styles.powerCardTarget}`}>
                            <div className={`${styles.powerCardLabel} ${styles.powerCardLabelTarget}`}>
                                Target Intensity
                            </div>
                            <div className={styles.powerCardValue}>
                                {formatTargetIntensity(currentProfile)}
                            </div>
                            <div className={styles.powerCardUnit}>Training Level</div>
                        </div>
                    </div>

                    {profileData && (
                        <div className={styles.profileMetadata}>
                            <div className={styles.profileDates}>
                                <span>Created: {new Date(profileData.createdAt).toLocaleDateString()}</span>
                                <span>Last Updated: {new Date(profileData.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.actionsContainer}>
                    <button
                        onClick={() => setShowSetup(true)}
                        className={styles.updateButton}
                    >
                        Update Power Profile
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={styles.clearButton}
                    >
                        Clear Profile
                    </button>
                </div>

                {/* Information Section */}
                <div className={styles.infoContainer}>
                    <h3 className={styles.infoTitle}>About 4DP Power Profile</h3>
                    <div className={styles.infoContent}>
                        <p className={styles.infoText}>
                            The Four Dimensional Power (4DP) profile captures your power across different energy systems:
                        </p>
                        <ul className={styles.infoList}>
                            <li className={styles.infoListItem}>
                                <strong className={styles.infoListItemNM}>NM (Neuromuscular Power):</strong> Peak 5-15 second power output
                            </li>
                            <li className={styles.infoListItem}>
                                <strong className={styles.infoListItemAC}>AC (Anaerobic Capacity):</strong> Power at VO2max (1-2 minutes)
                            </li>
                            <li className={styles.infoListItem}>
                                <strong className={styles.infoListItemMAP}>MAP (Maximum Aerobic Power):</strong> Sustainable aerobic power (3-8 minutes)
                            </li>
                            <li className={styles.infoListItem}>
                                <strong className={styles.infoListItemFTP}>FTP (Functional Threshold Power):</strong> One-hour sustainable power
                            </li>
                            <li className={styles.infoListItem}>
                                <strong className={styles.infoListItemTarget}>Target Intensity:</strong> Your preferred training intensity level (30-100%)
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
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <h3 className={styles.modalTitle}>Clear Power Profile?</h3>
                            <p className={styles.modalText}>
                                This will permanently delete your power profile and refresh the app. 
                                You'll need to set up your profile again.
                            </p>
                            <div className={styles.modalActions}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className={styles.modalCancelButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearProfile}
                                    className={styles.modalConfirmButton}
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