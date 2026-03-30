import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@skalamarketing.com'

type EmailTemplate = 'lead_welcome' | 'nurture_day_2' | 'nurture_day_3' | 'nurture_day_7' | 'weekly_report'

interface EmailData {
  leadName?:   string
  clientName?: string
  service?:    string
  phone?:      string
  reportUrl?:  string
  [key: string]: unknown
}

function buildSubjectAndBody(template: EmailTemplate, data: EmailData): { subject: string; html: string } {
  switch (template) {
    case 'lead_welcome':
      return {
        subject: `¡Hola ${data.leadName}! Gracias por contactar ${data.clientName}`,
        html: `
          <h2>¡Hola, ${data.leadName}! 👋</h2>
          <p>Gracias por comunicarte con <strong>${data.clientName}</strong>.</p>
          ${data.service ? `<p>Entendemos que estás interesado en <strong>${data.service}</strong>.</p>` : ''}
          <p>Uno de nuestros especialistas se pondrá en contacto contigo pronto.</p>
          ${data.phone ? `<p>También puedes escribirnos directamente al <a href="tel:${data.phone}">${data.phone}</a>.</p>` : ''}
          <p>¡Que tengas un excelente día!</p>
        `,
      }

    case 'nurture_day_2':
      return {
        subject: `${data.clientName} — ¿Tienes preguntas?`,
        html: `
          <h2>Hola ${data.leadName},</h2>
          <p>Queríamos seguir en contacto y ver si tienes alguna pregunta sobre <strong>${data.service || 'nuestros servicios'}</strong>.</p>
          <p>Estamos aquí para ayudarte. ¿Hay algo específico que quieras saber?</p>
          <p>— El equipo de ${data.clientName}</p>
        `,
      }

    case 'nurture_day_3':
      return {
        subject: `Testimonio de clientes de ${data.clientName}`,
        html: `
          <h2>Hola ${data.leadName},</h2>
          <p>Nuestros clientes hablan por nosotros. Mira lo que dicen sobre ${data.clientName} en Google.</p>
          <p>Si estás listo para dar el siguiente paso, responde este email o llámanos.</p>
        `,
      }

    case 'nurture_day_7':
      return {
        subject: `Última oportunidad — ${data.clientName}`,
        html: `
          <h2>Hola ${data.leadName},</h2>
          <p>Sabemos que estás ocupado. Si sigues interesado en ${data.service || 'nuestros servicios'}, estamos aquí.</p>
          <p>Responde este email para agendar una consulta sin compromiso.</p>
        `,
      }

    case 'weekly_report':
      return {
        subject: `Reporte semanal — ${data.clientName}`,
        html: `
          <h2>Reporte semanal de ${data.clientName}</h2>
          <p>Tu resumen de actividad de la semana está listo.</p>
          ${data.reportUrl ? `<p><a href="${data.reportUrl}">Ver reporte completo →</a></p>` : ''}
        `,
      }
  }
}

export async function sendEmail({
  to,
  template,
  data,
}: {
  to: string
  template: EmailTemplate
  data: EmailData
}): Promise<boolean> {
  const { subject, html } = buildSubjectAndBody(template, data)

  try {
    const result = await resend.emails.send({
      from:    FROM,
      to,
      subject,
      html,
    })
    logger.info('[Resend] Email enviado', { to, template, id: result.data?.id })
    return true
  } catch (err) {
    logger.error('[Resend] Error al enviar email', {
      to,
      template,
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}
