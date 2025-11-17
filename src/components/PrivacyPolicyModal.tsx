import React from 'react';
import styles from './PrivacyPolicyModal.module.css';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Privacy Policy - Workout Scheduling</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3>Your Data Stays Private</h3>
                        <p>
                            We take your privacy seriously. When you use our workout scheduling feature, 
                            your credentials and personal data are handled with the utmost care.
                        </p>
                    </div>

                    <div className={styles.section}>
                        <h3>What We Don't Do</h3>
                        <ul className={styles.list}>
                            <li><strong>No Storage:</strong> We never store your Wahoo Systm username or password</li>
                            <li><strong>No Tracking:</strong> We don't track or log your credentials</li>
                            <li><strong>No Sharing:</strong> We don't share your data with any third parties</li>
                            <li><strong>No Databases:</strong> Your credentials never touch our servers or databases</li>
                        </ul>
                    </div>

                    <div className={styles.section}>
                        <h3>How It Works</h3>
                        <p>
                            When you enter your Wahoo Systm credentials:
                        </p>
                        <ol className={styles.list}>
                            <li>Your credentials are kept only in your browser's memory</li>
                            <li>We connect directly from your browser to Wahoo Systm's API</li>
                            <li>We schedule your workouts using Wahoo's official endpoints</li>
                            <li>Your credentials are immediately cleared from memory after use</li>
                            <li>The connection is encrypted end-to-end</li>
                        </ol>
                    </div>

                    <div className={styles.section}>
                        <h3>Technical Details</h3>
                        <p>
                            This application runs entirely in your browser. Your Wahoo Systm credentials 
                            are sent directly to <code>api.thesufferfest.com</code> using their official 
                            GraphQL endpoints. We act only as a pass-through - your data never stops 
                            at our servers.
                        </p>
                    </div>

                    <div className={styles.section}>
                        <h3>Open Source</h3>
                        <p>
                            This application is open source. You can inspect the code to verify that 
                            we handle your data exactly as described in this policy. Look for the 
                            <code>systmApi.ts</code> service and <code>WorkoutSchedulingModal.tsx</code> 
                            component to see exactly how your credentials are processed.
                        </p>
                    </div>

                    <div className={styles.disclaimer}>
                        <p>
                            <strong>Note:</strong> This application is not affiliated with Wahoo Fitness. 
                            Wahoo, Systm, and The Sufferfest are trademarks of Wahoo Fitness LLC.
                        </p>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.okButton}>
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;