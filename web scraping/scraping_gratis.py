from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import requests

# --- AYARLAR ---
# n8n'deki aynı webhook URL'sini kullanıyoruz
webhook_url = "http://localhost:5678/webhook/watsons-data"

urls=[
    "https://www.gratis.com/anyong-b-61144",
    "https://www.gratis.com/beauty-of-joseon-b-61176",
    "https://www.gratis.com/bic-b-60706?categories=50501,5050104",
    "https://www.gratis.com/bioblas-b-60033",
    "https://www.gratis.com/flormar-b-60102?categories=50101,5010104,5010102,5010105,5010101,50102,5010203,5010205,5010202,5010201,5010204,50103,5010304,5010306,5010302,5010305,5010308,5010301,5010307,5010309,5010310",
    "https://www.gratis.com/garnier-b-60107",
    "https://www.gratis.com/hoito-b-61026",
    "https://www.gratis.com/loreal-paris-b-60148?categories=5010304,5010306,5010301,5010302,5010307,5010305,5010308,5010303,5010309,50101,5010102,5010101,5010105,5010104,50202,5020201,5020204,5020205,5020202,5020203,50201,5020101,5020102,50204,5020402,51601,5160104,5160101",
    "https://www.gratis.com/maruderm-b-60688?categories=502,50202,50201,50206,50208,50204,503,50303,50302,50301",
    "https://www.gratis.com/maybelline-new-york-b-60153",
    "https://www.gratis.com/note-b-60169?categories=50102,5010204,5010201,5010203,5010202,5010205,50103,5010304,5010302,5010308,5010306,5010305,5010301,5010309,5010311,5010303,50101,5010105,5010101,5010102,5010104",
    "https://www.gratis.com/pastel-b-60181?categories=50103,5010302,5010306,5010301,5010311,5010308,5010304,5010309,5010303,5010305,50101,5010101,5010102,5010105,50102,5010204,5010205,5010202,5010201,5010203",
]

options = webdriver.ChromeOptions()
#options.add_argument("--headless=new") # n8n/sunucu uyumu için headless
options.add_argument("--start-maximized")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
options.add_argument("--disable-blink-features=AutomationControlled")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

urun_listesi = []
cekilen_isimler = set()

try:
    for base_url in urls:
        # Kategori ismini URL'den çekiyoruz
        marka_adi = base_url.split('/')[-1].split('-b-')[0].upper()
        print(f"\n🚀 Şu an taranan marka: {marka_adi}")
        
        current_page = 1
        while True:
            # Rossmann mantığı: URL'ye sayfa parametresini ekle
            baglac = "&" if "?" in base_url else "?"
            target_url = f"{base_url}{baglac}page={current_page}"
            
            print(f"🔎 Sayfa {current_page} yükleniyor...")
            driver.get(target_url)
            time.sleep(5) # Gratis'in yüklenmesi için Rossmann'dan biraz daha fazla süre verelim
            
            # Ürünlerin yüklenmesini tetiklemek için bir kez aşağı kaydır
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)

            # Gratis ürün kartlarını bul
            urunler = driver.find_elements(By.CSS_SELECTOR, "div.relative.flex.flex-col.justify-between.border.rounded-xl")
            
            # Eğer sayfada ürün yoksa veya 30. sayfayı geçtiysek (güvenlik sınırı) döngüden çık
            if not urunler or current_page > 30:
                print(f"🏁 {marka_adi} markası için sayfalar bitti.")
                break

            found_new_in_page = False
            for urun in urunler:
                try:
                    isim = urun.find_element(By.CSS_SELECTOR, "h5").text.strip()
                    
                    if isim and isim not in cekilen_isimler:
                        # Fiyat çekme işlemleri
                        try:
                            # Gratis fiyat yapısı: Ana fiyat + Kuruş (sup etiketi içinde)
                            indirimli_ana = urun.find_element(By.CSS_SELECTOR, "span.text-primary-850 span.text-\[16px\]").text.strip()
                            indirimli_kurus = urun.find_element(By.CSS_SELECTOR, "span.text-primary-850 sup").text.strip()
                            indirimli_kurus = indirimli_kurus.replace("TL", "").strip()
                            
                            # Sayısal formata çevirme (Örn: 150,50 -> 150.50)
                            fiyat_str = f"{indirimli_ana}.{indirimli_kurus}".replace(" ", "").replace(",", "")
                            guncel_fiyat = float(fiyat_str)
                        except:
                            guncel_fiyat = 0.0

                        urun_listesi.append({
                            "store_product_name": isim,
                            "price": guncel_fiyat,
                            "m_id": 2 # Gratis ID
                        })
                        cekilen_isimler.add(isim)
                        found_new_in_page = True
                except:
                    continue

            print(f"✅ Sayfa {current_page} tamamlandı. Toplam benzersiz ürün: {len(cekilen_isimler)}")

            # Eğer bu sayfada daha önce çekmediğimiz HİÇ yeni ürün bulamadıysak, 
            # muhtemelen site bizi başa döndürmüştür veya ürünler bitmiştir.
            if not found_new_in_page:
                print(f"🛑 Yeni ürün bulunamadı, {marka_adi} taranması sonlandırılıyor.")
                break
                
            current_page += 1

    # --- n8n WEBHOOK GÖNDERİMİ ---
    if urun_listesi:
        print(f"\n✅ Toplam {len(urun_listesi)} Gratis ürünü n8n'e gönderiliyor...")
        response = requests.post(webhook_url, json=urun_listesi)
        print(f"n8n Yanıtı: {response.status_code}")
    else:
        print("\n❌ Gönderilecek veri bulunamadı.")

finally:
    driver.quit()