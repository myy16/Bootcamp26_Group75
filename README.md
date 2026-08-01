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




- **Ürün Durumu**:
  
Sprint 1 kapsamında Beautrics’in ilk kullanıcı akışını gösterebilmek amacıyla Figma üzerinde başlangıç seviyesinde wireframe tasarımı hazırlanmıştır. Bu sprintte ürünün tüm fonksiyonlarının tamamlanmasından ziyade, temel kullanıcı deneyiminin görselleştirilmesine ve geliştirme sürecine yön verecek ilk arayüz yapısının oluşturulmasına odaklanılmıştır.

Ekran görüntüleri:
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

Sprint 2’de temel hedefimiz, Sprint 1’de oluşturulan teknik temeli kullanıcıya dönük ana fonksiyonlarla genişletmek ve Beautrics’in kişiselleştirilmiş bakım deneyimini destekleyecek modülleri geliştirmektir.

Beautrics; kullanıcı profili, onboarding seçimleri, favori ürün takibi, sepet oluşturma, chatbot önerileri, günlük bakım rutini, ürün karşılaştırma ve fiyat takibi gibi birden fazla kullanıcı akışıyla çalışan bir platform olduğu için bu sprintte özellikle kullanıcı verilerinin yönetilmesi ve öneri sistemini destekleyen yapıların oluşturulması önceliklendirilmiştir.

Sprint sonunda birçok user story Closed durumuna taşınmış, To Do ve In Progress durumunda kalan işler ise Sprint 3’e aktarılmak üzere belirlenmiştir.

Sprint kapsamına alınan user story’ler daha küçük task’lara bölünmüştür. Böylece her iş daha net takip edilebilir, sorumluluk atanabilir ve sprint board üzerinde ilerleme durumu izlenebilir hale getirilmiştir.

Azure DevOps board üzerinde mavi kartlar user story’leri, sarı kartlar ise bu user story’lere bağlı task’ları temsil etmektedir. 

Sprint 2 kapsamında ele alınan temel user story’ler:

- **US-03:** Bir sistem olarak, kullanıcının kişisel bakım profilini ve onboarding seçimlerini saklamak istiyorum; böylece öneriler kullanıcıya özel üretilebilsin.
- **US-04:** Bir kullanıcı olarak, ürünleri sepete ve favorilere eklemek, fiyat alarmı oluşturmak ve bildirim almak istiyorum; böylece alışverişimi planlayıp takip edebileyim.
- **US-05:** Bir kullanıcı olarak, chatbot önerilerimin ve günlük bakım rutinlerimin profilime göre oluşmasını istiyorum; böylece sistem daha kişisel ve takip edilebilir öneriler sunsun.
- **US-07:** Bir kullanıcı olarak, Beautrics’e kayıt olmak ve giriş yapmak istiyorum; böylece kişisel bakım profilime ve önerilerime erişebilirim.
- **US-08:** Bir kullanıcı olarak, profil bilgilerimi görüntülemek ve güncellemek istiyorum; böylece bakım tercihlerimi zaman içinde değiştirebilirim.
- **US-09:** Bir sistem olarak, ürün kataloğumuzu ve fiyatları güncel tutmak için 4 marketin verilerini günlük olarak otomatik kazımak istiyorum.
- **US-10:** Bir sistem olarak, ürün kataloğunu genişletip erkek kullanıcıların da uygulamayı kullanmasını sağlamak istiyorum.
- **US-11:** Bir kullanıcı olarak, ana sayfada 4 marketin fiyatlarını karşılaştıran ürün kartlarını ve bana özel önerilen ürünleri görmek istiyorum; böylece en uygun fiyatı anında fark edebilirim.
- **US-12:** Bir yapay zeka sistemi olarak, kullanıcıların doğal dildeki sorularını veritabanındaki gerçek ürünlerle eşleştirmek istiyorum; böylece bütçeye uygun rutin önerebilirim.
- **US-13:** Bir kullanıcı olarak, bakım tercihlerimi ister ilk girişte pop-up ile ister sohbet esnasında buton yönlendirmesiyle belirlemek istiyorum; böylece sistem beni zorlamadan tanıyabilir.
- **US-14:** Bir kullanıcı olarak, beğendiğim ürünleri favorilerime eklemek istiyorum; böylece fiyat trendini analiz edip en uygun zamanda sepete ekleyebilirim.

- **Daily Scrum**:

Sprint 2 Daily Scrum toplantıları takım üyelerinin uygunluk durumuna göre Google Meet üzerinden gerçekleştirilmiştir. Toplantılarda her takım üyesinin üzerinde çalıştığı görevler, tamamlanan işler, devam eden çalışmalar ve varsa engel durumları değerlendirilmiştir.

Daily Scrum sürecinde özellikle Azure DevOps board üzerindeki user story ve task durumları takip edilmiştir. Backlog, To Do, In Progress ve Done kolonlarındaki ilerlemeler kontrol edilmiş; tamamlanan görevlerin doğru statüye taşınmasına dikkat edilmiştir.

Sprint 2 boyunca yapılan Google Meet toplantılarında kullanıcı profili, onboarding yapısı, favoriler, sepet, Supabase Auth, chatbot önerileri, günlük bakım rutini, ürün karşılaştırma kartları, web scraping, pgvector ve embedding pipeline kurulumu gibi başlıklar ele alınmıştır.

- **Sprint board update**: Sprint board screenshotları:

Sprint board üzerinde user story’lerin Sprint 2 boyunca geçirdiği durum değişiklikleri Azure DevOps üzerinden takip edilmiştir.

Sprint 2 board ekran görüntülerinde kullanıcı profili, onboarding, favoriler, sepet, üye kayıt/giriş, chatbot altyapısı, ürün karşılaştırma, web scraping gibi işlerin önemli ölçüde tamamlandığı görülmektedir.

Sprint 2 backlog ekranlarında user story’lerin task’lara bölündüğü, her task için sorumlu kişilerin atandığı ve tamamlanan işlerin Done durumuna alındığı görülmektedir. 

<img width="1737" height="829" alt="1" src="https://github.com/user-attachments/assets/b675498c-509c-4c7a-9205-1f80d9a8e16e" />
<img width="1733" height="829" alt="3" src="https://github.com/user-attachments/assets/3eba0bbf-50ed-413d-b80d-ed5ba6841e68" />
<img width="1713" height="832" alt="5" src="https://github.com/user-attachments/assets/a242bfb2-4246-4532-9d19-2f410b6c3c03" />
<img width="1714" height="830" alt="image" src="https://github.com/user-attachments/assets/9da01540-832c-4a08-9ef5-fb844643d02c" />
<img width="1698" height="826" alt="image" src="https://github.com/user-attachments/assets/3a2fd05d-6a59-4b61-91b6-3cb41d4fe1cc" />
<img width="1697" height="817" alt="image" src="https://github.com/user-attachments/assets/8fcd0a4a-320c-4a07-9220-81a46a5cc81d" />
<img width="1690" height="805" alt="image" src="https://github.com/user-attachments/assets/97ce5e83-7edf-41c4-a97c-16d8628ae67d" />

- **Ürün Durumu**:

Sprint 2 kapsamında Beautrics’in kullanıcıya dönük temel fonksiyonlarını destekleyecek altyapı geliştirilmiştir. Sprint 1’de Figma üzerinde hazırlanan başlangıç wireframe yapısı, Sprint 2’de kullanıcı profili, onboarding, favoriler, sepet ve öneri sistemiyle ilişkilendirilecek şekilde genişletilmiştir.

Bu sprintte ürünün tüm fonksiyonlarının tamamen tamamlanmasından ziyade, kişiselleştirilmiş kullanıcı deneyimini destekleyecek temel veri yapılarının ve kullanıcı akışlarının oluşturulmasına odaklanılmıştır.

Sprint 2 sonunda kullanıcı profili ve onboarding seçimlerinin saklanmasına yönelik veri yapısı hazırlanmış, üye kayıt/giriş süreçleri Supabase Auth ile desteklenmiş, favori ürünler ve sepet yapısı kullanıcı akışıyla ilişkilendirilmiştir. Ayrıca chatbot önerileri, günlük bakım rutini ve ürün karşılaştırma süreçleri için gerekli veri yapıları oluşturulmuştur.

Ekran görüntüleri:

<img width="1887" height="913" alt="image" src="https://github.com/user-attachments/assets/2cc9db25-6e68-48da-9f6c-fb4fa52ded8d" />
<img width="1872" height="920" alt="image" src="https://github.com/user-attachments/assets/abac31a8-ee5f-4758-95d6-2817ea6ae7a0" />
<img width="1886" height="917" alt="image" src="https://github.com/user-attachments/assets/8ba2d5f3-4ad4-417c-90b7-0e0c014ce962" />
<img width="1892" height="922" alt="image" src="https://github.com/user-attachments/assets/c918a61a-95cc-4287-93b4-07193924484d" />
<img width="1876" height="915" alt="image" src="https://github.com/user-attachments/assets/2242f8f3-9a62-49a9-bd59-ff147b7e0205" />

## Sprint Review

Sprint Review sonucunda Sprint 2 hedeflerinin büyük ölçüde karşılandığı görülmüştür. Sprint 1’de oluşturulan teknik temel, Sprint 2’de kullanıcı profili, onboarding, favoriler, sepet, chatbot önerileri, ürün karşılaştırma ve web scraping süreçleriyle genişletilmiştir.

Sprint sonunda alınan kararlar:

- Kullanıcı profili ve onboarding seçimlerinin sistemde saklanabilmesi için oluşturulan veri yapısının sonraki sprintte ürün önerileriyle daha güçlü şekilde ilişkilendirilmesine karar verilmiştir.
- Favoriler ve sepet yapısının kullanıcı deneyimi açısından temel akışlardan biri olduğu görülmüş, bu alanların Sprint 3’te test ve iyileştirme adımlarıyla desteklenmesine karar verilmiştir.
- Supabase Auth ile hazırlanan üye kayıt ve giriş süreçlerinin sonraki sprintte uçtan uca kullanıcı senaryolarıyla test edilmesi planlanmıştır.
- Chatbot önerileri için oluşturulan veritabanı tablolarının, ürün kartları ve kullanıcı profiliyle birlikte çalışacak şekilde geliştirilmesine karar verilmiştir.
- Web scraping yapısının günlük ürün ve fiyat güncelliğini sağlamak için kritik olduğu değerlendirilmiş, veri doğruluğu kontrollerinin Sprint 3’te sürdürülmesine karar verilmiştir.
- Sprint sonunda To Do ve In Progress durumda kalan AI soru butonu, test işlemleri ve ürün yelpazesinin genişletilmesi kapsamındaki işlerin Sprint 3’te tamamlanmasına karar verilmiştir.

Sprint Review katılımcıları:

- Edanur Ay
- Sude Gül ÜZÜM
- Ayşegül Yılmaz
- Muhammet Yusuf Yılmaz

## Sprint Retrospective

Sprint 2 sonunda takım içi süreç, görev dağılımı ve board yönetimi açısından aşağıdaki değerlendirmeler yapılmıştır:

- Sprint 2’de Sprint 1’e göre daha fazla user story tamamlanmış ve task takibi daha düzenli hale getirilmiştir.
- Kullanıcı profili, onboarding, favoriler ve sepet gibi birbirine bağlı modüllerde işlerin bağımlılıklarının sprint başında daha net belirlenmesi gerektiği görülmüştür.
- Supabase, web scraping, pgvector ve chatbot altyapısı gibi teknik konularda yapılan işlerin ürün ekranlarıyla ilişkisinin daha görünür hale getirilmesi gerektiği değerlendirilmiştir.
- Test işlemlerinin sprint sonuna kalmaması için Sprint 3’te test görevlerinin daha erken başlatılmasına karar verilmiştir.

## Sprint 3’e Aktarılan İşler

Sprint 2 sonunda tamamlanmamış veya doğrulama süreci devam eden işler Sprint 3’e aktarılmıştır:

- Ürün kartlarında AI Sor butonunun tamamlanması
- Chatbot üzerinden ürün önerisi alma akışının geliştirilmesi
- UI/UX testlerinin tamamlanması
- Chatbot testlerinin tamamlanması
- Database testlerinin tamamlanması
- Ürün yelpazesinin genişletilmesi
- Erkek kullanıcıların da uygulamayı kullanabilmesi için ürün kataloğunun genişletilmesi
- Sprint 2’de tamamlanan kullanıcı profili, onboarding, favoriler, sepet ve öneri altyapısının uçtan uca test edilmesi

---

# Sprint 3

Sprint 3’te temel hedefimiz, önceki sprintlerde geliştirilen kullanıcı akışlarını uçtan uca test etmek, tespit edilen sorunlara yönelik gerekli iyileştirmeleri gerçekleştirmek ve Beautrics’in kullanıcıya sunulan fonksiyonlarını daha kararlı hale getirmektir.

Bu sprintte özellikle chatbot ve veritabanı testleri, marka ve ürün listeleme işlemleri, kişiselleştirilmiş ürün önerileri, ürün kartları, fiyat analizi, sepet, favoriler, kullanıcı profili ve kayıt süreçleri üzerinde çalışılmıştır. Bununla birlikte ürün kartlarındaki AI Sor özelliği tamamlanmış ve Beautrics’in görsel kimliğini desteklemek amacıyla logo çalışması gerçekleştirilmiştir.

Sprint 3 kapsamında takip edilen ana çalışmalar:

-Test İşlemleri ve Gerekli Geliştirmelerin Yapılması: Chatbot, veritabanı ve kullanıcı arayüzü fonksiyonlarının kontrol edilmesi; tespit edilen sorunlara yönelik gerekli düzenlemelerin gerçekleştirilmesi.

-Frontend Çalışmaları: Beautrics için logo oluşturulması ve hazırlanan logonun uygulamaya eklenmesi.

-Chatbot Üzerinden Profile Uygun Ürün Önerisi: Kullanıcının bakım ihtiyacını chatbot’a iletebilmesi, profiline uygun ürün önerisi alabilmesi ve ürün kartları üzerinden AI Sor özelliğine erişebilmesi.


Test ve iyileştirme çalışmaları kapsamında aşağıdaki başlıklar ele alınmıştır:

-Chatbot yanıtlarının ve bağlantı durumunun kontrol edilmesi

-Veritabanı işlemlerinin test edilmesi

-Markalar butonunun aktiflik durumunun kontrol edilmesi

-Marka seçimi sonrasında ilgili ürünlerin doğru listelenmesinin kontrol edilmesi

-Öneri alanında gösterilen ürün verilerinin kontrol edilmesi

-Kullanıcı giriş yapmadan önce gösterilen kişiselleştirilmiş önerilerin kontrol edilmesi

-Fiyat analizi grafiği ve yapay zekâ tahmin verilerinin kontrol edilmesi

-Sepet optimizasyonu ekranındaki işlev ve yönlendirmelerin kontrol edilmesi

-Kayıt sürecindeki e-posta doğrulama işlemlerinin değerlendirilmesi

-Profil bilgileri, hesap güvenliği ve kullanıcı işlemlerinin kontrol edilmesi

-Favoriler ekranındaki yönlendirme ve fiyat karşılaştırma alanlarının kontrol edilmesi

- **Daily Scrum**:

Daily Scrum sürecinde Azure DevOps board üzerindeki work item ve task durumları düzenli olarak takip edilmiştir. Backlog, To Do, In Progress, Rejected ve Done kolonlarındaki hareketler kontrol edilmiş; tamamlanan çalışmaların ilgili statülere taşınmasına dikkat edilmiştir.

Sprint boyunca özellikle chatbot ve veritabanı testleri, marka ve ürün listeleme işlemleri, kişiselleştirilmiş öneri alanları, fiyat analizi, ürün kartı yönlendirmeleri, sepet, favoriler, profil ve kayıt işlemleri üzerinde durulmuştur.


- **Sprint board update**: Sprint board screenshotları:

Sprint 3 kapsamında planlanan ana çalışmaların sprint içerisindeki ilerleme durumu Azure DevOps üzerinden takip edilmiştir.

<img width="1705" height="813" alt="1" src="https://github.com/user-attachments/assets/03e1044f-7164-484f-8829-286877498d77" />
<img width="1700" height="826" alt="2" src="https://github.com/user-attachments/assets/d72535c3-8672-4fcc-9a01-b7d323fe3c0c" />
<img width="1698" height="819" alt="3" src="https://github.com/user-attachments/assets/59e972f7-19f0-4d77-8d00-4ce9144e7251" />
<img width="1700" height="825" alt="4" src="https://github.com/user-attachments/assets/30379f39-3c5c-4e13-bc28-54039c083a85" />
<img width="1696" height="816" alt="5" src="https://github.com/user-attachments/assets/babf3fca-b1b6-4642-af6d-259498884ec9" />
<img width="1690" height="811" alt="6" src="https://github.com/user-attachments/assets/7d1a275a-5b9c-43fd-8c54-6b859a742fe3" />
<img width="1696" height="817" alt="7" src="https://github.com/user-attachments/assets/69b2a975-ef1d-4c19-af80-b2da5a3bd4d3" />





- **Ürün Durumu**:
Sprint 3 sonunda Beautrics’in temel kullanıcı akışları tek bir uygulama yapısı altında bir araya getirilmiş ve ürün, bütünleşik bir MVP seviyesine ulaştırılmıştır. Kullanıcıların kayıt olup giriş yapabildiği, kişisel bakım tercihlerini profil üzerinden yönetebildiği ve ürünleri kategori veya marka bazında inceleyebildiği bir kullanıcı deneyimi oluşturulmuştur.

Ana sayfada farklı mağazalardaki ürün fiyatlarının karşılaştırılabildiği ürün kartları ile kullanıcı profiline ve bakım tercihlerine göre şekillenen öneri alanları sunulmuştur. Ürünlerin detay bilgilerine erişilmesi, favorilere veya sepete eklenmesi ve fiyat değişimlerinin incelenmesi için gerekli ekranlar kullanıcı akışına dâhil edilmiştir. Fiyat analizi grafiği ve yapay zekâ destekli tahmin alanlarıyla ürünlerin fiyat değişimlerinin kullanıcı tarafından takip edilebilmesi desteklenmiştir.

Chatbot entegrasyonu sayesinde kullanıcıların bakım ihtiyaçlarını doğal dilde ifade ederek veritabanındaki ürünler arasından uygun öneriler alabilmesine yönelik yapı hazırlanmıştır. Ürün kartlarına eklenen AI Sor özelliğiyle kullanıcıların seçtikleri ürün hakkında doğrudan yapay zekâ asistanına soru yöneltebilmesi sağlanmıştır.

Sprint 3 kapsamında gerçekleştirilen arayüz düzenlemeleri, yönlendirme kontrolleri ve test çalışmalarıyla marka seçimi, ürün listeleme, kişiselleştirilmiş öneriler, favoriler, sepet, profil ve chatbot arasındaki temel bağlantılar geliştirilmiştir. Ayrıca Beautrics için hazırlanan logo uygulamaya eklenerek ürünün görsel kimliği tamamlanmıştır.

Ürünün son hali; kişiselleştirilmiş bakım önerileri, ürün ve mağaza fiyat karşılaştırması, favori ve sepet yönetimi, fiyat analizi ve yapay zekâ destekli ürün danışmanlığını aynı platformda birleştiren, temel kullanıcı akışları oluşturulmuş bir MVP niteliğindedir. Erkek kullanıcılara yönelik ürün kataloğunun genişletilmesi ise Sprint 3 sonunda tamamlanmayan kapsam olarak kalmıştır.

Ekran görüntüleri:

<img width="1919" height="860" alt="image" src="https://github.com/user-attachments/assets/0653185c-c221-44b7-92cf-20e5678eabf8" />
<img width="1897" height="872" alt="image" src="https://github.com/user-attachments/assets/15094754-e388-4873-843a-403becbb830a" />
<img width="1915" height="867" alt="image" src="https://github.com/user-attachments/assets/1ca30d3e-576b-4e86-be8a-334ff02884da" />
<img width="1919" height="852" alt="image" src="https://github.com/user-attachments/assets/c7b5af8f-0444-48ed-aabb-b191db98d2bf" />
<img width="1919" height="859" alt="image" src="https://github.com/user-attachments/assets/54a8c053-4c02-4b04-9322-c6d8cb062e53" />
<img width="973" height="572" alt="image" src="https://github.com/user-attachments/assets/4d9d22bd-6c67-440f-a50b-cd1ca53436f5" />
<img width="1915" height="867" alt="image" src="https://github.com/user-attachments/assets/5fb44f11-592b-4a34-b360-60fea895fde7" />
<img width="1918" height="857" alt="image" src="https://github.com/user-attachments/assets/c6437e56-91fa-419f-9270-778cba243687" />
<img width="1918" height="833" alt="image" src="https://github.com/user-attachments/assets/a3bb423e-6b2a-497f-ab8b-d85f7e2abf0d" />
<img width="1890" height="868" alt="image" src="https://github.com/user-attachments/assets/dd198413-bd3a-4f78-ae6a-d2cd483c14e1" />
<img width="1893" height="868" alt="image" src="https://github.com/user-attachments/assets/411690ab-0b67-484d-a286-4bf896de265a" />
<img width="1908" height="856" alt="image" src="https://github.com/user-attachments/assets/7b43c4c3-85c3-40ff-93e8-e221b8087827" />
<img width="1908" height="856" alt="image" src="https://github.com/user-attachments/assets/25ae61d8-9a94-4ab7-b89d-3eb5aac6ce56" />




## Sprint Review
Sprint 3 kapsamında önceki sprintlerde geliştirilen fonksiyonlar bütünsel olarak ele alınmış; test, kontrol ve iyileştirme çalışmaları tamamlanarak Beautrics’in temel kullanıcı akışları son haline getirilmiştir.

Sprint sonunda ulaşılan durum:

Test İşlemleri ve Gerekli Geliştirmelerin Yapılması çalışması Closed durumuna getirilmiştir.

-Chatbot ve veritabanı testleri gerçekleştirilmiştir.

-Marka seçimi ve seçilen markaya ait ürünlerin listelenmesi kontrol edilmiştir.

-Kişiselleştirilmiş ürün önerilerinin gösterildiği alanlar test edilmiştir.

-Ürün kartlarındaki yönlendirmeler ve kategori etiketi metinleri düzenlenmiştir.

-Ürün kartlarında yer alan AI Sor özelliği tamamlanmıştır.

-Chatbot üzerinden kullanıcı profiline uygun ürün önerisi alınmasına yönelik çalışma Closed durumuna getirilmiştir.

-Kullanıcı kayıt ve profil işlemleri, favoriler, sepet ve fiyat analizi alanları kontrol edilmiştir.

-Beautrics logosu oluşturularak uygulamaya eklenmiştir.

-Ürün kataloğunun erkek kullanıcıları da kapsayacak şekilde genişletilmesine ilişkin 3 story point’lik US-10 tamamlanmamış ve Rejected kolonunda bırakılmıştır.

Son Sprint Review kapsamında Beautrics’in kişiselleştirilmiş bakım önerileri, ürün ve mağaza fiyat karşılaştırması, favori ve sepet yönetimi, fiyat analizi ve yapay zekâ destekli ürün danışmanlığı gibi temel fonksiyonları bir araya getiren bütünleşik MVP yapısı değerlendirilmiştir.

Sprint Review katılımcıları:

Edanur Ay

Sude Gül ÜZÜM

Ayşegül Yılmaz

Muhammet Yusuf Yılmaz


## Sprint Retrospective
Projenin son sprinti olan Sprint 3 sonunda geliştirme süreci; takım çalışması, görev yönetimi, test faaliyetleri ve ürünün ulaştığı son durum açısından değerlendirilmiştir.

-Önceki sprintlerde geliştirilen kullanıcı akışlarının ayrı test task’larına bölünmesi, kontrollerin daha düzenli ve izlenebilir şekilde yürütülmesini sağlamıştır.

-Chatbot, veritabanı ve frontend çalışmalarının aynı sprint kapsamında ele alınması, birbiriyle ilişkili kullanıcı akışlarının bütünsel olarak kontrol edilmesini sağlamıştır.

-Testler sonucunda belirlenen frontend düzenlemeleri gerçekleştirilerek kullanıcıya sunulan ekranlar ve yönlendirmeler iyileştirilmiştir.

-User story ve task durumlarının Azure DevOps üzerinden takip edilmesi, sprint ilerlemesinin ve tamamlanan kapsamın görünür olmasını sağlamıştır.

-Ana work item’ların kapatılmasından önce bağlı task durumlarının kontrol edilmesi ve ana kartla uyumlu hale getirilmesi gerektiği görülmüştür.

-Story point değerlerinin ve iş durumlarının sprint boyunca güncel tutulmasının burndown grafiğinin doğru yorumlanması açısından önemli olduğu değerlendirilmiştir.

-Veri kapsamı geniş çalışmaların sprint planlaması sırasında daha ayrıntılı şekilde ele alınması gerektiği görülmüştür.

-Test faaliyetlerinin geliştirme sürecinin sonuna bırakılmadan sprint boyunca yürütülmesinin hata ve eksikliklerin daha erken tespit edilmesini sağladığı değerlendirilmiştir.

-Proje boyunca edinilen deneyimlerin, sonraki projelerde kapsam yönetimi, görev dağılımı, test planlaması ve board kullanımı açısından yol gösterici olması beklenmektedir.

Sprint 3’ün tamamlanmasıyla birlikte Beautrics projesinin planlanan sprint süreci sona ermiş ve ürünün temel fonksiyonlarını içeren MVP yapısı ortaya çıkarılmıştır.


---
