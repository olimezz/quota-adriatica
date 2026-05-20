import os
from PIL import Image

def generate_assets():
    logo_path = 'logo.png'
    if not os.path.exists(logo_path):
        print(f"Errore: {logo_path} non trovato!")
        return

    print("Caricamento logo.png...")
    img = Image.open(logo_path).convert('RGBA')
    w, h = img.size
    print(f"Dimensioni logo: {w}x{h}")

    # Scansione limiti reali (x da 900 a 2150, y da 250 a 1450)
    x_min, x_max = w, 0
    y_min, y_max = h, 0
    for y in range(250, 1450):
        for x in range(900, 2150):
            r, g, b, a = img.getpixel((x, y))
            if r < 245 or g < 245 or b < 245:
                if x < x_min: x_min = x
                if x > x_max: x_max = x
                if y < y_min: y_min = y
                if y > y_max: y_max = y

    print(f"Limiti reali del logo rilevati: x={x_min} a {x_max}, y={y_min} a {y_max}")
    content_w = x_max - x_min + 1
    content_h = y_max - y_min + 1
    print(f"Dimensioni contenuto: larghezza={content_w}, altezza={content_h}")

    cx = (x_min + x_max) // 2
    cy = (y_min + y_max) // 2

    # Utilizziamo la dimensione reale con margine per il ritaglio quadrato
    max_dim = max(content_w, content_h)
    margin = 90
    crop_size = max_dim + (margin * 2)
    half_crop = crop_size // 2

    left = cx - half_crop
    top = cy - half_crop
    right = cx + half_crop
    bottom = cy + half_crop

    # Forziamo il ritaglio perfettamente quadrato
    left = max(0, left)
    top = max(0, top)
    right = min(w, right)
    bottom = min(h, bottom)

    crop_w = right - left
    crop_h = bottom - top
    final_crop_size = min(crop_w, crop_h)

    left = cx - final_crop_size // 2
    top = cy - final_crop_size // 2
    right = left + final_crop_size
    bottom = top + final_crop_size

    print(f"Ritaglio quadrato definitivo (con respiro): size={final_crop_size}x{final_crop_size}")
    cropped = img.crop((left, top, right, bottom)).convert('RGBA')
    cw, ch = cropped.size

    # Algoritmo Flood Fill (BFS) per rendere trasparente SOLO lo sfondo bianco esterno,
    # preservando elementi interni e qualsiasi forma sporgente (es. nastri o dettagli sulla destra)
    print("Rimozione dello sfondo bianco tramite Flood Fill...")
    pixels = cropped.load()
    visited = set()
    
    # Consideriamo come "sfondo bianco" i pixel con R, G, B > 242
    def is_white(x, y):
        r, g, b, a = pixels[x, y]
        return r > 242 and g > 242 and b > 242

    # Punti di partenza per il flood fill: i 4 angoli e tutti i pixel dei bordi esterni
    queue = []
    for x in range(cw):
        queue.append((x, 0))
        queue.append((x, ch - 1))
    for y in range(1, ch - 1):
        queue.append((0, y))
        queue.append((cw - 1, y))

    # Eseguiamo il BFS
    flood_filled = set()
    for pt in queue:
        if pt not in visited and is_white(pt[0], pt[1]):
            q = [pt]
            visited.add(pt)
            while q:
                curr = q.pop(0)
                cx_p, cy_p = curr
                flood_filled.add(curr)
                # Controlliamo i 4 vicini
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nx, ny = cx_p + dx, cy_p + dy
                    if 0 <= nx < cw and 0 <= ny < ch:
                        neighbor = (nx, ny)
                        if neighbor not in visited and is_white(nx, ny):
                            visited.add(neighbor)
                            q.append(neighbor)

    # Impostiamo l'alpha a 0 per tutti i pixel dello sfondo rilevati
    for x, y in flood_filled:
        pixels[x, y] = (0, 0, 0, 0)

    # Sfumatura antialias morbida sui bordi del logo per evitare pixel bianchi spuri
    # Qualsiasi pixel non trasparente che confina con un pixel trasparente viene addolcito se è molto chiaro
    for y in range(1, ch - 1):
        for x in range(1, cw - 1):
            r, g, b, a = pixels[x, y]
            if a > 0:
                # Controlliamo se confina con la trasparenza
                has_transparent_neighbor = False
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    if pixels[x+dx, y+dy][3] == 0:
                        has_transparent_neighbor = True
                        break
                if has_transparent_neighbor and r > 230 and g > 230 and b > 230:
                    # Riduciamo l'opacità gradualmente per i bordi chiari
                    pixels[x, y] = (r, g, b, int(a * 0.3))

    # Salviamo le diverse versioni degli asset
    
    # 1. emblem.png (420x420)
    print("Generazione emblem.png (420x420)...")
    emblem_final = cropped.resize((420, 420), Image.Resampling.LANCZOS)
    emblem_final.save('emblem.png', 'PNG')
    
    # 2. apple-touch-icon.png (180x180)
    print("Generazione apple-touch-icon.png (180x180)...")
    apple_icon = cropped.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save('apple-touch-icon.png', 'PNG')
    
    # 3. favicon.png (32x32)
    print("Generazione favicon.png (32x32)...")
    fav_png = cropped.resize((32, 32), Image.Resampling.LANCZOS)
    fav_png.save('favicon.png', 'PNG')
    
    # 4. favicon.ico (48x48)
    print("Generazione favicon.ico (48x48)...")
    fav_ico = cropped.resize((48, 48), Image.Resampling.LANCZOS)
    fav_ico.save('favicon.ico', 'ICO')

    print("Tutti gli asset sono stati rigenerati mantenendo intatta la forma reale del logo (nastri inclusi)!")

if __name__ == '__main__':
    generate_assets()
