import React from 'react';
import { useViewport } from '../hooks/useViewport';
import styles from './IntroPage.module.css';

interface IntroPageProps {
    onGetStarted: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onGetStarted }) => {
    const viewport = useViewport();

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={`${styles.heroSection} ${viewport.isMobile ? styles.heroSectionMobile : ''}`}>
                <h1 className={`${styles.heroTitle} ${viewport.isMobile ? styles.heroTitleMobile : ''}`}>
                    Assault on the Castle
                </h1>
                <p className={`${styles.heroSubtitle} ${viewport.isMobile ? styles.heroSubtitleMobile : ''}`}>
                    Launch your siege on the fortress in pursuit of KNIGHTHOOD and IMMORTALITY! Plan your quest through 10 instruments of SUFFERING, 
                    analyze the training load, and storm the castle to claim the highest HONOUR in Sufferlandria!
                </p>
            </div>

            {/* What is the Challenge Section */}
            <div className={`${styles.contentCard} ${viewport.isMobile ? styles.contentCardMobile : ''}`}>
                <h2 className={`${styles.cardTitle} ${viewport.isMobile ? styles.cardTitleMobile : ''}`}>
                    🏰 The Quest Bestowed by the Ministry of Madness
                </h2>
                <p className={styles.cardText}>
                    There are those who know how to Suffer. And there are those for whom SUFFERING is but a minor annoyance. 
                    To earn the highest HONOUR accorded by the Sufferlandrian Ministry of Madness, one must simply do 
                    <strong> 10 Sufferfest videos back-to-back</strong>, with no more than 10 minutes rest between each instrument of pain.
                </p>
                <p className={`${styles.cardText} ${styles.cardTextLast}`}>
                    This is not merely a test of your physical capabilities in your Bicycle Torture Chamber—it's a trial of mental 
                    fortitude that separates true Sufferlandrians from mere mortals. Only the brave dare attempt it, and even fewer 
                    emerge victorious to bask in eternal GLORY!
                </p>
            </div>

            {/* How to Use This App */}
            <div className={`${styles.contentCard} ${viewport.isMobile ? styles.contentCardMobile : ''}`}>
                <h2 className={`${styles.cardTitle} ${viewport.isMobile ? styles.cardTitleMobile : ''} ${styles.cardTitleWithSteps}`}>
                    📱 Your Guide to KNIGHTHOOD
                </h2>
                
                <div className={styles.stepsContainer}>
                    <div className={styles.stepItem}>
                        <div className={styles.stepNumber}>1</div>
                        <div>
                            <h3 className={styles.stepTitle}>
                                Assemble Your Arsenal of SUFFERING
                            </h3>
                            <p className={styles.stepDescription}>
                                Use the <strong>"Plan Quest"</strong> tab to select 10 instruments of pain from all available 
                                Knighthood workouts. Witness real-time calculations of your impending SUFFERING through TSS and training load.
                            </p>
                        </div>
                    </div>

                    <div className={styles.stepItem}>
                        <div className={styles.stepNumber}>2</div>
                        <div>
                            <h3 className={styles.stepTitle}>
                                Plot Your Path to GLORY
                            </h3>
                            <p className={styles.stepDescription}>
                                Save different combinations of SUFFERING as scenarios. Compare the pain levels, 
                                share your madness with fellow Sufferlandrians, and find the perfect recipe for KNIGHTHOOD.
                            </p>
                        </div>
                    </div>

                    <div className={styles.stepItem}>
                        <div className={styles.stepNumber}>3</div>
                        <div>
                            <h3 className={styles.stepTitle}>
                                Perfect Your 4DP Battle Plan
                            </h3>
                            <p className={styles.stepDescription}>
                                Analyze your Four Dimensional Power profile, view detailed breakdowns of each torture session, 
                                and calibrate your power settings to accurately predict the magnitude of SUFFERING ahead.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`${styles.actionButtons} ${viewport.isMobile ? styles.actionButtonsMobile : ''}`}>
                <button
                    data-testid="begin-quest-button"
                    onClick={onGetStarted}
                    className={styles.primaryButton}
                >
                    ⚔️ Begin Your Assault on the Castle
                </button>
                <a
                    href="https://support.wahoofitness.com/hc/en-us/articles/4406074947090-How-to-become-a-Knight-of-Sufferlandria"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondaryButton}
                >
                    � Official Rules from the Ministry
                </a>
            </div>

        </div>
    );
};

export default IntroPage;