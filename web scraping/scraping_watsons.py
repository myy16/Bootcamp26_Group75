from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import pandas as pd
import requests
import json # n8n için JSON desteği
webhook_url = "http://localhost:5678/webhook/watsons-data"


urls = [
    "https://www.watsons.com.tr/search/anyong",
    "https://www.watsons.com.tr/erkek-bakim/tiras/c/227?query=:most-relevant:masterBrandName:BIC",
    "https://www.watsons.com.tr/search/bioablas?query=bioablas:most-relevant:masterBrandName:BIOBLAS", 
    "https://www.watsons.com.tr/flormar/b/3193?query=:numberOfReviews:subcategory:1016:subcategory:1005:subcategory:1012:subcategory:1020:subcategory:1002:subcategory:1001:subcategory:1010:subcategory:1011:subcategory:1013:subcategory:1008",
    "https://www.watsons.com.tr/garnier/b/2626?query=:numberOfReviews:subcategory:10001:subcategory:1092:subcategory:1041",
    "https://www.watsons.com.tr/hoito/b/3685",
    "https://www.watsons.com.tr/loreal-paris/b/1894?query=:numberOfReviews:subcategory:1010:subcategory:1001:subcategory:1016:subcategory:1002:subcategory:1013:subcategory:1011:subcategory:1008:subcategory:1012:subcategory:1005:subcategory:1041:subcategory:1020",
    "https://www.watsons.com.tr/maruderm/b/3488",
    "https://www.watsons.com.tr/maybelline/b/1896",
    "https://www.watsons.com.tr/note/b/2545",
    "https://www.watsons.com.tr/pastel/b/2629?query=:numberOfReviews:subcategory:1016:subcategory:1020:subcategory:1013:subcategory:1002:subcategory:1011:subcategory:1001:subcategory:1010:subcategory:1005:subcategory:1012"
]

options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

urun_listesi = []
cekilen_isimler = set() 

try:
    for base_url in urls:
        print(f"\n🚀 Yeni kategori taranıyor: {base_url.split('/')[-3] if 'search' not in base_url else 'Arama Results'}")
        driver.get(base_url)
        sayfa_sayisi = 1
        
        while True:
            print(f"📄 Sayfa {sayfa_sayisi} işleniyor...")
            time.sleep(5)
            
            urunler = driver.find_elements(By.CSS_SELECTOR, "e2-product-tile")
            yeni_urun_sayisi = 0 # Bu sayfada kaç tane "gerçekten yeni" ürün bulduk?

            for kart in urunler:
                try:
                    ad = kart.find_element(By.CSS_SELECTOR, "h3.product-list-item__name").text.strip()
                    
                    if ad not in cekilen_isimler:
                        try:
                            fiyat_raw = kart.find_element(By.CSS_SELECTOR, "span.value").text.strip()
                        except:
                            fiyat_raw = kart.find_element(By.CSS_SELECTOR, "span.price__default-value").text.strip()
                        
                        temiz_fiyat = fiyat_raw.replace("TL", "").replace("₺", "").replace(".", "").replace(",", ".").strip()
                        
                        urun_listesi.append({
                            "store_product_name": ad, # Sütun isimlerini n8n'deki gibi yaptık
                            "price": float(temiz_fiyat),
                            "m_id": 1 # Watsons
                        })
                        cekilen_isimler.add(ad)
                        yeni_urun_sayisi += 1
                except:
                    continue

            # Eğer sayfada 10 tane ürün varsa ama biz hiç yeni ürün bulamadıysak durmalıyız
            if len(urunler) > 0 and yeni_urun_sayisi == 0:
                print(f" Bu sayfada ({sayfa_sayisi}) yeni ürün yok. Muhtemelen liste bitti. Diğer URL'ye geçiliyor.")
                break

            # Sonraki Sayfa Butonu Kontrolü
            try:
                next_button = driver.find_element(By.CSS_SELECTOR, "a.pagination-link.next, a[aria-label='next page']")
                if "disabled" in next_button.get_attribute("class") or not next_button.get_attribute("href"):
                    print("Son sayfaya ulaşıldı.")
                    break
                next_url = next_button.get_attribute("href")

                if next_url:
                    driver.get(next_url)
                else:
                    driver.execute_script("arguments[0].click();", next_button)
                sayfa_sayisi += 1
                time.sleep(3) 
            except:
                print(" Sonraki sayfa butonu yok, diğer linke geçiliyor.")
                break

    # Excel Kayıt (n8n'e bağlamadan önceki son test için)
    if urun_listesi:
        print(f"\n✅ Toplam {len(urun_listesi)} ürün n8n'e gönderiliyor...")
        response = requests.post(webhook_url, json=urun_listesi)
        print(f"n8n Yanıtı: {response.status_code}")

    else:
        print("\n Veri çekilemedi.")

finally:
    driver.quit()