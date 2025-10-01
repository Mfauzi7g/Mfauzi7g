import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Gift,
  Star,
  Coins
} from 'lucide-react';
import { rewardsAPI } from '../services/api';
import { toast } from 'sonner';

const TaskManager = ({ selectedChild, onTaskUpdate }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'chores',
    reward_minutes: 15
  });

  React.useEffect(() => {
    if (selectedChild) {
      loadRewardsData();
    }
  }, [selectedChild]);

  const loadRewardsData = async () => {
    setLoading(true);
    try {
      const data = await rewardsAPI.getRewards(selectedChild.id);
      setRewardsData(data);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    setCreating(true);
    try {
      await rewardsAPI.createTask(selectedChild.id, taskForm);
      toast.success('Task created successfully!');
      setTaskForm({ title: '', description: '', category: 'chores', reward_minutes: 15 });
      setShowCreateDialog(false);
      loadRewardsData();
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const approveTask = async (taskId) => {
    try {
      await rewardsAPI.approveTask(taskId);
      toast.success('Task approved! Time added to child\'s bank.');
      loadRewardsData();
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Failed to approve task');
    }
  };

  const rejectTask = async (taskId) => {
    try {
      await rewardsAPI.rejectTask(taskId);
      toast.success('Task rejected');
      loadRewardsData();
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast.error('Failed to reject task');
    }
  };

  const handleRedeemTime = async () => {
    const minutesToRedeem = Math.min(rewardsData.earned_minutes, 60); // Max 1 hour at a time
    if (minutesToRedeem <= 0) {
      toast.error('No earned time available');
      return;
    }

    try {
      await rewardsAPI.redeemTime(selectedChild.id, minutesToRedeem);
      toast.success(`Successfully redeemed ${minutesToRedeem} minutes!`);
      loadRewardsData();
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error redeeming time:', error);
      toast.error('Failed to redeem time');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      chores: '🧹',
      homework: '📚',
      reading: '📖',
      exercise: '🏃‍♂️',
      creativity: '🎨',
      other: '⭐'
    };
    return icons[category] || '⭐';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      completed: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!selectedChild) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a family member to manage their tasks</p>
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedChild.name}'s Reward Center
          </h2>
          <p className="text-gray-600">Manage tasks and earned screen time</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task for {selectedChild.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="e.g., Make your bed"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Describe what needs to be done..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={taskForm.category} onValueChange={(value) => setTaskForm({...taskForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chores">🧹 Chores</SelectItem>
                    <SelectItem value="homework">📚 Homework</SelectItem>
                    <SelectItem value="reading">📖 Reading</SelectItem>
                    <SelectItem value="exercise">🏃‍♂️ Exercise</SelectItem>
                    <SelectItem value="creativity">🎨 Creativity</SelectItem>
                    <SelectItem value="other">⭐ Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reward">Reward Minutes (5-120)</Label>
                <Input
                  id="reward"
                  type="number"
                  min="5"
                  max="120"
                  value={taskForm.reward_minutes}
                  onChange={(e) => setTaskForm({...taskForm, reward_minutes: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createTask}
                  disabled={creating || !taskForm.title || !taskForm.description}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Time Bank */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Coins className="w-5 h-5 mr-2" />
            Time Bank
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-700">
                {rewardsData?.earned_minutes || 0} minutes
              </p>
              <p className="text-sm text-green-600">Available for extra screen time</p>
            </div>
            <Button 
              onClick={handleRedeemTime}
              disabled={!rewardsData?.earned_minutes || rewardsData.earned_minutes <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Gift className="w-4 h-4 mr-2" />
              Redeem Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tasks Completed
            </CardTitle>
            <Trophy className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rewardsData?.total_tasks_completed || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Tasks
            </CardTitle>
            <Clock className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rewardsData?.pending_tasks?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Minutes Earned
            </CardTitle>
            <Star className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rewardsData?.completed_tasks?.reduce((total, task) => total + task.reward_minutes, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Tasks */}
      {rewardsData?.pending_tasks?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Pending Tasks ({rewardsData.pending_tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rewardsData.pending_tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getCategoryIcon(task.category)}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === 'completed' ? 'Waiting for Approval' : 'Pending'}
                        </Badge>
                        <span className="text-sm text-gray-500">+{task.reward_minutes} min</span>
                      </div>
                    </div>
                  </div>
                  {task.status === 'completed' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveTask(task.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectTask(task.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Completed Tasks */}
      {rewardsData?.completed_tasks?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewardsData.completed_tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">{getCategoryIcon(task.category)}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-500">
                        Completed {new Date(task.approved_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">+{task.reward_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskManager;