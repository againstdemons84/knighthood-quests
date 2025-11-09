import React from 'react';
import { useViewport } from '../hooks/useViewport';

interface IntroPageProps {
    onGetStarted: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onGetStarted }) => {
    const viewport = useViewport();

    return (
        <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            color: 'white'
        }}>
            {/* Hero Section */}
            <div style={{
                textAlign: 'center',
                marginBottom: viewport.isMobile ? '32px' : '48px'
            }}>
                <h1 style={{
                    fontSize: viewport.isMobile ? '32px' : '48px',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Assault on the Castle
                </h1>
                <p style={{
                    fontSize: viewport.isMobile ? '18px' : '20px',
                    color: '#999',
                    lineHeight: '1.6'
                }}>
                    Launch your siege on the fortress in pursuit of KNIGHTHOOD and IMMORTALITY! Plan your quest through 10 instruments of SUFFERING, 
                    analyze the training load, and storm the castle to claim the highest HONOUR in Sufferlandria!
                </p>
            </div>

            {/* What is the Challenge Section */}
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: viewport.isMobile ? '24px' : '32px',
                borderRadius: '12px',
                marginBottom: '24px'
            }}>
                <h2 style={{
                    fontSize: viewport.isMobile ? '24px' : '28px',
                    marginBottom: '16px',
                    color: '#4CAF50'
                }}>
                    🏰 The Quest Bestowed by the Ministry of Madness
                </h2>
                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: '#ccc',
                    marginBottom: '16px'
                }}>
                    There are those who know how to Suffer. And there are those for whom SUFFERING is but a minor annoyance. 
                    To earn the highest HONOUR accorded by the Sufferlandrian Ministry of Madness, one must simply do 
                    <strong> 10 Sufferfest videos back-to-back</strong>, with no more than 10 minutes rest between each instrument of pain.
                </p>
                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: '#ccc'
                }}>
                    This is not merely a test of your physical capabilities in your Bicycle Torture Chamber—it's a trial of mental 
                    fortitude that separates true Sufferlandrians from mere mortals. Only the brave dare attempt it, and even fewer 
                    emerge victorious to bask in eternal GLORY!
                </p>
            </div>

            {/* How to Use This App */}
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: viewport.isMobile ? '24px' : '32px',
                borderRadius: '12px',
                marginBottom: '24px'
            }}>
                <h2 style={{
                    fontSize: viewport.isMobile ? '24px' : '28px',
                    marginBottom: '20px',
                    color: '#4CAF50'
                }}>
                    📱 Your Guide to KNIGHTHOOD
                </h2>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>1</div>
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'white' }}>
                                Assemble Your Arsenal of SUFFERING
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Use the <strong>"Plan Quest"</strong> tab to select 10 instruments of pain from all available 
                                Knighthood workouts. Witness real-time calculations of your impending SUFFERING through TSS and training load.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>2</div>
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'white' }}>
                                Plot Your Path to GLORY
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Save different combinations of SUFFERING as scenarios. Compare the pain levels, 
                                share your madness with fellow Sufferlandrians, and find the perfect recipe for KNIGHTHOOD.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>3</div>
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'white' }}>
                                Perfect Your 4DP Battle Plan
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Analyze your Four Dimensional Power profile, view detailed breakdowns of each torture session, 
                                and calibrate your power settings to accurately predict the magnitude of SUFFERING ahead.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div style={{
                backgroundColor: '#2a2a2a',
                padding: viewport.isMobile ? '24px' : '32px',
                borderRadius: '12px',
                marginBottom: '32px'
            }}>
                <h2 style={{
                    fontSize: viewport.isMobile ? '24px' : '28px',
                    marginBottom: '16px',
                    color: '#FF9800'
                }}>
                    💡 Wisdom from Fellow Knights
                </h2>
                <ul style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: '#ccc',
                    paddingLeft: '20px'
                }}>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Embrace Humility:</strong> Choose the Merciful Path for your first quest into KNIGHTHOOD
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Fuel for Battle:</strong> 6+ hours in your Bicycle Torture Chamber demands serious nutrition strategy
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Respect the TSS:</strong> Aim for 400-600 TSS based on your tolerance for SUFFERING
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Train for Pain:</strong> Test shorter combinations before attempting the full symphony of SUFFERING
                    </li>
                </ul>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                flexDirection: viewport.isMobile ? 'column' : 'row',
                gap: '16px',
                justifyContent: 'center',
                marginBottom: '32px'
            }}>
                <button
                    data-testid="begin-quest-button"
                    onClick={onGetStarted}
                    style={{
                        padding: '16px 32px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
                >
                    ⚔️ Begin Your Assault on the Castle
                </button>
                <a
                    href="https://support.wahoofitness.com/hc/en-us/articles/4406074947090-How-to-become-a-Knight-of-Sufferlandria"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        padding: '16px 32px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        display: 'inline-block'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
                >
                    � Official Rules from the Ministry
                </a>
            </div>

            {/* Footer Links */}
            <div style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#666',
                borderTop: '1px solid #333',
                paddingTop: '24px'
            }}>
                <p style={{ marginBottom: '8px' }}>
                    <strong>Helpful Resources:</strong>
                </p>
                <div style={{
                    display: 'flex',
                    flexDirection: viewport.isMobile ? 'column' : 'row',
                    gap: viewport.isMobile ? '8px' : '24px',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <a 
                        href="https://wahooligan.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#4CAF50', textDecoration: 'none' }}
                    >
                        Wahooligan Community
                    </a>
                    <a 
                        href="https://www.wahoofitness.com/devices/indoor-cycling/bike-trainers" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#4CAF50', textDecoration: 'none' }}
                    >
                        SYSTM Training App
                    </a>
                    <a 
                        href="https://thesufferfest.com/pages/four-dimensional-power" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#4CAF50', textDecoration: 'none' }}
                    >
                        4DP Power Profile
                    </a>
                </div>
            </div>
        </div>
    );
};

export default IntroPage;