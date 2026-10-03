import prisma from '../src/lib/prisma'
import crypto from 'crypto'

/**
 * Migration Script for Remediating KYC Document Public URLs
 * Options:
 *   --dry-run      Simulate migration without modifying DB or moving production files.
 *   --batch-size=N Process at most N records per run (default: 5).
 */

async function runMigration() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run') || process.env.DRY_RUN === '1'
  const batchArg = args.find(a => a.startsWith('--batch-size='))
  const batchSize = batchArg ? parseInt(batchArg.split('=')[1], 10) : 5

  console.log(`=======================================================`)
  console.log(`KYC DOCUMENT MIGRATION ENGINE`)
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulated Audit)' : 'PRODUCTION EXECUTION'}`)
  console.log(`Batch Size Limit: ${batchSize}`)
  console.log(`=======================================================\n`)

  const allDocs = await prisma.customerDocument.findMany({
    select: {
      id: true,
      customerId: true,
      type: true,
      url: true,
      fileName: true,
      fileSize: true,
      uploadedAt: true,
    }
  })

  let eligible: typeof allDocs = []
  let skipped: typeof allDocs = []
  let manualReview: typeof allDocs = []

  for (const doc of allDocs) {
    if (doc.url.includes('/') || doc.url.startsWith('http')) {
      eligible.push(doc)
    } else if (doc.url.startsWith('kyc_')) {
      skipped.push(doc)
    } else {
      manualReview.push(doc)
    }
  }

  const plannedBatches = Math.ceil(eligible.length / batchSize)

  console.log(`Audit Summary:`)
  console.log(`- Total Records in DB:              ${allDocs.length}`)
  console.log(`- Legacy/Public URLs Eligible:      ${eligible.length}`)
  console.log(`- Already Opaque Keys Skipped:     ${skipped.length}`)
  console.log(`- Requiring Manual Review:          ${manualReview.length}`)
  console.log(`- Planned Migration Batches:        ${plannedBatches}`)
  console.log(``)

  if (isDryRun) {
    console.log(`[DRY-RUN COMPLETE] No database records or production files were modified.`)
    return
  }

  // Production batch processing loop
  const batchToProcess = eligible.slice(0, batchSize)
  console.log(`Processing Batch 1 of ${plannedBatches} (${batchToProcess.length} items)...`)

  const storageSecret = process.env.STORAGE_SERVER_API_KEY || process.env.CRON_SECRET || ''
  let successCount = 0
  let failCount = 0

  for (const doc of batchToProcess) {
    try {
      console.log(`Processing Document ID: ${doc.id} (Type: ${doc.type})`)

      // 1. Fetch source binary server-side
      const srcRes = await fetch(doc.url)
      if (!srcRes.ok) {
        console.error(`  ↳ Failed to fetch legacy source file (Status: ${srcRes.status})`)
        failCount++
        continue
      }

      const buffer = Buffer.from(await srcRes.arrayBuffer())
      const sourceSize = buffer.length
      const sourceHash = crypto.createHash('sha256').update(buffer).digest('hex')

      // 2. Prepare upload to private storage server
      const fileExt = doc.fileName ? doc.fileName.split('.').pop() || 'jpg' : 'jpg'
      const outgoingForm = new FormData()
      const blob = new Blob([buffer], { type: srcRes.headers.get('content-type') || 'image/jpeg' })
      outgoingForm.append('images[]', blob, `doc_${doc.id}.${fileExt}`)

      const uploadRes = await fetch('https://uploads.healingcity.lk/index.php', {
        method: 'POST',
        headers: {
          'X-Storage-Api-Key': storageSecret,
        },
        body: outgoingForm,
      })

      if (!uploadRes.ok) {
        console.error(`  ↳ Failed to upload to private storage (Status: ${uploadRes.status})`)
        failCount++
        continue
      }

      const uploadData = await uploadRes.json()
      const opaqueKey = uploadData?.files?.[0]?.key

      if (!opaqueKey) {
        console.error(`  ↳ Private storage server did not return opaque key`)
        failCount++
        continue
      }

      // 3. Verify copied binary checksum & size from private storage fetch endpoint
      const fetchUrl = `https://uploads.healingcity.lk/index.php?action=fetch&key=${encodeURIComponent(opaqueKey)}`
      const verifyRes = await fetch(fetchUrl, {
        headers: { 'X-Storage-Api-Key': storageSecret }
      })

      if (!verifyRes.ok) {
        console.error(`  ↳ Verification fetch failed (Status: ${verifyRes.status})`)
        failCount++
        continue
      }

      const verifyBuffer = Buffer.from(await verifyRes.arrayBuffer())
      const verifySize = verifyBuffer.length
      const verifyHash = crypto.createHash('sha256').update(verifyBuffer).digest('hex')

      if (sourceSize !== verifySize || sourceHash !== verifyHash) {
        console.error(`  ↳ Checksum mismatch! Source: ${sourceHash}, Dest: ${verifyHash}`)
        failCount++
        continue
      }

      // 4. Update database record atomically to opaque storage key
      await prisma.customerDocument.update({
        where: { id: doc.id },
        data: { url: opaqueKey, fileSize: verifySize },
      })

      // 5. Audit log without sensitive details
      await prisma.kYCApproval.create({
        data: {
          customerId: doc.customerId,
          action: 'document_migrated',
          performedBy: 'system_migration_script',
          notes: `Document ${doc.id} (${doc.type}) migrated to private storage. Verified SHA-256: ${verifyHash.substring(0, 8)}...`,
        }
      })

      console.log(`  ↳ SUCCESS: Verified & updated to opaque key (${verifySize} bytes).`)
      successCount++
    } catch (err: any) {
      console.error(`  ↳ Exception during document migration: ${err?.message || err}`)
      failCount++
    }
  }

  console.log(`\nBatch Execution Results:`)
  console.log(`- Successfully Migrated: ${successCount}`)
  console.log(`- Failed:                ${failCount}`)
  console.log(`- Remaining Eligible:    ${eligible.length - successCount}`)
}

runMigration()
  .catch((err) => {
    console.error('Fatal migration error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
