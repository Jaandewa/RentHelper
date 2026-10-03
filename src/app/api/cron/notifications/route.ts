import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendTemplatedWhatsApp } from '@/lib/notifications/whatsapp';
import { renderEmailTemplate } from '@/lib/notifications/email-templates';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationsToProcess = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "notification_deliveries"
      WHERE status IN ('pending', 'failed')
        AND "nextAttemptAt" <= NOW()
        AND "attemptCount" < "maxAttempts"
      ORDER BY "nextAttemptAt" ASC
      LIMIT 20
    `;

    if (notificationsToProcess.length === 0) {
      return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
    }

    const ids = notificationsToProcess.map(n => n.id);
    
    await prisma.notificationDelivery.updateMany({
      where: { id: { in: ids } },
      data: { status: 'sending' }
    });

    const rows = await prisma.notificationDelivery.findMany({
      where: { id: { in: ids } }
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      try {
        const metadata = (row.metadata as Record<string, any>) || {};
        let success = false;
        let providerMessageId: string | undefined;

        if (row.channel === 'whatsapp') {
          const result = await sendTemplatedWhatsApp(
            row.recipient, 
            row.templateKey || row.eventType || '', 
            metadata
          );
          success = result?.success ?? false;
          if (!success) throw new Error((result as any)?.error || 'WhatsApp send failed');
          providerMessageId = (result as any)?.providerMessageId;
        } else if (row.channel === 'email') {
          const templateKeyStr = row.templateKey || row.eventType || '';
          const rendered = renderEmailTemplate(
            templateKeyStr, 
            metadata
          );
          
          if (!rendered) {
            throw new Error(`Unknown email event type: ${row.templateKey || row.eventType}`);
          }
          
          const result = await sendEmail({ 
            to: row.recipient, 
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });
          success = result?.success ?? false;
          if (!success) throw new Error(result?.error || 'Email send failed');
        } else {
          throw new Error(`Unsupported channel: ${row.channel}`);
        }

        if (success) {
          await prisma.notificationDelivery.update({
            where: { id: row.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              providerMessageId: providerMessageId
            }
          });
          sentCount++;
        }
      } catch (error: any) {
        const newAttemptCount = row.attemptCount + 1;
        const lastErrorCode = error?.message || 'Unknown error';
        
        let newStatus = 'failed';
        let newNextAttemptAt: Date | null = null;
        
        if (newAttemptCount >= row.maxAttempts) {
          newStatus = 'failed';
          newNextAttemptAt = null;
        } else {
          const backoffMinutes = [1, 5, 30];
          const delayMinutes = backoffMinutes[Math.min(row.attemptCount, backoffMinutes.length - 1)];
          newNextAttemptAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        }

        await prisma.notificationDelivery.update({
          where: { id: row.id },
          data: {
            status: newStatus,
            attemptCount: newAttemptCount,
            lastErrorCode: lastErrorCode.substring(0, 255),
            nextAttemptAt: newNextAttemptAt
          }
        });
        failedCount++;
      }
    }

    return NextResponse.json({ 
      processed: rows.length, 
      sent: sentCount, 
      failed: failedCount 
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
