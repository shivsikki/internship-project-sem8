import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useRealTimeSync from '../../hooks/useRealTimeSync';
import { useToast } from '../Toast/ToastProvider';
import './HealthRecommendations.css';

const HealthRecommendations = ({ user }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [healthGoals, setHealthGoals] = useState([]);
  const [wellnessScore, setWellnessScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [personalizedPlan, setPersonalizedPlan] = useState(null);
  const [healthInsights, setHealthInsights] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState(null);

  // Real-time sync hook
  const { registerCallback, triggerRefresh } = useRealTimeSync(user?._id, user?.role);

  useEffect(() => {
    loadHealthRecommendations();
  }, []);

  // Register real-time callbacks
  useEffect(() => {
    if (!user?._id) return;

    // Register callbacks for real-time updates
    const unregisterTestUpdate = registerCallback('onTestUpdate', (data) => {
      console.log('HealthRecommendations: Test updated', data);
      loadHealthRecommendations(); // Refresh recommendations
    });

    const unregisterPrescriptionUpdate = registerCallback('onPrescriptionUpdate', (data) => {
      console.log('HealthRecommendations: Prescription updated', data);
      loadHealthRecommendations(); // Refresh recommendations
    });

    const unregisterAppointmentUpdate = registerCallback('onAppointmentUpdate', (data) => {
      console.log('HealthRecommendations: Appointment updated', data);
      loadHealthRecommendations(); // Refresh recommendations
    });

    // Cleanup on unmount
    return () => {
      unregisterTestUpdate?.();
      unregisterPrescriptionUpdate?.();
      unregisterAppointmentUpdate?.();
    };
  }, [user?._id, registerCallback]);

  const loadHealthRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get user's health data for personalized recommendations
      const response = await axios.post('/api/ai/health-recommendations', {
        userId: user._id,
        age: user.age,
        gender: user.gender,
        preferences: {
          fitness: 'moderate',
          diet: 'balanced',
          sleep: 'adequate',
          stress: 'moderate'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRecommendations(response.data.data.recommendations || []);
        setHealthGoals(response.data.data.goals || []);
        setWellnessScore(response.data.data.wellnessScore || 75);
        setPersonalizedPlan(response.data.data.personalizedPlan || null);
        setHealthInsights(response.data.data.insights || []);
        setRiskAssessment(response.data.data.riskAssessment || null);
      }
    } catch (error) {
      console.error('Error loading health recommendations:', error);
      // Fallback to mock data
      setMockRecommendations();
    } finally {
      setLoading(false);
    }
  };

  const setMockRecommendations = () => {
    setRecommendations([
      {
        id: 1,
        category: 'exercise',
        title: 'Increase Daily Steps',
        description: 'Aim for 10,000 steps daily to improve cardiovascular health',
        priority: 'high',
        difficulty: 'moderate',
        timeCommitment: '30 min/day',
        benefits: ['Better heart health', 'Weight management', 'Improved mood'],
        actionSteps: ['Take stairs instead of elevator', 'Walk during lunch breaks', 'Park further away'],
        progress: 65
      },
      {
        id: 2,
        category: 'diet',
        title: 'Add More Vegetables',
        description: 'Include at least 5 servings of vegetables in your daily diet',
        priority: 'high',
        difficulty: 'easy',
        timeCommitment: '5 min/meal',
        benefits: ['Better nutrition', 'Improved digestion', 'Stronger immune system'],
        actionSteps: ['Add spinach to smoothies', 'Snack on carrot sticks', 'Include salad with lunch'],
        progress: 40
      },
      {
        id: 3,
        category: 'sleep',
        title: 'Improve Sleep Quality',
        description: 'Maintain consistent sleep schedule for 7-8 hours nightly',
        priority: 'medium',
        difficulty: 'moderate',
        timeCommitment: '8 hours/night',
        benefits: ['Better mental clarity', 'Improved immune function', 'More energy'],
        actionSteps: ['Go to bed same time nightly', 'Avoid screens before bed', 'Create relaxing bedtime routine'],
        progress: 80
      },
      {
        id: 4,
        category: 'stress',
        title: 'Practice Mindfulness',
        description: 'Dedicate 10 minutes daily to meditation or deep breathing',
        priority: 'medium',
        difficulty: 'easy',
        timeCommitment: '10 min/day',
        benefits: ['Reduced anxiety', 'Better focus', 'Emotional balance'],
        actionSteps: ['Use meditation apps', 'Practice deep breathing', 'Try guided imagery'],
        progress: 30
      },
      {
        id: 5,
        category: 'hydration',
        title: 'Stay Hydrated',
        description: 'Drink at least 8 glasses of water throughout the day',
        priority: 'medium',
        difficulty: 'easy',
        timeCommitment: 'Throughout day',
        benefits: ['Better skin', 'Improved kidney function', 'More energy'],
        actionSteps: ['Carry water bottle', 'Set hourly reminders', 'Drink before meals'],
        progress: 55
      },
      {
        id: 6,
        category: 'medical',
        title: 'Regular Health Checkups',
        description: 'Schedule annual physical exams and preventive screenings',
        priority: 'high',
        difficulty: 'easy',
        timeCommitment: 'Once/year',
        benefits: ['Early disease detection', 'Preventive care', 'Peace of mind'],
        actionSteps: ['Schedule annual physical', 'Get recommended screenings', 'Track health metrics'],
        progress: 90
      }
    ]);

    setHealthGoals([
      { id: 1, title: 'Lose 5 kg in 3 months', category: 'weight', target: 5, current: 2, unit: 'kg' },
      { id: 2, title: 'Run 5K without stopping', category: 'fitness', target: 5, current: 3, unit: 'km' },
      { id: 3, title: 'Meditate daily for 30 days', category: 'mental', target: 30, current: 12, unit: 'days' },
      { id: 4, title: 'Reduce blood pressure to 120/80', category: 'medical', target: 120, current: 125, unit: 'mmHg' }
    ]);

    setWellnessScore(78);

    setPersonalizedPlan({
      phase: 'Foundation Building',
      duration: '4 weeks',
      focus: ['Establishing healthy habits', 'Building consistency', 'Gradual improvements'],
      weeklySchedule: [
        { day: 'Monday', activities: ['30 min walk', 'Meditation', 'Healthy meal prep'] },
        { day: 'Tuesday', activities: ['Strength training', 'Hydration tracking', 'Sleep routine'] },
        { day: 'Wednesday', activities: ['Yoga', 'Mindful eating', 'Stress management'] },
        { day: 'Thursday', activities: ['Cardio exercise', 'Meal planning', 'Reflection'] },
        { day: 'Friday', activities: ['Active recovery', 'Social connection', 'Relaxation'] },
        { day: 'Saturday', activities: ['Outdoor activity', 'Family time', 'Flexibility'] },
        { day: 'Sunday', activities: ['Rest day', 'Meal prep', 'Goal review'] }
      ]
    });

    setHealthInsights([
      {
        type: 'positive',
        title: 'Strong Cardiovascular Base',
        description: 'Your recent activities show good heart health indicators',
        confidence: 85
      },
      {
        type: 'warning',
        title: 'Sleep Pattern Inconsistency',
        description: 'Irregular sleep times may affect your energy levels',
        confidence: 72
      },
      {
        type: 'opportunity',
        title: 'Stress Management Potential',
        description: 'Adding mindfulness practices could significantly improve well-being',
        confidence: 90
      }
    ]);

    setRiskAssessment({
      overall: 'low',
      factors: [
        { name: 'Cardiovascular', risk: 'low', score: 15 },
        { name: 'Metabolic', risk: 'moderate', score: 35 },
        { name: 'Mental Health', risk: 'low', score: 20 },
        { name: 'Immune System', risk: 'low', score: 18 }
      ],
      recommendations: ['Continue regular exercise', 'Monitor blood sugar', 'Practice stress management']
    });
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  const getCategoryIcon = (category) => {
    const icons = {
      exercise: '🏃',
      diet: '🥗',
      sleep: '😴',
      stress: '🧘',
      hydration: '💧',
      medical: '🏥',
      weight: '⚖️',
      mental: '🧠'
    };
    return icons[category] || '💪';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#ff6b6b',
      medium: '#f9ca24',
      low: '#4ecdc4'
    };
    return colors[priority] || '#95a5a6';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#4ecdc4',
      moderate: '#f9ca24',
      hard: '#ff6b6b'
    };
    return colors[difficulty] || '#95a5a6';
  };

  const updateRecommendationProgress = (id, progress) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, progress } : rec
    ));
  };

  const getWellnessScoreColor = (score) => {
    if (score >= 80) return '#4ecdc4';
    if (score >= 60) return '#45b7d1';
    if (score >= 40) return '#f9ca24';
    return '#ff6b6b';
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: '#4ecdc4',
      moderate: '#f9ca24',
      high: '#ff6b6b',
      critical: '#e74c3c'
    };
    return colors[risk] || '#95a5a6';
  };

  const categories = [
    { id: 'all', label: 'All Recommendations', icon: '🎯' },
    { id: 'exercise', label: 'Exercise', icon: '🏃' },
    { id: 'diet', label: 'Nutrition', icon: '🥗' },
    { id: 'sleep', label: 'Sleep', icon: '😴' },
    { id: 'stress', label: 'Stress Management', icon: '🧘' },
    { id: 'hydration', label: 'Hydration', icon: '💧' },
    { id: 'medical', label: 'Medical Care', icon: '🏥' }
  ];

  if (loading) {
    return (
      <div className="health-recommendations-loading">
        <div className="loading-spinner"></div>
        <p>Generating personalized health recommendations...</p>
      </div>
    );
  }

  return (
    <div className="health-recommendations">
      <div className="recommendations-header">
        <h2>🎯 AI-Powered Health Recommendations</h2>
        <p>Personalized wellness plan based on your health profile and goals</p>
      </div>

      {/* Wellness Score Overview */}
      <div className="wellness-score-section">
        <div className="score-overview">
          <div className="score-circle" style={{ borderColor: getWellnessScoreColor(wellnessScore) }}>
            <div className="score-value" style={{ color: getWellnessScoreColor(wellnessScore) }}>
              {wellnessScore}
            </div>
            <div className="score-label">Wellness Score</div>
          </div>
          <div className="score-details">
            <h3>Your Overall Wellness</h3>
            <p>Based on your current health metrics and lifestyle patterns</p>
            
            {riskAssessment && (
              <div className="risk-assessment">
                <h4>Risk Assessment</h4>
                <div className="risk-overview">
                  <span className="risk-level" style={{ color: getRiskColor(riskAssessment.overall) }}>
                    Overall Risk: {riskAssessment.overall.toUpperCase()}
                  </span>
                </div>
                <div className="risk-factors">
                  {riskAssessment.factors.map((factor, index) => (
                    <div key={index} className="risk-factor">
                      <span className="factor-name">{factor.name}</span>
                      <div className="risk-bar">
                        <div 
                          className="risk-fill" 
                          style={{ 
                            width: `${factor.score}%`,
                            backgroundColor: getRiskColor(factor.risk)
                          }}
                        ></div>
                      </div>
                      <span className="risk-score">{factor.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Insights */}
      {healthInsights.length > 0 && (
        <div className="insights-section">
          <h3>🔍 AI Health Insights</h3>
          <div className="insights-grid">
            {healthInsights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-header">
                  <span className="insight-icon">
                    {insight.type === 'positive' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'}
                  </span>
                  <h4>{insight.title}</h4>
                </div>
                <p>{insight.description}</p>
                <div className="confidence-meter">
                  <span>Confidence: {insight.confidence}%</span>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Plan */}
      {personalizedPlan && (
        <div className="personalized-plan-section">
          <h3>📋 Your Personalized Wellness Plan</h3>
          <div className="plan-overview">
            <div className="plan-header">
              <h4>{personalizedPlan.phase}</h4>
              <span className="plan-duration">{personalizedPlan.duration}</span>
            </div>
            <div className="plan-focus">
              <h5>Focus Areas:</h5>
              <ul>
                {personalizedPlan.focus.map((focus, index) => (
                  <li key={index}>{focus}</li>
                ))}
              </ul>
            </div>
            <div className="weekly-schedule">
              <h5>Weekly Schedule:</h5>
              <div className="schedule-grid">
                {personalizedPlan.weeklySchedule.map((day, index) => (
                  <div key={index} className="day-schedule">
                    <h6>{day.day}</h6>
                    <ul>
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="category-filter">
        <h3>📂 Filter Recommendations</h3>
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="recommendations-list">
        <h3>🎯 Personalized Recommendations</h3>
        <div className="recommendations-grid">
          {filteredRecommendations.map(recommendation => (
            <div key={recommendation.id} className="recommendation-card">
              <div className="card-header">
                <div className="recommendation-icon">
                  {getCategoryIcon(recommendation.category)}
                </div>
                <div className="recommendation-title">
                  <h4>{recommendation.title}</h4>
                  <div className="recommendation-meta">
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(recommendation.priority) }}
                    >
                      {recommendation.priority}
                    </span>
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(recommendation.difficulty) }}
                    >
                      {recommendation.difficulty}
                    </span>
                    <span className="time-commitment">
                      ⏱️ {recommendation.timeCommitment}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="card-content">
                <p>{recommendation.description}</p>
                
                <div className="benefits-section">
                  <h5>Benefits:</h5>
                  <ul>
                    {recommendation.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="action-steps">
                  <h5>Action Steps:</h5>
                  <ul>
                    {recommendation.actionSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{recommendation.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${recommendation.progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-actions">
                    <button 
                      onClick={() => updateRecommendationProgress(recommendation.id, Math.min(100, recommendation.progress + 10))}
                      className="progress-btn"
                    >
                      +10%
                    </button>
                    <button 
                      onClick={() => updateRecommendationProgress(recommendation.id, 100)}
                      className="progress-btn complete"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Goals */}
      {healthGoals.length > 0 && (
        <div className="health-goals-section">
          <h3>🎯 Your Health Goals</h3>
          <div className="goals-grid">
            {healthGoals.map(goal => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <span className="goal-icon">{getCategoryIcon(goal.category)}</span>
                  <h4>{goal.title}</h4>
                </div>
                <div className="goal-progress">
                  <div className="progress-circle">
                    <svg width="60" height="60">
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="5"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#4ecdc4"
                        strokeWidth="5"
                        strokeDasharray={`${2 * Math.PI * 25}`}
                        strokeDashoffset={`${2 * Math.PI * 25 * (1 - goal.current / goal.target)}`}
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                    <div className="progress-text">
                      {Math.round((goal.current / goal.target) * 100)}%
                    </div>
                  </div>
                  <div className="goal-details">
                    <span>{goal.current} / {goal.target} {goal.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecommendations;
