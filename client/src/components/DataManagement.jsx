import React, { useRef, useState } from 'react';
import { exportAllJSON, importFromJSON } from '../api';
import toast from 'react-hot-toast';

export default function DataManagement() {
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAllJSON();
      toast.success('备份导出成功');
    } catch (err) {
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importFromJSON(file);
      toast.success(`导入完成：${result.imported}/${result.total} 条记录`);
    } catch (err) {
      toast.error('导入失败，请检查文件格式');
    } finally {
      setImporting(false);
    }
    e.target.value = '';
  };

  return (
    <div className="card">
      <h4>数据管理</h4>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
        导出全量 JSON 备份，或从备份文件恢复数据（自动去重）
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? '导出中...' : '导出全部备份'}
        </button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? '导入中...' : '导入备份'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
    </div>
  );
}
