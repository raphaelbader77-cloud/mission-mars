"""Build original Mission Mars pixel artwork. Optional artist tool: Python, Pillow, NumPy.

The game ships the PNGs; generating the art is never required for playing or building.
"""
from pathlib import Path
import math
import random

import numpy as np
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "public" / "art"
OUT.mkdir(parents=True, exist_ok=True)
NAVY = "#101a31"
INK = "#182234"
W, H = 512, 288


def noise(width, height, cell, seed):
    rng = np.random.default_rng(seed)
    tile = rng.integers(0, 255, (max(2, height // cell + 2), max(2, width // cell + 2)), dtype=np.uint8)
    return np.asarray(Image.fromarray(tile).resize((width, height), Image.Resampling.BICUBIC)) / 255


def palette_image(indices, colors):
    rgb = np.array([tuple(bytes.fromhex(color.lstrip("#"))) for color in colors], dtype=np.uint8)
    return Image.fromarray(rgb[np.array(indices, dtype=int).clip(0, len(rgb) - 1)])


def stars(d, amount, box=(0, 0, W, H), seed=21):
    r = random.Random(seed)
    for i in range(amount):
        x, y = r.randrange(box[0], box[2]), r.randrange(box[1], box[3])
        if i % 41 == 0:
            d.line((x-2, y, x+2, y), fill="#62788b")
            d.line((x, y-2, x, y+2), fill="#8199a8")
            d.point((x,y), fill="#f6e9bf")
        else:
            d.point((x, y), fill=r.choice(("#334159","#43556e","#678297","#74859b","#aebdb8","#dbd7bb")))
            if i % 19 == 0:
                d.point((x+1,y), fill="#698295")


def planet():
    # Layer broad basalt regions, meandering faults, a lit northern rim and shadowed craters.
    size = 284
    yy, xx = np.mgrid[:size, :size]
    x, y = (xx-141.5)/139.5, (yy-141.5)/139.5
    rho = x*x+y*y
    z = np.sqrt(np.maximum(0, 1-rho))
    u = np.arctan2(x, z + .001)
    v = np.arcsin(np.clip(y, -1, 1))
    macro = noise(size,size,45,12)
    fine = noise(size,size,9,15)
    detail = noise(size,size,3,22)
    ridge = np.sin(u*6+v*5+macro*5+fine*.7)
    contour = np.floor((macro*.58+fine*.29+detail*.13+ridge*.08)*8)/8
    light = -.60*x-.54*y+.63*z
    relief = light*3.05+contour*3.65+.10*detail
    relief -= (np.abs(np.sin(6*v + 1.2*np.sin(u*4)+macro*2.6)) < .12)*.45
    # A dark branched rift follows the middle latitudes, approaching the shadow.
    valley = .02+.105*np.sin(3.0*u+.4)+.04*np.sin(9*u)+.035*(fine-.5)
    width = (.014+.024*(np.cos(u*4)+1))*np.maximum(0, 1-(u/.97)**4)
    relief -= (np.abs(y-valley)<width)*1.15
    relief += (np.abs(y-valley-width)<.010)*.48
    r = random.Random(550)
    for i in range(142):
        angle = r.random()*2*math.pi
        dist = math.sqrt(r.random())*.985
        a, b = math.cos(angle)*dist, math.sin(angle)*dist
        px, py = 141.5+a*139.5, 141.5+b*139.5
        diameter = r.uniform(3,13) if i < 35 else r.uniform(1.2,4.9)
        dx, dy = xx-px, yy-py
        # Craters foreshorten on the approaching limb.
        along = (dx*math.cos(angle)+dy*math.sin(angle))/max(.24, math.sqrt(1-dist*dist))
        across = -dx*math.sin(angle)+dy*math.cos(angle)
        rr = np.sqrt(along**2+across**2)/diameter
        rag = rr + .07*(fine-.5)
        rim = (rag > .80)&(rag < 1.06)
        floor = rag < .81
        relief += rim*np.where(dx+dy < 0, .91, .30)
        relief -= floor*np.where((dx+dy < 0)&(rr>.54), 1.12, .44)
    colors = ["321e35","41213c","56263b","702e40","873842","a84842","c85940","de6c43",
              "ee8550","fa9a60","f7b575","ffcf91","ffdda2"]
    bands = np.floor((relief+2)*1.35)
    # An irregular stepped terminator retains surface geology in shadow.
    bands -= np.clip((-light+.05)*3, 0, 3)
    img = palette_image(bands, colors).convert("RGBA")
    rim = (rho > .968)&(rho <= 1)&(x+y < -.35)
    rgb = np.array(img)
    rgb[rim,:3] = (255, 177, 111)
    rgb[:,:,3] = np.where(rho <= 1, 255, 0)
    return Image.fromarray(rgb)


def ship(inflight=True):
    # Side-lit retro transfer craft, drawn nose-up to make the launch and orbit views share a design.
    im = Image.new("RGBA", (77, 133), (0,0,0,0))
    d = ImageDraw.Draw(im)
    def poly(points, color, edge=None):
        d.polygon(points, fill=color, outline=edge)
    if inflight:
        for x,y in [(17,83),(55,83),(36,91)]:
            d.polygon([(x-4,y),(x+4,y),(x+3,y+11),(x+1,y+17),(x-1,y+29),(x-3,y+17)],fill="#b24f47")
            d.polygon([(x-3,y),(x+3,y),(x+2,y+14),(x,y+20),(x-2,y+11)],fill="#ff9f47")
            d.polygon([(x-2,y),(x+2,y),(x+1,y+9),(x-1,y+12)],fill="#ffe8a2")
        poly([(33,90),(42,90),(41,101),(38,117),(36,130),(34,112)],"#dd6941")
        poly([(34,92),(40,92),(38,111),(36,117)],"#ffc761")
        d.line((36,93,36,106),fill="#fff4cb",width=2)
    poly([(27,53),(25,76),(13,91),(5,92),(6,82),(13,61),(16,51)],"#a54340",INK)
    poly([(44,53),(52,54),(61,61),(69,82),(69,93),(61,92),(45,75)],"#902f38",INK)
    poly([(7,84),(15,64),(25,56),(22,70),(12,85)],"#f16e4b")
    poly([(53,57),(62,68),(68,83),(63,80)],"#ce4b40")
    for px in (15,54):
        poly([(px-4,74),(px+3,73),(px+5,81),(px+3,85),(px-4,85),(px-5,81)],"#526273",INK)
        d.rectangle((px-3,78,px+1,82), fill="#a0a99f")
        d.line((px-4,84,px+3,84),fill="#f6b65a")
    poly([(31,72),(42,72),(44,86),(40,90),(31,90),(28,86)],"#5b6974",INK)
    d.rectangle((31,83,41,87),fill="#243646")
    d.line((31,88,41,88),fill="#d6a87c")
    poly([(36,4),(40,8),(44,18),(48,33),(49,56),(46,73),(42,81),(29,81),(25,73),(23,56),(24,36),(27,21),(31,11)],"#c7cabe",INK)
    poly([(36,6),(38,13),(35,24),(32,40),(32,66),(35,77),(29,75),(26,64),(26,40),(29,21)],"#fbf0d0")
    poly([(39,10),(43,19),(47,35),(48,54),(45,73),(41,79),(39,79),(42,65),(44,41),(42,23)],"#87969e")
    poly([(36,5),(40,9),(43,17),(42,19),(28,22),(32,11)],"#d75847")
    poly([(34,10),(36,7),(37,10),(33,18),(30,20)],"#ff9466")
    poly([(27,26),(43,22),(43,24),(26,29)],"#b74d43")
    # Recessed cockpit, highlight, hull tiles, identity markings.
    poly([(30,33),(34,29),(40,28),(42,32),(42,38),(38,43),(31,43),(28,40)],"#535963",INK)
    poly([(31,34),(35,31),(40,31),(40,36),(37,40),(31,40)],"#3b778a")
    poly([(31,34),(36,31),(39,31),(34,35),(30,37)],"#b7e4da")
    d.line((30,46,41,44), fill="#8f9799")
    d.line((29,48,29,58),fill="#eee8d0")
    d.rectangle((32,51,38,53),fill="#d95846")
    d.rectangle((32,55,38,56),fill="#4c7481")
    d.line((27,64,44,61), fill="#9aa7a5")
    poly([(26,68),(45,65),(45,70),(27,73)],"#ba5247")
    d.line((32,75,41,74),fill="#71858a")
    d.line((36,1,36,5),fill="#e3ccad")
    return im


def orbit():
    yy,xx = np.mgrid[:H,:W]
    band = np.exp(-((yy-(40+.29*xx+14*np.sin(xx/95)))/42)**2)
    n = .7*noise(W,H,38,9)+.3*noise(W,H,11,2)
    im = palette_image(np.floor((n*1.4+band*2.85)*(0.58+.42*xx/W)), ["091221","0b1526","101a2d","152035","1b253b","292a42"])
    d = ImageDraw.Draw(im)
    stars(d,570)
    # Distant satellite moons and a few small rocks establish scale.
    for x,y,s in [(290,46,5),(480,21,3),(266,207,2)]:
        d.ellipse((x-s,y-s,x+s,y+s), fill="#606170")
        d.ellipse((x-s+2,y-s+1,x+s,y+s), fill="#474557")
        d.line((x-s+1,y-2,x-1,y-s), fill="#a79a89")
    globe=planet()
    im.paste(globe,(280,68),globe)
    craft=ship().rotate(-32,Image.Resampling.NEAREST,expand=True)
    im.paste(craft,(277,39),craft)
    im.save(OUT/"orbit.png",optimize=True)


def mountain(d, y, spread, color, seed, w=W, bottom=H):
    r=random.Random(seed)
    points=[(-5,y)]
    height=y
    for x in range(0,w+12,6):
        height += r.choice((-3,-2,-1,0,1,2,3))
        height = min(y+spread,max(y-spread,height))
        points.append((x,height))
    d.polygon([(0,bottom)]+points+[(w,bottom)],fill=color)


def gantry(d,x,y,h):
    top=y-h
    d.rectangle((x-2,top-4,x+18,y),fill="#263148")
    for v in [x,x+14]:
        d.rectangle((v,top,v+2,y), fill="#ac695e")
        d.line((v,top,v,y),fill="#efaa72")
    for t in range(top+1,y-8,13):
        d.line((x+1,t,x+15,t+12),fill="#b67662",width=2)
        d.line((x+15,t,x+2,t+12),fill="#865b60",width=2)
        d.rectangle((x-2,t-1,x+18,t+1),fill="#5d5262")
        d.line((x-1,t-1,x+18,t-1),fill="#d19779")
    for t,dx in [(top+7,31),(top+31,34),(top+61,31)]:
        d.rectangle((x+14,t,x+dx,t+3),fill="#5b505e")
        d.line((x+16,t,x+dx,t),fill="#eda779")
        d.line((x+18,t+10,x+dx,t+3),fill="#a77869",width=2)
    d.line((x+4,top-9,x+4,top-2),fill="#7e7a7c")
    d.point((x+4,top-9),fill="#ffe29c")


def launchpad():
    yy,xx=np.mgrid[:H,:W]
    haze = noise(W,H,32,19)*.5
    im=palette_image(np.floor((yy/H)*7.6+haze),["111c36","1c2946","333757","4d4262","6e5269","995f69","c17d71","e39d79","f5bd8b"])
    d=ImageDraw.Draw(im); stars(d,153,(0,0,W,115))
    r=random.Random(8)
    for i in range(52):
        x,y=r.randrange(-40,W),r.randrange(99,200)
        col = "#796178" if y<145 else "#be857e"
        for k in range(r.randint(2,6)):
            d.rectangle((x+3*k,y+k,x+r.randint(18,67),y+k),fill=col)
    d.ellipse((71,160,98,187),fill="#f6c58c")
    mountain(d,191,24,"#785f71",8);mountain(d,202,20,"#555368",5)
    mountain(d,214,10,"#384359",9)
    # Mission buildings, stored fuel and distant floodlights.
    for x,w,y in [(17,52,211),(100,42,200),(174,34,215),(216,54,207),(417,53,202)]:
        d.rectangle((x,y,x+w,235),fill="#344458",outline="#273447")
        d.rectangle((x+1,y,x+w-1,y+3),fill="#aa9790")
        d.line((x+2,y-2,x+w-3,y-2),fill="#dcc09b")
        for bx in range(x+4,x+w-2,7):
            d.rectangle((bx,y+8,bx+3,y+10),fill="#e9ac76")
        d.line((x+4,y-10,x+4,y),fill="#535979")
        d.point((x+4,y-11),fill="#ff9c7a")
    for x in (133,152,400):
        d.ellipse((x,198,x+17,207),fill="#a19794",outline="#445064")
        d.rectangle((x,203,x+17,225),fill="#8c8790",outline="#465266")
        d.rectangle((x+2,204,x+6,222),fill="#c3ad9e")
        d.line((x,211,x+17,211),fill="#63697b")
    # Rocket is fuelled but waiting on its launch clamps.
    d.rectangle((284,215,401,224),fill="#353e53",outline="#232e42")
    d.rectangle((289,216,398,218),fill="#ac8c81")
    craft=ship(False).crop((0,0,77,94)).resize((104,128),Image.Resampling.NEAREST)
    im.paste(craft,(298,87),craft)
    gantry(d,288,219,120)
    d.rectangle((0,229,W,288),fill="#2b3747")
    for i in range(110):
        x,y=r.randrange(W),r.randrange(230,288)
        d.line((x,y,x+r.randrange(2,22),y),fill=r.choice(["#344152","#354453","#47505b"]))
    for x in range(-3,W,21):
        d.rectangle((x,234,x+10,235),fill="#aa8973")
        d.point((x+2,227),fill="#f4cc86")
    # Foreground satellite dish with slanted receiver and squat service building.
    d.polygon([(47,254),(54,235),(59,235),(67,254)],fill="#1a293b")
    d.polygon([(25,217),(63,230),(80,215),(75,230),(63,237),(52,236),(36,229)],fill="#677580",outline=INK)
    d.line((25,216,80,214),fill="#b4aba3",width=2)
    d.line((51,226,60,201),fill="#9c9996",width=2)
    d.line((64,229,60,201),fill="#69707b")
    d.rectangle((58,199,62,202),fill="#ddab85")
    for x in (248,402):
        d.line((x,224,x,184),fill="#374454",width=2)
        d.rectangle((x-4,183,x+4,185),fill="#f8d692")
    im.save(OUT/"launchpad.png",optimize=True)


def control():
    im=Image.new("RGB",(W,H),"#172738");d=ImageDraw.Draw(im)
    # Wide observation windows over the spaceport.
    panorama=Image.open(OUT/"launchpad.png").resize((397,172),Image.Resampling.NEAREST)
    im.paste(panorama,(58,15))
    for x in [53,152,253,353,454]:
        d.polygon([(x,8),(x+7,8),(x+3,185),(x-8,185)],fill="#253648",outline="#142033")
        d.line((x+1,12,x-3,179),fill="#61737a",width=2)
    d.rectangle((43,8,468,15),fill="#435566")
    d.rectangle((37,182,474,196),fill="#2d4453")
    d.line((46,184,468,184),fill="#99a19a",width=2)
    for x in (0,470):
        d.rectangle((x,0,x+41,202),fill="#293b4a",outline="#142536")
        for y in (22,73,127):
            d.rectangle((x+5,y,x+34,y+32),fill="#162c3a",outline="#415260")
            for k in range(5):
                d.line((x+9,y+5+k*5,x+26,y+5+k*5),fill="#496272")
                d.point((x+30,y+5+k*5),fill="#96cbb9")
    d.rectangle((0,197,W,H),fill="#223341")
    for x in (38,159,280,401):
        d.polygon([(x,202),(x+69,202),(x+85,224),(x-13,224)],fill="#526975",outline="#101e2e")
        d.rectangle((x-13,224,x+85,239),fill="#314b58",outline="#162433")
        d.rectangle((x+10,185,x+57,211),fill="#152532",outline="#77878b")
        d.rectangle((x+13,188,x+54,208),fill="#1c414e")
        for k in range(6):
            d.line((x+16,191+2*k,x+23+(k*7)%21,191+2*k),fill="#79b9aa")
        d.line((x+10,215,x+43,215),fill="#9ba69e")
        for k in range(9):
            d.point((x+9+k*4,218),fill="#d5b880")
    # Foreground consoles: navigation and telemetry, built in three distinct banks.
    for x in (-31,116,267,414):
        d.polygon([(x+13,241),(x+105,241),(x+142,274),(x-12,274)],fill="#485760",outline="#132532")
        d.rectangle((x-12,274,x+142,288),fill="#2c3f50",outline="#172332")
        d.polygon([(x+18,245),(x+61,245),(x+69,258),(x+10,258)],fill="#223d49",outline="#1d2c3b")
        for k in range(5):
            d.line((x+18,248+k*2,x+28+(k*11)%24,248+k*2),fill="#89bbae")
        for k in range(3):
            d.rectangle((x+77+k*5,250,x+79+k*5,252),fill=["#f7a569","#8db8b5","#f3c47b"][k])
        d.line((x+11,266,x+103,266),fill="#80908c",width=2)
    im.save(OUT/"control.png",optimize=True)


def colony():
    im=Image.new("RGB",(W,H),"#ad573e");d=ImageDraw.Draw(im);r=random.Random(47)
    # Low viewpoint over a later ARES settlement, with layered horizon and basalt mesas.
    d.rectangle((0,0,W,61),fill="#493448");d.rectangle((0,32,W,73),fill="#64404b")
    stars(d,71,(0,0,W,45))
    d.ellipse((81,9,100,28),fill="#759a8e")
    d.polygon([(82,17),(86,12),(93,12),(89,16),(94,17),(95,21),(89,20),(87,23)],fill="#a5b58c")
    mountain(d,69,18,"#895047",13);mountain(d,82,12,"#9a5846",18)
    d.rectangle((0,92,W,H),fill="#bb6946")
    for i in range(290):
        x,y=r.randrange(W),r.randrange(90,H)
        d.line((x,y,x+r.randint(2,12),y),fill=r.choice(["#ad6045","#c77a50","#ab6046"]))
    def crater(x,y,radius):
        d.ellipse((x-radius,y-radius//3,x+radius,y+radius//3),fill="#cc8056")
        d.ellipse((x-radius+2,y-radius//3-1,x+radius-1,y+radius//3-2),fill="#9c523d")
        d.arc((x-radius+2,y-radius//3,x+radius-2,y+radius//3+2),190,340,fill="#84473e",width=2)
    for cr in [(16,150,27),(289,98,32),(466,172,25),(204,266,32),(467,262,44),(125,106,12),(34,237,13)]:crater(*cr)
    for xy in [[(43,173),(120,194),(242,187),(350,160)],[(120,194),(165,234),(335,254)],[(245,187),(224,149),(292,128)]]:
        d.line(xy,fill="#94533d",width=15)
        d.line(xy,fill="#db8d55",width=11)
    def dome(x,y,radius):
        d.ellipse((x-radius+5,y-3,x+radius+11,y+14),fill="#95543f")
        d.pieslice((x-radius,y-radius,x+radius,y+radius),180,360,fill="#679697",outline="#344657",width=2)
        d.ellipse((x-radius,y-5,x+radius,y+8),fill="#52696b",outline="#41494e",width=2)
        for k in (.5,.85):
            rr=int(radius*k);d.arc((x-rr,y-radius,x+rr,y+radius),180,360,fill="#b0c6b0",width=2)
        d.line((x-radius+5,y-radius//2,x+radius-6,y-radius//2),fill="#c8b99c",width=2)
        d.rectangle((x-9,y-5,x+8,y+8),fill="#d5bea0",outline="#4f5557")
        d.rectangle((x-5,y-2,x+4,y+8),fill="#374b53")
    def hab(x,y):
        d.polygon([(x+2,y+10),(x+13,y-3),(x+63,y-3),(x+70,y+6),(x+70,y+30),(x+59,y+35),(x,y+35)],fill="#8b8177",outline="#434754")
        d.polygon([(x,y+9),(x+57,y+9),(x+59,y+35),(x,y+35)],fill="#c5aa8d",outline="#4d5358")
        d.polygon([(x+1,y+8),(x+11,y-3),(x+62,y-3),(x+57,y+8)],fill="#e6cda5")
        d.rectangle((x+8,y+13,x+23,y+22),fill="#476675",outline="#374c58")
        d.rectangle((x+12,y+14,x+20,y+16),fill="#a7c9bb")
        d.rectangle((x+35,y+13,x+47,y+34),fill="#535d61",outline="#444b51")
        d.line((x+41,y+14,x+41,y+34),fill="#a59a83")
    dome(101,159,39); dome(183,142,24);hab(293,110);hab(326,204);dome(74,237,24)
    for x,y in [(204,158),(232,151),(259,146),(297,191),(321,186)]:
        d.line((x+8,y+4,x+8,y+17),fill="#484b54",width=3)
        d.polygon([(x,y),(x+24,y-4),(x+28,y+6),(x+4,y+10)],fill="#40536e",outline="#b3a99a")
        for k in (5,11,17):d.line((x+k,y-1,x+k+4,y+7),fill="#7192a0")
    for i in range(48):
        x,y=r.randrange(W),r.randrange(100,H)
        if (x<38 or x>440 or y>273):
            d.polygon([(x-3,y),(x-1,y-3),(x+2,y-4),(x+5,y),(x+4,y+2),(x-2,y+2)],fill="#92523f")
            d.line((x-2,y-1,x+1,y-3),fill="#d49461")
    # The survey rover is visible at a bend in the service road.
    x,y=181,224
    d.ellipse((x-14,y+3,x+22,y+9),fill="#96583e")
    d.polygon([(x-15,y-2),(x-9,y-7),(x+11,y-7),(x+16,y-2),(x+16,y+3),(x+10,y+6),(x-13,y+4)],fill="#c7ac8a",outline="#38474e")
    d.polygon([(x-10,y-6),(x-7,y-11),(x+4,y-12),(x+8,y-7)],fill="#ece0af",outline="#45535a")
    d.polygon([(x-6,y-10),(x+2,y-10),(x+4,y-8),(x-8,y-8)],fill="#7095a0")
    for dx in (-10,0,10):
        d.ellipse((x+dx-3,y+1,x+dx+3,y+7),fill="#354451",outline="#29323e")
        d.rectangle((x+dx-1,y+3,x+dx+1,y+5),fill="#8d968e")
    d.line((x+12,y-6,x+12,y-16),fill="#435565")
    d.line((x+9,y-16,x+15,y-16),fill="#d7ceb0",width=2)
    # Unpressurised walking suits with dark visors and narrow painted shoulder stripes.
    for x,y in [(121,183),(256,173),(336,165)]:
        d.ellipse((x-3,y+7,x+8,y+10),fill="#9d593f")
        d.rectangle((x-4,y-1,x+3,y+6),fill="#d7c49a",outline="#4d5151")
        d.rectangle((x-3,y+6,x-1,y+9),fill="#525758")
        d.rectangle((x+1,y+6,x+3,y+9),fill="#525758")
        d.rectangle((x-5,y,x-4,y+4),fill="#b67955")
        d.ellipse((x-4,y-7,x+3,y),fill="#e4d2a6",outline="#565653")
        d.rectangle((x-1,y-5,x+3,y-2),fill="#394c55")
        d.point((x+1,y-5),fill="#94b7b1")
        d.line((x-2,y+2,x+2,y+2),fill="#bf6b49")
    im.save(OUT/"colony.png",optimize=True)


PEOPLE = {
    # Shadow, midtone, light, hair dark, hair light, jacket, jacket light
    "morgan": ["#945e50","#cc9377","#efc29c","#4b515b","#b7b4a1","#364b61","#6e8692"],
    "chen":   ["#94664e","#c79469","#e1b788","#202332","#48434b","#a75a3f","#e28b50"],
    "reyes":  ["#885541","#ae7858","#d39b72","#282534","#55404a","#297c79","#61a596"],
    "kim":    ["#9d6e58","#d59f79","#e9bb94","#2e303b","#555360","#c7c5ac","#ebe8c9"],
    "brown":  ["#694942","#936348","#b8815e","#2d2830","#594348","#536c81","#95acb2"],
    "wilson": ["#985f50","#c18469","#dfa786","#533a37","#8b604c","#4c6580","#8c9eae"],
}


def portrait(name, colors):
    sh,sk,hi,hair,hair2,coat,trim=colors
    im=Image.new("RGBA",(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
    def p(pts,c):d.polygon(pts,fill=c)
    def r(box,c):d.rectangle(box,fill=c)
    if name in ("reyes","morgan"):
        p([(9,16),(12,9),(18,6),(29,5),(37,13),(39,24),(37,35),(31,38),(12,35),(8,29)],hair)
        if name=="reyes":
            for x,y,rd in [(10,10,5),(15,9,6),(25,7,6),(32,11,5),(35,17,6),(8,21,5),(12,27,6),(36,27,5)]:
                d.ellipse((x-rd,y-rd,x+rd,y+rd),fill=hair,outline=INK)
    p([(0,47),(3,39),(10,36),(18,33),(22,31),(29,31),(33,35),(40,37),(45,41),(48,47)],INK)
    p([(2,47),(4,41),(12,37),(19,35),(30,34),(35,37),(42,39),(46,47)],coat)
    p([(17,37),(21,34),(28,33),(32,35),(30,41),(25,44),(21,42)],"#273a48")
    p([(21,29),(29,28),(29,33),(31,35),(26,39),(23,38),(20,35)],sh)
    p([(22,32),(27,31),(28,34),(24,36),(21,35)],sk)
    p([(8,38),(17,34),(20,35),(20,37),(13,42),(6,42)],trim)
    p([(31,34),(36,36),(39,39),(35,41),(29,37)],trim)
    r((7,44,14,45),"#354956")
    r((34,43,39,45),"#223946");r((35,43,38,43),"#f7b870")
    r((25,40,26,47),"#1e3442")
    # Face is turned very slightly to screen right.
    p([(13,15),(16,11),(27,9),(33,13),(34,19),(34,26),(31,30),(27,34),(20,33),(15,29),(13,25),(10,23),(10,19),(13,18)],INK)
    p([(14,16),(21,12),(29,12),(32,15),(33,21),(32,27),(28,31),(25,33),(20,31),(16,27),(15,24),(12,24),(11,21),(12,19),(14,20)],sh)
    p([(17,15),(27,12),(31,15),(32,22),(31,26),(28,30),(24,31),(19,28),(17,24),(16,21)],sk)
    p([(20,15),(29,14),(31,16),(31,19),(27,19),(25,17),(20,18)],hi)
    r((12,20,13,22),sk)
    p([(26,20),(27,21),(28,24),(27,25),(25,24)],hi)
    r((26,25,28,25),sh)
    r((18,19,22,19),hair2);r((28,19,31,19),hair2)
    r((19,21,22,21),"#ebe0bd");r((28,21,31,21),"#ebe0bd")
    r((21,21,22,22),hair);r((30,21,31,22),hair)
    d.line((22,27,28,27),fill=sh)
    d.line((24,28,27,28),fill=hi)
    if name=="morgan":
        p([(11,11),(14,7),(20,4),(30,5),(35,9),(36,14),(32,16),(29,13),(27,10),(24,14),(18,16),(16,22),(13,20),(12,17)],hair)
        p([(13,12),(16,8),(21,6),(29,6),(30,8),(26,9),(21,12),(15,15)],hair2)
        p([(15,14),(18,10),(23,8),(25,8),(20,12)],"#d2cbb0")
        d.line((29,9,34,13), fill=hair2,width=2)
        r((17,22,22,23),"#53656a");r((28,22,32,23),"#53656a")
        d.line((22,21,28,21),fill="#374754")
    elif name=="chen":
        p([(11,14),(10,11),(13,10),(13,7),(17,8),(21,4),(23,5),(29,4),(28,7),(33,6),(36,11),(34,15),(30,16),(29,12),(24,14),(19,14),(16,18),(15,23),(13,21)],hair)
        p([(13,12),(18,8),(22,7),(23,6),(29,6),(26,9),(20,10),(16,13)],hair2)
        r((12,18,14,23),"#374b58");r((10,19,12,22),"#8faaa7")
        d.line((12,23,15,26),fill="#4b5661");d.line((15,26,18,26),fill="#5b686c")
    elif name=="reyes":
        p([(11,13),(13,7),(19,4),(28,5),(33,9),(34,14),(31,15),(28,11),(24,15),(20,16),(15,20),(13,20)],hair)
        for x,y in [(13,11),(17,8),(21,7),(26,7),(31,11),(9,19),(36,23),(10,26)]:
            d.arc((x-2,y-2,x+3,y+3),165,300,fill=hair2,width=2)
        r((13,24,14,26),"#efb775");r((32,24,33,25),"#efb775")
    elif name=="kim":
        p([(12,12),(15,7),(21,5),(28,5),(33,9),(35,15),(31,15),(29,12),(25,12),(22,14),(17,16),(15,20),(13,19)],hair)
        d.line((14,12,21,7,28,7),fill=hair2,width=2)
        d.rectangle((17,19,23,23),outline="#47545b");d.rectangle((28,19,33,23),outline="#47545b")
        d.line((23,20,28,20),fill="#47545b")
        d.line((17,37,18,41,20,43),fill="#527883");d.line((31,37,31,43,29,45),fill="#527883")
        r((28,44,30,46),"#477680")
    elif name=="brown":
        p([(12,10),(17,6),(26,5),(32,8),(34,12),(33,15),(29,13),(23,12),(17,14),(14,20),(12,19)],hair)
        for x,y in [(16,10),(20,8),(24,8),(28,9),(31,11)]:r((x,y,x+1,y),hair2)
        p([(17,25),(20,28),(24,30),(28,29),(31,26),(31,29),(27,33),(22,32),(18,29)],hair)
        r((22,27,27,27),hair2)
    else:
        p([(12,11),(16,7),(21,6),(25,4),(28,6),(33,7),(35,13),(31,14),(28,11),(22,13),(17,16),(15,21),(12,18)],hair)
        p([(15,11),(20,7),(25,6),(30,8),(26,9),(21,9),(17,13)],hair2)
        d.line((17,24,18,27),fill=hair2)
    im.save(OUT/f"{name}.png",optimize=True)
    # Tiny full-body suits share flight colours with the corresponding portraits.
    sprite=Image.new("RGBA",(20,30),(0,0,0,0));sd=ImageDraw.Draw(sprite)
    sd.polygon([(3,13),(5,11),(14,11),(17,15),(18,20),(16,22),(14,20),(13,24),(14,28),(11,29),(9,24),(8,28),(5,29),(5,23),(4,20),(2,22),(1,19)],fill=INK)
    sd.rectangle((5,13,13,22),fill=coat);sd.rectangle((6,13,8,21),fill=trim)
    sd.rectangle((3,15,5,20),fill=coat);sd.rectangle((14,15,16,19),fill=trim)
    sd.rectangle((6,22,8,26),fill="#73828b");sd.rectangle((10,22,12,26),fill="#566877")
    sd.rectangle((10,15,12,17),fill="#344858");sd.point((11,16),fill="#ffc27e")
    head=im.crop((9,4,36,34)).resize((11,12),Image.Resampling.NEAREST)
    sprite.paste(head,(4,1),head);sprite.save(OUT/f"{name}-sprite.png",optimize=True)


def nova():
    im=Image.new("RGBA",(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
    d.polygon([(8,13),(15,7),(33,7),(40,13),(42,24),(36,33),(28,36),(24,42),(21,36),(13,34),(7,26)],fill="#253948",outline=INK)
    d.polygon([(9,15),(16,9),(32,9),(38,14),(39,24),(34,31),(26,34),(24,37),(22,33),(15,31),(10,26)],fill="#74969e",outline="#375365")
    d.polygon([(11,16),(17,11),(31,10),(36,14),(25,13),(17,15),(13,20)],fill="#c4d4be")
    d.polygon([(13,18),(17,15),(32,14),(36,17),(36,25),(31,29),(18,29),(12,25)],fill="#192f43")
    d.line((15,22,19,22,21,19,24,26,27,18,29,22,33,22),fill="#8af2dc",width=2)
    d.line((18,32,22,33),fill="#e9ae74");d.rectangle((8,20,9,24),fill="#efba76")
    d.line((35,11,37,5),fill="#718896");d.point((37,4),fill="#e4b77a")
    im.save(OUT/"nova.png",optimize=True)


if __name__ == "__main__":
    orbit()
    launchpad()
    control()
    colony()
    for person, colors in PEOPLE.items():
        portrait(person, colors)
    nova()
