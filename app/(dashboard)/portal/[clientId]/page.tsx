import { redirect } from 'next/navigation'

export default async function OldPortalRedirect({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  redirect(`/portal/${clientId}`)
}
