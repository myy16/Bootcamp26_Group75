// ⚠️ VARSAYIM: Supabase client'ınızın yolu `./supabaseClient` olarak
// varsaydım (profileApi.ts / chatApi.ts'nizde muhtemelen aynısını
// kullanıyorsunuzdur). Gerçek dosya adı/yolu farklıysa bu import'u
// düzeltmeniz yeterli, geri kalanı değişmez.
import { supabase } from './supabase';

export type AlertType = 'back_in_stock' | 'price_drop';

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: number;
  alert_type: AlertType;
  target_price: number | null;
  is_active: boolean;
  notified_at: string | null;
  created_at: string;
}

/**
 * Kullanıcının aktif alarmlarının product_id listesini döner.
 * FavoritesPage açılışında bir kez çağrılır, hangi ürünlerde
 * "Kurulu" rozetinin gösterileceğini belirlemek için kullanılır.
 */
export async function getUserAlertProductIds(
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('price_alerts')
    .select('product_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Alarm listesi alınamadı:', error);
    return new Set();
  }

  return new Set((data ?? []).map((row) => String(row.product_id)));
}

/**
 * Alarm kurar. Aynı kullanıcı/ürün/tip için zaten kayıt varsa
 * (unique constraint) günceller (upsert).
 */
export async function createAlarm(
  userId: string,
  productId: number,
  alertType: AlertType = 'back_in_stock',
  targetPrice?: number,
): Promise<boolean> {
  const { error } = await supabase.from('price_alerts').upsert(
    {
      user_id: userId,
      product_id: productId,
      alert_type: alertType,
      target_price: targetPrice ?? null,
      is_active: true,
      notified_at: null,
    },
    { onConflict: 'user_id,product_id,alert_type' },
  );

  if (error) {
    console.error('Alarm kurulamadı:', error);
    return false;
  }
  return true;
}

export async function removeAlarm(
  userId: string,
  productId: number,
  alertType: AlertType = 'back_in_stock',
): Promise<boolean> {
  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('alert_type', alertType);

  if (error) {
    console.error('Alarm silinemedi:', error);
    return false;
  }
  return true;
}
