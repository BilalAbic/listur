'use client'

/**
 * useFavorites — FavoritesContext'in wrapper hook'u.
 *
 * Önceki implementasyonda her bileşen kendi realtime subscription'ını açıyordu.
 * Bu, aynı `favorites:{userId}` kanalına birden fazla subscriber oluşturuyor ve
 * "cannot add postgres_changes callbacks after subscribe()" hatasına yol açıyordu.
 *
 * Artık subscription FavoritesProvider (layout seviyesi) tarafından tek seferlik
 * yönetiliyor. Bu hook sadece context'ten okur.
 */
export { useFavoritesContext as useFavorites } from '@/context/FavoritesContext'
