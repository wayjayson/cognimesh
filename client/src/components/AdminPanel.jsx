import React, { useState, useEffect } from 'react';
import { fetchAdminStats, fetchAdminUsers, fetchAdminUserEntries, deleteAdminUser, deleteAdminEntry } from '../api';
import toast from 'react-hot-toast';

export default function AdminPanel({ onClose }) {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userEntries, setUserEntries] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try { setStats(await fetchAdminStats()); } catch (e) { toast.error('加载统计失败'); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await fetchAdminUsers()); } catch (e) { toast.error('加载用户列表失败'); }
    finally { setLoading(false); }
  };

  const viewEntries = async (user) => {
    setViewingUser(user);
    setLoading(true);
    try { setUserEntries(await fetchAdminUserEntries(user._id)); } catch (e) { toast.error('加载日记失败'); }
    finally { setLoading(false); }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`确认删除用户 ${user.email} 及其全部日记？此操作不可撤销。`)) return;
    try {
      await deleteAdminUser(user._id);
      toast.success('已删除');
      setUsers(users.filter(u => u._id !== user._id));
      loadStats();
    } catch (e) { toast.error(e.message); }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('确认删除此条目？')) return;
    try {
      await deleteAdminEntry(entryId);
      toast.success('已删除');
      setUserEntries(userEntries.filter(e => e._id !== entryId));
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '92vh' }}>
        <h4>管理后台</h4>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'stats', label: '统计' },
            { key: 'users', label: '用户' },
          ].map(t => (
            <button key={t.key}
              className={tab === t.key ? 'btn-primary' : 'btn-secondary'}
              style={{ width: 'auto', padding: '5px 16px', fontSize: '0.75rem', margin: 0 }}
              onClick={() => { setTab(t.key); if (t.key === 'users') loadUsers(); else loadStats(); }}
            >{t.label}</button>
          ))}
          <button className="btn-secondary" onClick={onClose} style={{ width: 'auto', padding: '5px 16px', fontSize: '0.75rem', margin: 0, marginLeft: 'auto' }}>关闭</button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>加载中...</p>}

        {/* Stats Tab */}
        {tab === 'stats' && stats && !loading && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: '总用户', value: stats.totalUsers },
                { label: '活跃用户(7天)', value: stats.activeUsers },
                { label: '总日记', value: stats.totalEntries },
                { label: '本月新增', value: stats.entriesThisMonth },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-heading)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {stats.usersByMonth?.length > 0 && (
              <div>
                <h5 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>月度注册趋势</h5>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
                  {stats.usersByMonth.map(m => (
                    <div key={m._id} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ background: 'var(--accent)', borderRadius: '3px 3px 0 0', height: Math.max(4, m.count * 10), minWidth: 20 }} />
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>{m._id.slice(5)}月</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-heading)' }}>{m.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && !loading && (
          <div>
            {viewingUser ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <button className="btn-secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.7rem', margin: 0 }}
                    onClick={() => { setViewingUser(null); setUserEntries(null); }}>← 返回</button>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-heading)' }}>{viewingUser.email} 的日记</span>
                </div>
                {userEntries?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>暂无日记</p>}
                {userEntries?.map(e => (
                  <div key={e._id} className="diary-entry-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="diary-entry-time">{e.date} {e.time} · 心情{e.valence} 精神{e.arousal}</div>
                      <div>{e.thought || '(无文字)'}</div>
                      {e.situation && <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>情境: {e.situation}</div>}
                    </div>
                    <button className="btn-danger" style={{ width: 'auto', padding: '2px 8px', fontSize: '0.65rem', margin: 0 }}
                      onClick={() => handleDeleteEntry(e._id)}>删除</button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {users.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>暂无用户</p>}
                {users.map(u => (
                  <div key={u._id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px', marginBottom: 6
                  }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-heading)' }}>
                        {u.email}
                        {u.role === 'admin' && <span style={{ color: 'var(--accent)', fontSize: '0.6rem', marginLeft: 6 }}>管理员</span>}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {u.entryCount || 0} 条日记
                        {u.lastEntryDate && ` · 最后: ${u.lastEntryDate}`}
                        {' · '}{new Date(u.createdAt).toLocaleDateString('zh-CN')} 注册
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ width: 'auto', padding: '3px 10px', fontSize: '0.65rem', margin: 0 }}
                        onClick={() => viewEntries(u)}>查看</button>
                      {u.role !== 'admin' && (
                        <button className="btn-danger" style={{ width: 'auto', padding: '3px 10px', fontSize: '0.65rem', margin: 0 }}
                          onClick={() => handleDeleteUser(u)}>删除</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
