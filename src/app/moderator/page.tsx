import { redirect } from 'next/navigation'

// Direkt bekleyenler sayfas?na y?nlendir
export default function ModeratorPage() {
  redirect('/moderator/bekleyenler')
}
