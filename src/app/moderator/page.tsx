import { redirect } from 'next/navigation'

// Direkt bekleyenler sayfasına yönlendir
export default function ModeratorPage() {
  redirect('/moderator/bekleyenler')
}
