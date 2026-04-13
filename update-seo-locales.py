import json
import os
import glob

locales_dir = 'src/lib/locales'
files = glob.glob(os.path.join(locales_dir, '*.json'))

not_found = {
  "tr": {
    "notFoundTitle": "Makale Bulunamadı - LAF",
    "notFoundDesc": "Aradığınız makale bulunamadı. LAF platformunda diğer makaleleri keşfedin.",
    "homeTab": "Ana Sayfa",
    "articlesTab": "Makaleler"
  },
  "en": {
    "notFoundTitle": "Article Not Found - LAF",
    "notFoundDesc": "The article you are looking for could not be found. Explore other articles on the LAF platform.",
    "homeTab": "Home",
    "articlesTab": "Articles"
  },
  "es": {
    "notFoundTitle": "Artículo no encontrado - LAF",
    "notFoundDesc": "El artículo que busca no ha sido encontrado. Explore otros artículos en la plataforma LAF.",
    "homeTab": "Inicio",
    "articlesTab": "Artículos"
  }
}

for file_path in files:
    filename = os.path.basename(file_path)
    lang = filename.replace('.json', '')
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        content = not_found.get(lang, not_found['en'])
        if "seo" not in data:
            data["seo"] = {}
            
        data["seo"]["notFoundTitle"] = content["notFoundTitle"]
        data["seo"]["notFoundDesc"] = content["notFoundDesc"]
        data["seo"]["homeTab"] = content["homeTab"]
        data["seo"]["articlesTab"] = content["articlesTab"]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        pass
