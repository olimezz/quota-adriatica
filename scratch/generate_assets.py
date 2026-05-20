import os
from PIL import Image, ImageDraw

def generate_assets():
    logo_path = 'logo.png'
    if not os.path.exists(logo_path):
        print(f"Errore: {logo_path} non trovato!")
        return

    print("Caricamento logo.png...")
    img = Image.open(logo_path).convert('RGBA')
    w, h = img.size
    print(f"Dimensioni logo: {w}x{h}")

    # Centro e raggio del cerchio rilevati
    cx, cy = 1497, 840
    r = 504  # Raggio di 504px (diametro 1008px)

    # Ritaglio del quadrato contenente il cerchio
    left = cx - r
    top = cy - r
    right = cx + r
    bottom = cy + r

    print(f"Ritaglio area quadrata: left={left}, top={top}, right={right}, bottom={bottom}")
    cropped = img.crop((left, top, right, bottom))
    cw, ch = cropped.size

    # Creazione della maschera circolare antialias ad alta risoluzione
    # Per avere un bordo circolare pulito e non seghettato, creiamo una maschera 4x più grande
    scale = 4
    mask_size = (cw * scale, ch * scale)
    mask = Image.new('L', mask_size, 0)
    draw = ImageDraw.Draw(mask)
    
    # Disegniamo il cerchio pieno bianco sulla maschera ingrandita
    draw.ellipse([0, 0, mask_size[0], mask_size[1]], fill=255)
    
    # Rimpiccioliamo la maschera con campionamento di alta qualità (LANCZOS) per un perfetto antialiasing
    mask = mask.resize((cw, ch), Image.Resampling.LANCZOS)

    # Applichiamo la maschera come canale alpha del ritaglio
    # Questo rende trasparente tutto ciò che è all'esterno del cerchio di raggio r
    emblem_rgba = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    emblem_rgba.paste(cropped, (0, 0), mask=mask)

    # Rimuoviamo anche lo sfondo bianco interno/esterno che potrebbe essere rimasto nei bordi sfumati
    # Se il pixel originale era quasi bianco ed è vicino al bordo, lo rendiamo trasparente
    pixels = emblem_rgba.load()
    for y in range(ch):
        for x in range(cw):
            # Calcoliamo la distanza dal centro per sicurezza
            dx = x - cw / 2
            dy = y - ch / 2
            dist = (dx*dx + dy*dy)**0.5
            
            r_val, g_val, b_val, a_val = pixels[x, y]
            
            # Se siamo fuori dal cerchio o molto vicini al bordo ed è bianco, applichiamo trasparenza totale
            if dist >= r:
                pixels[x, y] = (0, 0, 0, 0)
            elif dist > r - 8:
                # Sfumatura morbida al bordo per evitare pixel bianchi spuri
                if r_val > 240 and g_val > 240 and b_val > 240:
                    pixels[x, y] = (0, 0, 0, 0)

    # Salviamo le diverse versioni degli asset richiesti
    
    # 1. emblem.png (420x420)
    print("Generazione emblem.png (420x420)...")
    emblem_final = emblem_rgba.resize((420, 420), Image.Resampling.LANCZOS)
    emblem_final.save('emblem.png', 'PNG')
    
    # 2. apple-touch-icon.png (180x180)
    print("Generazione apple-touch-icon.png (180x180)...")
    apple_icon = emblem_rgba.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('apple-touch-icon.png', 'PNG')
    
    # 3. favicon.png (32x32)
    print("Generazione favicon.png (32x32)...")
    fav_png = emblem_rgba.resize((32, 32), Image.Resampling.LANCZOS)
    fav_png.save('favicon.png', 'PNG')
    
    # 4. favicon.ico (48x48)
    print("Generazione favicon.ico (48x48)...")
    fav_ico = emblem_rgba.resize((48, 48), Image.Resampling.LANCZOS)
    fav_ico.save('favicon.ico', 'ICO')

    print("Tutti gli asset sono stati generati con successo!")

if __name__ == '__main__':
    generate_assets()
