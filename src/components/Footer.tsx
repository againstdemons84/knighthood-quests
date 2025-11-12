import React from 'react';
import { useViewport } from '../hooks/useViewport';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
    const viewport = useViewport();

    return (
        <div className={styles.footer}>
            <p className={styles.footerTitle}>
                <strong>Helpful Resources:</strong>
            </p>
            <div className={`${styles.linksContainer} ${viewport.isMobile ? styles.linksContainerMobile : styles.linksContainerDesktop}`}>
                <a 
                    href="https://wahooligan.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    Wahooligan Community
                </a>
                <a 
                    href="https://systm.wahoofitness.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    SYSTM Training App
                </a>
                <a 
                    href="https://support.wahoofitness.com/hc/en-us/articles/360021387420-Learn-about-4DP" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    4DP Power Profile
                </a>
                <a 
                    href="https://github.com/againstdemons84/knighthood-quests/issues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    Raise an Issue
                </a>
                <a 
                    href="https://github.com/againstdemons84/knighthood-quests/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    Contribute on GitHub
                </a>
            </div>
        </div>
    );
};

export default Footer;