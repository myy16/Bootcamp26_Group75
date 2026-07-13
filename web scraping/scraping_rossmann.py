from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import pandas as pd
import requests

webhook_url = "http://localhost:5678/webhook/watsons-data"

urls = [
    "https://www.rossmann.com.tr/markalar/anyong",
    "https://www.rossmann.com.tr/markalar/beauty-of-joseon",
    "https://www.rossmann.com.tr/markalar/bic",
    "https://www.rossmann.com.tr/markalar/bioblas",
    "https://www.rossmann.com.tr/makyaj?filters[brand.f]=flormar&filters[paths.f]=1%2F2%2F3%2F11%7C1%2F2%2F3%2F10%7C1%2F2%2F3%2F9",
    "https://www.rossmann.com.tr/cilt-bakimi?filters[brand.f]=garnier&p=4",
    "https://www.rossmann.com.tr/makyaj?filters[brand.f]=l%27oreal+paris&p=2", #makyaj
    "https://www.rossmann.com.tr/cilt-bakimi?filters[brand.f]=l%27oreal+paris&p=3", #cilt bakım
    "https://www.rossmann.com.tr/markalar/maruderm",
    "https://www.rossmann.com.tr/markalar/maybelline",
    "https://www.rossmann.com.tr/makyaj?filters[brand.f]=note&filters[paths.f]=1%2F2%2F3%2F11%7C1%2F2%2F3%2F10%7C1%2F2%2F3%2F9",
    "https://www.rossmann.com.tr/makyaj?filters[paths.f]=1%2F2%2F3%2F11%7C1%2F2%2F3%2F10%7C1%2F2%2F3%2F9&filters[brand.f]=pastel",
]

options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

tum_veriler = [] 
cekilen_isimler = set()

try:
    for base_url in urls:
        print(f"\n🔎 Şu an taranan marka: {base_url.split('/')[-1].upper()}")
        
        current_page = 1
        while True:
            # Eğer URL'de zaten '?' varsa p parametresini '&' ile, yoksa '?' ile ekle
            baglac = "&" if "?" in base_url else "?"
            target_url = f"{base_url}{baglac}p={current_page}"
            
            driver.get(target_url)
            time.sleep(4)
            
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)

            kartlar = driver.find_elements(By.CSS_SELECTOR, "div.px-2.pb-3.flex.flex-col")
            
            if not kartlar or current_page > 30:
                break

            found_new_in_page = False
            for kart in kartlar:
                try:
                    marka = kart.find_element(By.CSS_SELECTOR, "a.font-medium").text.strip()
                    urun_adi = kart.find_element(By.CSS_SELECTOR, "a.product-item-link").text.strip()
                    tam_isim = f"{marka} {urun_adi}"

                    if tam_isim not in cekilen_isimler:
                        fiyat = "0,00"
                        try:
                            # İndirimli fiyat
                            f_alan = kart.find_element(By.CSS_SELECTOR, "div.text-rossRed-100")
                            ana = f_alan.find_element(By.CSS_SELECTOR, "span.text-2xl").text.strip()
                            kurus = f_alan.find_element(By.CSS_SELECTOR, "span.leading-none").text.strip()
                            fiyat = f"{ana}{kurus}"
                        except:
                            try:
                                # Normal fiyat
                                f_alan = kart.find_element(By.CSS_SELECTOR, "div.price.text-rossGray-150")
                                ana = f_alan.find_element(By.CSS_SELECTOR, "span.text-base").text.strip()
                                kurus = f_alan.find_element(By.CSS_SELECTOR, "span.leading-none").text.strip()
                                fiyat = f"{ana}{kurus}"

                            except: pass
                        temiz_fiyat = fiyat.replace("TL", "").replace("₺", "").replace(".", "").replace(",", ".").strip()


                        tum_veriler.append({
                            "store_product_name": tam_isim, 
                            "price": float(temiz_fiyat),
                            "m_id": 4 
                        })
                        cekilen_isimler.add(tam_isim)
                        found_new_in_page = True
                except: continue

            if not found_new_in_page:
                break
                
            current_page += 1

    if tum_veriler:
        print(f"\n✅ Toplam {len(tum_veriler)} ürün n8n'e gönderiliyor...")
        response = requests.post(webhook_url, json=tum_veriler)
        print(f"n8n Yanıtı: {response.status_code}")
    else:
        print("\n Hiç veri çekilemedi.")

finally:
    driver.quit()