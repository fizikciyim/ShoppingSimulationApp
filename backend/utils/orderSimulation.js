// utils/orderSimulation.js
import db from "../config/db.js";

// Sipariş adımları (frontend ile birebir aynı sıra!)
export const STEPS = [
  "Sipariş Alındı",
  "Hazırlanıyor",
  "Kargoya Verildi",
  "Teslimatta",
  "Teslim Edildi",
];

export const EVENT_GROUPS = {
  Hazırlanıyor: [
    "Depoda yanlış paketleme yapıldı",
    "Ürün tedarikçiden eksik geldiği için sipariş iptal edildi",
    "Depoda yangın alarmı nedeniyle tüm gönderiler durduruldu",
    "Sistemde beklenmedik hata oluştu",
    "Tedarik zincirinde aksama yaşandı, gönderi iptal edildi",
    "Depo çalışanı kahve molasında ürünün yerini unuttu",
    "Ürün kalite kontrolünden geçemedi",
    "Ürün etiketleme sırasında barkod hatası oluştu",
    "Stok sisteminde tutarsızlık tespit edildi",
    "Ürün kutusu ezik bulundu, yeniden paketleme süreci başlatıldı",
    "Paketleme bandında elektrik kesintisi yaşandı",
    "Ürün ambalaj malzemesi tükendi, gönderim durduruldu",
    "Yeni ürün partisi karıştırıldı, kontrol süreci başlatıldı",
    "Depoda forklift arızalandı, işlemler yavaşladı",
    "Etiket yazıcısı mürekkep bitti, yenisi bekleniyor",
    "Depo çalışanı yanlış ürünü kutuya koydu",
    "Ürün güvenlik kontrolünde takıldı",
    "Kalite kontrol ekibi fazla mesai yapmayı reddetti",
    "Tedarikçi faturayı göndermediği için işlem durduruldu",
    "Ürün üzerine yanlış seri numarası yazıldı",
  ],
  "Kargoya Verildi": [
    "Kargo aracı yolda bozuldu",
    "Kargo şubesi taşındı, gönderi kayboldu",
    "Ürün taşıma sırasında hasar gördü",
    "Kargo şirketi teknik arıza yaşadı",
    "Ürün sevkiyat sırasında yanlış araca yüklendi",
    "Kargo aracının lastiği patladı",
    "Kargo sistemi bakımdadayken veri kaybı yaşandı",
    "Kargo şirketi grevde olduğu için gönderi iptal edildi",
    "Şube çalışanı kutuyu yanlış müşteriye teslim etti",
    "Kargo yanlış ülkeye yönlendirildi",
    "Gümrükte evrak eksikliğinden dolayı ürün bekletiliyor",
    "Ürün teslimatı sırasında fırtına çıktı",
    "Kargo aracının GPS’i bozuldu",
    "Sürücü vardiya değişimini unuttu",
    "Kargo konteyneri ters yöne giden araca yüklendi",
    "Kargo firmasının sisteminde planlı bakım vardı",
    "Ürün gümrükte bekletiliyor",
    "Kargo takip sistemi çöktü, güncelleme gecikiyor",
    "Sürücü kahve molasında aracı kilitledi, anahtar içeride kaldı",
    "Kargo kamyonunun sigortası bittiği için bağlandı",
  ],

  Teslimatta: [
    "Kurye adresi bulamadı ve teslimat iptal edildi",
    "Alıcıya ulaşılamadığı için teslimat iptal edildi",
    "Kuryenin aracı kaza yaptığı için gönderi iptal edildi",
    "Ürün kayboldu",
    "Teslimat sırasında ürün hasar gördü",
    "Kurye yoğun trafikte mahsur kaldı",
    "Yanlış alıcıya teslim edildi",
    "Kurye bölge dışı teslimat denemesi yaptığı için iptal edildi",
    "Ürün teslimat sırasında yağmurdan ıslandı",
    "Teslimat sisteminde GPS arızası yaşandı",
    "Kuryenin telefonu kapandığı için iletişim sağlanamadı",
    "Kurye evde kimseyi bulamadı",
    "Alıcı tatilde olduğu için teslimat ertelendi",
    "Kurye teslimat kutusunu başka araçta unuttu",
    "Adres yanlış yazıldığı için teslimat geri döndü",
    "Kurye siparişi başka şehre götürdü",
    "Kuryenin motoru yolda kaldı",
    "Teslimat sırasında köpek saldırısına uğrandı",
  ],

  Ortak: [
    "Sistem hatası nedeniyle işlem iptal edildi",
    "Sipariş yoğunluğu nedeniyle işlem iptal edildi",
    "Ürün barkodu okunamadı ve işlem iptal edildi",
    "Beklenmedik bir teknik sorun oluştu",
    "Sunucu bağlantısı kesildi",
    "Veritabanı yanıt vermedi",
    "Sistem güncellemesi nedeniyle işlem iptal edildi",
    "Yapay zekâ algoritması siparişi şüpheli buldu",
    "Teslimat süresi aşıldığı için sipariş otomatik iptal edildi",
    "Operasyon ekibi manuel iptal işlemi gerçekleştirdi",
    "Planlı bakım nedeniyle işlemler geçici olarak durduruldu",
    "Beklenmedik ağ trafiği nedeniyle işlem gecikti",
    "Veri senkronizasyonu başarısız oldu",
    "Sunucu aşırı yük altında kaldı",
    "Güvenlik sistemi siparişi spam olarak işaretledi",
    "Faturalandırma sisteminde hata oluştu",
    "Destek ekibi manuel müdahale etti",
    "Üçüncü taraf servis cevap vermedi",
  ],
};

const FALLBACK_EVENT = "Bilinmeyen bir hata nedeniyle sipariş iptal edildi.";

// Basit helper: belli bir adımda iptal olsun mu?
function shouldCancelHere(stepIndex) {
  // Eski sistemde 1..3 arasında bir eventIndex seçiyordun.
  // Burada yaklaşık benzer davranış için:
  if (stepIndex <= 0 || stepIndex >= STEPS.length - 1) return false;
  // %30 iptal ihtimali, istersen değiştir.
  return Math.random() < 0.3;
}

function pickRandomEvent(stepTitle) {
  const possibleEvents = [
    ...(EVENT_GROUPS[stepTitle] || []),
    ...EVENT_GROUPS.Ortak,
  ];
  const idx = Math.floor(Math.random() * possibleEvents.length);
  return possibleEvents[idx] || FALLBACK_EVENT;
}

/**
 * 🔹 Yeni ana fonksiyon: TEK ADIM ilerletir
 * - Lambda her tetiklendiğinde SADECE 1 step ilerler veya iptal eder.
 * - Döngü + uzun sleep yok.
 */
export async function advanceOrderOneStep(orderId, stepIndex) {
  const stepTitle = STEPS[stepIndex];
  if (!stepTitle) {
    console.log("Geçersiz adım index:", stepIndex);
    return { finished: true };
  }

  // Bu adımda iptal olacak mı?
  if (shouldCancelHere(stepIndex)) {
    const eventText = pickRandomEvent(stepTitle);

    await db.query(
      `UPDATE orders
       SET status='İptal Edildi',
           has_event=1,
           event_text=?,
           event_index=?,
           step_history = JSON_ARRAY_APPEND(
             COALESCE(step_history, JSON_ARRAY()),
             '$',
             JSON_OBJECT(
               'title', ?,
               'at', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 HOUR), '%Y-%m-%d %H:%i:%s'),
               'event', ?,
               'cancelled', true
             )
           ),
           updated_at=NOW()
       WHERE id=?`,
      [eventText, stepIndex, stepTitle, eventText, orderId]
    );

    console.log(
      `🚨 Sipariş ${orderId} iptal edildi (${stepTitle}): ${eventText}`
    );

    return {
      finished: true,
      cancelled: true,
    };
  }

  // Normal ilerleme: sadece statü + step_history
  await db.query(
    `UPDATE orders
     SET status=?,
         step_history = JSON_ARRAY_APPEND(
           COALESCE(step_history, JSON_ARRAY()),
           '$',
           JSON_OBJECT(
             'title', ?,
             'at', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 HOUR), '%Y-%m-%d %H:%i:%s')
           )
         ),
         updated_at=NOW()
     WHERE id=?`,
    [stepTitle, stepTitle, orderId]
  );

  console.log(`✅ Sipariş ${orderId} → ${stepTitle}`);

  const isLast = stepIndex >= STEPS.length - 1;

  return {
    finished: isLast,
    cancelled: false,
    nextStepIndex: isLast ? null : stepIndex + 1,
  };
}
