// src/admin/components/Promotions/PromotionsPage.jsx
// Loyalty rewards and promotional campaigns for regular shuttle users

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from '../Common/Button';
import Modal from '../Common/Modal';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Alert from '../Common/Alert';

export default function PromotionsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form state for new campaign
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardType: 'free_ride',
    minimumRides: 10,
    frequency: 'monthly',
    active: true
  });

  useEffect(() => {
    loadCampaigns();
    loadEligibleUsers();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await api.get('/admin/promotions/campaigns');
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      showAlert('error', 'Failed to load campaigns');
    }
  };

  const loadEligibleUsers = async () => {
    try {
      const data = await api.get('/admin/promotions/eligible-users');
      setEligibleUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading eligible users:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/promotions/campaigns', formData);
      showAlert('success', 'Campaign created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadCampaigns();
    } catch (error) {
      showAlert('error', error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRewards = async (campaignId) => {
    if (!confirm('Send reward emails to all eligible users for this campaign?')) return;

    setLoading(true);
    try {
      const result = await api.post(`/admin/promotions/campaigns/${campaignId}/send-rewards`);
      showAlert('success', `Sent ${result.sent || 0} reward emails successfully!`);
      loadEligibleUsers();
    } catch (error) {
      showAlert('error', error.response?.data?.error || 'Failed to send rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (campaignId, currentStatus) => {
    setLoading(true);
    try {
      await api.put(`/admin/promotions/campaigns/${campaignId}`, {
        active: !currentStatus
      });
      showAlert('success', 'Campaign status updated');
      loadCampaigns();
    } catch (error) {
      showAlert('error', 'Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      rewardType: 'free_ride',
      minimumRides: 10,
      frequency: 'monthly',
      active: true
    });
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSendRewardEmail = async (user) => {
    if (!confirm(`Send reward email to ${user.fullName}?`)) return;

    setLoading(true);
    try {
      await api.post('/admin/promotions/send-reward', {
        userId: user._id,
        rewardType: 'free_ride'
      });
      showAlert('success', 'Reward email sent successfully!');
    } catch (error) {
      showAlert('error', error.response?.data?.error || 'Failed to send reward email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px', borderBottom: '2px solid rgba(255,212,28,0.2)', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFD41C', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🎁</span> Loyalty Rewards & Promotions
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(251,251,251,0.6)', margin: 0 }}>
          Reward regular shuttle users and boost engagement with promotional campaigns
        </p>
      </div>

      {/* Alert */}
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Actions */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <Button onClick={() => setShowCreateModal(true)} icon="➕">
          Create Campaign
        </Button>
        <Button onClick={loadEligibleUsers} variant="secondary" icon="🔄">
          Refresh Eligible Users
        </Button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard
          icon="📊"
          label="Active Campaigns"
          value={campaigns.filter(c => c.active).length}
          color="#10B981"
        />
        <StatCard
          icon="👥"
          label="Eligible Users"
          value={eligibleUsers.length}
          color="#3B82F6"
        />
        <StatCard
          icon="🎫"
          label="Rewards Sent This Month"
          value={campaigns.reduce((sum, c) => sum + (c.rewardsSent || 0), 0)}
          color="#FFD41C"
        />
      </div>

      {/* Eligible Users Section */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255,212,28,0.2)',
        padding: '24px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#FFD41C', fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏆</span> Users Eligible for Rewards
        </h3>

        {eligibleUsers.length === 0 ? (
          <p style={{ color: 'rgba(251,251,251,0.5)', textAlign: 'center', padding: '40px' }}>
            No eligible users yet. Users who regularly use the shuttle service will appear here.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,212,28,0.2)' }}>
                  <th style={tableHeaderStyle}>Student Name</th>
                  <th style={tableHeaderStyle}>School ID</th>
                  <th style={tableHeaderStyle}>Rides This Month</th>
                  <th style={tableHeaderStyle}>Total Spent</th>
                  <th style={tableHeaderStyle}>Last Ride</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eligibleUsers.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,212,28,0.1)' }}>
                    <td style={tableCellStyle}>{user.fullName}</td>
                    <td style={tableCellStyle}>{user.schoolUId}</td>
                    <td style={tableCellStyle}>
                      <span style={{ color: '#10B981', fontWeight: 600 }}>{user.ridesThisMonth}</span>
                    </td>
                    <td style={tableCellStyle}>₱{user.totalSpent?.toFixed(2)}</td>
                    <td style={tableCellStyle}>
                      {user.lastRideDate ? new Date(user.lastRideDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={tableCellStyle}>
                      <Button
                        size="small"
                        onClick={() => handleSendRewardEmail(user)}
                        disabled={loading}
                      >
                        Send Reward
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaigns List */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255,212,28,0.2)',
        padding: '24px'
      }}>
        <h3 style={{ color: '#FFD41C', fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📢</span> Promotional Campaigns
        </h3>

        {campaigns.length === 0 ? (
          <p style={{ color: 'rgba(251,251,251,0.5)', textAlign: 'center', padding: '40px' }}>
            No campaigns yet. Create your first campaign to start rewarding loyal users!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,212,28,0.15)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ color: '#FBFBFB', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                      {campaign.title}
                    </h4>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: campaign.active ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)',
                      color: campaign.active ? '#10B981' : '#9CA3AF',
                      border: `1px solid ${campaign.active ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.3)'}`
                    }}>
                      {campaign.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(251,251,251,0.7)', fontSize: '14px', margin: '0 0 12px 0' }}>
                    {campaign.description}
                  </p>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'rgba(251,251,251,0.6)' }}>
                    <span>🎫 {campaign.rewardType === 'free_ride' ? 'Free Ride' : campaign.rewardType}</span>
                    <span>🔢 Min. {campaign.minimumRides} rides</span>
                    <span>📅 {campaign.frequency}</span>
                    <span>📧 {campaign.rewardsSent || 0} sent</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    size="small"
                    onClick={() => handleSendRewards(campaign._id)}
                    disabled={loading || !campaign.active}
                  >
                    Send Rewards
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => handleToggleActive(campaign._id, campaign.active)}
                    disabled={loading}
                  >
                    {campaign.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <Modal
          title="Create Promotional Campaign"
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Campaign Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monthly Loyalty Reward"
              required
            />

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#FBFBFB' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the reward to motivate students..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,212,28,0.2)',
                  borderRadius: '8px',
                  color: '#FBFBFB',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <Select
              label="Reward Type"
              value={formData.rewardType}
              onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
              options={[
                { value: 'free_ride', label: '🎫 Free Ride' },
                { value: 'discount', label: '💰 Discount' },
                { value: 'credit', label: '💳 Account Credit' }
              ]}
            />

            <Input
              label="Minimum Rides Required"
              type="number"
              value={formData.minimumRides}
              onChange={(e) => setFormData({ ...formData, minimumRides: parseInt(e.target.value) })}
              min="1"
              required
            />

            <Select
              label="Frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              options={[
                { value: 'weekly', label: '📅 Weekly' },
                { value: 'biweekly', label: '📅 Bi-Weekly' },
                { value: 'monthly', label: '📅 Monthly' }
              ]}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Button onClick={handleCreate} disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid rgba(255,212,28,0.2)'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: 'rgba(251,251,251,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: color }}>
        {value}
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 700,
  color: '#FFD41C',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle = {
  padding: '16px 12px',
  fontSize: '14px',
  color: '#FBFBFB'
};