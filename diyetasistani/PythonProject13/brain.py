import ollama
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import json # <--- YENİ: JSON ayrıştırmak için eklendi
import re # <--- YENİ: Regex için eklendi
from fastapi import FastAPI, UploadFile, File, Form  # YENİ: Form kütüphanesi eklendi
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# =====================================================================
# 1. YAPAY ZEKA MODELİNİN KURULUMU (BEYNİ YÜKLEME)
# =====================================================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Sistem {device} üzerinde başlatılıyor...")

# Colab'de kullandığımız mimarinin aynısını boş olarak yaratıyoruz
num_classes = 101
model = models.efficientnet_v2_s(weights=None)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)

# İndirdiğimiz dolu beyni bu boş mimarinin içine yerleştiriyoruz
model.load_state_dict(torch.load('EfficientNet_best.pth', map_location=device))
model.to(device)
model.eval()  # Modeli eğitim modundan çıkarıp test/tahmin moduna alıyoruz

# Fotoğrafı eğittiğimiz zamanki boyutlara getirme kuralları
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Sınıflar (Yapay zeka 0-100 arası sayı döner, biz onu kelimeye çevirmeliyiz)
class_names = [
    'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
    'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
    'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
    'ceviche', 'cheesecake', 'cheese_plate', 'chicken_curry', 'chicken_quesadilla',
    'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
    'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', 'cup_cakes',
    'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict',
    'escargots', 'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras',
    'french_fries', 'french_onion_soup', 'french_toast', 'fried_calamari', 'fried_rice',
    'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
    'grilled_salmon', 'guacamole','gyoza','hamburger', 'hot_and_sour_soup', 'hot_dog',
    'huevos_rancheros', 'hummus', 'ice_cream', 'lasagna', 'lobster_bisque',
    'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons', 'miso_soup', 'mussels',
    'nachos', 'omelette', 'onion_rings', 'oysters', 'pad_thai',
    'paella', 'pancakes', 'panna_cotta', 'peking_duck', 'pho',
    'pizza', 'pork_chop', 'poutine', 'prime_rib', 'pulled_pork_sandwich',
    'ramen', 'ravioli', 'red_velvet_cake', 'risotto', 'samosa',
    'sashimi', 'scallops', 'seaweed_salad', 'shrimp_and_grits', 'spaghetti_bolognese',
    'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake', 'sushi',
    'tacos', 'takoyaki', 'tiramisu', 'tuna_tartare', 'waffles'
]


# =====================================================================
# 2. OLLAMA FONKSİYONU (AKADEMİK VE DETAYLI PROMPT)
# =====================================================================
def get_diet_recommendation(food_name, current_calories, target_calories, yas, boy, kilo, cinsiyet, boyun, bel, kalca):
    profil_detayi = f"{yas} yaşında, {boy} cm boyunda, {kilo} kilo ağırlığında bir {cinsiyet.lower()}"

    ekstra_olculer = []
    if bel > 0: ekstra_olculer.append(f"bel: {bel} cm")
    if boyun > 0: ekstra_olculer.append(f"boyun: {boyun} cm")
    if kalca > 0: ekstra_olculer.append(f"kalça: {kalca} cm")

    if ekstra_olculer:
        profil_detayi += f" (Ölçüleri: {', '.join(ekstra_olculer)})"

    # Kullanıcının yemeği yemeden önceki kalan kalorisini Python'da hesaplayıp modele hazır veriyoruz.
    kalan_kalori = target_calories - current_calories

    # HOCANIN İSTEDİĞİ VE "DİYETİSYEN KURALLARI" EKLENMİŞ YENİ PROMPT
    prompt = (
        f"Sen hem uzman bir diyetisyen hem de tutkulu bir fitness koçusun. Kullanıcı az önce '{food_name}' yedi.\n"
        f"Kullanıcı Profili: {profil_detayi}. Hedefi sağlıklı yaşam ve ideal kilosuna ulaşmak.\n"
        f"Kullanıcının bu öğün öncesi kalan kalori hakkı: {kalan_kalori} kcal (Hedef: {target_calories}).\n\n"
        f"GÖREVLERİN:\n"
        f"1. ANALİZ: '{food_name}' yemeğinin porsiyon kalorisini hesapla. KESİN KURAL: Doğal/proteinli besinlere 'Sağlıklı', aşırı şekerli/işlenmiş besinlere 'Sağlıksız' de.\n"
        f"2. MOTİVASYON: Sağlıklıysa 'Böyle devam et, çok iyi gidiyorsun!', sağlıksızsa 'Buna dikkat etmelisin, daha sağlıklı beslenmelisin.' diyerek analize başla.\n"
        f"3. DİYETİSYEN ÖNERİSİ: Yuvarlak laflar etme! Kalan/aşılan kaloriye göre ertesi gün için SPESİFİK yemek isimleri ve kalorilerini barındıran net bir menü ver.\n"
        f"4. SPORTİF KOÇLUK: Hep yürüyüş önerme! Kullanıcının profiline göre 'Ağırlık Antrenmanı', 'HIIT', 'Yüzme' veya 'Kardiyo' gibi çeşitli egzersizleri net süre belirterek öner.\n\n"
        f"KATI FORMAT KURALI (SADECE JSON):\n"
        f"React arayüzünün bozulmaması için tavsiye metninin içinde 'Yarın için öğün tavsiyem:' ve 'Egzersiz tavsiyem:' kelimeleri KESİNLİKLE bulunmalıdır.\n"
        f"{{\n"
        f"  \"kalori\": (sadece sayı),\n"
        f"  \"tavsiye\": \"[Motivasyon ve Sağlık Analizi]. Yarın için öğün tavsiyem: [Net Yemekler ve Kalorileri]. Egzersiz tavsiyem: [Ağırlık/HIIT/Kardiyo vb. Net Egzersiz Önerisi]\"\n"
        f"}}"
    )

    try:
        response = ollama.chat(
            model='llama3',
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        result_text = response['message']['content'].strip()

        import json
        data = json.loads(result_text)

        kalori_str = str(data.get("kalori", 300)).replace("kcal", "").replace("kalori", "").replace(",", ".").strip()
        try:
            kalori_val = abs(float(kalori_str))
            if kalori_val == 0:
                kalori_val = 300.0
        except ValueError:
            kalori_val = 300.0

        tavsiye_val = data.get("tavsiye", "Sağlıklı beslenmeye devam et!")

        return kalori_val, tavsiye_val

    except Exception as e:
        print(f"Llama3 JSON Hatası: {e}")
        return 300.0, "Yapay zeka detaylı analiz yapamadı, ancak yemeğiniz başarıyla kaydedildi."

# =====================================================================
# 3. FASTAPI SUNUCUSU (JAVA'NIN VE REACT'İN İSTEK ATACAĞI KAPI)
# =====================================================================
app = FastAPI(title="Yemek Tanıma ve Diyet Mikroservisi")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# YENİ: current_calories ve target_calories parametreleri Form verisi olarak eklendi
@app.post("/analyze-food")
async def analyze_food_api(
        file: UploadFile = File(...),
        current_calories: float = Form(0),
        target_calories: float = Form(2400),
        yas: int = Form(24),        # YENİ
        boy: float = Form(177),     # YENİ
        kilo: float = Form(99),     # YENİ
        cinsiyet: str = Form("Erkek"), # YENİ
        boyun: float = Form(0),     # YENİ
        bel: float = Form(0),       # YENİ
        kalca: float = Form(0)      # YENİ
):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        input_tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            outputs = model(input_tensor)
            _, predicted = torch.max(outputs, 1)
            food_idx = predicted.item()

        if food_idx < len(class_names):
            food_name = class_names[food_idx]
        else:
            food_name = f"Bilinmeyen Yemek (ID: {food_idx})"

        print(f"👁️ Model Tahmini: {food_name}")

        # Ollama'dan dinamik kaloriyi ve tavsiyeyi aynı anda çekiyoruz!
        estimated_cal, ollama_advice = get_diet_recommendation(
            food_name, current_calories, target_calories,
            yas, boy, kilo, cinsiyet, boyun, bel, kalca
        )

        return {
            "status": "success",
            "detected_food": food_name,
            "estimated_calories": estimated_cal, # Llama3'ün kendi hesapladığı kalori!
            "ai_advice": ollama_advice
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Sadece test etmek için çalıştırıldığında:
if __name__ == "__main__":
    print("🌍 Mikroservis başlatılıyor. 8000 portu dinleniyor...")
    uvicorn.run(app, host="0.0.0.0", port=8000)