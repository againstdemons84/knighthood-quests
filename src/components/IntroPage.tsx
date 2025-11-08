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
                    Knight of Sufferlandria Challenge
                </h1>
                <p style={{
                    fontSize: viewport.isMobile ? '18px' : '20px',
                    color: '#999',
                    lineHeight: '1.6'
                }}>
                    Become a Knight by completing 10 Knighthood workouts back-to-back. 
                    Plan your challenge, analyze the training load, and conquer Sufferlandria!
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
                    🏰 What is the Knight of Sufferlandria Challenge?
                </h2>
                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: '#ccc',
                    marginBottom: '16px'
                }}>
                    The Knight of Sufferlandria is the ultimate endurance challenge in the SYSTM training app. 
                    To earn your knighthood, you must complete <strong>10 Knighthood workouts</strong> in a single session, 
                    back-to-back with no more than 10 minutes between each workout.
                </p>
                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: '#ccc'
                }}>
                    This is not just a test of fitness—it's a test of mental fortitude, strategic planning, 
                    and pure determination. Only the brave attempt it, and even fewer complete it successfully.
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
                    📱 How to Use This App
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
                                Plan Your Challenge
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Use the <strong>"Plan Challenge"</strong> tab to select 10 workouts from all available 
                                Knighthood workouts. See real-time calculations of total duration, TSS, and training load.
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
                                Save & Compare Scenarios
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Save different workout combinations as scenarios. Compare training loads, 
                                share with friends, and find the perfect strategy for your fitness level.
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
                                Optimize Your Strategy
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Analyze power profiles, view detailed workout breakdowns, and adjust your 
                                power profile settings to get accurate TSS and IF calculations.
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
                    💡 Pro Tips for Success
                </h2>
                <ul style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: '#ccc',
                    paddingLeft: '20px'
                }}>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Start Conservative:</strong> Choose easier workouts for your first attempt
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Plan Your Nutrition:</strong> 6+ hours requires serious fueling strategy
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Mind the TSS:</strong> Aim for 400-600 TSS depending on your fitness level
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Test Your Scenarios:</strong> Practice with shorter workout combinations first
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
                    🚀 Start Planning Your Challenge
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
                    📚 Official SYSTM Guide
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