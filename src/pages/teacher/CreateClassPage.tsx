import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createClass } from '@/services/class.service';
import { Button } from '@/components/common/Button';

export function CreateClassPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await createClass(user.$id, name, courseName, schoolYear);
      navigate('/classes');
    } catch {
      setError('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Class</h1>
      <form onSubmit={void handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            placeholder="e.g., English 101 - Period 3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course name</label>
          <input
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            placeholder="e.g., English Literature"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School year / semester</label>
          <input
            value={schoolYear}
            onChange={e => setSchoolYear(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            placeholder="e.g., 2025-2026 Fall"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">Create class</Button>
      </form>
    </div>
  );
}
