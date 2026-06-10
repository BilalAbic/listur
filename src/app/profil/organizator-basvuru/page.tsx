import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ApplicationForm } from '@/components/organizers/ApplicationForm'

export const metadata: Metadata = {
  title: 'Organizatör Doğrulama Başvurusu',
}

export const dynamic = 'force-dynamic'

export default async function OrganizatorBasvuruPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/giris?redirect=/profil/organizator-basvuru')
  }

  const supabaseAdmin = createAdminClient()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, handle, is_organizer, verified_at, name')
    .eq('id', user.id)
    .single()

  // Zaten organizatör mü?
  if (profile?.is_organizer && profile.handle) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Zaten doğrulanmış organizatörsün</h1>
          <p className="text-gray-600 mb-6">
            <span className="font-medium text-gray-900">@{profile.handle}</span> olarak Listur&apos;da görünüyorsun.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href={`/organizator/${profile.handle}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Profilime Git
            </Link>
            <Link
              href="/profil/organizator"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Açık başvurusu var mı?
  const { data: openApp } = await supabaseAdmin
    .from('organizer_applications')
    .select('id, created_at, requested_handle')
    .eq('user_id', user.id)
    .eq('status', 'open')
    .maybeSingle()

  if (openApp) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm p-8 text-center">
          <div className="text-5xl mb-3">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Başvurun değerlendiriliyor</h1>
          <p className="text-gray-700 mb-1">
            <span className="font-medium">@{openApp.requested_handle}</span> handle&apos;ı için başvurun{' '}
            <span className="font-medium">
              {new Date(openApp.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>{' '}
            tarihinde alındı.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Admin inceledikten sonra in-app bildirim alacaksın.
          </p>
        </div>
      </div>
    )
  }

  // Önceki reddedilmiş başvuru var mı? (kullanıcı için bilgi)
  const { data: lastRejected } = await supabaseAdmin
    .from('organizer_applications')
    .select('id, rejection_note, reviewed_at, requested_handle')
    .eq('user_id', user.id)
    .eq('status', 'resolved')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const initial = lastRejected
    ? { requested_handle: lastRejected.requested_handle }
    : undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Organizatör Olarak Doğrulan</h1>
        <p className="text-gray-600 text-sm">
          Doğrulanmış organizatör olunca <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/organizator/handle</code>{' '}
          adresinde public sayfan, takipçiler ve etkinlik analytics&apos;i olur.
        </p>
      </header>

      {lastRejected && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-800 font-medium mb-1">Önceki başvurun reddedildi</p>
          {lastRejected.rejection_note && (
            <p className="text-sm text-red-700">
              <span className="font-medium">Not:</span> {lastRejected.rejection_note}
            </p>
          )}
          <p className="text-xs text-red-600 mt-2">Yeni bir başvuru oluşturabilirsin.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <ApplicationForm initial={initial} />
      </div>
    </div>
  )
}
