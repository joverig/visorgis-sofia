# Imágenes representativas de comida (Wikimedia Commons): nombre de archivo, autor, licencia
import hashlib, urllib.parse
F = {
 'shopska':   ('Chopska.jpg', 'Popo le Chien', 'CC0', 'Ensalada shopska'),
 'banitsa':   ('Banitsa and yogurt.jpg', 'Biso', 'CC BY 3.0', 'Banitsa con yogur'),
 'boza':      ('Boza bg.jpg', 'Ikonact', 'CC BY-SA 3.0', 'Boza'),
 'kavarma':   ('Kavarma.jpeg', 'Jeroen Kransen', 'CC BY-SA 2.5', 'Kavarma'),
 'kebapche':  ('Kebapche bg.jpg', 'Ikonact', 'CC BY-SA 3.0', 'Kebapche'),
 'sarmi':     ('Bulgarians Gotta Love Sarmi.JPG', 'CaptainPiggles', 'CC BY-SA 4.0', 'Sarmi'),
 'patatnik':  ('Patatnik.jpg', 'K kapustin', 'CC BY-SA 3.0', 'Patatnik'),
 'gyuveche':  ('Turkish earthenware pots or guvech.jpg', 'E4024', 'CC BY-SA 3.0', 'Cazuelas de barro (gyuveche)'),
 'chushki':   ('Chushki burek.jpg', 'Biso', 'CC BY 3.0', 'Chushki byurek'),
 'mekitsa':   ('Mekici and jam.JPG', 'Biso (Biser Todorov)', 'CC BY-SA 3.0', 'Mekitsi con mermelada'),
 'kyopolou':  ('Kyopoolu bg.jpg', 'Ikonact', 'CC BY-SA 3.0', 'Kyopolou'),
 'rakia':     ('Rakia, Sofia ( 1070644).jpg', 'Matti Blume', 'CC BY-SA 4.0', 'Rakía en Sofía'),
 'pljeskavica':('Pleskavitsa.JPG', 'Biso', 'CC BY 3.0', 'Pljeskavica'),
 'khorovats': ('Khorovats in Sevan.jpg', '2colored', 'CC BY-SA 2.0', 'Khorovats armenio'),
 'coctel':    ('Elegant cocktail garnished with citrus twist presented in a stylish glass on a wooden bar.jpg', 'Shixart1985', 'CC BY 2.0', 'Cóctel'),
 'cheverme':  ('Cheverme.JPG', 'Иван', 'CC BY-SA 3.0', 'Chevermé'),
 'vinocaliente':('Mulled wine made on the brazier.jpg', 'SWT666', 'CC BY 4.0', 'Vino caliente'),
 'sirene':    ('White Brine cheese cubes.jpg', 'Иван', 'CC BY-SA 4.0', 'Queso sirene'),
 'moussaka':  ('Bulgarian cuisine Moussaka, Lukanka, Kashkaval (1).jpg', 'EvelinaRibarova', 'CC BY-SA 4.0', 'Musaka, lukanka y kashkaval'),
 'alta':      ('Pan seared scallops with grilled asparagus fine dining appetizer.jpg', 'Wiki.cullin', 'CC0', 'Plato de alta cocina'),
 'carpa':     ('Охридски крап (полнет).jpg', 'Alextrajcheski', 'CC BY-SA 4.0', 'Carpa rellena'),
 'mavrud':    ('Mavrud E1.jpg', 'Elena Chochkova', 'CC BY-SA 3.0', 'Uva mavrud'),
 'vino':      ('Wine being poured into a glass.jpg', 'Fabio Ingrosso', 'CC BY 2.0', 'Vino tinto'),
 'velas':     ('Candle Light Lounge in Treme.jpg', 'Derek Bridges', 'CC BY 2.0', 'Bar a la luz de las velas'),
 'yogur':     ('Bulgarian yogurt.JPG', 'Ned Jelyazkov', 'CC BY-SA 3.0', 'Yogur búlgaro'),
 'codillo':   ('Pork knuckle with roasted potatoes, Zabrze, Silesian Voivodeship, Poland, March 2024.jpg', 'MichalPL', 'CC BY-SA 4.0', 'Codillo asado'),
 'drob':      ('Bulgarian drob sarma.jpg', 'Biser Todorov', 'CC BY 4.0', 'Drob sarma'),
 'kachamak':  ('Kachamak (polenta).jpg', 'Biser Todorov', 'CC BY 4.0', 'Kachamak'),
 'cerveza':   ('Glass of beer at The Tombs.jpg', 'Ser Amantio di Nicolao', 'CC BY-SA 4.0', 'Cerveza'),
}
def url(nombre, ancho=960):
    n = nombre.replace(' ', '_'); h = hashlib.md5(n.encode()).hexdigest()
    q = urllib.parse.quote(n)
    return f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{ancho}px-{q}'
def foto(k):
    n, autor, lic, alt = F[k]
    return {'url': url(n), 'alt': alt, 'autor': autor, 'licencia': lic,
            'fuente': 'https://commons.wikimedia.org/wiki/File:' + urllib.parse.quote(n.replace(' ', '_'))}
if __name__ == '__main__':
    for k in F: print(k, url(F[k][0]))
