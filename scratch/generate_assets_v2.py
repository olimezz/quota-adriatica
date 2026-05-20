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

    # Rilevamento dei limiti del contenuto (escludendo rumore di compressione sui bordi)
    # Scansioniamo la zona centrale in cui sappiamo trovarsi il logo
    x_min, x_max = w, 0
    y_min, y_max = h, 0
    
    for y in range(250, 1450):
        for x in range(900, 2150):
            r, g, b, a = img.getpixel((x, y))
            # Se il pixel non è bianco (soglia 245)
            if r < 245 or g < 245 or b < 245:
                if x < x_min: x_min = x
                if x > x_max: x_max = x
                if y < y_min: y_min = y
                if y > y_max: y_max = y

    print(f"Limiti reali del logo rilevati: x={x_min} a {x_max}, y={y_min} a {y_max}")
    content_w = x_max - x_min + 1
    content_h = y_max - y_min + 1
    print(f"Dimensioni contenuto: larghezza={content_w}, altezza={content_h}")

    # Calcoliamo il vero centro del logo
    cx = (x_min + x_max) // 2
    cy = (y_min + y_max) // 2
    print(f"Vero centro: cx={cx}, cy={cy}")

    # Prendiamo la dimensione massima del logo (larghezza o altezza)
    max_dim = max(content_w, content_h)
    
    # Aggiungiamo un margine di sicurezza (es. 40 pixel per lato) per dare "respiro" all'emblema
    # ed evitare che tocchi i bordi o sembri troppo zoomato/tagliato.
    margin = 40
    crop_size = max_dim + (margin * 2)
    half_crop = crop_size // 2

    # Coordinate del ritaglio quadrato
    left = cx - half_crop
    top = cy - half_crop
    right = cx + half_crop
    bottom = cy + half_crop

    # Assicuriamoci che rientri nelle dimensioni dell'immagine
    left = max(0, left)
    top = max(0, top)
    right = min(w, right)
    bottom = min(h, bottom)
    
    # Se il ritaglio non è perfettamente quadrato a causa dei bordi dell'immagine, lo forziamo
    crop_w = right - left
    crop_h = bottom - top
    final_crop_size = min(crop_w, crop_h)
    
    # Ricalibriamo per renderlo perfettamente quadrato
    left = cx - final_crop_size // 2
    top = cy - final_crop_size // 2
    right = left + final_crop_size
    bottom = top + final_crop_size

    print(f"Ritaglio quadrato definitivo (con respiro): size={final_crop_size}x{final_crop_size}")
    print(f"Coordinate: left={left}, top={top}, right={right}, bottom={bottom}")
    
    cropped = img.crop((left, top, right, bottom))
    cw, ch = cropped.size

    # Creazione della maschera circolare antialias ad alta risoluzione
    scale = 4
    mask_size = (cw * scale, ch * scale)
    mask = Image.new('L', mask_size, 0)
    draw = ImageDraw.Draw(mask)
    
    # Disegniamo il cerchio lasciando un leggero margine interno trasparente
    # Il raggio del cerchio effettivo sarà la metà della dimensione massima del logo
    logo_radius_on_mask = (max_dim // 2) * scale
    center_on_mask = (cw * scale) // 2
    
    draw.ellipse([
        center_on_mask - logo_radius_on_mask - (margin // 2) * scale,
        center_on_mask - logo_radius_on_mask - (margin // 2) * scale,
        center_on_mask + logo_radius_on_mask + (margin // 2) * scale,
        center_on_mask + logo_radius_on_mask + (margin // 2) * scale
    ], fill=255)
    
    # Rimpiccioliamo la maschera con campionamento LANCZOS per un antialiasing perfetto
    mask = mask.resize((cw, ch), Image.Resampling.LANCZOS)

    # Applichiamo la maschera come canale alpha del ritaglio
    emblem_rgba = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    emblem_rgba.paste(cropped, (0, 0), mask=mask)

    # Rimuoviamo pixel bianchi spuri all'esterno della forma del logo
    pixels = emblem_rgba.load()
    center_x_pixel = cw // 2
    center_y_pixel = ch // 2
    cutoff_radius = (max_dim // 2) + margin - 5

    for y in range(ch):
        for x in range(cw):
            dx = x - center_x_pixel
            dy = y - center_y_pixel
            dist = (dx*dx + dy*dy)**0.5
            
            # Se siamo oltre la forma principale e il colore è quasi bianco, rendiamo trasparente
            if dist > cutoff_radius:
                pixels[x, y] = (0, 0, 0, 0)
            elif dist > cutoff_radius - 12:
                r_val, g_val, b_val, a_val = pixels[x, y]
                if r_val > 235 and g_val > 235 and b_val > 235:
                    # Dissolvenza morbida
                    pixels[x, y] = (r_val, g_val, b_val, 0)

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

    print("Tutti gli asset sono stati rigenerati con successo con il corretto livello di zoom e margine!")

if __name__ == '__main__':
    generate_assets()
