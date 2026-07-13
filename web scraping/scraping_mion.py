from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import pandas as pd
import requests

webhook_url = "http://localhost:5678/webhook/watsons-data"

urls=[
    "https://www.migros.com.tr/bic-b-402/kisisel-bakim-kozmetik-saglik-c-8",
    "https://www.migros.com.tr/bioblas-b-43f",
    "https://www.migros.com.tr/mion/garnier-b-456/makyaj-c-11db1",
    "https://www.migros.com.tr/mion/garnier-b-456/cilt-bakim-c-11df3",
    "https://www.migros.com.tr/loral-paris-b-459/makyaj-c-95",
    "https://www.migros.com.tr/loral-paris-b-459/cilt-bakimi-c-93",
    "https://www.migros.com.tr/mion/arama?q=maruderm",
    "https://www.migros.com.tr/maybelline-new-york-b-466",
    "https://www.migros.com.tr/mion/arama?q=note&kategori=73137",
]

options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


urun_listesi = []

try:
    for base_url in urls:
        print(f"Link taranıyor: {base_url[:60]}...")
        driver.get(base_url)
        time.sleep(6) 

        urun_kartlari = driver.find_elements(By.CSS_SELECTOR, "fe-product-card")

        for kart in urun_kartlari:
            try:
                isim = kart.find_element(By.CSS_SELECTOR, "fe-product-name a").text.strip()
                try:
                    fiyat = kart.find_element(By.CSS_SELECTOR, "div#sale-price").text.strip()
                except:
                    try:
                        fiyat = kart.find_element(By.CSS_SELECTOR, "fe-product-price .price").text.strip()
                    except:
                        fiyat = "Fiyat Bilgisi Yok"
                
                    temiz_fiyat = fiyat.replace("TL", "").replace("₺", "").replace(".", "").replace(",", ".").strip()

                if isim:
                    urun_listesi.append({
                        "store_product_name": isim, # Sütun isimlerini n8n'deki gibi yaptık
                        "price": float(temiz_fiyat),
                        "m_id": 3
                    })
            except Exception:
                continue
        
        print(f" Bu linkten {len(urun_kartlari)} kart tarandı. Toplam ürün: {len(urun_listesi)}")

    if urun_listesi:
        print(f"\n✅ Toplam {len(urun_listesi)} ürün n8n'e gönderiliyor...")
        response = requests.post(webhook_url, json=urun_listesi)
        print(f"n8n Yanıtı: {response.status_code}")
    else:
        print("\nVeri çekilemedi. Linkleri veya internet bağlantısını kontrol edin.")

finally:
    driver.quit()