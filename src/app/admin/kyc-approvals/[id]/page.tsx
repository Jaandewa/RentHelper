'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, CheckCircle, XCircle, AlertCircle, FileText, Calendar, Phone, MapPin, User, ExternalLink } from 'lucide-react'

interface CustomerDetail {
  id: string
  nicNumber: string | null
  phone: string | null
  phone2: string | null
  dateOfBirth: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  address: string | null
  city: string | null
  kycStatus: string
  kycRejectionReason: string | null
  trustScore: number
  createdAt: string
  updatedAt: string
  user: { id: string; name: string; email: string; status: string; createdAt: string }
  customerDocuments: Array<{ id: string; type: string; url: string; fileName: string; uploadedAt: string }>
  kycApprovals: Array<{ id: string; action: string; performedBy: string; notes: string | null; createdAt: string }>
}

export default function KycDetailReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Action Modals
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  const [adminNote, setAdminNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data.customer)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/kyc/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id, adminNote }),
      })
      if (res.ok) {
        setApproveModalOpen(false)
        router.push('/admin/kyc-approvals')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to approve KYC')
      }
    } catch {
      alert('Network error')
    }
    setSubmitting(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/kyc/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id, reason: rejectReason.trim() }),
      })
      if (res.ok) {
        setRejectModalOpen(false)
        router.push('/admin/kyc-approvals')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to reject KYC')
      }
    } catch {
      alert('Network error')
    }
    setSubmitting(false)
  }

  const handleRequestInfo = async () => {
    if (!infoMessage.trim()) {
      alert('Please enter an information request message')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/kyc/request-information', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id, message: infoMessage.trim() }),
      })
      if (res.ok) {
        setInfoModalOpen(false)
        router.push('/admin/kyc-approvals')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to send request')
      }
    } catch {
      alert('Network error')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Customer Not Found</h2>
        <Link href="/admin/kyc-approvals" className="text-blue-600 underline mt-2 inline-block">
          Return to KYC Queue
        </Link>
      </div>
    )
  }

  const frontDoc = customer.customerDocuments.find(d => d.type === 'nic_front')
  const backDoc = customer.customerDocuments.find(d => d.type === 'nic_back')
  const selfieDoc = customer.customerDocuments.find(d => d.type === 'selfie_with_id')

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/kyc-approvals" className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" /> KYC Review: {customer.user?.name || 'Customer'}
            </h1>
            <p className="text-xs text-gray-500">Submitted: {new Date(customer.updatedAt || customer.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInfoModalOpen(true)}
            className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" /> Request Info
          </button>
          <button
            onClick={() => setRejectModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" /> Reject KYC
          </button>
          <button
            onClick={() => setApproveModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle className="w-4 h-4" /> Approve KYC
          </button>
        </div>
      </div>

      {/* Previous Rejection Reason Banner */}
      {customer.kycRejectionReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Previous Reason / Note:
          </div>
          <p className="text-amber-700">{customer.kycRejectionReason}</p>
        </div>
      )}

      {/* Customer Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Personal Details
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Full Name</p>
              <p className="font-medium text-gray-900">{customer.user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Email Address</p>
              <p className="font-medium text-gray-900">{customer.user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">NIC / Passport Number</p>
              <p className="font-mono font-semibold text-blue-700">{customer.nicNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Date of Birth</p>
              <p className="font-medium text-gray-900">
                {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Primary Phone</p>
              <p className="font-medium text-gray-900">{customer.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Secondary Phone</p>
              <p className="font-medium text-gray-900">{customer.phone2 || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 text-xs">Address</p>
              <p className="font-medium text-gray-900">{customer.address || 'N/A'}, {customer.city || ''}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Phone className="w-5 h-5 text-purple-600" /> Emergency Contact
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Contact Person Name</p>
              <p className="font-medium text-gray-900">{customer.emergencyContact || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Emergency Phone</p>
              <p className="font-medium text-gray-900">{customer.emergencyPhone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Previews */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" /> Uploaded Document Proofs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Front Document */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="font-semibold text-sm text-gray-800 mb-2">ID Front Photo</p>
            {frontDoc ? (
              <div className="space-y-2">
                <a href={frontDoc.url} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-lg border border-gray-300 bg-white">
                  <img src={frontDoc.url} alt="ID Front" className="w-full h-48 object-cover group-hover:scale-105 transition duration-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition">
                    <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                  </div>
                </a>
                <p className="text-xs text-gray-500 truncate">{frontDoc.fileName}</p>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                Not Uploaded
              </div>
            )}
          </div>

          {/* Back Document */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="font-semibold text-sm text-gray-800 mb-2">ID Back Photo</p>
            {backDoc ? (
              <div className="space-y-2">
                <a href={backDoc.url} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-lg border border-gray-300 bg-white">
                  <img src={backDoc.url} alt="ID Back" className="w-full h-48 object-cover group-hover:scale-105 transition duration-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition">
                    <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                  </div>
                </a>
                <p className="text-xs text-gray-500 truncate">{backDoc.fileName}</p>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                Not Uploaded
              </div>
            )}
          </div>

          {/* Selfie Document */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="font-semibold text-sm text-gray-800 mb-2">Selfie Photo <span className="text-gray-400 text-xs">(Optional)</span></p>
            {selfieDoc ? (
              <div className="space-y-2">
                <a href={selfieDoc.url} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-lg border border-gray-300 bg-white">
                  <img src={selfieDoc.url} alt="Selfie Proof" className="w-full h-48 object-cover group-hover:scale-105 transition duration-200" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition">
                    <ExternalLink className="w-4 h-4 mr-1" /> View Full Image
                  </div>
                </a>
                <p className="text-xs text-gray-500 truncate">{selfieDoc.fileName}</p>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                No Selfie Provided
              </div>
            )}
          </div>
        </div>
      </div>

      {/* APPROVE MODAL */}
      {approveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" /> Approve Customer KYC
            </h3>
            <p className="text-sm text-gray-600">
              This will mark {customer.user?.name}&apos;s account as verified, allowing them to book items on the marketplace.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Optional Admin Note</label>
              <input
                type="text"
                placeholder="e.g. Identity verified against NIC database"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setApproveModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                {submitting ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" /> Reject Customer KYC
            </h3>
            <p className="text-sm text-gray-600">
              Please state the reason for rejecting this verification request. This reason will be shown to the customer when they attempt to re-login.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Front document photo is blurry and illegible."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleReject} disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST INFO MODAL */}
      {infoModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-600" /> Request Information
            </h3>
            <p className="text-sm text-gray-600">
              Specify what additional details or clearer documents are needed from the customer.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message to Customer *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Please re-upload a clearer photo of your NIC back side."
                value={infoMessage}
                onChange={e => setInfoMessage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setInfoModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleRequestInfo} disabled={submitting} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
