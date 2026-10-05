'use client'

import { useState, useEffect } from 'react'
import { FileText, Shield, CheckCircle, Clock, Eye, Search, AlertCircle, Building2, Plus, Send } from 'lucide-react'

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

interface ProviderTermsVersion {
  id: string
  businessId: string
  version: string
  title: string
  content: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  business?: {
    id: string
    name: string
    slug: string
  }
}

export default function AdminTermsPage() {
  const [activeTab, setActiveTab] = useState<'platform' | 'provider'>('platform')
  const [platformTerms, setPlatformTerms] = useState<PlatformTermsVersion[]>([])
  const [activePlatformTerms, setActivePlatformTerms] = useState<PlatformTermsVersion | null>(null)
  const [providerTerms, setProviderTerms] = useState<ProviderTermsVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selected terms for read-only preview modal
  const [previewTerms, setPreviewTerms] = useState<{ title: string; version: string; content: string; businessName?: string } | null>(null)
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
      setProviderTerms(data.providerTermsVersions || [])
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

  const filteredProviderTerms = providerTerms.filter(t =>
    t.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.business?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Terms & Legal Policies Management</h1>
        <p className="admin-page-subtitle">
          Manage platform terms of service versions and inspect registered provider agreements.
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
          <div className="admin-stat-card__label">Published Platform Terms</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon bg-indigo-500/10 text-indigo-500">
            <FileText size={20} />
          </div>
          <div className="admin-stat-card__value">{platformTerms.length}</div>
          <div className="admin-stat-card__label">Platform Version History</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon bg-emerald-500/10 text-emerald-500">
            <Building2 size={20} />
          </div>
          <div className="admin-stat-card__value">{providerTerms.length}</div>
          <div className="admin-stat-card__label">Provider Custom Agreements</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('platform')}
          className={`admin-tab ${activeTab === 'platform' ? 'admin-tab--active' : ''}`}
        >
          Platform Terms & Conditions ({platformTerms.length})
        </button>
        <button
          onClick={() => setActiveTab('provider')}
          className={`admin-tab ${activeTab === 'provider' ? 'admin-tab--active' : ''}`}
        >
          Provider Agreements ({providerTerms.length})
        </button>
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
      ) : activeTab === 'platform' ? (
        <div className="admin-table-wrapper">
          <div className="admin-table-toolbar">
            <h3 className="admin-table-toolbar__title">Platform Terms & Conditions History</h3>
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search platform versions..."
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
                    <td className="font-medium">
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
      ) : (
        <div className="admin-table-wrapper">
          <div className="admin-table-toolbar">
            <h3 className="admin-table-toolbar__title">Registered Provider Terms & Agreements</h3>
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by business name or version..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Version</th>
                <th>Agreement Title</th>
                <th>Status</th>
                <th>Published At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviderTerms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No provider terms versions found.
                  </td>
                </tr>
              ) : (
                filteredProviderTerms.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold text-blue-500">
                      {t.business?.name || 'Unknown Business'}
                    </td>
                    <td>
                      <span className="font-mono font-semibold">
                        {t.version}
                      </span>
                    </td>
                    <td>
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
                    <td className="text-right">
                      <button
                        onClick={() => setPreviewTerms({ title: t.title, version: t.version, content: t.content, businessName: t.business?.name })}
                        className="admin-btn admin-btn--primary py-1 px-3 text-xs"
                      >
                        <Eye size={14} /> View Agreement
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
        <div className="admin-modal-overlay">
          <div className="admin-modal max-w-2xl w-full max-h-[85vh] flex flex-col p-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-4">
              <div>
                <h3 className="admin-modal__title">
                  {previewTerms.title}
                </h3>
                <p className="text-xs text-blue-500 font-mono">
                  {previewTerms.businessName ? `Provider: ${previewTerms.businessName} • ` : ''}Version: {previewTerms.version} (Read-Only Preview)
                </p>
              </div>
              <button
                onClick={() => setPreviewTerms(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
              {previewTerms.content}
            </div>

            <div className="admin-modal__actions">
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
