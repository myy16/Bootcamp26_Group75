# *Beautrics*

Takım 75

# Ürün İle İlgili Bilgiler

## Takım Üyeleri
| İsim | Unvan | Sosyal Medya |
| :--- | :--- | :--- |
| **Edanur Ay** | Scrum Master | <a href="https://github.com/edanurray"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Github_logo_svg.svg/3840px-Github_logo_svg.svg.png" width="25"></a>    <a href="https://www.linkedin.com/in/edanuray/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/3840px-LinkedIn_icon.svg.png" width="25"></a> |
| **Sude Gül ÜZÜM** | Product Owner | <a href="https://github.com/sudeguluzum"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Github_logo_svg.svg/3840px-Github_logo_svg.svg.png" width="25"></a>    <a href="https://www.linkedin.com/in/sude-g%C3%BCl-%C3%BCz%C3%BCm-9679ba21b/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/3840px-LinkedIn_icon.svg.png" width="25"></a> | |
| **Ayşegül Yılmaz** | Developer | <a href="https://github.com/aysegulyilmazz"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Github_logo_svg.svg/3840px-Github_logo_svg.svg.png" width="25" ></a>    <a href="https://www.linkedin.com/in/ay%C5%9Feg%C3%BCl-y%C4%B1lmaz-08712336b/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/3840px-LinkedIn_icon.svg.png" width="25"></a> |
| **Muhammet Yusuf Yılmaz** | Developer | <a href="https://github.com/myy16"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Github_logo_svg.svg/3840px-Github_logo_svg.svg.png" width="25"></a>    <a href="https://www.linkedin.com/in/myy1647/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/3840px-LinkedIn_icon.svg.png" width="25"></a> |
| **Abdulkadir Temizoğlu** | Developer | <a href="https://github.com/sudeguluzum"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Github_logo_svg.svg/3840px-Github_logo_svg.svg.png" width="25" ></a>    <a href="https://www.linkedin.com/in/abdulkadir-temizo%C4%9Flu-754701218/"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/3840px-LinkedIn_icon.svg.png" width="25"></a> |


## Ürün İsmi

Beautrics

## Ürün Açıklaması

Beautrics, kullanıcıların kişisel bakım harcamalarını optimize ederken aynı zamanda en doğru ürünlere ulaşmasını sağlayan yapay zeka destekli bir Kişisel Bakım ve Alışveriş Zekası (BI) platformudur. Sistem; kullanıcıların cilt tipi, saç yapısı, dönemsel bakım ihtiyaçları ve bütçelerine en uygun ürünleri gelişmiş bir RAG (Retrieval-Augmented Generation) mimarisi ve doğal dil işleme (NLP) yetenekleriyle analiz eder. Eş zamanlı olarak Watsons, Gratis, Rossmann ve Mion gibi Türkiye’nin lider perakendecilerindeki güncel fiyatları ve sepet kombinasyonlarını tarayarak son tüketiciye minimum maliyetle maksimum verim sağlayan akıllı bir alışveriş rotası çizer.

## Ürün Özellikleri

* Kullanıcının cilt tipi, saç yapısı ve özel bakım ihtiyaçlarının yanı sıra bütçesine göre ürün önerileri sunma
* Yapay zeka destekli sohbet robotu ile doğal dilde ürün önerileri sunma
* Bütçeye uygun akıllı alışveriş sepeti oluşturma
* Gratis, Watsons, Rossmann ve Mion mağazalarındaki ürün fiyatlarını karşılaştırma
* İndirimli ürünleri listeleme
* Favori ürün oluşturma ve fiyat değişimlerinde bildirim gönderme
* Günlük cilt bakım rutini önerileri sunma
  
## Hedef Kitle
* Kozmetik ve kişisel bakım ürünleri kullanan bireyler
* Cilt bakımına ilgi duyan kullanıcılar
* Bütçesini verimli kullanmak isteyen kişiler
* Online ve mağaza kozmetik alışverişi yapan kullanıcılar
* Gratis, Watsons, Rossmann ve Mion müşterileri
* +18 yaş


## Product Backlog URL

[Miro_Azure Backlog Board Ekran Görüntüleri](https://miro.com/app/board/uXjVH-rX4N8=/?share_link_id=813882419570)

---

# Sprint 1

Sprint 1’de temel hedefimiz, Beautrics projesinin teknik temelini oluşturmak ve ilerleyen sprintlerde geliştirilecek ana kullanıcı akışları için gerekli altyapıyı hazırlamaktır.

Beautrics; kullanıcı profili, ürün önerisi, fiyat karşılaştırması, favori ürün takibi, sepet oluşturma ve kişiselleştirilmiş bakım rutini gibi birden fazla veriyle çalışan bir platform olduğu için ilk sprintte özellikle veritabanı yapısının oluşturulması ve genişletilmesi önceliklendirilmiştir.

Bu sprintte veritabanı altyapısının yanında ürün-mağaza ilişkisi, Supabase kurulumu, web scraping, N8N iş akışı, kullanıcı kayıt/giriş ekranı, favoriler, sepet ve kullanıcı profili gibi temel alanlar üzerinde çalışılmıştır.

Sprint 1 için toplam **100 story point** planlanmıştır. Sprint sonunda burndown grafiğine göre işlerin **%92’si tamamlanmış**, kalan **8 story point** ise Sprint 2’ye aktarılmıştır.

Sprint kapsamına alınan user story’ler daha küçük task’lara bölünmüştür. Böylece her iş daha net takip edilebilir, sorumluluk atanabilir ve sprint board üzerinde ilerleme durumu izlenebilir hale getirilmiştir.

Azure DevOps board üzerinde mavi kartlar user story’leri, sarı kartlar ise bu user story’lere bağlı task’ları temsil etmektedir. İlgili ekran görüntülerini Miro Backlog Board linkinden inceleyebilirsiniz.
Sprint 1 kapsamında ele alınan temel user story’ler:

- **US-01:** Bir sistem analisti olarak, veritabanı yapısını oluşturmak istiyorum; böylece Beautrics doğru veri temeli üzerinde geliştirilsin.
- **US-02:** Bir geliştirici olarak, ürün kataloğu ve mağaza fiyat verisinin güvenilir olmasını istiyorum; böylece aynı ürün farklı mağazalarda doğru şekilde karşılaştırılabilsin.
- **US-03:** Bir sistem olarak, kullanıcının kişisel bakım profilini ve onboarding seçimlerini saklamak istiyorum; böylece öneriler kullanıcıya özel üretilebilsin.
- **US-04:** Bir kullanıcı olarak, ürünleri sepete ve favorilere eklemek, fiyat alarmı oluşturmak ve bildirim almak istiyorum; böylece alışverişimi planlayıp takip edebileyim.
- **US-05:** Bir kullanıcı olarak, chatbot önerilerimin ve günlük bakım rutinlerimin profilime göre oluşmasını istiyorum; böylece sistem daha kişisel ve takip edilebilir öneriler sunsun.
- **US-07:** Bir kullanıcı olarak, Beautrics’e kayıt olmak ve giriş yapmak istiyorum; böylece kişisel bakım profilime ve önerilerime erişebilirim.
- **US-08:** Bir kullanıcı olarak, profil bilgilerimi görüntülemek ve güncellemek istiyorum; böylece bakım tercihlerimi zaman içinde değiştirebilirim.

US-06 kapsamında yer alan veritabanı güvenilirliği, tutarlılığı ve sorgulanabilirliği ihtiyacı ayrı bir user story olarak devam ettirilmemiştir. Bu kapsam, US-01 ve US-02 altında yer alan veritabanı modelleme, Supabase kurulumu, ürün-mağaza ilişkisi ve veri doğrulama task’larına dağıtılmıştır. Bu nedenle ilgili kart board üzerinde Rejected/Removed alanında gösterilmiştir.


- **Daily Scrum**:

Sprint 1 Daily Scrum toplantıları takım üyelerinin uygunluk durumuna göre Google Meet üzerinden gerçekleştirilmiştir. Toplantılarda her takım üyesinin üzerinde çalıştığı görevler, tamamlanan işler, devam eden çalışmalar ve varsa engel durumları değerlendirilmiştir.

Daily Scrum sürecinde özellikle Azure DevOps board üzerindeki user story ve task durumları takip edilmiştir. Backlog, To Do, In Progress, Rejected ve Done kolonlarındaki ilerlemeler kontrol edilmiş; tamamlanan görevlerin doğru statüye taşınmasına dikkat edilmiştir.

Sprint 1 boyunca yapılan Google Meet toplantılarında veritabanı yapısının oluşturulması, Supabase kurulumu, ürün-mağaza ilişkisi, web scraping, N8N iş akışı, Figma wireframe tasarımı, kullanıcı kayıt/giriş süreci, favoriler, sepet ve kullanıcı profili gibi başlıklar ele alınmıştır.

- **Sprint board update**: Sprint board screenshotları:
Sprint board üzerinde user story’lerin sprint boyunca geçirdiği durum değişiklikleri Azure DevOps üzerinden takip edilmiştir.
<img width="1133" height="825" alt="1" src="https://github.com/user-attachments/assets/57b0c165-260c-4a79-abee-53a733128cf5" />
<img width="1253" height="829" alt="2" src="https://github.com/user-attachments/assets/e7b51b1f-931a-46c3-96e7-33b6ff31c3b7" />
<img width="1260" height="815" alt="3" src="https://github.com/user-attachments/assets/c7e902c7-076a-4300-96a0-b98e41f9daf8" />
<img width="1719" height="742" alt="5" src="https://github.com/user-attachments/assets/911f333c-141c-4c80-a684-eb918f438b6b" />
<img width="1709" height="817" alt="6" src="https://github.com/user-attachments/assets/c028e8ae-2b5a-4e72-aa9e-5e4d57b76e69" />




- **Ürün Durumu**: Ekran görüntüleri:
Sprint 1 kapsamında Beautrics’in ilk kullanıcı akışını gösterebilmek amacıyla Figma üzerinde başlangıç seviyesinde wireframe tasarımı hazırlanmıştır. Bu sprintte ürünün tüm fonksiyonlarının tamamlanmasından ziyade, temel kullanıcı deneyiminin görselleştirilmesine ve geliştirme sürecine yön verecek ilk arayüz yapısının oluşturulmasına odaklanılmıştır.

<img width="1470" height="790" alt="image" src="https://github.com/user-attachments/assets/d3ee1eca-b297-49c4-87b1-93a460560a8a" />
<img width="1472" height="794" alt="image" src="https://github.com/user-attachments/assets/6326e881-c3ee-4380-b559-645689656564" />
<img width="1466" height="787" alt="image" src="https://github.com/user-attachments/assets/53423e8b-6c19-47ae-859a-c9e45ac9de2d" />


## Sprint Review

Sprint Review sonucunda Sprint 1 hedefinin büyük ölçüde karşılandığı görülmüştür. Sprint başında planlanan 100 story point’in 92 story point’lik kısmı tamamlanmış, kalan 8 story point ise Sprint 2’ye aktarılmıştır.

Sprint sonunda alınan kararlar:

- Supabase üzerinde oluşturulan temel yapı, sonraki sprintlerde kullanıcı profili, onboarding, favoriler, sepet ve chatbot önerileriyle genişletilecektir.
- Sprint sonunda In Progress durumda kalan kullanıcı tarafı task’larının Sprint 2’de tamamlanması ve test edilmesi kararlaştırılmıştır.

Sprint Review katılımcıları:
- Edanur Ay
- Sude Gül ÜZÜM
- Ayşegül Yılmaz
- Muhammet Yusuf Yılmaz
- Abdulkadir Temizoğlu


## Sprint Retrospective

Sprint 1 sonunda takım içi süreç, görev dağılımı ve board yönetimi açısından aşağıdaki değerlendirmeler yapılmıştır:

- User story ve task ayrımının board üzerinde daha net takip edilmesi gerektiği görülmüştür.
- Story point tahminlerinin sprint planlama sırasında daha detaylı değerlendirilmesi gerektiği belirlenmiştir.
- Sprint sonunda kalan işlerin Sprint 2’ye daha net acceptance criteria ile aktarılmasına karar verilmiştir.
- Takım içindeki görev dağılımının daha dengeli yapılması ve task sorumluluklarının sprint başında netleştirilmesi gerektiği belirlenmiştir.



## Sprint 2’ye Aktarılan İşler

Sprint 1 sonunda tamamlanmamış veya doğrulama süreci devam eden işler Sprint 2’ye aktarılmıştır:

---

# Sprint 2


---

# Sprint 3

---
