import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createReading, publishReading, assignReading } from '@/services/reading.service';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { Button } from '@/components/common/Button';

export function CreateReadingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [contentFormat, setContentFormat] = useState<'plain' | 'markdown'>('plain');
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const classes = useLiveQuery(
    () => (user ? db.classes.where('teacherId').equals(user.$id).toArray() : []),
    [user?.$id],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const reading = await createReading(user.$id, title, content, {
        author, sourceUrl, description, contentFormat,
      });
      await publishReading(reading.$id, user.$id);
      for (const classId of selectedClasses) {
        await assignReading(reading.$id, classId);
      }
      navigate('/readings');
    } catch {
      setError('Failed to create reading');
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (id: string) => {
    setSelectedClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Reading</h1>
      <form onSubmit={void handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
            <input
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              type="url"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="text-sm font-medium text-gray-700">Format:</label>
            <button
              type="button"
              onClick={() => setContentFormat('plain')}
              className={`text-sm px-3 py-1 rounded ${contentFormat === 'plain' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Plain text
            </button>
            <button
              type="button"
              onClick={() => setContentFormat('markdown')}
              className={`text-sm px-3 py-1 rounded ${contentFormat === 'markdown' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
            >
              Markdown
            </button>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-y font-mono text-sm"
            placeholder="Paste the reading text here…"
          />
        </div>

        {classes && classes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign to classes</label>
            <div className="space-y-2">
              {classes.map(cls => (
                <label key={cls.$id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClasses.has(cls.$id)}
                    onChange={() => toggleClass(cls.$id)}
                    className="rounded"
                  />
                  <span>{cls.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Create & publish reading
        </Button>
      </form>
    </div>
  );
}
