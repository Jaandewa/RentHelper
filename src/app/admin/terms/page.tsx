'use client'

import { useState, useEffect } from 'react'
import { FileText, Shield, CheckCircle, Clock, Eye, Search, AlertCircle } from 'lucide-react'

interface PlatformTermsVersion {
  id: string
  version: string
  title: string
  content: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  createdBy: string
}

export default function AdminTermsPage() {
  const [platformTerms, setPlatformTerms] = useState<PlatformTermsVersion[]>([])
  const [activePlatformTerms, setActivePlatformTerms] = useState<PlatformTermsVersion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selected terms for read-only preview modal
  const [previewTerms, setPreviewTerms] = useState<{ title: string; version: string; content: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTerms()
  }, [])

  const fetchTerms = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/terms')
      if (!res.ok) throw new Error('Failed to fetch terms')
      const data = await res.json()
      setPlatformTerms(data.termsVersions || [])
      setActivePlatformTerms(data.activeTerms || null)
    } catch (err: any) {
      setError(err.message || 'Error loading terms versions')
    } finally {
      setLoading(false)
    }
  }

  const filteredPlatformTerms = platformTerms.filter(t => 
    t.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Terms & Legal Policies</h1>
        <p className="admin-page-subtitle">
          Inspect platform terms of service versions and legal agreement history.
        </p>
      </div>

      {/* Stats row */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon bg-blue-500/10 text-blue-500">
            <Shield size={20} />
          </div>
          <div className="admin-stat-card__value">
            {activePlatformTerms ? activePlatformTerms.version : 'None Active'}
          </div>
          <div className="admin-stat-card__label">Active Platform Terms</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon bg-indigo-500/10 text-indigo-500">
            <FileText size={20} />
          </div>
          <div className="admin-stat-card__value">{platformTerms.length}</div>
          <div className="admin-stat-card__label">Total Platform Versions</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div className="admin-stat-card__value">Snapshot On Booking</div>
          <div className="admin-stat-card__label">Mandatory Legal Contract</div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-card text-center py-12">
          <div className="admin-spinner mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading terms data...</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <div className="admin-table-toolbar">
            <h3 className="admin-table-toolbar__title">Platform Terms Versions</h3>
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search versions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Title</th>
                <th>Status</th>
                <th>Published At</th>
                <th>Created At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlatformTerms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No platform terms versions found.
                  </td>
                </tr>
              ) : (
                filteredPlatformTerms.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="font-mono font-semibold text-blue-500">
                        {t.version}
                      </span>
                    </td>
                    <td className="font-medium text-gray-900 dark:text-gray-100">
                      {t.title}
                    </td>
                    <td>
                      {t.isPublished ? (
                        <span className="admin-badge admin-badge--active">
                          <CheckCircle size={12} /> Active Published
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge--trial">
                          <Clock size={12} /> Draft
                        </span>
                      )}
                    </td>
                    <td>
                      {t.publishedAt ? new Date(t.publishedAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setPreviewTerms({ title: t.title, version: t.version, content: t.content })}
                        className="admin-btn admin-btn--primary py-1 px-3 text-xs"
                      >
                        <Eye size={14} /> View Content
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Read-Only Content Preview Modal */}
      {previewTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="admin-card max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {previewTerms.title}
                </h3>
                <p className="text-xs text-blue-500 font-mono">
                  Version: {previewTerms.version} (Read-Only Preview)
                </p>
              </div>
              <button
                onClick={() => setPreviewTerms(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {previewTerms.content}
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setPreviewTerms(null)}
                className="admin-btn admin-btn--primary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
