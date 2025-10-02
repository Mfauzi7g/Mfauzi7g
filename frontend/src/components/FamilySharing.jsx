import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Share, 
  Check, 
  X, 
  Shield,
  Settings,
  Crown,
  Eye,
  Lock
} from 'lucide-react';
import { familySharingAPI } from '../services/api';
import { toast } from 'sonner';

const FamilySharing = ({ selectedChild }) => {
  const { t } = useTranslation();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [sharedChildren, setSharedChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'co-parent'
  });

  useEffect(() => {
    loadFamilyData();
  }, []);

  const loadFamilyData = async () => {
    setLoading(true);
    try {
      const [members, invites, children] = await Promise.all([
        familySharingAPI.getFamilyMembers(),
        familySharingAPI.getPendingInvites(),
        familySharingAPI.getSharedChildren()
      ]);

      setFamilyMembers(members.data?.members || []);
      setPendingInvites(invites.data?.invites || []);
      setSharedChildren(children.data?.children || []);
    } catch (error) {
      console.error('Error loading family data:', error);
      toast.error('Failed to load family sharing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const result = await familySharingAPI.inviteMember(inviteData);
      if (result.success) {
        toast.success('Invitation sent successfully!');
        setInviteData({ email: '', role: 'co-parent' });
        setShowInviteForm(false);
        loadFamilyData();
      } else {
        toast.error(result.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      const result = await familySharingAPI.acceptInvite(inviteId);
      if (result.success) {
        toast.success('Successfully joined family!');
        loadFamilyData();
      } else {
        toast.error(result.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      const result = await familySharingAPI.rejectInvite(inviteId);
      if (result.success) {
        toast.success('Invitation rejected');
        loadFamilyData();
      } else {
        toast.error(result.message || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('Error rejecting invite:', error);
      toast.error('Failed to reject invitation');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'parent': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'co-parent': return <Users className="w-4 h-4 text-blue-600" />;
      case 'guardian': return <Shield className="w-4 h-4 text-green-600" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'view': return <Eye className="w-3 h-3 text-green-600" />;
      case 'control': return <Lock className="w-3 h-3 text-blue-600" />;
      case 'admin': return <Settings className="w-3 h-3 text-red-600" />;
      default: return <Eye className="w-3 h-3 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Family Sharing
          </h2>
          <p className="text-gray-600">
            Manage family access to children's screen time controls
          </p>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Invite Family Member</span>
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>Pending Invitations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Family Invitation</p>
                      <p className="text-sm text-gray-500">
                        From: {invite.from_user_id} • Role: {invite.role}
                      </p>
                      <p className="text-xs text-gray-400">
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.id)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectInvite(invite.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Family Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {familyMembers.length > 0 ? (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{member.user_id.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">User {member.user_id}</p>
                        {getRoleIcon(member.role)}
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        {member.permissions.map((permission) => (
                          <div key={permission} className="flex items-center space-x-1">
                            {getPermissionIcon(permission)}
                            <span className="text-xs text-gray-500">{permission}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">
                        Joined: {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {member.role !== 'parent' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Remove Access
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h3>
              <p className="text-gray-500 mb-4">
                Invite family members to help manage your children's screen time
              </p>
              <Button onClick={() => setShowInviteForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Send First Invitation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Children */}
      {sharedChildren.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share className="w-5 h-5 text-green-600" />
              <span>Children Shared With You</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sharedChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-500">{child.device_name}</p>
                      <p className="text-xs text-gray-400">
                        Shared by: {child.shared_by}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={child.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {child.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {child.permissions.map((permission) => (
                        <div key={permission} className="flex items-center">
                          {getPermissionIcon(permission)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invite Family Member</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteData.role}
                    onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="co-parent">Co-Parent (Full Access)</option>
                    <option value="guardian">Guardian (View Only)</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Send Invitation
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowInviteForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FamilySharing;