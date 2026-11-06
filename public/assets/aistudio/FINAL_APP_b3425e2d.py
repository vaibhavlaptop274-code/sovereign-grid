import os
import random
import json
import shutil
import calendar
import tkinter.filedialog as fd
import tkinter.messagebox as msg
import datetime
from datetime import date, timedelta
import customtkinter as ctk
from PIL import Image, ImageDraw, ImageTk
from fpdf import FPDF

# --- THE TEJAS ENGINE (DYNAMIC THEMES) ---
# --- THE TEJAS ENGINE (DYNAMIC THEMES) ---
TEJAS_PALETTES = {
    "DEFAULT": {"BG": "#050505", "PANEL": "#0A0A0A", "BORDER": "#1A1A1A", "BLUE": "#3b82f6", "GREEN": "#10b981"},
    "AGNI-VARDHAN": {"BG": "#110505", "PANEL": "#1a0f0f", "BORDER": "#5a2929", "BLUE": "#f97316", "GREEN": "#dc2626"},
    "SHUNYA-AVASTHA": {"BG": "#020617", "PANEL": "#0f172a", "BORDER": "#0ea5e9", "BLUE": "#38bdf8", "GREEN": "#2dd4bf"}, # UPGRADED: Deep Cosmic Void (Cyan/Navy)
    "BRAHMASTRAS": {"BG": "#1f2937", "PANEL": "#111827", "BORDER": "#374151", "BLUE": "#eab308", "GREEN": "#22c55e"},
    "KALKI": {"BG": "#000000", "PANEL": "#141414", "BORDER": "#fbb606", "BLUE": "#ffffff", "GREEN": "#fbbf24"},
    "RUDRA": {"BG": "#1a0505", "PANEL": "#2a0808", "BORDER": "#ef4444", "BLUE": "#f87171", "GREEN": "#fca5a5"},
    "INDRA-JAAL": {"BG": "#000000", "PANEL": "#001100", "BORDER": "#00ff00", "BLUE": "#22c55e", "GREEN": "#4ade80"},
    "VAIKUNTHA": {"BG": "#f8fafc", "PANEL": "#f1f5f9", "BORDER": "#cbd5e1", "BLUE": "#0284c7", "GREEN": "#06d93e"}
}

# --- THE RANKING ENGINE (1.5 YEAR VEDIC SCALING) ---
RANK_THRESHOLDS = [
    (0, "JIGYASU"), (1000, "VIDYARTHI"), (2500, "MUMUKSHU"), (5000, "ANUSHASITA"), 
    (8000, "SADHAKA"), (12000, "BRAHMACHARI"), (17000, "DHRUTIMAN"), (23000, "TAPASVI"), 
    (30000, "URDHVARETAS"), (38000, "JITENDRIYA"), (48000, "VAIRAGI"), (60000, "TEJASVI"), 
    (75000, "OJASVI"), (95000, "STHITAPRAJNA"), (120000, "DHYAN-YOGI"), (150000, "TATTVADARSHI"), 
    (185000, "MAHATAPASVI"), (225000, "RISHI"), (275000, "MAHARISHI"), (350000, "PARAMHAMSA")
]

try:
    from ctypes import windll
    windll.shcore.SetProcessDpiAwareness(1)
except: pass

import sys
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    import sys
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "selfbuild_v4_db.json")
SIG_PATH = os.path.join(BASE_DIR, "selfbuild_signature.png")
PFP_PATH = os.path.join(BASE_DIR, "profile_pic.png")

# --- SIGNATURE MODULE ---
class SignaturePad(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="#0A0A0A", border_color="#1A1A1A", border_width=1, corner_radius=10, **kwargs)
        ctk.CTkLabel(self, text="DIGITAL SIGNATURE LOCK", font=("Inter", 10, "bold"), text_color="#888888").pack(pady=5)
        self.canvas = ctk.CTkCanvas(self, bg="#FFFFFF", highlightthickness=0, height=80)
        self.canvas.pack(fill="x", padx=15, pady=5)
        self.img = Image.new("RGB", (800, 80), "#FFFFFF")
        self.draw = ImageDraw.Draw(self.img)
        self.canvas.bind("<B1-Motion>", self.paint)
        btn_f = ctk.CTkFrame(self, fg_color="transparent")
        btn_f.pack(pady=5)
        ctk.CTkButton(btn_f, text="Clear", width=80, fg_color="#1A1A1A", text_color="#FFFFFF", hover_color="#ff4444", command=self.clear).pack(side="left", padx=5)

    def paint(self, e):
        self.canvas.create_oval(e.x-2, e.y-2, e.x+2, e.y+2, fill="#000000", outline="#000000")
        self.draw.line([e.x-2, e.y-2, e.x+2, e.y+2], fill="#000000", width=3)

    def clear(self):
        self.canvas.delete("all")
        self.img = Image.new("RGB", (800, 80), "#FFFFFF")
        self.draw = ImageDraw.Draw(self.img)

    def save(self):
        self.img.save(SIG_PATH)

# --- MAIN APPLICATION ---
class SelfBuildingApp(ctk.CTk):   
    def __init__(self):
        super().__init__()
        self.title("SOVEREIGN GRID - V5.0 (HARDCORE EDITION)")
        self.geometry("1100x900")
        
        self.vars = {}
        self.save_timer = None
        self.load_data() 

        active_theme = self.data["profile"].get("active_tejas", "DEFAULT")
        colors = TEJAS_PALETTES.get(active_theme, TEJAS_PALETTES["DEFAULT"])

        self.BG = colors["BG"]
        self.PANEL = colors["PANEL"]
        self.BORDER = colors["BORDER"]
        self.CYBER_BLUE = colors["BLUE"]
        self.EMERALD = colors["GREEN"]
        self.TEXT_PRI = "#FFFFFF"
        self.TEXT_SEC = "#888888"
        
        # Override for the Absolute Light Theme
        if active_theme == "VAIKUNTHA":
            self.TEXT_PRI = "#0f172a" 
            self.TEXT_SEC = "#475569"
            ctk.set_appearance_mode("light")  
        else:
            ctk.set_appearance_mode("dark")   

        self.HEAD_FONT   = ("Agency FB", 32, "bold")      
        self.RANK_FONT   = ("Impact", 36)                 
        self.SUB_FONT    = ("Copperplate Gothic Bold", 18)
        self.QUOTE_FONT  = ("Bell MT", 16, "italic")      
        self.UI_FONT     = ("Bahnschrift", 12)            
        self.UI_BOLD     = ("Bahnschrift", 13, "bold")
        
        self.configure(fg_color=self.BG)

        # 🚨 NEW ALIGNMENT: Creates the top bar as an independent instance variable
        self.top_bar = ctk.CTkFrame(self, fg_color=self.PANEL, height=60, corner_radius=0, border_width=1, border_color=self.BORDER)
        self.top_bar.pack(fill="x", side="top")
        
        ctk.CTkButton(self.top_bar, text="👤 PROFILE", font=self.UI_BOLD, fg_color=self.BG, border_color=self.CYBER_BLUE, border_width=1, width=100, command=self.open_profile).pack(side="left", padx=10, pady=10)
        ctk.CTkButton(self.top_bar, text="🎯 TARGETS", font=self.UI_BOLD, fg_color=self.BG, border_color=self.EMERALD, border_width=1, width=100, command=self.open_target_page).pack(side="left", padx=10, pady=10)
        ctk.CTkButton(self.top_bar, text="⏳ MESOCYCLE", font=self.UI_BOLD, fg_color=self.BG, border_color="#8b5cf6", border_width=1, width=100, command=self.open_mesocycle).pack(side="left", padx=10, pady=10)
        ctk.CTkButton(self.top_bar, text="☰ SIDE PANEL", font=self.UI_BOLD, fg_color=self.BG, border_color=self.BORDER, border_width=1, hover_color=self.CYBER_BLUE, command=self.toggle_sidebar).pack(side="right", padx=15, pady=10)

        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True)

        self.bg_canvas = ctk.CTkCanvas(self.main_container, bg=self.BG, highlightthickness=0)
        self.bg_canvas.place(relx=0, rely=0, relwidth=1, relheight=1)

        self.main_scroll = ctk.CTkScrollableFrame(self.main_container, fg_color="transparent")
        self.main_scroll.pack(fill="both", expand=True, padx=40, pady=20)
        self.main_scroll.lift() 

        self.dim_frame = ctk.CTkFrame(self.main_container, fg_color="#020202", corner_radius=0)
        ctk.CTkLabel(self.dim_frame, text="FOCUS MODE ACTIVE\nUse Side Panel", font=("Inter", 24, "bold"), text_color="#1A1A1A").place(relx=0.5, rely=0.5, anchor="center")

        self.build_ui() 
        self.build_sidebar()

    def load_data(self):
        if os.path.exists(DB_PATH):
            with open(DB_PATH, "r") as f: self.data = json.load(f)
        else:
            self.data = {"profile": {"name": "INITIATE", "title": "JEE Aspirant", "xp": 0, "arka": 0}, "history": {}}
        
        if "profile" not in self.data: self.data["profile"] = {"name": "INITIATE", "title": "JEE Aspirant", "xp": 0, "arka": 0}
        
        # --- SMRITI V2: "ATTEMPT TO BE PERFECT" HIERARCHY ---
        if "smriti_v2" not in self.data["profile"]:
            self.data["profile"]["smriti_v2"] = {}

        # --- MESOCYCLE V2: INDEPENDENT TABS & MULTI-STANDARDS ---
        default_meso = {
            "SLEEP": {"active": False, "start_date": "", "tabs": {"Wake up": {"standards": [], "logs": {}}, "Sleep": {"standards": [], "logs": {}}}},
            "HEALTH": {"active": False, "start_date": "", "tabs": {"Exercise": {"standards": [], "logs": {}}, "Meditation": {"standards": [], "logs": {}}, "Water": {"standards": [], "logs": {}}}},
            "LAPTOP": {"active": False, "start_date": "", "tabs": {"YouTube": {"standards": [], "logs": {}}, "Anime": {"standards": [], "logs": {}}, "Movies": {"standards": [], "logs": {}}, "News": {"standards": [], "logs": {}}, "WEBAPP": {"standards": [], "logs": {}}}},
            "DEVOTION": {"active": False, "start_date": "", "tabs": {"Ram Writing": {"standards": [], "logs": {}}, "God Prayer": {"standards": [], "logs": {}}, "Ram Jaap": {"standards": [], "logs": {}}}},
            "STUDY": {"active": False, "start_date": "", "tabs": {"Class": {"standards": [], "logs": {}}, "Self Study": {"standards": [], "logs": {}}, "Backlog": {"standards": [], "logs": {}}, "DPPs": {"standards": [], "logs": {}}}}
        }
        if "meso_v2" not in self.data["profile"]:
            self.data["profile"]["meso_v2"] = default_meso
        else:
            # Sync any newly added pillars or tabs into existing save files
            for pillar, p_val in default_meso.items():
                if pillar not in self.data["profile"]["meso_v2"]:
                    self.data["profile"]["meso_v2"][pillar] = p_val
                else:
                    for tab_name, t_val in p_val["tabs"].items():
                        if tab_name not in self.data["profile"]["meso_v2"][pillar]["tabs"]:
                            self.data["profile"]["meso_v2"][pillar]["tabs"][tab_name] = t_val

        # --- DRISHTI V2: ADVANCED BACKLOG HIERARCHY ---
        if "drishti_v2" not in self.data["profile"]:
            self.data["profile"]["drishti_v2"] = {"IOC": {}, "OC": {}, "PC": {}, "MATH": {}, "PHY": {}}
            # Legacy migration safety net
            old_bls = self.data["profile"].get("backlogs", [])
            if old_bls:
                self.data["profile"]["drishti_v2"]["PHY"]["LEGACY_BACKLOGS"] = old_bls
                self.data["profile"]["backlogs"] = []

        if "bank" not in self.data["profile"]: self.data["profile"]["bank"] = {}
        bank = self.data["profile"]["bank"]
        
        if "savings" not in bank: bank["savings"] = 0
        if "loan" not in bank: bank["loan"] = 0
        if "fixed_deposits" not in bank: bank["fixed_deposits"] = []
        if "trust" not in bank: bank["trust"] = {"active": False, "balance": 0, "strikes": 0}
        if "bonds" not in bank: bank["bonds"] = []
        
        if "stocks" not in bank:
            bank["stocks"] = {
                "PHYS": {"shares": 0, "price": 10, "last_studied": str(date.today())},
                "CHEM": {"shares": 0, "price": 10, "last_studied": str(date.today())},
                "MATH": {"shares": 0, "price": 10, "last_studied": str(date.today())}
            }
        else:
            for tck in ["PHYS", "CHEM", "MATH"]:
                if tck in bank["stocks"] and "last_studied" not in bank["stocks"][tck]:
                    bank["stocks"][tck]["last_studied"] = str(date.today())

        if "kalpa_vriksha" not in bank: bank["kalpa_vriksha"] = {"active": False, "principal": 0, "days_locked": 0, "target_days": 0}
        if "rin_mukti" not in bank: bank["rin_mukti"] = {"active": False, "debt": 0}
        if "vidya_options" not in bank: bank["vidya_options"] = []
        if "yajna" not in bank: bank["yajna"] = {"total_burned": 0}
        if "sannyasa_nidhi" not in bank: bank["sannyasa_nidhi"] = 0
        
        if "solar_charge" not in self.data["profile"]: self.data["profile"]["solar_charge"] = 0
        if "solar_ignited" not in self.data["profile"]: self.data["profile"]["solar_ignited"] = False
        if "sudarshan_grace" not in self.data["profile"]: self.data["profile"]["sudarshan_grace"] = False
        if "shani_freeze_until" not in self.data["profile"]: self.data["profile"]["shani_freeze_until"] = ""
        if "xp" not in self.data["profile"]: self.data["profile"]["xp"] = 0
        if "arka" not in self.data["profile"]: self.data["profile"]["arka"] = 0
        if "owned_items" not in self.data["profile"]: self.data["profile"]["owned_items"] = []
        if "inventory" not in self.data["profile"]: self.data["profile"]["inventory"] = {}
        if "active_tejas" not in self.data["profile"]: self.data["profile"]["active_tejas"] = "DEFAULT"
        if "backlogs" not in self.data["profile"]: self.data["profile"]["backlogs"] = []
        if "mistakes" not in self.data["profile"]: self.data["profile"]["mistakes"] = []
        if "prana" not in self.data["profile"]: self.data["profile"]["prana"] = 100
    
    def save_data_state(self):
        with open(DB_PATH, "w") as f: json.dump(self.data, f, indent=4)

    def get_var(self, key, default=""):
        if key not in self.vars:
            today_str = str(date.today())
            existing_val = self.data.get("history", {}).get(today_str, {}).get(key, default)
            var = ctk.StringVar(value=str(existing_val))
            var.trace_add("write", lambda *args: self.trigger_debounced_save())
            self.vars[key] = var
        return self.vars[key]

    def trigger_debounced_save(self):
        if self.save_timer is not None:
            self.after_cancel(self.save_timer)
        self.save_timer = self.after(1500, self.sync_data)

    def sync_data(self):
        today = str(date.today())
        if "history" not in self.data: self.data["history"] = {}
        if today not in self.data["history"]: self.data["history"][today] = {}
        current_log = {k: v.get() for k, v in self.vars.items() if v.get() != ""}
        self.data["history"][today].update(current_log)
        with open(DB_PATH, "w") as f: json.dump(self.data, f, indent=4)
        self.update_prana_ui()

    def update_prana_ui(self):
        if hasattr(self, 'p_bar') and self.p_bar.winfo_exists():
            current_prana = self.calculate_prana()
            self.p_bar.set(current_prana / 100.0)
            p_color = self.EMERALD if current_prana > 60 else (self.CYBER_BLUE if current_prana > 30 else "#ef4444")
            self.p_bar.configure(progress_color=p_color)
            if hasattr(self, 'p_lbl') and self.p_lbl.winfo_exists():
                self.p_lbl.configure(text=f"{current_prana}%", text_color=p_color)

    # --- LIVE UI FACTORY HELPERS ---
    def make_entry(self, parent, label_text, key):
        f = ctk.CTkFrame(parent, fg_color="transparent")
        f.pack(fill="x", pady=5)
        ctk.CTkLabel(f, text=label_text, font=("Inter", 12), text_color=self.TEXT_SEC, width=150, anchor="w").pack(side="left")
        ctk.CTkEntry(f, textvariable=self.get_var(key), fg_color=self.BG, border_color=self.BORDER).pack(side="left", fill="x", expand=True)

    def make_check(self, parent, label_text, key):
        chk = ctk.CTkCheckBox(parent, text=label_text, variable=self.get_var(key, "No"), onvalue="Yes", offvalue="No", 
                        text_color=self.TEXT_PRI, fg_color=self.CYBER_BLUE, hover_color=self.EMERALD)
        chk.pack(anchor="w", pady=5)
        return chk

    def make_dropdown(self, parent, label_text, key, options):
        f = ctk.CTkFrame(parent, fg_color="transparent")
        f.pack(fill="x", pady=5)
        ctk.CTkLabel(f, text=label_text, font=("Inter", 12), text_color=self.TEXT_SEC, width=150, anchor="w").pack(side="left")
        ctk.CTkOptionMenu(f, variable=self.get_var(key, options[0]), values=options, fg_color=self.BG, button_color=self.BORDER, button_hover_color=self.CYBER_BLUE).pack(side="left")

    def make_cond_radio(self, parent, label_text, key, trigger_val, text_label):
        main_f = ctk.CTkFrame(parent, fg_color="transparent")
        main_f.pack(fill="x", pady=5)
        lbl_f = ctk.CTkFrame(main_f, fg_color="transparent")
        lbl_f.pack(fill="x")
        ctk.CTkLabel(lbl_f, text=label_text, font=("Inter", 12), text_color=self.TEXT_SEC, width=200, anchor="w").pack(side="left")
        radio_var = self.get_var(key, "No")
        text_var = self.get_var(f"{key}_Notes", "")
        hidden_f = ctk.CTkFrame(main_f, fg_color="transparent")
        ctk.CTkLabel(hidden_f, text=text_label, font=("Inter", 10), text_color=self.CYBER_BLUE).pack(anchor="w")
        tb = ctk.CTkTextbox(hidden_f, height=80, fg_color=self.BG, border_color=self.BORDER, border_width=1)
        tb.pack(fill="x", pady=2)
        tb.insert("1.0", text_var.get())
        tb.bind("<KeyRelease>", lambda e: text_var.set(tb.get("1.0", "end-1c")))
        
        def check_cond():
            if radio_var.get() == trigger_val: hidden_f.pack(fill="x", pady=5)
            else: hidden_f.pack_forget()
        ctk.CTkRadioButton(lbl_f, text="Yes", variable=radio_var, value="Yes", command=check_cond, fg_color=self.CYBER_BLUE).pack(side="left", padx=10)
        ctk.CTkRadioButton(lbl_f, text="No", variable=radio_var, value="No", command=check_cond, fg_color=self.CYBER_BLUE).pack(side="left")
        check_cond()

    def make_any_radio(self, parent, label_text, key, options, text_label):
        main_f = ctk.CTkFrame(parent, fg_color="transparent")
        main_f.pack(fill="x", pady=10)
        lbl_f = ctk.CTkFrame(main_f, fg_color="transparent")
        lbl_f.pack(fill="x")
        ctk.CTkLabel(lbl_f, text=label_text, font=self.UI_BOLD, text_color=self.TEXT_PRI, width=220, anchor="w").pack(side="left")
        radio_var = self.get_var(key, "None")
        text_var = self.get_var(f"{key}_Notes", "")
        hidden_f = ctk.CTkFrame(main_f, fg_color="transparent")
        ctk.CTkLabel(hidden_f, text=text_label, font=self.UI_FONT, text_color=self.CYBER_BLUE).pack(anchor="w")
        tb = ctk.CTkTextbox(hidden_f, height=80, fg_color=self.BG, border_color=self.BORDER, border_width=1)
        tb.pack(fill="x", pady=2)
        tb.insert("1.0", text_var.get())
        tb.bind("<KeyRelease>", lambda e: text_var.set(tb.get("1.0", "end-1c")))
        
        def check_visibility():
            if radio_var.get() != "None": hidden_f.pack(fill="x", pady=5)
            else: hidden_f.pack_forget()
        for opt in options:
            ctk.CTkRadioButton(lbl_f, text=opt, variable=radio_var, value=opt, command=check_visibility, fg_color=self.CYBER_BLUE).pack(side="left", padx=10)
        check_visibility() 

    def calculate_prana(self):
        prana = 100
        today_str = str(date.today())
        def fetch(key, default):
            if key in self.vars:
                val = self.vars[key].get()
                if val != "": return val
            return self.data.get("history", {}).get(today_str, {}).get(key, default)

        sleep_hrs = fetch("Sleep_Hours", "7")
        if str(sleep_hrs).isdigit():
            hrs = int(sleep_hrs)
            if hrs < 6: prana -= 20
            elif hrs > 8: prana += 5
            
        if fetch("Ex_Med", "No") == "Yes": prana += 10
        if fetch("Laptop_Waste", "No") == "Yes": prana -= 15
        
        study_hrs = fetch("Study_TotalHrs", "0")
        if str(study_hrs).isdigit():
            if int(study_hrs) > 10: prana -= 15
            
        soma_used = int(fetch("Soma_Used_Today", 0))
        prana += (soma_used * 30)

        if fetch("Mrityunjaya_Active", "No") == "Yes": return 100
        return max(0, min(100, prana))

    def consume_soma(self):
        if self.data["profile"].get("inventory", {}).get("Soma-Rasa", 0) > 0:
            self.data["profile"]["inventory"]["Soma-Rasa"] -= 1
            today_str = str(date.today())
            if today_str not in self.data["history"]: self.data["history"][today_str] = {}
            self.data["history"][today_str]["Soma_Used_Today"] = self.data["history"][today_str].get("Soma_Used_Today", 0) + 1
            self.save_data_state()
            msg.showinfo("SOMA CONSUMED", "Prana restored. Keep grinding.")
            self.go_to_dashboard()

    def consume_vishrama(self):
        if msg.askyesno("VISHRAMA-MUDRA", "Activate Sanctioned Rest?\nYour streak will freeze safely, and all penalties for today are canceled."):
            self.data["profile"]["inventory"]["Vishrama-Mudra"] -= 1
            today_str = str(date.today())
            if today_str not in self.data["history"]: self.data["history"][today_str] = {}
            self.data["history"][today_str]["Vishrama_Active"] = "Yes"
            self.save_data_state()
            msg.showinfo("REST GRANTED", "Vishrama-Mudra active. You are officially off duty today.")
            self.go_to_dashboard()

    def consume_sanjeevani(self):
        yesterday_str = str(date.today() - timedelta(days=1))
        if yesterday_str not in self.data.get("history", {}):
            msg.showwarning("DENIED", "No log found for yesterday to resurrect.")
            return
            
        if msg.askyesno("SANJEEVANI PROTOCOL", "Consume Sanjeevani to rewrite yesterday's failures into successes?"):
            self.data["profile"]["inventory"]["Sanjeevani"] -= 1
            y_log = self.data["history"][yesterday_str]
            y_log["Study_Achieved"] = "Yes"
            y_log["Laptop_Waste"] = "No"
            y_log["Laptop_Delayed"] = "Yes"
            y_log["Sleep_WokeEarly"] = "Yes"
            y_log["Ex_Done"] = "Yes"
            self.data["profile"]["arka"] += 200
            self.data["profile"]["xp"] += 100
            self.save_data_state()
            msg.showinfo("RESURRECTED", "Yesterday's timeline has been overwritten. Graph restored.")
            self.go_to_dashboard()
    
    def consume_mrityunjaya(self):
        if msg.askyesno("MRITYUNJAYA PROTOCOL", "Initiate Total Resurrection?\nThis will heal Prana to 100%, wipe all of today's penalties, and grant a 5x Multiplier."):
            self.data["profile"]["inventory"]["Mrityunjaya"] -= 1
            today_str = str(date.today())
            if today_str not in self.data["history"]: self.data["history"][today_str] = {}
            log = self.data["history"][today_str]
            log["Mrityunjaya_Active"] = "Yes"
            log["Laptop_Waste"] = "No"
            log["Laptop_Anime"] = "No"
            log["AFAC_Used"] = "Yes" 
            self.save_data_state()
            msg.showinfo("RESURRECTED", "Mrityunjaya active. You are invincible today. Get to work.")
            self.go_to_dashboard()

    def get_rank_info(self):
        xp = self.data["profile"].get("xp", 0)
        current_rank = "JIGYASU"
        next_rank = "VIDYARTHI"
        next_xp = 1000
        prev_xp = 0
        for i in range(len(RANK_THRESHOLDS)):
            if xp >= RANK_THRESHOLDS[i][0]:
                current_rank = RANK_THRESHOLDS[i][1]
                prev_xp = RANK_THRESHOLDS[i][0]
                if i + 1 < len(RANK_THRESHOLDS):
                    next_rank = RANK_THRESHOLDS[i+1][1]
                    next_xp = RANK_THRESHOLDS[i+1][0]
                else:
                    next_rank = "MAX RANK"
                    next_xp = RANK_THRESHOLDS[i][0]
            else: break
        return current_rank, prev_xp, next_rank, next_xp

    def equip_tejas(self, theme_name):
        if theme_name in self.data["profile"].get("owned_items", []):
            self.data["profile"]["active_tejas"] = theme_name
            self.save_data_state()
            msg.showinfo("TEJAS EQUIPPED", f"[{theme_name}] Aura is now locked in.\n\nSYSTEM REBOOT REQUIRED.\nPlease close and restart the app.")
        else:
            msg.showerror("UNAUTHORIZED", "You have not manifested this Aura yet. Earn more Arka.")

    def clear_main_view(self):
        for widget in self.main_scroll.winfo_children(): widget.destroy()

    def go_to_dashboard(self):
        self.clear_main_view()
        # Restores the Top Bar perfectly at the top when you return
        self.top_bar.pack(fill="x", side="top", before=self.main_container)
        self.build_ui() 

    def prepare_view(self, title_text, color=None):
        self.clear_main_view()
        # 🚨 ERASES THE TOP BAR when entering any sub-module for deep focus
        self.top_bar.pack_forget()
        
        if color is None: color = self.CYBER_BLUE
        
        nav_f = ctk.CTkFrame(self.main_scroll, fg_color="transparent")
        nav_f.pack(fill="x", pady=(0, 20))
        ctk.CTkButton(nav_f, text="← BACK TO DASHBOARD", width=150, height=32,
                     fg_color="transparent", border_width=1, border_color=self.BORDER,
                     font=self.UI_FONT, command=self.go_to_dashboard).pack(side="left")
        
        ctk.CTkLabel(self.main_scroll, text=title_text.upper(), font=("Inter", 24, "bold"), text_color=color).pack(anchor="w", pady=(0, 20))
        return self.main_scroll

    # --- CORE UI ---
    def build_ui(self):
        ctk.CTkLabel(self.main_scroll, text="           T    H    E           C    O    M    E    B    A    C    K", font=self.HEAD_FONT, text_color=self.TEXT_PRI).pack(anchor="center", pady=(0, 5))
        
        current_prana = self.calculate_prana()
        p_color = self.EMERALD if current_prana > 60 else (self.CYBER_BLUE if current_prana > 30 else "#ef4444")
        
        prana_f = ctk.CTkFrame(self.main_scroll, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, height=130)
        prana_f.pack_propagate(False)
        prana_f.pack(fill="x", pady=10)
        
        self.p_bar = ctk.CTkProgressBar(prana_f, progress_color=p_color, fg_color=self.BG, height=8)
        self.p_bar.pack(side="bottom", fill="x", padx=20, pady=(0, 20))
        self.p_bar.set(current_prana / 100.0)

        lbl_f = ctk.CTkFrame(prana_f, fg_color="transparent")
        lbl_f.pack(side="top", fill="x", padx=20, pady=(20, 0))
        ctk.CTkLabel(lbl_f, text="PRANA (MENTAL FATIGUE LEVEL)", font=("Inter", 10, "bold"), text_color=self.TEXT_SEC).pack(side="left")
        
        inv = self.data["profile"].get("inventory", {})
        btn_box = ctk.CTkFrame(lbl_f, fg_color="transparent")
        btn_box.pack(side="left", padx=20)

        if inv.get("Soma-Rasa", 0) > 0: ctk.CTkButton(btn_box, text=f"SOMA ({inv['Soma-Rasa']})", fg_color="#8b5cf6", hover_color="#7c3aed", height=20, width=80, command=self.consume_soma).pack(side="left", padx=5)
        if inv.get("Vishrama-Mudra", 0) > 0: ctk.CTkButton(btn_box, text=f"VISHRAMA ({inv['Vishrama-Mudra']})", fg_color="#3b82f6", hover_color="#2563eb", height=20, width=90, command=self.consume_vishrama).pack(side="left", padx=5)
        if inv.get("Sanjeevani", 0) > 0: ctk.CTkButton(btn_box, text=f"SANJEEVANI ({inv['Sanjeevani']})", fg_color="#10b981", hover_color="#059669", height=20, width=90, command=self.consume_sanjeevani).pack(side="left", padx=5)
        if inv.get("Mrityunjaya", 0) > 0: ctk.CTkButton(btn_box, text=f"MRITYUNJAYA ({inv['Mrityunjaya']})", fg_color="#ef4444", hover_color="#b91c1c", height=20, width=110, command=self.consume_mrityunjaya).pack(side="left", padx=5)
            
        self.p_lbl = ctk.CTkLabel(lbl_f, text=f"{current_prana}%", font=("Inter", 12, "bold"), text_color=p_color)
        self.p_lbl.pack(side="right")

        stats_frame = ctk.CTkFrame(self.main_scroll, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=15)
        stats_frame.pack(fill="x", pady=10)
        
        streak_lbl = ctk.CTkLabel(stats_frame, text=f"CURRENT STREAK: {self.calculate_streak()} DAYS", font=("Inter", 18, "bold"), text_color=self.EMERALD)
        streak_lbl.pack(pady=(15, 5))
        
        # Dynamically fetch current month's max days
        today = date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        month_name = today.strftime("%B").upper()
        
        ctk.CTkLabel(stats_frame, text=f"{month_name} COMBAT REPORT ({days_in_month} DAYS - Discipline / 10)", font=("Inter", 12, "bold"), text_color=self.TEXT_SEC).pack()
        self.canvas = ctk.CTkCanvas(stats_frame, bg=self.PANEL, highlightthickness=0, height=320)
        self.canvas.pack(fill="both", expand=True, padx=20, pady=15)
        
        # This tells the graph to flawlessly recalculate its width and redraw whenever the window loads or resizes
        self.canvas.bind("<Configure>", lambda e: self.draw_authentic_graph())

        routine_frame = ctk.CTkFrame(self.main_scroll, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=15)
        routine_frame.pack(fill="x", pady=10)
        ctk.CTkLabel(routine_frame, text="QUICK DAILY ROUTINE", font=("Inter", 16, "bold"), text_color=self.TEXT_PRI).pack(anchor="w", padx=20, pady=(15, 10))

        grid_f = ctk.CTkFrame(routine_frame, fg_color="transparent")
        grid_f.pack(fill="x", padx=20, pady=10)
        
        core_habits = [
            ("Meditation", "Ex_Med"), ("3L Water Consumed", "Eye_Water"), 
            ("Body Moved (Exercise)", "Ex_Done"), ("Study Target Met", "Study_Achieved"), 
            ("Eye Protection Used", "Eye_Darkroom"), ("Woke Up Early", "Sleep_WokeEarly")
        ]
        
        for i, (label, key) in enumerate(core_habits):
            var = self.get_var(key, "No")
            chk = ctk.CTkCheckBox(grid_f, text=label, variable=var, onvalue="Yes", offvalue="No", 
                                 font=self.UI_FONT, text_color=self.TEXT_PRI, fg_color=self.CYBER_BLUE, 
                                 hover_color=self.EMERALD, corner_radius=5)
            chk.grid(row=i//2, column=i%2, padx=10, pady=10, sticky="w")

        self.sig_pad = SignaturePad(self.main_scroll)
        self.sig_pad.pack(fill="x", pady=(15, 20))
        
        ctk.CTkButton(self.main_scroll, text="PROCEED TO LOCK & PLAN TOMORROW", 
                     font=self.UI_BOLD, fg_color=self.CYBER_BLUE, height=50, 
                     command=lambda: [self.sig_pad.save(), self.open_tomorrow_planning()]).pack(fill="x", padx=40, pady=(0, 20))

    def build_sidebar(self):
        if hasattr(self, 'sidebar') and self.sidebar.winfo_exists():
            self.sidebar.destroy()

        self.sidebar = ctk.CTkFrame(self, width=250, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=0)
        self.sidebar_visible = False

        ctk.CTkLabel(self.sidebar, text="DATA TERMINALS", font=("Inter", 14, "bold"), text_color=self.TEXT_SEC).pack(pady=(30, 10), padx=20, anchor="w")

        menus = [
            ("📚 Study", self.open_study), ("💻 Laptop Discipline", self.open_laptop), 
            ("🌙 Sleep", self.open_sleep), ("⚔️ Health", self.open_health), 
            ("🧠 Mindset", self.open_mindset), ("🙏 Devotion", self.open_devotion),
            ("⚠️ AFAC RULE", self.open_afac)
        ]
        for text, cmd in menus:
            btn = ctk.CTkButton(self.sidebar, text=text, font=self.UI_FONT, fg_color="transparent", text_color=self.TEXT_PRI, hover_color="#1A1A1A", anchor="w", height=35, command=lambda c=cmd: [c(), self.toggle_sidebar()])
            btn.pack(fill="x", padx=10, pady=2)

        now = datetime.datetime.now()
        if "Brahma-Muhurta" in self.data["profile"].get("owned_items", []):
            if 3 <= now.hour < 7: 
                bm_btn = ctk.CTkButton(self.sidebar, text="🌅 DAWN CONQUEST", font=self.UI_BOLD, fg_color="#fbbf24", text_color="#000000", hover_color="#f59e0b", height=40, command=lambda: [self.open_brahma_muhurta(), self.toggle_sidebar()])
                bm_btn.pack(fill="x", padx=10, pady=(20, 2))  

        ctk.CTkLabel(self.sidebar, text="HARDCORE ENGINES", font=("Inter", 14, "bold"), text_color="#ef4444").pack(pady=(20, 10), padx=20, anchor="w")
        engines = [
            ("⏳ THE CHAKRAVYUH", self.open_chakravyuh),
            ("🎯 DRISHTI V2 (Backlogs)", self.open_drishti),
            ("🧠 SMRITI (Mistakes)", self.open_smriti),
            ("🏦 KUBERA'S VAULT", self.open_bank), 
            ("🚨 DHARMA-SANKAT", self.open_dharma_sankat),
            ("🛡️ THE ARMORY", self.secure_open_armory)
        ]
        for text, cmd in engines:
            btn = ctk.CTkButton(self.sidebar, text=text, font=self.UI_BOLD, fg_color="transparent", text_color=self.TEXT_PRI, hover_color="#1A1A1A", anchor="w", height=35, command=lambda c=cmd: [c(), self.toggle_sidebar()])
            btn.pack(fill="x", padx=10, pady=2)
            
    def schedule_presence_check(self):
        if not getattr(self, 'c_timer_running', False): return
        delay_ms = random.randint(300, 900) * 1000 
        self.lr_job = self.after(delay_ms, self.trigger_presence_check)

    def trigger_presence_check(self):
        if not getattr(self, 'c_timer_running', False): return
        self.lr_window = ctk.CTkToplevel(self)
        self.lr_window.attributes("-topmost", True)
        self.lr_window.geometry("450x200")
        self.lr_window.title("LAKSHMAN-REKHA")
        self.lr_window.update_idletasks()
        x = (self.lr_window.winfo_screenwidth() // 2) - (450 // 2)
        y = (self.lr_window.winfo_screenheight() // 2) - (200 // 2)
        self.lr_window.geometry(f"+{x}+{y}")
        ctk.CTkLabel(self.lr_window, text="⚠️ PRESENCE CHECK ⚠️", font=("Inter", 20, "bold"), text_color="#ef4444").pack(pady=(20, 10))
        ctk.CTkLabel(self.lr_window, text="Prove you are still locked in. You have 15 seconds.", font=("Inter", 12)).pack()
        self.lr_clicked = False
        def passed():
            self.lr_clicked = True
            self.lr_window.destroy()
            if hasattr(self, 'lr_death_job'): self.after_cancel(self.lr_death_job)
            self.schedule_presence_check() 
        ctk.CTkButton(self.lr_window, text="I AM PRESENT", font=("Inter", 14, "bold"), fg_color=self.EMERALD, height=40, command=passed).pack(pady=20)
        self.lr_death_job = self.after(15000, self.enforce_presence_check)
        
    def enforce_presence_check(self):
        if hasattr(self, 'lr_window') and self.lr_window.winfo_exists():
            if not getattr(self, 'lr_clicked', False):
                self.lr_window.destroy()
                msg.showerror("LAKSHMAN-REKHA BROKEN", "Presence Check Failed. You drifted.\nAutomatic Surrender Initiated.")
                self.surrender_chakravyuh()

    def toggle_sidebar(self):
        if self.sidebar_visible:
            self.sidebar.place_forget()
            self.dim_frame.place_forget()
            self.sidebar_visible = False
        else:
            self.dim_frame.place(relx=0, rely=0, relwidth=1, relheight=1)
            self.sidebar.place(relx=1.0, x=-250, y=60, relheight=1)
            self.sidebar.lift()
            self.sidebar_visible = True

    # ==========================================
    # HARDCORE ENGINES & CHAKRAVYUH
    # ==========================================
    def open_brahma_muhurta(self):
        p = self.prepare_view("THE CREATOR'S HOUR", color="#fbbf24")
        ctk.CTkLabel(p, text="The world is asleep. You are awake. Name your conquest.", font=("Inter", 16, "bold"), text_color=self.TEXT_SEC).pack(pady=(0, 20))
        f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color="#fbbf24", border_width=2)
        f.pack(fill="x", padx=40, pady=10, ipadx=20, ipady=20)
        ctk.CTkLabel(f, text="DAWN TARGET:", font=("Inter", 12, "bold"), text_color="#fbbf24").pack(pady=5)
        bm_var = ctk.StringVar()
        ctk.CTkEntry(f, textvariable=bm_var, width=500, font=("Inter", 14), placeholder_text="e.g., 50 Advanced Calculus Questions...").pack(pady=10)
        def lock_bm():
            if not bm_var.get().strip(): return
            self.data["profile"]["bm_active_target"] = bm_var.get().strip()
            self.save_data_state()
            msg.showinfo("LOCKED", "Dawn Conquest Locked.\nEnter the Chakravyuh and survive before 7:00 AM to claim 2,000 ARKA.")
            self.go_to_dashboard()
        ctk.CTkButton(f, text="LOCK MISSION & ENTER THE GRID", font=self.UI_BOLD, fg_color="#fbbf24", text_color="#000000", hover_color="#f59e0b", height=50, command=lock_bm).pack(pady=20)
        active = self.data["profile"].get("bm_active_target", "")
        if active:
            ctk.CTkLabel(p, text=f"ACTIVE DAWN CONQUEST: {active}", font=("Inter", 18, "bold"), text_color=self.EMERALD).pack(pady=30)
            def claim_bm():
                import datetime
                if datetime.datetime.now().hour >= 7:
                    msg.showerror("TOO LATE", "The sun has risen. The Creator's Hour is over. Target failed.")
                else:
                    self.data["profile"]["arka"] += 2000
                    msg.showinfo("VICTORY", "Dawn Conquest Complete. +2,000 ARKA deposited.")
                self.data["profile"]["bm_active_target"] = ""
                self.save_data_state()
                self.go_to_dashboard()
            ctk.CTkButton(p, text="I HAVE COMPLETED IT (CLAIM 2000 ARKA)", font=self.UI_BOLD, fg_color=self.EMERALD, height=50, command=claim_bm).pack()

    def open_chakravyuh(self):
        p = self.prepare_view("The Chakravyuh")
        ctk.CTkLabel(p, text="WARNING: ABSOLUTE LOCKDOWN PROTOCOL", font=("Inter", 16, "bold"), text_color="#ef4444").pack(pady=(0, 20))
        f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
        f.pack(fill="x", padx=40, pady=10, ipadx=20, ipady=20)
        ctk.CTkLabel(f, text="SET DEEP WORK DURATION", font=("Inter", 12, "bold"), text_color=self.CYBER_BLUE).pack(pady=(10, 5))
        time_var = ctk.StringVar(value="25 Minutes")
        ctk.CTkOptionMenu(f, variable=time_var, values=["10 Minutes", "25 Minutes", "50 Minutes", "90 Minutes", "120 Minutes"], fg_color=self.BG, button_color=self.BORDER, width=200).pack(pady=10)
        ctk.CTkLabel(f, text="DEFINE THE MISSION", font=("Inter", 12, "bold"), text_color=self.CYBER_BLUE).pack(pady=(20, 5))
        mission_var = ctk.StringVar()
        ctk.CTkEntry(f, textvariable=mission_var, width=400, placeholder_text="e.g., HCV Physics Chapter 5 - 20 Questions", fg_color=self.BG).pack(pady=10)
        ctk.CTkLabel(f, text="RULES: Surviving = +200 Arka. Surrendering = -500 Arka. Full screen locked.", font=("Inter", 11), text_color=self.TEXT_SEC).pack(pady=20)
        ctk.CTkButton(f, text="ENTER THE CHAKRAVYUH", font=self.UI_BOLD, fg_color="#ef4444", hover_color="#b91c1c", height=50, width=300, command=lambda: self.start_chakravyuh(time_var.get(), mission_var.get())).pack(pady=10)

    def start_chakravyuh(self, time_str, mission):
        if not mission.strip():
            msg.showwarning("DENIED", "You cannot enter the grid without a mission.")
            return
        self.c_minutes = int(time_str.split()[0])
        self.c_seconds = self.c_minutes * 60
        self.c_timer_running = True
        try: self.state('zoomed')
        except: self.attributes('-zoomed', True)
        self.main_scroll.pack_forget()
        self.c_frame = ctk.CTkFrame(self.main_container, fg_color=self.BG)
        self.c_frame.pack(expand=True, fill="both")
        center_f = ctk.CTkFrame(self.c_frame, fg_color="transparent")
        center_f.place(relx=0.5, rely=0.5, anchor="center")
        ctk.CTkLabel(center_f, text="MISSION ACTIVE", font=("Inter", 24, "bold"), text_color=self.CYBER_BLUE).pack()
        ctk.CTkLabel(center_f, text=mission.upper(), font=("Inter", 36, "bold"), text_color=self.TEXT_PRI, wraplength=800).pack(pady=(10, 40))
        self.c_timer_label = ctk.CTkLabel(center_f, text="", font=("Inter", 120, "bold"), text_color="#fbbf24")
        self.c_timer_label.pack(pady=20)
        ctk.CTkButton(center_f, text="SURRENDER (-500 ARKA)", font=("Inter", 14, "bold"), fg_color="#ef4444", hover_color="#b91c1c", width=200, height=40, command=self.surrender_chakravyuh).pack(pady=60)
        if "Lakshman-Rekha" in self.data["profile"].get("owned_items", []):
            self.schedule_presence_check()
        self.update_timer() 

    def surrender_chakravyuh(self):
        if msg.askyesno("SURRENDER?", "Are you sure you want to break focus?\nPenalty: -500 Arka."):
            self.c_timer_running = False
            if hasattr(self, 'c_frame'): self.c_frame.destroy()
            self.main_scroll.pack(fill="both", expand=True, padx=40, pady=20)
            self.data["profile"]["arka"] = max(0, self.data["profile"]["arka"] - 500)
            self.save_data_state()
            msg.showerror("FAILURE", "Focus Broken. Penalty Applied.")
            self.go_to_dashboard()    

    def update_timer(self):
        if not self.c_timer_running: return
        mins, secs = divmod(self.c_seconds, 60)
        self.c_timer_label.configure(text='{:02d}:{:02d}'.format(mins, secs))
        if self.c_seconds > 0:
            self.c_seconds -= 1
            self.after(1000, self.update_timer)
        else: self.complete_chakravyuh()

    def complete_chakravyuh(self):
        self.c_timer_running = False
        if hasattr(self, 'lr_job'): self.after_cancel(self.lr_job)
        if hasattr(self, 'lr_death_job'): self.after_cancel(self.lr_death_job)
        if hasattr(self, 'lr_window') and self.lr_window.winfo_exists(): self.lr_window.destroy()
        if hasattr(self, 'c_frame'): self.c_frame.destroy()
        self.main_scroll.pack(fill="both", expand=True, padx=40, pady=20)
        base_arka = 200
        now = datetime.datetime.now()
        if now.hour < 7 and "Brahma-Muhurta" in self.data["profile"].get("owned_items", []):
            base_arka *= 3
            msg.showinfo("BRAHMA-MUHURTA ACTIVE", "Creator's Hour recognized.\n3x Payout Applied.")
        self.data["profile"]["arka"] += base_arka
        self.data["profile"]["xp"] += 100
        self.save_data_state()
        msg.showinfo("MISSION ACCOMPLISHED", f"You survived the Chakravyuh.\n+{base_arka} Arka | +100 XP")
        self.go_to_dashboard()

    # ==========================================
    # DRISHTI V2: ADVANCED HIERARCHICAL BACKLOGS
    # ==========================================
    def open_drishti(self):
        p = self.prepare_view("DRISHTI: The Backlog Annihilator")
        ctk.CTkLabel(p, text="Select a domain to isolate and destroy backlogs.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0,20))

        subjects = ["IOC", "OC", "PC", "MATH", "PHY"]
        grid_f = ctk.CTkFrame(p, fg_color="transparent")
        grid_f.pack(fill="both", expand=True, padx=20)

        for i, subj in enumerate(subjects):
            b_count = sum(len(topics) for topics in self.data["profile"]["drishti_v2"].get(subj, {}).values())
            card = ctk.CTkFrame(grid_f, fg_color=self.PANEL, border_color=self.BORDER, border_width=2, corner_radius=15)
            card.grid(row=i//2, column=i%2, padx=10, pady=10, sticky="nsew")
            grid_f.grid_columnconfigure(i%2, weight=1)

            ctk.CTkLabel(card, text=subj, font=("Inter", 24, "bold"), text_color=self.CYBER_BLUE).pack(pady=(20, 5))
            ctk.CTkLabel(card, text=f"Active Targets: {b_count}", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0, 20))
            ctk.CTkButton(card, text="ENTER DOMAIN", fg_color="transparent", border_color=self.EMERALD, border_width=1, hover_color=self.EMERALD, command=lambda s=subj: self.open_drishti_subject(s)).pack(pady=(0, 20))

    def open_drishti_subject(self, subj):
        p = self.prepare_view(f"DRISHTI DOMAIN: {subj}")
        ctk.CTkLabel(p, text="Identify the chapters harboring your weakness.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0,20))

        add_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
        add_f.pack(fill="x", pady=10, ipadx=10, ipady=10)

        new_chap = ctk.StringVar()
        ctk.CTkEntry(add_f, textvariable=new_chap, width=400, placeholder_text="Enter new chapter name...").pack(side="left", padx=10)

        def add_chapter():
            c_name = new_chap.get().strip()
            if c_name:
                if c_name not in self.data["profile"]["drishti_v2"][subj]:
                    self.data["profile"]["drishti_v2"][subj][c_name] = []
                    self.save_data_state()
                    self.open_drishti_subject(subj)
                else:
                    msg.showwarning("EXISTS", "Chapter already exists in this domain.")

        ctk.CTkButton(add_f, text="LOG NEW CHAPTER", fg_color=self.CYBER_BLUE, command=add_chapter).pack(side="left", padx=10)

        list_f = ctk.CTkScrollableFrame(p, fg_color="transparent", height=400)
        list_f.pack(fill="both", expand=True)

        chapters = self.data["profile"]["drishti_v2"].get(subj, {})
        if not chapters:
            ctk.CTkLabel(list_f, text="NO CHAPTERS LOGGED. DOMAIN SECURE.", font=self.SUB_FONT, text_color=self.EMERALD).pack(pady=50)
            return

        for chap, topics in chapters.items():
            f = ctk.CTkFrame(list_f, fg_color=self.PANEL, border_color="#fbbf24", border_width=1)
            f.pack(fill="x", pady=5)
            info_f = ctk.CTkFrame(f, fg_color="transparent")
            info_f.pack(side="left", padx=15, pady=15)
            ctk.CTkLabel(info_f, text=chap.upper(), font=("Inter", 16, "bold")).pack(anchor="w")
            ctk.CTkLabel(info_f, text=f"Backlogged Topics: {len(topics)}", font=("Inter", 11), text_color=self.TEXT_SEC).pack(anchor="w")
            ctk.CTkButton(f, text="OPEN CHAPTER", fg_color="transparent", border_width=1, border_color=self.CYBER_BLUE, text_color=self.CYBER_BLUE, command=lambda c=chap: self.open_drishti_chapter(subj, c)).pack(side="right", padx=15)

    def open_drishti_chapter(self, subj, chap):
        p = self.prepare_view(f"TARGET: {chap} ({subj})")
        ctk.CTkLabel(p, text="The longer they survive, the more they pay when killed.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0,20))

        add_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
        add_f.pack(fill="x", pady=10, ipadx=10, ipady=10)

        new_topic = ctk.StringVar()
        ctk.CTkEntry(add_f, textvariable=new_topic, width=400, placeholder_text="Enter specific backlog topic...").pack(side="left", padx=10)

        def add_topic():
            t_name = new_topic.get().strip()
            if t_name:
                self.data["profile"]["drishti_v2"][subj][chap].append({"topic": t_name, "days": 0, "bounty": 100})
                self.save_data_state()
                self.open_drishti_chapter(subj, chap)

        ctk.CTkButton(add_f, text="LOCK TARGET", fg_color="#ef4444", command=add_topic).pack(side="left", padx=10)

        list_f = ctk.CTkScrollableFrame(p, fg_color="transparent", height=400)
        list_f.pack(fill="both", expand=True)

        topics = self.data["profile"]["drishti_v2"][subj][chap]
        if not topics:
            ctk.CTkLabel(list_f, text="NO ACTIVE BACKLOGS HERE. GRID IS CLEAR.", font=self.SUB_FONT, text_color=self.EMERALD).pack(pady=50)
            return

        for i, t in enumerate(topics):
            f = ctk.CTkFrame(list_f, fg_color=self.PANEL, border_color="#ef4444", border_width=1)
            f.pack(fill="x", pady=5)
            info_f = ctk.CTkFrame(f, fg_color="transparent")
            info_f.pack(side="left", padx=15, pady=10)
            ctk.CTkLabel(info_f, text=t["topic"].upper(), font=("Inter", 14, "bold")).pack(anchor="w")
            ctk.CTkLabel(info_f, text=f"Active for: {t.get('days', 0)} Days  |  Bounty: {t.get('bounty', 100)} Arka", font=("Inter", 11), text_color="#fbbf24").pack(anchor="w")

            def kill_backlog(idx=i, reward=t.get('bounty', 100)):
                self.data["profile"]["arka"] += reward
                self.data["profile"]["drishti_v2"][subj][chap].pop(idx)
                self.save_data_state()
                msg.showinfo("TARGET ANNIHILATED", f"Backlog cleared. Bounty Claimed: +{reward} Arka.")
                self.open_drishti_chapter(subj, chap)

            ctk.CTkButton(f, text="ANNIHILATE", fg_color="#ef4444", hover_color="#b91c1c", command=kill_backlog).pack(side="right", padx=15)

    def open_smriti(self):
        p = self.prepare_view("SMRITI: THE PURSUIT OF PERFECTION")
        ctk.CTkLabel(p, text="Log your 'Attempts to be Perfect' (e.g., Mock Tests, Practice Sessions).", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0,20))

        add_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
        add_f.pack(fill="x", pady=10, ipadx=10, ipady=10)

        # 🚨 ABSOLUTE FIX 1: Bind variable permanently to 'self' so Python cannot delete it
        self.new_attempt_var = ctk.StringVar()
        ctk.CTkEntry(add_f, textvariable=self.new_attempt_var, width=400, placeholder_text="Name of the Attempt (e.g., Mock Test 4, HCV Ch 5)...").pack(side="left", padx=10)

        def add_attempt():
            a_name = self.new_attempt_var.get().strip()
            if a_name:
                # 🚨 ABSOLUTE FIX 2: Silent Failsafe patch in case 'load_data' missed creating the folder
                if "smriti_v2" not in self.data["profile"]:
                    self.data["profile"]["smriti_v2"] = {}
                    
                if a_name not in self.data["profile"]["smriti_v2"]:
                    self.data["profile"]["smriti_v2"][a_name] = []
                    self.save_data_state()
                    self.open_smriti()
                else:
                    msg.showwarning("EXISTS", "This attempt name already exists.")

        ctk.CTkButton(add_f, text="CREATE ATTEMPT", fg_color="#8b5cf6", hover_color="#7c3aed", command=add_attempt).pack(side="left", padx=10)

        list_f = ctk.CTkScrollableFrame(p, fg_color="transparent", height=500)
        list_f.pack(fill="both", expand=True)

        attempts = self.data["profile"].get("smriti_v2", {})
        if not attempts:
            ctk.CTkLabel(list_f, text="NO ATTEMPTS RECORDED.", font=self.SUB_FONT, text_color=self.TEXT_SEC).pack(pady=50)
            return

        for a_name, m_list in reversed(list(attempts.items())):
            f = ctk.CTkFrame(list_f, fg_color=self.PANEL, border_color="#8b5cf6", border_width=1)
            f.pack(fill="x", pady=5)
            
            info_f = ctk.CTkFrame(f, fg_color="transparent")
            info_f.pack(side="left", padx=15, pady=15)
            ctk.CTkLabel(info_f, text=a_name.upper(), font=("Inter", 16, "bold")).pack(anchor="w")
            ctk.CTkLabel(info_f, text=f"Mistakes Logged: {len(m_list)}", font=("Inter", 11), text_color=self.TEXT_SEC).pack(anchor="w")

            ctk.CTkButton(f, text="OPEN VAULT", fg_color="transparent", border_width=1, border_color="#8b5cf6", text_color="#8b5cf6", hover_color="#2d1b4e", command=lambda n=a_name: self.open_smriti_attempt(n)).pack(side="right", padx=15)

    def open_smriti_attempt(self, attempt_name):
        p = self.prepare_view(f"SMRITI: {attempt_name}", color="#8b5cf6")
        ctk.CTkLabel(p, text="Log specific concept failures here. The Oracle is watching.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0,20))

        add_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
        add_f.pack(fill="x", pady=10, ipadx=10, ipady=10)

        # 🚨 ABSOLUTE FIX 1: Bind permanently to 'self'
        self.smriti_topic_var = ctk.StringVar()
        self.smriti_mistake_var = ctk.StringVar()

        ctk.CTkEntry(add_f, textvariable=self.smriti_topic_var, width=200, placeholder_text="Concept/Topic").pack(side="left", padx=10)
        ctk.CTkEntry(add_f, textvariable=self.smriti_mistake_var, width=500, placeholder_text="Describe the precise mistake/rule broken...").pack(side="left", padx=10)

        def add_mistake():
            t = self.smriti_topic_var.get().strip()
            m = self.smriti_mistake_var.get().strip()
            if t and m:
                # 🚨 ABSOLUTE FIX 2: Failsafe patches
                if "smriti_v2" not in self.data["profile"]:
                    self.data["profile"]["smriti_v2"] = {}
                if attempt_name not in self.data["profile"]["smriti_v2"]:
                    self.data["profile"]["smriti_v2"][attempt_name] = []
                    
                self.data["profile"]["smriti_v2"][attempt_name].append({"topic": t, "mistake": m, "date": str(date.today())})
                self.save_data_state()
                self.open_smriti_attempt(attempt_name)

        ctk.CTkButton(add_f, text="STORE IN VAULT", fg_color="#8b5cf6", hover_color="#7c3aed", command=add_mistake).pack(side="left", padx=10)

        list_f = ctk.CTkScrollableFrame(p, fg_color="transparent", height=400)
        list_f.pack(fill="both", expand=True)

        mistakes = self.data["profile"]["smriti_v2"].get(attempt_name, [])
        if not mistakes:
            ctk.CTkLabel(list_f, text="NO FAILURES LOGGED. FLAWLESS ATTEMPT.", font=self.SUB_FONT, text_color=self.EMERALD).pack(pady=50)
            return

        for m in reversed(mistakes):
            f = ctk.CTkFrame(list_f, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
            f.pack(fill="x", pady=5)
            ctk.CTkLabel(f, text=f"{m['topic'].upper()}  ({m.get('date', '')})", font=("Inter", 12, "bold"), text_color="#8b5cf6").pack(anchor="w", padx=15, pady=(10, 0))
            ctk.CTkLabel(f, text=m['mistake'], font=("Inter", 12), wraplength=700, justify="left").pack(anchor="w", padx=15, pady=(5, 10))


    def open_dharma_sankat(self):
        p = self.prepare_view("DHARMA-SANKAT PROTOCOL", color="#ef4444")
        self.configure(fg_color="#1a0505") 
        if hasattr(self, 'bg_canvas'): self.bg_canvas.configure(bg="#1a0505")
        ctk.CTkLabel(p, text="\"Yield not to unmanliness, O son of Pritha.\nIt does not befit you.\nCast off this petty weakness of heart and arise!\"", 
                     font=("Bell MT", 18, "italic"), text_color="#fbbf24", justify="center").pack(pady=30)
        ctk.CTkLabel(p, text="The day is falling apart. Do not let it die.", font=("Inter", 16, "bold")).pack()
        f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color="#ef4444", border_width=2)
        f.pack(fill="x", padx=50, pady=30, ipadx=20, ipady=20)
        ctk.CTkLabel(f, text="SALVAGE PLAN (How will you save the remaining hours?):", font=("Inter", 12, "bold")).pack(anchor="w")
        plan = ctk.CTkTextbox(f, height=100, fg_color=self.BG, border_color="#ef4444", border_width=1)
        plan.pack(fill="x", pady=10)
        def execute_reset():
            if len(plan.get("1.0", "end-1c")) < 20:
                msg.showwarning("DENIED", "You must write a real salvage plan.")
                return
            self.data["profile"]["arka"] = max(0, self.data["profile"]["arka"] - 100) 
            self.save_data_state()
            msg.showinfo("PROTOCOL EXECUTED", "Mindset Reset. Go to work.")
            self.configure(fg_color=self.BG) 
            self.go_to_dashboard()
        ctk.CTkButton(f, text="EXECUTE RESET & FORGIVE MYSELF", font=self.UI_BOLD, fg_color="#ef4444", height=50, command=execute_reset).pack(pady=10)

    def open_bank(self):
        p = self.prepare_view("KUBERA'S VAULT (ARKA BANK)")
        bank = self.data["profile"].get("bank", {})
        wallet = self.data["profile"]["arka"]

        head_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color="#fbbf24", border_width=1)
        head_f.pack(fill="x", pady=10, ipadx=20, ipady=15)
        
        ctk.CTkLabel(head_f, text=f"WALLET: {wallet} ARKA", font=("Inter", 16, "bold"), text_color=self.CYBER_BLUE).pack(side="left", expand=True)
        ctk.CTkLabel(head_f, text=f"SAVINGS: {bank.get('savings', 0)}", font=("Inter", 16, "bold"), text_color=self.EMERALD).pack(side="left", expand=True)

        tabs = ctk.CTkTabview(p, fg_color="transparent", segmented_button_selected_color="#fbbf24")
        tabs.pack(fill="both", expand=True)
        t_save = tabs.add("BASIC BANKING")
        t_loan = tabs.add("STANDARD LOAN") 
        t_stock = tabs.add("ARKA EXCHANGE")  # <-- NEW FINANCIAL NAME
        t_trust = tabs.add("BRAHMACHARYA TRUST")
        t_bond = tabs.add("SANKALPA BONDS")
        t_sac = tabs.add("SURRENDER")
        t_kalpa = tabs.add("KALPA-VRIKSHA")
        t_debt = tabs.add("RIN-MUKTI (DEBT)")
        t_yajna = tabs.add("YAJNA & PENSION")
        t_xp = tabs.add("ASTRAL FORGE")

        # --- TAB 9: ASTRAL FORGE (Arka to XP Transmutation) ---
        ctk.CTkLabel(t_xp, text="ASTRAL FORGE (XP TRANSMUTATION)", font=("Inter", 20, "bold"), text_color="#8b5cf6").pack(pady=(20, 5))
        ctk.CTkLabel(t_xp, text="Sacrifice wealth for raw experience. The Forge respects only discipline.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0, 20))

        rules_f = ctk.CTkFrame(t_xp, fg_color=self.BG, border_color="#ef4444", border_width=1, corner_radius=10)
        rules_f.pack(fill="x", padx=40, pady=10, ipadx=15, ipady=15)
        
        rules_text = (
            "1. THE EXCHANGE: 5 Arka = 1 XP.\n"
            "2. THE THRESHOLD: Minimum sacrifice of 5,000 Arka per ignition.\n"
            "3. THE DISCIPLINE LOCK: Requires an active unbroken streak of at least 7 days.\n"
            "4. THE COOLDOWN: The Forge is volatile. It can only be used once every 7 days."
        )
        ctk.CTkLabel(rules_f, text="STRICT PROTOCOLS:", font=("Inter", 12, "bold"), text_color="#ef4444").pack(anchor="w", pady=(0, 5))
        ctk.CTkLabel(rules_f, text=rules_text, font=("Inter", 12), text_color=self.TEXT_PRI, justify="left").pack(anchor="w")

        xp_amt = ctk.IntVar(value=5000)
        xp_f = ctk.CTkFrame(t_xp, fg_color="transparent")
        xp_f.pack(pady=20)
        
        ctk.CTkLabel(xp_f, text="ARKA TO SACRIFICE:", font=("Inter", 14, "bold"), text_color="#fbbf24").pack(side="left", padx=10)
        ctk.CTkEntry(xp_f, textvariable=xp_amt, font=("Inter", 14), width=150, text_color="#fbbf24").pack(side="left", padx=10)

        def transmute_xp():
            amt = xp_amt.get()
            current_arka = self.data["profile"]["arka"]
            streak = self.calculate_streak()
            
            # Initialize forge tracking if it doesn't exist
            if "last_forge_use" not in self.data["profile"]["bank"]:
                self.data["profile"]["bank"]["last_forge_use"] = "2000-01-01"
                
            import datetime
            last_use = datetime.datetime.strptime(self.data["profile"]["bank"]["last_forge_use"], "%Y-%m-%d").date()
            days_since_use = (date.today() - last_use).days

            if days_since_use < 7:
                msg.showerror("FORGE COOLING DOWN", f"The Astral Forge is too unstable.\nYou must wait {7 - days_since_use} more days to transmute again.")
                return
            if amt < 5000:
                msg.showerror("SACRIFICE TOO LOW", "The Forge demands a minimum of 5,000 Arka.")
                return
            if amt > current_arka:
                msg.showerror("INSUFFICIENT WEALTH", f"You only have {current_arka} Arka.")
                return
            if streak < 7:
                msg.showerror("LACK OF DISCIPLINE", f"You need a 7-day streak to prove your worth.\nCurrent Streak: {streak} days.")
                return
                
            # Execute the Exchange
            gained_xp = amt // 5
            self.data["profile"]["arka"] -= amt
            self.data["profile"]["xp"] += gained_xp
            self.data["profile"]["bank"]["last_forge_use"] = str(date.today())
            
            self.save_data_state()
            msg.showinfo("TRANSMUTATION SUCCESSFUL", f"Sacrificed {amt} Arka into the Astral Forge.\nManifested {gained_xp} XP.")
            self.open_bank()

        ctk.CTkButton(xp_f, text="IGNITE FORGE", fg_color="#8b5cf6", hover_color="#7c3aed", height=40, font=("Inter", 12, "bold"), command=transmute_xp).pack(side="left", padx=20)

        # --- TAB 1: BASIC BANKING ---
        act_f = ctk.CTkFrame(t_save, fg_color=self.PANEL); act_f.pack(pady=10, fill="x", ipadx=10, ipady=10)
        amt_var = ctk.IntVar(value=0)
        ctk.CTkEntry(act_f, textvariable=amt_var, font=("Inter", 14), width=150).pack(side="left", padx=20)
        
        def tx(is_dep):
            amt = amt_var.get()
            if amt <= 0: return
            if is_dep and amt <= self.data["profile"]["arka"]:
                self.data["profile"]["arka"] -= amt; self.data["profile"]["bank"]["savings"] += amt
            elif not is_dep and amt <= self.data["profile"]["bank"]["savings"]:
                self.data["profile"]["bank"]["savings"] -= amt; self.data["profile"]["arka"] += amt
            else: msg.showerror("DENIED", "Insufficient funds."); return
            self.save_data_state(); self.open_bank()

        ctk.CTkButton(act_f, text="DEPOSIT", fg_color=self.EMERALD, command=lambda: tx(True)).pack(side="left", padx=10)
        ctk.CTkButton(act_f, text="WITHDRAW", fg_color="#ef4444", command=lambda: tx(False)).pack(side="left", padx=10)

        # --- TAB 1.5: STANDARD LOAN ---
        ctk.CTkLabel(t_loan, text=f"ACTIVE LOAN: {bank.get('loan', 0)} ARKA", font=("Inter", 24, "bold"), text_color="#fbbf24").pack(pady=20)
        ctk.CTkLabel(t_loan, text="Voluntary debt. Compounds at 2% daily interest.", font=("Inter", 12)).pack()
        borrow_amt = ctk.IntVar(value=0)
        bf = ctk.CTkFrame(t_loan, fg_color="transparent"); bf.pack(pady=10)
        ctk.CTkEntry(bf, textvariable=borrow_amt, width=150).pack(side="left", padx=10)

        def take_standard_loan():
            amt = borrow_amt.get()
            if amt <= 0: return
            total_logs = len(self.data.get("history", {}))
            if total_logs < 3:
                msg.showerror("CREDIT DENIED", f"Account Probation Active.\nYou only have {total_logs}/3 required days of logs.")
                return
            current_rank = self.get_rank_info()[0]
            rank_index = next((i for i, r in enumerate(RANK_THRESHOLDS) if r[1] == current_rank), 0)
            if rank_index < 2: 
                max_allowed = 500
                if amt > max_allowed:
                    msg.showwarning("CREDIT RESTRICTED", f"As a Novice, you are only approved for a Starter Micro-Loan of {max_allowed} Arka maximum.")
                    return
            else:
                graph_data = self.get_graph_data(15)
                avg_score = sum(graph_data) / len(graph_data) if graph_data else 0
                if avg_score < 6.0:
                    msg.showerror("CREDIT DENIED", f"Your 15-day discipline average is {avg_score:.1f}/10. High-risk borrower.")
                    return
                streak = self.calculate_streak()
                max_allowed = max(1000, streak * 200) 
                if amt > max_allowed:
                    msg.showwarning("CREDIT LIMIT EXCEEDED", f"Based on your current streak ({streak} days), your max limit is {max_allowed} Arka.")
                    return
            if msg.askyesno("STANDARD LOAN APPROVED", f"Karma Credit Check Passed.\n\nBorrow {amt} Arka at 2% daily interest?"):
                self.data["profile"]["arka"] += amt
                self.data["profile"]["bank"]["loan"] = self.data["profile"]["bank"].get("loan", 0) + amt
                self.save_data_state(); msg.showinfo("FUNDS WIRED", "The capital has been deposited into your wallet.")
                self.open_bank()
        ctk.CTkButton(bf, text="BORROW CAPITAL", fg_color="#fbbf24", text_color="#000000", hover_color="#f59e0b", command=take_standard_loan).pack(side="left", padx=10)

        repay_loan_amt = ctk.IntVar(value=0)
        rlf = ctk.CTkFrame(t_loan, fg_color="transparent"); rlf.pack(pady=10)
        ctk.CTkEntry(rlf, textvariable=repay_loan_amt, width=150).pack(side="left", padx=10)
        def repay_standard_loan():
            amt = repay_loan_amt.get()
            current_loan = self.data["profile"]["bank"].get("loan", 0)
            if amt > 0 and amt <= self.data["profile"]["arka"] and amt <= current_loan:
                self.data["profile"]["arka"] -= amt
                self.data["profile"]["bank"]["loan"] -= amt
                self.save_data_state(); self.open_bank()
            elif amt > self.data["profile"]["arka"]:
                msg.showerror("DENIED", "You do not have enough Arka to make this payment.")
        ctk.CTkButton(rlf, text="REPAY LOAN", fg_color=self.EMERALD, command=repay_standard_loan).pack(side="left", padx=10)

        # --- TAB 2: ARKA EXCHANGE (BULK ENGINE) ---
        ctk.CTkLabel(t_stock, text="Market prices surge when you conquer targets. They crash if ignored for 48h.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=5)
        
        def trade_stock(tck, is_buy, qty_str):
            try:
                qty = int(qty_str)
                if qty <= 0: return
            except ValueError:
                msg.showerror("INVALID", "Enter a valid number of assets.")
                return

            price = bank["stocks"][tck]["price"]
            total_cost = price * qty

            if is_buy:
                if self.data["profile"]["arka"] >= total_cost:
                    self.data["profile"]["arka"] -= total_cost
                    self.data["profile"]["bank"]["stocks"][tck]["shares"] += qty
                else: 
                    msg.showerror("DENIED", f"Not enough Arka.\nYou need {total_cost} Arka to acquire {qty} assets.")
            else:
                if bank["stocks"][tck]["shares"] >= qty:
                    self.data["profile"]["bank"]["stocks"][tck]["shares"] -= qty
                    self.data["profile"]["arka"] += total_cost
                else:
                    msg.showerror("DENIED", f"You do not own {qty} assets of {tck}.")
                    
            self.save_data_state()
            self.open_bank()

        for ticker in ["PHYS", "CHEM", "MATH"]:
            stock = bank["stocks"].get(ticker, {"shares": 0, "price": 10})
            sf = ctk.CTkFrame(t_stock, fg_color=self.BG, border_color=self.BORDER, border_width=1)
            sf.pack(fill="x", pady=5)
            
            ctk.CTkLabel(sf, text=f"${ticker}", font=("Inter", 16, "bold"), text_color=self.CYBER_BLUE, width=80).pack(side="left", padx=15, pady=15)
            ctk.CTkLabel(sf, text=f"PRICE: {stock['price']} Arka", font=("Inter", 14, "bold"), text_color="#fbbf24").pack(side="left", padx=10)
            ctk.CTkLabel(sf, text=f"ASSETS OWNED: {stock['shares']}", font=("Inter", 12)).pack(side="left", padx=10)
            
            # Isolated closure factory to handle independent quantity entries safely
            def make_trade_controls(parent, tck):
                q_var = ctk.StringVar(value="1")
                ctk.CTkButton(parent, text="SELL", width=60, fg_color="#ef4444", command=lambda: trade_stock(tck, False, q_var.get())).pack(side="right", padx=(5, 15))
                ctk.CTkButton(parent, text="BUY", width=60, fg_color=self.EMERALD, command=lambda: trade_stock(tck, True, q_var.get())).pack(side="right", padx=5)
                ctk.CTkEntry(parent, textvariable=q_var, width=50, justify="center").pack(side="right", padx=5)
                ctk.CTkLabel(parent, text="Qty:", font=("Inter", 12)).pack(side="right", padx=5)
                
            make_trade_controls(sf, ticker)
        
        # --- TAB 3: BRAHMACHARYA TRUST ---
        trust = bank.get("trust", {})
        if not trust.get("active"):
            ctk.CTkLabel(t_trust, text="Deposit 2000+ ARKA. Earn 5% daily compounding.\n3 Waste Usage strikes = Total Wipeout of Funds.", font=("Inter", 12), text_color="#fbbf24").pack(pady=20)
            t_amt = ctk.IntVar(value=2000)
            ctk.CTkEntry(t_trust, textvariable=t_amt, width=150).pack(pady=10)
            def open_trust():
                if t_amt.get() >= 2000 and self.data["profile"]["arka"] >= t_amt.get():
                    self.data["profile"]["arka"] -= t_amt.get()
                    self.data["profile"]["bank"]["trust"] = {"active": True, "balance": t_amt.get(), "strikes": 0}
                    self.save_data_state(); self.open_bank()
            ctk.CTkButton(t_trust, text="OPEN TRUST ESCROW", fg_color=self.CYBER_BLUE, command=open_trust).pack()
        else:
            ctk.CTkLabel(t_trust, text="TRUST ACTIVE", font=("Inter", 24, "bold"), text_color=self.EMERALD).pack(pady=10)
            ctk.CTkLabel(t_trust, text=f"BALANCE: {trust['balance']} ARKA", font=("Inter", 20, "bold")).pack(pady=5)
            ctk.CTkLabel(t_trust, text=f"STRIKES (ERRORS): {trust['strikes']} / 3", font=("Inter", 16, "bold"), text_color="#ef4444").pack(pady=5)
            def close_trust():
                self.data["profile"]["arka"] += int(trust["balance"])
                self.data["profile"]["bank"]["trust"] = {"active": False, "balance": 0, "strikes": 0}
                self.save_data_state(); self.open_bank()
            ctk.CTkButton(t_trust, text="WITHDRAW & CLOSE TRUST", fg_color=self.CYBER_BLUE, command=close_trust).pack(pady=20)

        # --- TAB 4: SANKALPA BONDS ---
        ctk.CTkLabel(t_bond, text="Stake Arka on tomorrow's target. Victory = 3x Payout. Failure = Total Burn + 20% Prana hit.", font=("Inter", 12), text_color="#fbbf24").pack(pady=10)
        b_amt = ctk.IntVar(value=1000)
        b_miss = ctk.StringVar()
        b_f = ctk.CTkFrame(t_bond, fg_color=self.PANEL); b_f.pack(fill="x", padx=20, pady=10, ipadx=10, ipady=10)
        ctk.CTkEntry(b_f, textvariable=b_amt, width=100).pack(side="left", padx=10)
        ctk.CTkEntry(b_f, textvariable=b_miss, width=300, placeholder_text="Exact Mission Description...").pack(side="left", padx=10)
        
        def buy_bond():
            amt = b_amt.get()
            if amt > self.data["profile"]["arka"]: return
            self.data["profile"]["arka"] -= amt
            self.data["profile"]["bank"]["bonds"].append({"mission": b_miss.get(), "stake": amt, "date": str(date.today() + timedelta(days=1))})
            self.save_data_state(); self.open_bank()
        ctk.CTkButton(b_f, text="TAKE VOW", fg_color="#ef4444", command=buy_bond).pack(side="left", padx=10)
        
        def make_resolve_cmd(index, is_won, stake):
            def action():
                if is_won: 
                    self.data["profile"]["arka"] += (stake * 3)
                    msg.showinfo("VOW KEPT", f"Bond fulfilled. +{stake*3} Arka.")
                else: 
                    msg.showwarning("VOW BROKEN", "Stake burned. Prana penalized.")
                self.data["profile"]["bank"]["bonds"].pop(index)
                self.save_data_state()
                self.open_bank()
            return action

        for i, bond in enumerate(bank.get("bonds", [])):
            if bond["date"] <= str(date.today()):
                f = ctk.CTkFrame(t_bond, fg_color=self.BG, border_color="#ef4444", border_width=1); f.pack(fill="x", pady=5)
                ctk.CTkLabel(f, text=f"DUE TODAY: {bond['mission']} (Stake: {bond['stake']})", font=("Inter", 12, "bold")).pack(side="left", padx=15, pady=10)
                ctk.CTkButton(f, text="FAILED (BURN)", fg_color="#ef4444", width=80, command=make_resolve_cmd(i, False, bond['stake'])).pack(side="right", padx=5)
                ctk.CTkButton(f, text="EXECUTED (3X)", fg_color=self.EMERALD, width=80, command=make_resolve_cmd(i, True, bond['stake'])).pack(side="right", padx=5)

        # --- TAB 5: SURRENDER (Sudarshan Grace) ---
        ctk.CTkLabel(t_sac, text="\"To action alone hast thou a right and never at all to its fruits.\"", font=("Bell MT", 16, "italic"), text_color=self.CYBER_BLUE).pack(pady=20)
        ctk.CTkLabel(t_sac, text="Offer 50,000 Arka to Krishna.\nYou receive no daily multipliers. If you suffer a catastrophic failure,\nthe Sudarshan Grace will save you once.", font=("Inter", 12), text_color=self.TEXT_SEC, justify="center").pack(pady=10)
        if self.data["profile"].get("sudarshan_grace"):
            ctk.CTkLabel(t_sac, text="SUDARSHAN GRACE IS WATCHING OVER YOU.", font=("Inter", 18, "bold"), text_color=self.EMERALD).pack(pady=30)
        else:
            def surrender():
                if self.data["profile"]["arka"] >= 50000:
                    self.data["profile"]["arka"] -= 50000
                    self.data["profile"]["sudarshan_grace"] = True
                    self.save_data_state(); msg.showinfo("NISHKAMA KARMA", "Offering accepted. The Chakra watches.")
                    self.open_bank()
                else: msg.showerror("DENIED", "You do not have the wealth to offer.")
            ctk.CTkButton(t_sac, text="SURRENDER 50,000 ARKA", font=("Inter", 14, "bold"), fg_color="#ef4444", height=50, command=surrender).pack(pady=20)

        # --- TAB 6: KALPA-VRIKSHA (Fixed Deposit) ---
        ctk.CTkLabel(t_kalpa, text="Lock Arka for 8% Daily Compound. Any failure = 50% Burn.", font=("Inter", 12), text_color="#fbbf24").pack(pady=10)
        if bank.get("kalpa_vriksha", {}).get("active"):
            kv = bank["kalpa_vriksha"]
            ctk.CTkLabel(t_kalpa, text="DEPOSIT ACTIVE", font=("Inter", 24, "bold"), text_color=self.EMERALD).pack(pady=10)
            ctk.CTkLabel(t_kalpa, text=f"Principal: {kv['principal']} Arka", font=("Inter", 16)).pack()
            ctk.CTkLabel(t_kalpa, text=f"Days Locked: {kv['days_locked']} / {kv['target_days']}", font=("Inter", 16, "bold"), text_color=self.CYBER_BLUE).pack()
        else:
            k_amt = ctk.IntVar(value=5000)
            k_days = ctk.IntVar(value=7)
            kf = ctk.CTkFrame(t_kalpa, fg_color=self.PANEL); kf.pack(pady=10, ipadx=10, ipady=10)
            ctk.CTkEntry(kf, textvariable=k_amt, width=150).pack(side="left", padx=10)
            ctk.CTkOptionMenu(kf, variable=k_days, values=["7", "14", "21"]).pack(side="left", padx=10)
            def open_kv():
                amt = k_amt.get()
                if amt <= self.data["profile"]["arka"] and amt > 0:
                    self.data["profile"]["arka"] -= amt
                    self.data["profile"]["bank"]["kalpa_vriksha"] = {"active": True, "principal": amt, "days_locked": 0, "target_days": int(k_days.get())}
                    self.save_data_state(); self.open_bank()
                else: msg.showerror("DENIED", "Insufficient Arka.")
            ctk.CTkButton(kf, text="LOCK FUNDS", fg_color="#ef4444", command=open_kv).pack(side="left", padx=10)

        # --- TAB 7: RIN-MUKTI (Debt System) ---
        rm = bank.get("rin_mukti", {"active": False, "debt": 0})
        ctk.CTkLabel(t_debt, text=f"CURRENT DEBT: {rm.get('debt', 0)} ARKA", font=("Inter", 24, "bold"), text_color="#ef4444").pack(pady=20)
        ctk.CTkLabel(t_debt, text="Debt compounds at 5% daily. Failure to pay triggers Shani's Lockdown.", font=("Inter", 12)).pack()
        repay_amt = ctk.IntVar(value=0)
        rf = ctk.CTkFrame(t_debt, fg_color="transparent"); rf.pack(pady=20)
        ctk.CTkEntry(rf, textvariable=repay_amt, width=150).pack(side="left", padx=10)
        def repay_debt():
            amt = repay_amt.get()
            if amt <= self.data["profile"]["arka"] and amt <= rm.get("debt", 0) and amt > 0:
                self.data["profile"]["arka"] -= amt
                self.data["profile"]["bank"]["rin_mukti"]["debt"] -= amt
                self.save_data_state(); self.open_bank()
        ctk.CTkButton(rf, text="REPAY DEBT", fg_color=self.EMERALD, command=repay_debt).pack(side="left", padx=10)

        # --- TAB 8: YAJNA & PENSION ---
        ctk.CTkLabel(t_yajna, text="SANNYASA-NIDHI (The Pension)", font=("Inter", 18, "bold"), text_color=self.CYBER_BLUE).pack(pady=(20, 5))
        ctk.CTkLabel(t_yajna, text="Compounds at 1% daily. Cannot be withdrawn until Rank 15 (DHYAN-YOGI).", font=("Inter", 11)).pack()
        ctk.CTkLabel(t_yajna, text=f"BALANCE: {bank.get('sannyasa_nidhi', 0)}", font=("Inter", 16, "bold"), text_color=self.EMERALD).pack(pady=5)
        pen_amt = ctk.IntVar(value=0)
        pf = ctk.CTkFrame(t_yajna, fg_color="transparent"); pf.pack()
        ctk.CTkEntry(pf, textvariable=pen_amt, width=150).pack(side="left", padx=5)
        def add_pension():
            amt = pen_amt.get()
            if amt <= self.data["profile"]["arka"] and amt > 0:
                self.data["profile"]["arka"] -= amt
                self.data["profile"]["bank"]["sannyasa_nidhi"] = bank.get("sannyasa_nidhi", 0) + amt
                self.save_data_state(); self.open_bank()
        ctk.CTkButton(pf, text="DEPOSIT", fg_color=self.CYBER_BLUE, command=add_pension).pack(side="left", padx=5)
        
        current_rank = self.get_rank_info()[0]
        if self.data["profile"]["xp"] >= RANK_THRESHOLDS[14][0]:
            def claim_pension():
                self.data["profile"]["arka"] += bank.get("sannyasa_nidhi", 0)
                self.data["profile"]["bank"]["sannyasa_nidhi"] = 0
                self.save_data_state(); self.open_bank()
            ctk.CTkButton(t_yajna, text="CLAIM PENSION (RANK 15 ACHIEVED)", fg_color=self.EMERALD, command=claim_pension).pack(pady=10)

        ctk.CTkLabel(t_yajna, text="YAJNA (The Fire Sacrifice)", font=("Inter", 18, "bold"), text_color="#ef4444").pack(pady=(30, 5))
        ctk.CTkLabel(t_yajna, text=f"Total Burned: {bank.get('yajna', {}).get('total_burned', 0)} Arka", font=("Inter", 14)).pack()
        y_amt = ctk.IntVar(value=1000)
        yf = ctk.CTkFrame(t_yajna, fg_color="transparent"); yf.pack(pady=10)
        ctk.CTkEntry(yf, textvariable=y_amt, width=150).pack(side="left", padx=5)
        def burn_yajna():
            amt = y_amt.get()
            if amt <= self.data["profile"]["arka"] and amt > 0:
                self.data["profile"]["arka"] -= amt
                self.data["profile"]["bank"]["yajna"]["total_burned"] = bank.get("yajna", {}).get("total_burned", 0) + amt
                self.save_data_state(); msg.showinfo("YAJNA", "Your Arka was burned into the void.")
                self.open_bank()
        ctk.CTkButton(yf, text="SACRIFICE", fg_color="#ef4444", command=burn_yajna).pack(side="left", padx=5)

    # ==========================================
    # DATA LOGGING, PROFILES & PDFS
    # ==========================================
    def open_profile(self):
        p = self.prepare_view("Profile Hub")
        tabs = ctk.CTkTabview(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
        tabs.pack(fill="both", expand=True, padx=20, pady=20)
        
        t_id = tabs.add("Identity & Stats")
        t_intel = tabs.add("Intelligence Analysis")
        t_set = tabs.add("System Settings")
        
        id_frame = ctk.CTkFrame(t_id, fg_color="transparent")
        id_frame.pack(pady=20)
        
       # --- AESTHETIC CIRCULAR PROFILE PIC (180x180) ---
        try:
            # 1. Open the image and ensure it has an alpha channel for transparency
            raw_img = Image.open(PFP_PATH).convert("RGBA")
            raw_img = raw_img.resize((180, 180))
            
            # 2. Create a perfect circular mask
            mask = Image.new("L", (180, 180), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, 180, 180), fill=255)
            
            # 3. Paste the image onto a transparent background using the mask
            circular_img = Image.new("RGBA", (180, 180), (0, 0, 0, 0))
            circular_img.paste(raw_img, (0, 0), mask=mask)
            
            # 4. Render the beautifully rounded image in the UI
            img = ctk.CTkImage(circular_img, size=(180, 180))
            ctk.CTkLabel(id_frame, image=img, text="").pack(pady=10)
            
        except Exception as e:
            # The fallback remains a perfect circle if no image is found
            f = ctk.CTkFrame(id_frame, width=180, height=180, fg_color="#1A1A1A", corner_radius=90)
            f.pack(pady=10); f.pack_propagate(False)
            ctk.CTkLabel(f, text="NO PFP", text_color=self.TEXT_SEC).place(relx=0.5, rely=0.5, anchor="center")
        # ------------------------------------------------
            
        ctk.CTkLabel(id_frame, text=self.data["profile"]["name"].upper(), font=("Inter", 28, "bold"), text_color=self.CYBER_BLUE).pack()
        ctk.CTkLabel(id_frame, text=self.data["profile"]["title"], font=("Inter", 16), text_color=self.TEXT_SEC).pack()
        
        stat_f = ctk.CTkFrame(t_id, fg_color=self.BG, corner_radius=10, border_color=self.BORDER, border_width=1)
        stat_f.pack(fill="x", padx=40, pady=30, ipadx=20, ipady=20)
        
        current_rank, prev_xp, next_rank, next_xp = self.get_rank_info()
        xp = self.data['profile']['xp']
        ctk.CTkLabel(stat_f, text=f"RANK: {current_rank}", font=self.RANK_FONT, text_color="#fbbf24").pack(anchor="w", pady=(5,0))
        
        if next_rank == "MAX RANK":
            progress = 1.0
            lbl_text = f"XP: {xp} (MAXIMUM RANK ACHIEVED)"
        else:
            progress = (xp - prev_xp) / (next_xp - prev_xp)
            lbl_text = f"XP: {xp} / {next_xp}  (Next: {next_rank})"
            
        ctk.CTkLabel(stat_f, text=lbl_text, font=("Inter", 12, "bold"), text_color=self.TEXT_SEC).pack(anchor="w", pady=(0,5))
        rank_bar = ctk.CTkProgressBar(stat_f, progress_color="#fbbf24", fg_color=self.BG, height=12)
        rank_bar.pack(fill="x", pady=(0, 15))
        rank_bar.set(progress)
        
        ctk.CTkLabel(stat_f, text=f"AVAILABLE ARKA (ESSENCE): {self.data['profile']['arka']}", font=("Inter", 16, "bold"), text_color=self.CYBER_BLUE).pack(anchor="w", pady=5)
        ctk.CTkLabel(stat_f, text=f"LIFETIME LOGS: {len(self.data.get('history', {}))} Days", font=("Inter", 16, "bold")).pack(anchor="w", pady=5)
        ctk.CTkLabel(stat_f, text=f"CURRENT STREAK: {self.calculate_streak()} Days", font=("Inter", 16, "bold"), text_color=self.EMERALD).pack(anchor="w", pady=5)

        ctk.CTkLabel(t_intel, text="10-DAY ECONOMY LEDGER", font=("Inter", 18, "bold"), text_color="#fbbf24").pack(pady=(20, 5))
        econ_f = ctk.CTkFrame(t_intel, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=15)
        econ_f.pack(fill="x", padx=20, pady=10)
        econ_canvas = ctk.CTkCanvas(econ_f, bg=self.PANEL, highlightthickness=0, height=250)
        econ_canvas.pack(fill="x", padx=10, pady=10)
        self.draw_economy_graph(econ_canvas, days=10)

        ctk.CTkLabel(t_intel, text="7-DAY BEHAVIOR & TASK ANALYSIS", font=("Inter", 18, "bold"), text_color=self.CYBER_BLUE).pack(pady=(20, 10))
        history = self.data.get("history", {})
        today = date.today()
        moods, energies = [], []
        tasks = {"Study Target Met": 0, "Early Wake": 0, "Meditation": 0, "Exercise": 0, "Delayed Laptop": 0}
        task_keys = {"Study Target Met": "Study_Achieved", "Early Wake": "Sleep_WokeEarly", "Meditation": "Ex_Med", "Exercise": "Ex_Done", "Delayed Laptop": "Laptop_Delayed"}
        
        for i in range(7):
            d_str = str(today - timedelta(days=i))
            if d_str in history:
                entry = history[d_str]
                if entry.get("Mindset_Mood", "").isdigit(): moods.append(int(entry["Mindset_Mood"]))
                if entry.get("Mindset_Energy", "").isdigit(): energies.append(int(entry["Mindset_Energy"]))
                for name, key in task_keys.items():
                    if entry.get(key) == "Yes": tasks[name] += 1

        beh_f = ctk.CTkFrame(t_intel, fg_color=self.BG, border_color=self.BORDER, border_width=1)
        beh_f.pack(fill="x", padx=20, pady=10, ipadx=15, ipady=15)
        avg_mood = round(sum(moods)/len(moods), 1) if moods else 0
        avg_nrg = round(sum(energies)/len(energies), 1) if energies else 0
        ctk.CTkLabel(beh_f, text=f"Avg Mood: {avg_mood}/5 | Avg Energy: {avg_nrg}/5", font=("Inter", 14)).pack(anchor="w")

        tsk_f = ctk.CTkFrame(t_intel, fg_color=self.BG, border_color=self.BORDER, border_width=1)
        tsk_f.pack(fill="both", expand=True, padx=20, pady=10, ipadx=15, ipady=15)
        for task, count in sorted(tasks.items(), key=lambda x: x[1], reverse=True):
            color = self.EMERALD if count >= 5 else (self.CYBER_BLUE if count >= 3 else "#ef4444")
            ctk.CTkLabel(tsk_f, text=f"[{count}/7] {task}", font=("Inter", 14, "bold"), text_color=color).pack(anchor="w", pady=2)

        is_saturday = today.weekday() == 5
        is_monthly = today.day == 30 or (today.month == 2 and today.day == 28)

        btn_intel = ctk.CTkButton(t_intel, text="Generate Intelligence PDF (Saturday Only)", fg_color=self.EMERALD if is_saturday else "#333333", text_color="#FFFFFF" if is_saturday else "#888888", command=lambda: self.generate_summary_pdf("Intelligence", 7))
        btn_intel.pack(pady=20, fill="x", padx=20)
        if not is_saturday: btn_intel.configure(state="disabled")

        ctk.CTkLabel(t_set, text="SYSTEM CONFIGURATION", font=("Inter", 18, "bold")).pack(pady=20)
        btn_week = ctk.CTkButton(t_set, text="Generate Weekly Summary PDF (Saturday Only)", fg_color=self.EMERALD if is_saturday else "#333333", text_color="#FFFFFF" if is_saturday else "#888888", command=lambda: self.generate_summary_pdf("Weekly", 7))
        btn_week.pack(pady=10, fill="x", padx=50)
        if not is_saturday: btn_week.configure(state="disabled")

        btn_month = ctk.CTkButton(t_set, text="Generate Monthly Summary PDF (30th / Feb 28th)", fg_color=self.CYBER_BLUE if is_monthly else "#333333", text_color="#FFFFFF" if is_monthly else "#888888", command=lambda: self.generate_summary_pdf("Monthly", 30))
        btn_month.pack(pady=10, fill="x", padx=50)
        if not is_monthly: btn_month.configure(state="disabled")

        ctk.CTkButton(t_set, text="Export Database Backup", command=self.export_db).pack(pady=30, fill="x", padx=50)
        ctk.CTkButton(t_set, text="FACTORY RESET ENGINE", fg_color="#ef4444", hover_color="#b91c1c", command=self.nuke_db).pack(pady=10, fill="x", padx=50)

    def export_db(self):
        dest = fd.asksaveasfilename(defaultextension=".json", initialfile="Sovereign_Backup.json")
        if dest: shutil.copy(DB_PATH, dest); msg.showinfo("Export", "Backup Success.")

    def nuke_db(self):
        if msg.askyesno("WARNING", "Delete ALL history?"):
            self.data["history"] = {}; self.data["profile"]["xp"] = 0; self.save_data_state(); msg.showinfo("Reset", "Wiped.")

    def generate_summary_pdf(self, report_type, days_back):
        import threading
        def background_task():
            pdf = FPDF()
            pdf.add_page()
            pdf.set_fill_color(5, 5, 5)
            pdf.rect(0, 0, 210, 297, 'F')
            today = date.today()
            history = self.data.get("history", {})
            moods, energies = [], []
            tasks = {"Study Target Met": 0, "Early Wake": 0, "Meditation": 0, "Exercise": 0, "Delayed Laptop": 0}
            task_keys = {"Study Target Met": "Study_Achieved", "Early Wake": "Sleep_WokeEarly", "Meditation": "Ex_Med", "Exercise": "Ex_Done", "Delayed Laptop": "Laptop_Delayed"}
            
            days_logged = 0
            for i in range(days_back):
                d_str = str(today - timedelta(days=i))
                if d_str in history:
                    days_logged += 1
                    entry = history[d_str]
                    if entry.get("Mindset_Mood", "").isdigit(): moods.append(int(entry["Mindset_Mood"]))
                    if entry.get("Mindset_Energy", "").isdigit(): energies.append(int(entry["Mindset_Energy"]))
                    for name, key in task_keys.items():
                        if entry.get(key) == "Yes": tasks[name] += 1

            avg_mood = round(sum(moods)/len(moods), 1) if moods else 0
            avg_nrg = round(sum(energies)/len(energies), 1) if energies else 0

            pdf.set_font("Helvetica", 'B', 24)
            pdf.set_text_color(59, 130, 246)
            pdf.cell(0, 15, f"{report_type.upper()} REPORT", ln=True, align="C")
            pdf.set_font("Helvetica", '', 12)
            pdf.set_text_color(136, 136, 136)
            pdf.cell(0, 10, f"Generated: {today} | Days Logged: {days_logged}/{days_back}", ln=True, align="C")
            pdf.ln(10)

            pdf.set_font("Helvetica", 'B', 16)
            pdf.set_text_color(16, 185, 129)
            pdf.cell(0, 10, "MINDSET AVERAGES", ln=True)
            pdf.set_font("Helvetica", '', 12)
            pdf.set_text_color(255, 255, 255)
            pdf.cell(0, 8, f"Average Mood: {avg_mood} / 5", ln=True)
            pdf.cell(0, 8, f"Average Energy: {avg_nrg} / 5", ln=True)
            pdf.ln(10)

            pdf.set_font("Helvetica", 'B', 16)
            pdf.set_text_color(16, 185, 129)
            pdf.cell(0, 10, "HABIT CONSISTENCY", ln=True)
            
            sorted_tasks = sorted(tasks.items(), key=lambda x: x[1], reverse=True)
            pdf.set_font("Helvetica", 'B', 12)
            pdf.set_text_color(59, 130, 246)
            pdf.cell(0, 8, "Tasks Done Most Often:", ln=True)
            pdf.set_font("Helvetica", '', 12)
            pdf.set_text_color(255, 255, 255)
            for task, count in sorted_tasks[:2]:
                pdf.cell(0, 8, f"- {task} ({count}/{days_back} days)", ln=True)
                
            pdf.ln(5)
            pdf.set_font("Helvetica", 'B', 12)
            pdf.set_text_color(239, 68, 68) 
            pdf.cell(0, 8, "Tasks Neglected:", ln=True)
            pdf.set_font("Helvetica", '', 12)
            pdf.set_text_color(255, 255, 255)
            for task, count in sorted_tasks[-2:]:
                pdf.cell(0, 8, f"- {task} ({count}/{days_back} days)", ln=True)

            pdf_name = f"Sovereign_{report_type}_Report_{today}.pdf"
            pdf_path = os.path.join(BASE_DIR, pdf_name)
            pdf.output(pdf_path)
            self.after(0, lambda: msg.showinfo("Success", f"{report_type} Report Generated Successfully:\n{pdf_path}"))

        threading.Thread(target=background_task, daemon=True).start()

    def get_economy_data(self, days=10):
        history = self.data.get("history", {})
        xp_data, arka_data = [], []
        today = date.today()
        for i in range(days - 1, -1, -1):
            target = str(today - timedelta(days=i))
            if target in history:
                d = history[target]
                xp_data.append(d.get("Daily_XP_Awarded", 0))
                arka_data.append(d.get("Daily_Arka_Awarded", 0))
            else:
                xp_data.append(0)
                arka_data.append(0)
        return xp_data, arka_data

    def draw_economy_graph(self, canvas, days=10):
        if not canvas.winfo_exists(): return
        canvas.delete("all")
        width, height = 800, 250
        pad_left, pad_bottom, pad_top, pad_right = 50, 40, 20, 140
        plot_w, plot_h = width - pad_left - pad_right, height - pad_bottom - pad_top
        canvas.configure(width=width, height=height)
        
        legend_x = width - pad_right + 25
        legend_y = pad_top + 20
        canvas.create_rectangle(legend_x, legend_y, legend_x + 15, legend_y + 15, fill="#fbbf24", outline="")
        canvas.create_text(legend_x + 25, legend_y + 7, text="XP EARNED", fill=self.TEXT_PRI, font=("Inter", 10, "bold"), anchor="w")
        canvas.create_rectangle(legend_x, legend_y + 35, legend_x + 15, legend_y + 50, fill=self.CYBER_BLUE, outline="")
        canvas.create_text(legend_x + 25, legend_y + 42, text="ARKA EARNED", fill=self.TEXT_PRI, font=("Inter", 10, "bold"), anchor="w")

        canvas.create_line(pad_left, pad_top, pad_left, height - pad_bottom, fill=self.BORDER, width=2)
        canvas.create_line(pad_left, height - pad_bottom, width - pad_right, height - pad_bottom, fill=self.BORDER, width=2)
        
        xp_data, arka_data = self.get_economy_data(days)
        max_val = max(max(xp_data) if xp_data else 0, max(arka_data) if arka_data else 0, 100)
        max_scale = int(max_val * 1.2) if max_val > 0 else 100 
        
        for i in range(0, 5):
            val = int(max_scale * (i / 4))
            y_pos = pad_top + plot_h - (i / 4) * plot_h
            canvas.create_line(pad_left, y_pos, width - pad_right, y_pos, fill="#1A1A1A", dash=(4, 4))
            canvas.create_text(pad_left - 25, y_pos, text=str(val), fill=self.TEXT_SEC, font=("Inter", 9, "bold"))
            
        num_points = len(xp_data)
        if num_points == 0: return

        bar_slot = plot_w / num_points
        bar_w = bar_slot * 0.35 
        today = date.today()
        
        for i in range(num_points):
            x_center = pad_left + (i * bar_slot) + (bar_slot / 2)
            day_offset = (num_points - 1) - i
            d_str = (today - timedelta(days=day_offset)).strftime("%d/%m")
            canvas.create_text(x_center, height - pad_bottom + 15, text=d_str, fill=self.TEXT_SEC, font=("Inter", 8))
            
            xp_h = (xp_data[i] / max_scale) * plot_h
            arka_h = (arka_data[i] / max_scale) * plot_h
            
            if xp_data[i] > 0: canvas.create_rectangle(x_center - bar_w - 2, pad_top + plot_h - xp_h, x_center - 2, pad_top + plot_h, fill="#fbbf24", outline="#fbbf24", width=1)
            if arka_data[i] > 0: canvas.create_rectangle(x_center + 2, pad_top + plot_h - arka_h, x_center + bar_w + 2, pad_top + plot_h, fill=self.CYBER_BLUE, outline=self.CYBER_BLUE, width=1)
    
    def calculate_streak(self):
        history = self.data.get("history", {})
        if not history: return 0
        streak, current_date = 0, date.today()
        
        if str(current_date) in history:
            if history[str(current_date)].get("Vishrama_Active") != "Yes": streak += 1
            current_date -= timedelta(days=1)
        elif str(current_date - timedelta(days=1)) in history:
            current_date -= timedelta(days=1)
        else: return 0
        
        while str(current_date) in history:
            if history[str(current_date)].get("Vishrama_Active") != "Yes": 
                streak += 1 
            current_date -= timedelta(days=1)
        return streak

    def get_graph_data(self, days=15):
        history, graph_data, today = self.data.get("history", {}), [], date.today()
        for i in range(days - 1, -1, -1):
            target = str(today - timedelta(days=i))
            if target in history:
                d = history[target]
                if d.get("Vishrama_Active") == "Yes":
                    graph_data.append(10)
                else:
                    # Calculate score out of 10 based on core habits completed
                    score = sum([1 for k in ["Sleep_WokeEarly", "Sleep_SleptEarly", "Sleep_Out10m", "Laptop_Delayed", "Eye_Sunlight", "Eye_Darkroom", "Height_Dal", "Height_Stretch", "Ex_Done"] if d.get(k) == "Yes"])
                    if d.get("Study_Target", "") != "": score += 1
                    graph_data.append(min(10, score))
            else: 
                graph_data.append(0)
        return graph_data

    def draw_authentic_graph(self):
        if not hasattr(self, 'canvas') or not self.canvas.winfo_exists(): return
        
        # Grab the absolute live width of the canvas to consume all dead space
        width = self.canvas.winfo_width()
        
        # Prevents an error if the UI hasn't fully rendered the first frame yet
        if width <= 10: 
            return 
            
        self.canvas.delete("all")
        height = 320 
        pad_left, pad_bottom, pad_top, pad_right = 50, 50, 30, 30
        plot_w, plot_h = width - pad_left - pad_right, height - pad_bottom - pad_top
        
        for i in range(0, 11, 2):
            y_pos = pad_top + plot_h - (i / 10.0) * plot_h
            self.canvas.create_line(pad_left, y_pos, width - pad_right, y_pos, fill="#1A1A1A", dash=(4, 4))
            self.canvas.create_text(pad_left - 20, y_pos, text=str(i), fill=self.TEXT_SEC, font=("Inter", 10, "bold"))

        self.canvas.create_line(pad_left, pad_top, pad_left, height - pad_bottom, fill=self.BORDER, width=2)
        self.canvas.create_line(pad_left, height - pad_bottom, width - pad_right, height - pad_bottom, fill=self.BORDER, width=2)
        
        today = date.today()
        days_in_month = calendar.monthrange(today.year, today.month)[1]
        
        data = self.get_graph_data(days=days_in_month) 
        num_bars = len(data)
        bar_spacing = plot_w / num_bars
        bar_w = bar_spacing * 0.55 
        
        for i, score in enumerate(data):
            day_offset = (num_bars - 1) - i
            target_date = today - timedelta(days=day_offset)
            date_str = target_date.strftime("%d/%m") 
            full_date_str = str(target_date) # Used as the database key
            
            bar_h = (score / 10.0) * plot_h
            x_center = pad_left + 10 + (i * bar_spacing) + (bar_spacing / 2)
            x1, x2 = x_center - (bar_w / 2), x_center + (bar_w / 2)
            y1, y2 = pad_top + plot_h - bar_h, pad_top + plot_h
            
            self.canvas.create_text(x_center, y2 + 20, text=date_str, fill=self.TEXT_SEC, font=("Inter", 8))
            
            # --- NEW: Check if this specific day was manually flagged as failed ---
            is_manual_fail = self.data.get("history", {}).get(full_date_str, {}).get("Manual_Fail_Yellow", False)
            
            if is_manual_fail: color = "#fbbf24"  # Sovereign's built-in yellow/gold
            elif score >= 8: color = self.EMERALD
            elif score >= 5: color = self.CYBER_BLUE
            else: color = "#ef4444"
                
            if score == 0 and not is_manual_fail: 
                # Blank/missed days that aren't manually toggled yet
                self.canvas.create_rectangle(x1, y2-2, x2, y2, fill="#333333", outline="", tags=(full_date_str, "graph_bar"))
            else:
                # If score is 0 but manually failed, give it a tiny height so it's visible and clickable
                if score == 0 and is_manual_fail: y1 = y2 - 10 
                
                # Draw the bar with tags attached so we can click them
                self.canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline=color, width=2, tags=(full_date_str, "graph_bar"))
                self.canvas.create_rectangle(x1+2, y1+2, x2-2, y2, fill=self.BG, outline="", tags=(full_date_str, "graph_bar"))
                self.canvas.create_text(x_center, y1 - 10, text=str(score), fill=color, font=("Inter", 8, "bold"))

        # --- NEW: Bind left-click to toggle the failure state ---
        self.canvas.tag_bind("graph_bar", "<Button-1>", self.toggle_bar_failure)

    def toggle_bar_failure(self, event):
        # 1. Identify which bar was clicked
        item = self.canvas.find_withtag("current")
        if not item: return
        
        tags = self.canvas.gettags(item[0])
        if not tags: return
        
        # 2. Extract the specific date string from the tag
        full_date_str = tags[0] 

        # 3. Ensure safety fallbacks in the database
        if "history" not in self.data:
            self.data["history"] = {}
        if full_date_str not in self.data["history"]:
            self.data["history"][full_date_str] = {}

        # 4. Toggle the Yellow Failure status
        current_status = self.data["history"][full_date_str].get("Manual_Fail_Yellow", False)
        self.data["history"][full_date_str]["Manual_Fail_Yellow"] = not current_status

        # 5. Save and refresh the UI instantly
        self.save_data_state()
        self.draw_authentic_graph()    

    def secure_open_armory(self):
        lock_date_str = self.data["profile"].get("armory_lock_until", "")
        if lock_date_str:
            import datetime
            lock_date = datetime.datetime.strptime(lock_date_str, "%Y-%m-%d").date()
            if datetime.date.today() <= lock_date:
                msg.showerror("MIRROR OF TRUTH", f"Ego Lock Active.\nYou underperformed your prediction by >20%.\nThe Armory remains sealed until {lock_date_str}.\nGo analyze your mistakes.")
                return 
            else:
                del self.data["profile"]["armory_lock_until"]
                self.save_data_state()

        shani_date_str = self.data["profile"].get("shani_freeze_until", "")
        if shani_date_str:
            import datetime
            shani_date = datetime.datetime.strptime(shani_date_str, "%Y-%m-%d").date()
            if datetime.date.today() <= shani_date:
                msg.showerror("SHANI'S AUDIT", f"ASSETS FROZEN.\nDiscipline does not match wealth.\nThe Armory is locked until {shani_date_str}.")
                return 
            else:
                self.data["profile"]["shani_freeze_until"] = ""
                self.save_data_state()
        self.open_armory()

    def calculate_daily_rewards(self, log):
        xp, arka = 0, 0
        
        # If Vishrama (Rest) is active, no rewards and no penalties
        if log.get("Vishrama_Active") == "Yes": return 0, 0
        
        today_str = str(date.today())

        # ========================================================
        # 1. NEW ENGINE: MESOCYCLE V2 INTEGRATION (Massive Payouts)
        # ========================================================
        meso = self.data["profile"].get("meso_v2", {})
        for p_name, p_data in meso.items():
            if p_data.get("active"):
                for t_name, t_data in p_data.get("tabs", {}).items():
                    day_log = t_data.get("logs", {}).get(today_str)
                    if day_log:
                        # Extract the overall status for the tab
                        status = day_log.get("status") if isinstance(day_log, dict) else day_log
                        
                        # Massive rewards for hitting the full tab standard
                        if status in ["Meet", "Pass", "PASS"]:
                            arka += 40
                            xp += 25
                        elif status in ["Exceed", "EXCEED"]:
                            arka += 80
                            xp += 50
                            
                        # Micro-rewards for each individual sub-rule you logged
                        if isinstance(day_log, dict) and "details" in day_log:
                            rule_count = len(day_log["details"])
                            perfect_rules = 0
                            
                            for r_val in day_log["details"].values():
                                r_stat = r_val.get("status", "")
                                if r_stat == "Meet": 
                                    arka += 10
                                    xp += 5
                                    perfect_rules += 1
                                elif r_stat == "Exceed": 
                                    arka += 25
                                    xp += 15
                                    perfect_rules += 1
                                elif r_stat in ["Fail", "FAIL"]:
                                    arka -= 25  # 🚨 THE BROKEN VOW TAX
                                    
                            # 🎯 PERFECT FOCUS BONUS (10/10 Self Study Jackpot)
                            if t_name == "Self Study" and rule_count == 10 and perfect_rules == 10:
                                arka += 500
                                xp += 200

        # ========================================================
        # 2. DAILY MISSIONS & DEBRIEF (Must, Imp, Opt Targets)
        # ========================================================
        for sec in ["Must", "Imp", "Opt"]:
            tasks = log.get(f"Tasks_{sec}", [])
            for i in range(len(tasks)):
                t_id = f"TaskLog_{today_str}_{sec}_{i}"
                res = log.get(f"{t_id}_Check", log.get(f"{t_id}_Radio", log.get(f"{t_id}_Note", "Pending")))
                
                if res == "Yes":
                    if sec == "Must": arka += 30; xp += 20
                    elif sec == "Imp": arka += 20; xp += 10
                    elif sec == "Opt": arka += 10; xp += 5

        if log.get("Reflect_Distraction", "") != "": arka += 15; xp += 10
        if log.get("Reflect_Win", "") != "": arka += 20; xp += 10
        if log.get("Reflect_Improvement", "") != "": arka += 20; xp += 10

        # ========================================================
        # 3. LEGACY TERMINALS & DAILY HABITS (Fully Restored)
        # ========================================================
        for key in ["Ex_Med", "Eye_Water", "Ex_Done","Eye_Darkroom", "Sleep_WokeEarly"]:
            if log.get(key) == "Yes": arka += 15; xp += 10
        
        subjects_completed = sum(1 for s in ["PHYS", "CHEM", "MATH"] if log.get(f"Study_{s}_Achieved") == "Yes")
        if subjects_completed > 0:
            arka += (20 * subjects_completed) 
            xp += (15 * subjects_completed)

        if log.get("Sleep_SleptEarly") == "Yes": arka += 15; xp += 10
        if log.get("Sleep_WokeEarly") == "Yes": arka += 15; xp += 10
        if log.get("Sleep_Forced") == "Yes": arka += 10; xp += 5
        elif log.get("Sleep_Forced") == "No": arka += 5; xp += 5

        if log.get("Eye_Sunlight") == "Yes": arka += 20; xp += 10
        if log.get("Eye_Darkroom") == "Yes": arka += 20; xp += 10
        if log.get("Eye_2020") == "Yes": arka += 30; xp += 15
        if log.get("Eye_Blink") == "Yes": arka += 10; xp += 5
        if log.get("Height_Dal") == "Yes": arka += 10; xp += 5
        if log.get("Height_Tak") == "Yes": arka += 10; xp += 5
        posture = log.get("Height_Posture", "1")
        if posture in ["4", "5"]: arka += 20; xp += 10
        if log.get("Height_Affirm") == "Yes": arka += 30; xp += 15

        if log.get("Laptop_Delayed") == "Yes": arka += 30; xp += 20
        if log.get("Laptop_Anime") == "Yes": arka -= 10; xp -= 5
        if log.get("Laptop_Waste") == "Yes": arka -= 100; xp -= 50
        if log.get("Laptop_AI") == "Yes": arka += 10; xp += 10
        if log.get("Laptop_NoScreenBed") == "Yes": arka += 100; xp += 75

        if log.get("Mindset_State") != "": arka += 30; xp += 20
        if log.get("Mindset_Mood") in ["1", "2", "3", "4", "5"]: arka += 30; xp += 20
        if log.get("Mindset_Energy") in ["1", "2", "3", "4", "5"]: arka += 30; xp += 20

        if log.get("Devo_Woke") == "Yes": arka += 20; xp += 10
        if log.get("Devo_Bath") == "Yes": arka += 15; xp += 10
        if log.get("Devo_Prayer") == "Yes": arka += 20; xp += 10
        if log.get("Devo_Chalisa") == "Yes": arka += 30; xp += 15
        if log.get("Devo_Failure") == "Yes": arka += 50; xp += 25
        if log.get("Devo_Temple") == "Yes": arka += 30; xp += 15
        if log.get("Devo_Health") == "Yes": arka += 10; xp += 5
        if log.get("Devo_water") == "Yes": arka += 10; xp += 5

        if log.get("AFAC_Used", "No") == "No": arka -= 150; xp -= 100
        elif log.get("AFAC_Trust") == "Yes" and log.get("AFAC_Action") == "Yes": arka += 30; xp += 20

        # ========================================================
        # 4. SIDDHIS, TESTS & MULTIPLIERS (Darpan, Kurukshetra, Surya-Tejas)
        # ========================================================
        if log.get("Study_TestTaken") == "Yes": 
            arka += 100; xp += 75
            if "Darpan" in self.data["profile"].get("owned_items", []):
                try:
                    actual_score = float(log.get("Study_T_Score", 0))
                    predicted_score = float(log.get("Study_T_Predicted", 0))
                    if predicted_score > 0:
                        if actual_score < (predicted_score * 0.8):
                            lock_date = str(date.today() + timedelta(days=3))
                            self.data["profile"]["armory_lock_until"] = lock_date
                            msg.showerror("DARPAN SHATTERED", f"Delusion Detected.\nPredicted: {predicted_score} | Actual: {actual_score}\nThe Mirror has judged you. Armory sealed for 3 days.")
                except Exception as e: print(f"Darpan Math Error: {e}")
            
            if "Kurukshetra" in self.data["profile"].get("owned_items", []):
                try:
                    total_marks = float(log.get("Study_T_Total", 300))
                    actual_score = float(log.get("Study_T_Score", 0))
                    predicted_score = float(log.get("Study_T_Predicted", 0))
                    wager = int(log.get("Study_T_Wager", 0))
                    if wager > 0 and total_marks > 0:
                        pred_percentage = (predicted_score / total_marks) * 100
                        mult = 1.5
                        if pred_percentage >= 90: mult = 5.0
                        elif pred_percentage >= 75: mult = 3.0
                        if actual_score >= predicted_score:
                            payout = int(wager * mult)
                            arka += payout
                            msg.showinfo("WAR ROOM VICTORY", f"Target Hit! House pays {mult}x.\n+{payout} Arka.")
                        else:
                            current_arka = self.data["profile"].get("arka", 0)
                            if wager <= current_arka: arka -= wager
                            else:
                                deficit = wager - current_arka
                                arka -= current_arka 
                                if "rin_mukti" not in self.data["profile"]["bank"]: self.data["profile"]["bank"]["rin_mukti"] = {"active": True, "debt": 0}
                                self.data["profile"]["bank"]["rin_mukti"]["debt"] += deficit
                                self.data["profile"]["bank"]["rin_mukti"]["active"] = True
                                msg.showwarning("DEVASTATING DEFEAT", f"MARGIN CALL TRIGGERED.\nYou wagered {wager} but only had {current_arka}.\nYou are now in Rin-Mukti Debt for {deficit} Arka.")
                except Exception as e: print(f"Kurukshetra Math Error: {e}")

        if "Surya-Tejas" in self.data["profile"].get("owned_items", []):
            if log.get("Sleep_WokeEarly") == "Yes":
                self.data["profile"]["solar_charge"] += 1
                if self.data["profile"]["solar_charge"] == 3 and not self.data["profile"]["solar_ignited"]:
                    self.data["profile"]["solar_ignited"] = True
                    msg.showinfo("DAWN BLADE IGNITED", "3 Days of waking early.\nSurya-Tejas is active. Permanent 1.5x Multiplier engaged.")
            else:
                if self.data["profile"]["solar_ignited"] or self.data["profile"]["solar_charge"] > 0:
                    self.data["profile"]["solar_ignited"] = False
                    self.data["profile"]["solar_charge"] = 0
                    sloth_penalty = 500
                    self.data["profile"]["arka"] = max(0, self.data["profile"].get("arka", 0) - sloth_penalty)
                    msg.showwarning("DAWN BLADE SHATTERED", f"You slept in. Surya-Tejas multiplier lost.\nSloth Penalty: -{sloth_penalty} Arka.")
            if self.data["profile"].get("solar_ignited"):
                arka = int(arka * 1.5)
                xp = int(xp * 1.5)

        if log.get("Mrityunjaya_Active") == "Yes":
            arka = arka * 5
            xp = xp * 5    

        return xp, arka

    def save_and_generate(self):
        try:
            today, tomorrow = str(date.today()), str(date.today() + timedelta(days=1))
            
            # --- 1. SAVE CURRENT UI STATE ---
            current_ui_data = {k: v.get() for k, v in self.vars.items() if v.get() != ""}
            if today not in self.data["history"]: self.data["history"][today] = {}
            self.data["history"][today].update(current_ui_data)
            
            log = self.data["history"][today]
            
            # --- 2. CALCULATE INCREMENTAL REWARDS ---
            new_xp, new_arka = self.calculate_daily_rewards(log)
            old_xp, old_arka = log.get("Daily_XP_Awarded", 0), log.get("Daily_Arka_Awarded", 0)
            
            xp_gain = new_xp - old_xp
            arka_gain = new_arka - old_arka
            
            self.data["profile"]["xp"] = max(0, self.data["profile"]["xp"] + xp_gain)
            self.data["profile"]["arka"] = max(0, self.data["profile"]["arka"] + arka_gain)

            log["Daily_XP_Awarded"] = new_xp
            log["Daily_Arka_Awarded"] = new_arka

            # --- 3. THE SOVEREIGN ENFORCEMENT ENGINE (EXACTLY ONCE PER DAY) ---
            bank = self.data["profile"].get("bank", {})
            total_deductions = 0
            alert_messages = []

            # THIS FLAG PREVENTS THE SILENT INFINITE TAX BUG
            if not log.get("Economy_Ticked", False):
                
                # A. Legacy Backlogs
                for bl in self.data["profile"].get("backlogs", []):
                    bl["days"] += 1
                    bl["bounty"] += 20 

                tax_taken = sum(50 for bl in self.data["profile"].get("backlogs", []) if bl.get("days", 0) > 7)
                
                # B. Drishti V2 Backlogs
                if "drishti_v2" in self.data["profile"]:
                    for subj in self.data["profile"]["drishti_v2"].values():
                        for chap in subj.values():
                            for bl in chap:
                                bl["days"] = bl.get("days", 0) + 1
                                bl["bounty"] = bl.get("bounty", 100) + 20
                                if bl.get("days", 0) > 7:
                                    tax_taken += 50
                                    
                if tax_taken > 0:
                    if bank.get("savings", 0) >= tax_taken: 
                        bank["savings"] -= tax_taken
                        alert_messages.append(f"Ajnana Tax: -{tax_taken} (Deducted from Savings)")
                    else: 
                        self.data["profile"]["arka"] = max(0, self.data["profile"]["arka"] - tax_taken)
                        total_deductions += tax_taken
                        alert_messages.append(f"Ajnana Tax: -{tax_taken} Arka (Overdue Backlogs!)")

                # C. Vidya-Stocks
                if "stocks" in bank:
                    import random
                    from datetime import datetime
                    today_obj = datetime.strptime(today, "%Y-%m-%d").date()
                    for tck in ["PHYS", "CHEM", "MATH"]:
                        current_price = bank["stocks"][tck]["price"]
                        last_studied_str = bank["stocks"][tck].get("last_studied", today)
                        last_studied_obj = datetime.strptime(last_studied_str, "%Y-%m-%d").date()
                        if log.get(f"Study_{tck}_Achieved") == "Yes":
                            growth = random.uniform(1.05, 1.15)
                            bank["stocks"][tck]["price"] = int((current_price + 5) * growth)
                            bank["stocks"][tck]["last_studied"] = today 
                        else:
                            days_ignored = (today_obj - last_studied_obj).days
                            if days_ignored >= 2:
                                decay = random.uniform(0.70, 0.85) 
                                bank["stocks"][tck]["price"] = max(1, int(current_price * decay))

                # D. Brahmacharya Trust
                if bank.get("trust", {}).get("active"):
                    waste_used = log.get("Laptop_Waste") == "Yes"
                    if not waste_used: bank["trust"]["balance"] = int(bank["trust"]["balance"] * 1.05) 
                    else:
                        bank["trust"]["strikes"] += 1
                        strike_count = bank["trust"]["strikes"]
                        if strike_count == 1: bank["trust"]["balance"] = int(bank["trust"]["balance"] * 0.70) 
                        elif strike_count == 2: bank["trust"]["balance"] = int(bank["trust"]["balance"] * 0.40) 
                        elif strike_count >= 3: 
                            bank["trust"] = {"active": False, "balance": 0, "strikes": 0} 
                            alert_messages.append("TRUST BURNED: 3 Strikes Hit.")

                # E. Shani's Audit
                total_wealth = self.data["profile"]["arka"] + bank.get("savings", 0)
                if total_wealth > 25000:
                    graph_data = self.get_graph_data(15)
                    avg_score = sum(graph_data) / len(graph_data) if graph_data else 0
                    if avg_score >= 7.0: 
                        reward = int(total_wealth * 0.05)
                        self.data["profile"]["arka"] += reward
                        alert_messages.append(f"Shani's Blessing: +{reward} Arka")
                    elif avg_score < 5.0: 
                        self.data["profile"]["shani_freeze_until"] = str(date.today() + timedelta(days=3))
                        alert_messages.append("SHANI'S AUDIT: Armory Frozen (Avg < 5.0)")

                # F. Kalpa-Vriksha
                kv = bank.get("kalpa_vriksha", {})
                if kv.get("active"):
                    if log.get("Study_Achieved") == "No" or log.get("Laptop_Waste") == "Yes":
                        penalty = int(kv["principal"] * 0.50)
                        bank["kalpa_vriksha"] = {"active": False, "principal": 0, "days_locked": 0, "target_days": 0}
                        alert_messages.append(f"KALPA-VRIKSHA SHATTERED: -{penalty} Arka (Principal Burned)")
                    else:
                        bank["kalpa_vriksha"]["days_locked"] += 1
                        if bank["kalpa_vriksha"]["days_locked"] >= bank["kalpa_vriksha"]["target_days"]:
                            payout = int(kv["principal"] * (1.08 ** kv["target_days"])) 
                            self.data["profile"]["arka"] += payout
                            bank["kalpa_vriksha"] = {"active": False, "principal": 0, "days_locked": 0, "target_days": 0}
                            alert_messages.append(f"KALPA-VRIKSHA MATURED: +{payout} Arka")

                # G. Rin-Mukti
                if bank.get("rin_mukti", {}).get("debt", 0) > 0:
                    bank["rin_mukti"]["debt"] = int(bank["rin_mukti"]["debt"] * 1.05) 
                    if self.data["profile"]["arka"] + bank.get("savings", 0) < bank["rin_mukti"]["debt"]:
                        self.data["profile"]["shani_freeze_until"] = str(date.today() + timedelta(days=2))

                # H. Standard Loan & Sannyasa
                if bank.get("loan", 0) > 0: bank["loan"] = int(bank["loan"] * 1.02)      
                if bank.get("sannyasa_nidhi", 0) > 0: bank["sannyasa_nidhi"] = int(bank["sannyasa_nidhi"] * 1.01) 

                # I. Options Expiration
                surviving_options = []
                for opt in bank.get("vidya_options", []):
                    if opt["expiry_date"] <= today:
                        current_price = bank["stocks"][opt["ticker"]]["price"]
                        if current_price >= opt["strike_price"]:
                            payout = opt["wager"] * 5
                            self.data["profile"]["arka"] += payout
                            alert_messages.append(f"OPTION EXECUTED: +{payout} Arka")
                        else:
                            alert_messages.append(f"OPTION EXPIRED: {opt['ticker']} CALL burned.")
                    else: surviving_options.append(opt)
                bank["vidya_options"] = surviving_options
                
                # Lock the economy tick for today
                log["Economy_Ticked"] = True

            # --- SUDARSHAN GRACE (Evaluated Live) ---
            if self.data["profile"].get("sudarshan_grace"):
                if self.calculate_prana() < 20: 
                    alert_messages.append("SUDARSHAN INTERVENTION: Prana Saved. Grace Consumed.")
                    log["Mindset_State"] = "SAVED BY GRACE"
                    self.data["profile"]["sudarshan_grace"] = False

            self.save_data_state()

            # --- 4. HARDENED OMNI-DATA PDF GENERATION ENGINE ---
            class DarkPDF(FPDF):
                def header(self):
                    self.set_fill_color(10, 10, 12)
                    self.rect(0, 0, 210, 297, 'F')
                    
            pdf = DarkPDF()
            pdf.set_auto_page_break(auto=True, margin=15)
            
            BG_COLOR = (10, 10, 12)
            CARD_BG = (22, 22, 26)
            BORDER_COLOR = (45, 45, 55)
            ACCENT_BLUE = (59, 130, 246)
            ACCENT_GREEN = (16, 185, 129)
            ACCENT_GOLD = (251, 191, 36)
            ACCENT_RED = (239, 68, 68)
            ACCENT_PURP = (168, 85, 247)
            TEXT_PRI = (240, 240, 240)
            TEXT_SEC = (140, 140, 140)
            
            if "Darpan" in self.data["profile"].get("owned_items", []):
              if "Study_Achieved" in self.vars and self.vars["Study_Achieved"].get() == "No":
                dialog = ctk.CTkInputDialog(text="DARPAN ACTIVE: You failed your main study target today.\nTo lock the grid, you must face the mirror.\n\nType exactly: I accept my mediocrity", title="MIRROR OF TRUTH")
                answer = dialog.get_input()
                if answer != "I accept my mediocrity":
                    msg.showerror("DENIED", "You cannot lie to the mirror. Save aborted. Face the truth.")
                    return 
        
            def check_page_break(required_height=25):
                if pdf.get_y() + required_height > 280:
                    pdf.add_page()

            def new_page(title, subtitle, color):
                pdf.add_page()
                pdf.set_font("Arial", 'B', 24)
                pdf.set_text_color(*color)
                pdf.set_x(10)
                pdf.cell(190, 15, f" {title.upper()}", ln=True)
                pdf.set_font("Arial", 'B', 10)
                pdf.set_text_color(*TEXT_SEC)
                pdf.set_x(10)
                pdf.cell(190, 5, f"   {subtitle.upper()}", ln=True)
                pdf.set_draw_color(*color)
                pdf.set_line_width(0.5)
                pdf.line(12, pdf.get_y() + 2, 198, pdf.get_y() + 2)
                pdf.ln(10)

            def draw_stat_row(data_list, title=""):
                if not data_list: return
                check_page_break(30)
                pdf.set_x(10)
                if title:
                    pdf.set_font("Arial", 'B', 10)
                    pdf.set_text_color(*TEXT_SEC)
                    pdf.cell(190, 8, f" {title.upper()}", ln=True)
                
                w = 190 / len(data_list)
                y = pdf.get_y()
                
                # --- FIX 1: Dynamic Height Calculation ---
                pdf.set_font("Arial", 'B', 10) # Set font to calculate true width
                max_h = 22
                for label, val in data_list:
                    v_str = str(val)
                    text_lines = v_str.split('\n')
                    total_lines = 0
                    for line in text_lines:
                        # Calculate how many times this line will wrap
                        width = pdf.get_string_width(line)
                        total_lines += int(width / (w - 4)) + 1
                    
                    # 9 (padding top) + line height * total_lines
                    req_h = 9 + (total_lines * 4)
                    if req_h > max_h:
                        max_h = req_h

                pdf.set_fill_color(*CARD_BG)
                pdf.set_draw_color(*BORDER_COLOR)
                pdf.set_line_width(0.2)
                
                start_x = 10
                actual_max_y = y + max_h
                
                for i, (label, val) in enumerate(data_list):
                    x = start_x + (i * w)
                    pdf.set_xy(x, y)
                    
                    # Draw the dynamically sized background box
                    pdf.rect(x, y, w - 2, max_h, 'FD')
                    
                    pdf.set_font("Arial", 'B', 8)
                    pdf.set_text_color(120, 120, 120)
                    pdf.text(x + 3, y + 5, str(label).upper()[:30]) 
                    
                    pdf.set_font("Arial", 'B', 10)
                    v_str = str(val) 
                    if v_str in ["Yes", "Pass", "Meet"]: pdf.set_text_color(*ACCENT_GREEN)
                    elif v_str in ["No", "Fail"]: pdf.set_text_color(*ACCENT_RED)
                    elif v_str == "Exceed": pdf.set_text_color(*ACCENT_BLUE)
                    else: pdf.set_text_color(*TEXT_PRI)
                    
                    pdf.set_xy(x + 2, y + 7)
                    pdf.multi_cell(w - 4, 4, v_str, border=0, align="L")
                    
                    # Track if multi_cell pushed FPDF further down than our calculation
                    if pdf.get_y() > actual_max_y:
                        actual_max_y = pdf.get_y()
                
                # --- FIX 2: Set cursor safely beneath the lowest element ---
                pdf.set_xy(start_x, actual_max_y + 4)

            def draw_text_block(label, text):
                if not text or str(text).strip() == "": return
                check_page_break(25)
                pdf.set_font("Arial", 'B', 10)
                pdf.set_text_color(*TEXT_SEC)
                pdf.set_x(10)
                pdf.cell(190, 8, f" {label.upper()}", ln=True)
                pdf.set_font("Arial", '', 10)
                pdf.set_text_color(*TEXT_PRI)
                pdf.set_fill_color(*CARD_BG)
                pdf.set_draw_color(*BORDER_COLOR)
                pdf.set_x(10)
                pdf.multi_cell(190, 8, f" {text}", border=1, fill=True)
                pdf.ln(5)

            def draw_mission_list(section_name, tasks_data, accent_color):
                if not tasks_data: return
                check_page_break(20)
                pdf.set_font("Arial", 'B', 14)
                pdf.set_text_color(*accent_color)
                pdf.set_x(10)
                pdf.cell(190, 10, f">> {section_name.upper()}", ln=True)
                w_box = 25
                w_text = 190 - w_box
                for task, status in tasks_data:
                    check_page_break(15)
                    pdf.set_fill_color(*CARD_BG)
                    pdf.set_draw_color(*BORDER_COLOR)
                    
                    if status in ["Yes", "Checkbox", "Pass", "Meet"]:
                        stat_icon = "[ V ]"
                        pdf.set_text_color(*ACCENT_GREEN)
                    elif status in ["No", "Pending", "Fail"]:
                        stat_icon = "[ X ]"
                        pdf.set_text_color(*ACCENT_RED)
                    elif status in ["Exceed"]:
                        stat_icon = "[ + ]"
                        pdf.set_text_color(*ACCENT_BLUE)
                    else:
                        stat_icon = f"[{str(status)[:10]}]"
                        pdf.set_text_color(*ACCENT_GOLD)
                        
                    pdf.set_font("Arial", 'B', 11)
                    x, y = 10, pdf.get_y()
                    pdf.set_xy(x, y)
                    pdf.cell(w_box, 10, stat_icon, border=1, align="C", fill=True)
                    pdf.set_font("Arial", '', 10)
                    pdf.set_text_color(*TEXT_PRI)
                    pdf.set_xy(x + w_box, y)
                    pdf.multi_cell(w_text, 10, f" {task}", border=1, fill=True)
                    pdf.ln(2)
                pdf.ln(5)

            new_page("Daily Overview", f"DATE: {today} | RANK: {self.get_rank_info()[0]}", ACCENT_GOLD)
            draw_stat_row([("XP Earned Today", log.get("Daily_XP_Awarded", 0)), ("Arka Earned Today", log.get("Daily_Arka_Awarded", 0))], "ECONOMY GAINS")
            
            new_page("Mindset Module", "COGNITIVE STATE & ENERGY", ACCENT_BLUE)
            draw_stat_row([("Mood Level", f"{log.get('Mindset_Mood', '-')}/5"), ("Energy Level", f"{log.get('Mindset_Energy', '-')}/5")], "MINDSET METRICS")
            draw_text_block("State of Mind", log.get("Mindset_State"))

            new_page("AFAC Protocol", "EMERGENCY RESET TRIGGER", ACCENT_RED)
            draw_stat_row([("AFAC Triggered?", log.get("AFAC_Used", "No")), ("Trusted Facts", log.get("AFAC_Trust", "No")), ("Went Outdoor", log.get("AFAC_Outdoor", "No"))], "AFAC PROTOCOL")
            draw_stat_row([("Water Mouth", log.get("AFAC_Mouth", "No")), ("Cold Face", log.get("AFAC_Face", "No")), ("Took Action", log.get("AFAC_Action", "No"))], "AFAC TACTICS")
            draw_text_block("Why was AFAC triggered?", log.get("AFAC_Why"))
            draw_text_block("AFAC Action Taken", log.get("AFAC_Action_Notes"))

            new_page("Daily Rituals & Devotion", "MORNING PROTOCOLS", ACCENT_PURP)
            draw_stat_row([("Woke < 6:30", log.get("Devo_Woke", "No")), ("Early Bath", log.get("Devo_Bath", "No")), ("God Prayer", log.get("Devo_Prayer", "No"))], "MORNING RITUALS")
            draw_stat_row([("Chalisa", log.get("Devo_Chalisa", "No")), ("Reject Fail", log.get("Devo_Failure", "No")), ("Temple", log.get("Devo_Temple", "No"))], "DEVOTION")
            draw_stat_row([("Eye Wash", log.get("Devo_Health", "No")), ("Morning Water", log.get("Devo_water", "No"))], "MORNING HEALTH")
            draw_text_block("Morning Energy", log.get("Devo_Woke_Notes"))
            draw_text_block("Bath Freshness", log.get("Devo_Bath_Exp"))
            draw_text_block("Prayer Realization", log.get("Devo_Prayer_Notes"))
            draw_text_block("Failure Strategy", log.get("Devo_Failure_Notes"))

            new_page("Sleep Module", "RECOVERY & REST METRICS", ACCENT_BLUE)
            draw_stat_row([("Slept At", log.get("Sleep_SleptAt", "-")), ("Woke At", log.get("Sleep_WokeAt", "-")), ("Total Hours", log.get("Sleep_Hours", "-"))], "SLEEP TIMING")
            draw_stat_row([("Slept < 11:00", log.get("Sleep_SleptEarly", "No")), ("Out of bed in 10m", log.get("Sleep_Out10m", "No")), ("Overall Rating", log.get("Sleep_Rating", "-"))], "SLEEP QUALITY")
            draw_text_block("Post Sleep Mindset", log.get("Sleep_Mindset"))
            draw_text_block("Sleep Analysis & Notes", log.get("Sleep_FinalNotes"))

            new_page("Study Module", "ACADEMIC EXECUTION", ACCENT_GREEN)
            draw_text_block("Today's Target", log.get("Study_Target"))
            draw_stat_row([("Target Achieved", log.get("Study_Achieved", "No")), ("Total Hrs", log.get("Study_TotalHrs", "0")), ("Self Study", log.get("Study_SelfHrs", "0")), ("Class Hrs", log.get("Study_ClassHrs", "0"))], "ACADEMIC LOAD")
            draw_text_block("Target Reflection / Analysis", log.get("Study_Reflection"))
            if log.get("Study_TestTaken") == "Yes":
                draw_stat_row([("Questions Attempted", log.get("Study_T_Ques", "0")), ("Correct Answers", log.get("Study_T_Corr", "0")), ("Final Score", log.get("Study_T_Score", "0"))], "TEST DIAGNOSTICS")

            new_page("Laptop Discipline", "DIGITAL BOUNDARIES", ACCENT_BLUE)
            draw_stat_row([("Delayed Laptop 1hr", log.get("Laptop_Delayed", "No")), ("No Screen Before Bed", log.get("Laptop_NoScreenBed", "No")), ("Laptop Rating", log.get("Laptop_Rating", "-"))], "DIGITAL DISCIPLINE")
            draw_stat_row([("Hours Used For Study", log.get("Laptop_StudyHrs", "-")), ("AI Learning?", log.get("Laptop_AI", "No")), ("Anime?", log.get("Laptop_Anime", "No")), ("Waste Usage?", log.get("Laptop_Waste", "No"))], "USAGE METRICS")
            draw_text_block("Anime Usage Notes", log.get("Laptop_Anime_Notes"))
            draw_text_block("Waste Trigger / Identification", log.get("Laptop_Waste_Notes"))

            new_page("Health Module", "EYES & NUTRITION", ACCENT_GREEN)
            draw_stat_row([("Sunlight 10m", log.get("Eye_Sunlight", "No")), ("No Darkroom", log.get("Eye_Darkroom", "No")), ("20-20-20 Rule", log.get("Eye_2020", "No"))], "EYE HEALTH")
            draw_stat_row([("3L Water Consumed", log.get("Eye_Water", "No")), ("10 Hard-Blinks", log.get("Eye_Blink", "No"))], "HYDRATION & EYES")
            draw_text_block("Amount of Water Drunk", log.get("Eye_Water_Notes"))
            draw_stat_row([("Dal 20g", log.get("Height_Dal", "No")), ("Stretching", log.get("Height_Stretch", "No")), ("Tak 500ml", log.get("Height_Tak", "No")), ("Posture Level", f"{log.get('Height_Posture', '-')}/5")], "NUTRITION & POSTURE")
            draw_text_block("Health Affirmation", log.get("Height_Affirm_Notes"))

            new_page("Physical Training", "EXERCISE & MEDITATION METRICS", ACCENT_GOLD)
            draw_stat_row([("Exercise Done?", log.get("Ex_Done", "No")), ("Duration", log.get("Ex_Duration", "-")), ("Type", log.get("Ex_Type", "-")), ("Sweating?", log.get("Ex_Sweat", "No"))], "EXERCISE LOG")
            draw_stat_row([("Meditation Done?", log.get("Ex_Med", "No")), ("Duration", log.get("Med_Duration", "-")), ("Type", log.get("Med_Type", "-")), ("Yog Nidra Last Night?", log.get("Ex_Yog", "No"))], "MEDITATION LOG")

            new_page("Missions", f"TODAY'S EXECUTION ({today})", ACCENT_RED)
            for sec in ["Must", "Imp", "Opt"]:
                tasks = log.get(f"Tasks_{sec}", [])
                if tasks:
                    task_formatted = []
                    for i, t in enumerate(tasks):
                        t_id = f"TaskLog_{today}_{sec}_{i}"
                        res = log.get(f"{t_id}_Check", log.get(f"{t_id}_Radio", log.get(f"{t_id}_Note", "Pending")))
                        task_formatted.append((t['label'], res))
                    draw_mission_list(sec, task_formatted, ACCENT_BLUE if sec == "Must" else (ACCENT_GOLD if sec == "Imp" else TEXT_SEC))

            new_page("End of Day Debrief", "REFLECTION & MESOCYCLE STANDARDS", ACCENT_GOLD)
            draw_text_block("Main Distraction Today", log.get("Reflect_Distraction", "None logged."))
            draw_text_block("Win of the Day", log.get("Reflect_Win", "None logged."))
            draw_text_block("One Improvement For Tomorrow", log.get("Reflect_Improvement", "None logged."))
            
            meso_data = []
            for p_name, p_data in self.data["profile"].get("meso_v2", {}).items():
                if p_data.get("active"):
                    for t_name, t_data in p_data.get("tabs", {}).items():
                        day_log = t_data.get("logs", {}).get(today)
                        if day_log:
                            status = day_log.get("status") if isinstance(day_log, dict) else day_log
                            meso_data.append((f"[{p_name}] {t_name} Standard", status))
            
            if meso_data:
                draw_mission_list("MESOCYCLE STANDARDS COMPLETED TODAY", meso_data, ACCENT_PURP)

            new_page("Strategy", f"TOMORROW'S DIRECTIVES ({tomorrow})", ACCENT_GOLD)
            t_data = self.data.get("history", {}).get(tomorrow, {})
            for sec in ["Must", "Imp", "Opt"]:
                t_tasks = t_data.get(f"Tasks_{sec}", [])
                if t_tasks:
                    formatted_tomorrow = [(t['label'], "Pending") for t in t_tasks]
                    draw_mission_list(f"Tomorrow: {sec}", formatted_tomorrow, ACCENT_GOLD)

            new_page("The Vault", "RANK, ARKA & INVENTORY STATUS", ACCENT_BLUE)
            current_rank = self.get_rank_info()[0]
            draw_stat_row([("Current Rank", current_rank), ("Total XP", self.data["profile"]["xp"]), ("Available Arka", self.data["profile"]["arka"])], "SOVEREIGN STATUS")

            inv = self.data["profile"].get("inventory", {})
            inv_items = [(k, v) for k, v in inv.items() if v > 0]
            if inv_items:
                pdf.ln(5)
                pdf.set_font("Arial", 'B', 10)
                pdf.set_text_color(*TEXT_SEC)
                pdf.set_x(10)
                pdf.cell(190, 8, " BLACK MARKET CONSUMABLES", ln=True)
                for i in range(0, len(inv_items), 3):
                    chunk = inv_items[i:i+3]
                    draw_stat_row(chunk)
            else:
                draw_text_block("Black Market Consumables", "No items currently in inventory.")

            owned = self.data["profile"].get("owned_items", [])
            if owned:
                owned_str = " | ".join(owned)
                draw_text_block("Manifested Arsenal (Tejas & Siddhis)", owned_str)
            else:
                draw_text_block("Manifested Arsenal", "Armory is empty. Earn Arka to unlock.")

            if os.path.exists(SIG_PATH): 
                check_page_break(30)
                pdf.ln(15)
                pdf.set_font("Arial", 'I', 10)
                pdf.set_text_color(*TEXT_SEC)
                pdf.set_x(10)
                pdf.cell(190, 5, "Digitally Signed & Locked by Sovereign:", ln=True)
                pdf.image(SIG_PATH, x=12, y=pdf.get_y(), w=45)
            
            pdf_name = f"Log_{today}.pdf"
            pdf_path = os.path.join(BASE_DIR, pdf_name)
            pdf.output(pdf_path)
            
            # --- 5. THE NEW TRANSACTION RECEIPT POPUP ---
            net_arka_gained = arka_gain - total_deductions
            
            final_msg = f"Sovereign Grid Dossier Generated: {pdf_name}\n\n"
            final_msg += f"Base XP Earned: +{xp_gain}\n"
            final_msg += f"Base Arka Earned: +{arka_gain}\n"
            
            if total_deductions > 0:
                final_msg += f"Taxes/Penalties: -{total_deductions}\n"
                final_msg += f"NET ARKA GAINED: {net_arka_gained}\n"
            
            if alert_messages:
                final_msg += "\n--- BANK ALERTS ---\n"
                final_msg += "\n".join(alert_messages)
                
            msg.showinfo("LOCKED", final_msg)
            self.go_to_dashboard()
            
        except Exception as e: 
            msg.showerror("ERROR", f"Engine failed: {e}")
            
    # ==========================================
    # DAILY DATA TERMINALS (Fully Restored)
    # ==========================================
    def open_devotion(self):
        p = self.prepare_view("Daily Rituals & Devotion")
        self.make_any_radio(p, "1. Woke up before 6:30?", "Devo_Woke", ["Yes", "No"], "Explain the morning energy (30 words):")
        bath_f = ctk.CTkFrame(p, fg_color="transparent"); bath_f.pack(fill="x", pady=10)
        self.make_check(bath_f, "2. Early Bath Completed", "Devo_Bath")
        self.make_entry(p, "Write about your freshness/experience:", "Devo_Bath_Exp")
        self.make_any_radio(p, "3. God Prayer?", "Devo_Prayer", ["Yes", "No"], "Prayer Realization (30 words):")
        self.make_any_radio(p, "4. Hanuman Chalisa?", "Devo_Chalisa", ["Yes", "No"], "Strength felt / Thoughts (30 words):")
        self.make_any_radio(p, "5. Rejected Failure?", "Devo_Failure", ["Yes", "No", "No Risk"], "Strategy against failure (30 words):")
        self.make_any_radio(p, "6. Hanuman Temple?","Devo_Temple", ["Yes", "No"], "Bhakti/ Thoughts (30 words):")
        self.make_any_radio(p, "7. Washed eyes 3 times immediately?", "Devo_Health", ["Yes", "No"], "EYE HEALTH (30 words):")
        self.make_any_radio(p, "Water Drunk?","Devo_water", ["Yes", "No"], "Hydration (30 words):")
        
    def open_sleep(self):
        p = self.prepare_view("Sleep Module")
        time_f = ctk.CTkFrame(p, fg_color="transparent"); time_f.pack(fill="x", pady=5)
        def make_mini_entry(parent, label, key):
            f = ctk.CTkFrame(parent, fg_color="transparent"); f.pack(side="left", expand=True, fill="x", padx=5)
            ctk.CTkLabel(f, text=label, font=("Inter", 11), text_color=self.TEXT_SEC).pack()
            ctk.CTkEntry(f, textvariable=self.get_var(key), fg_color=self.BG, border_color=self.BORDER, height=28).pack(fill="x")

        make_mini_entry(time_f, "Slept at:", "Sleep_SleptAt")
        make_mini_entry(time_f, "Woke up at:", "Sleep_WokeAt")
        make_mini_entry(time_f, "Hours:", "Sleep_Hours")
        self.make_cond_radio(p, "Did you sleep forcefully?", "Sleep_Forced", "Yes", "Write about why:")
        self.make_dropdown(p, "Sleep Rating:", "Sleep_Rating", ["Great", "Good", "Okay", "Bad", "Worse"])
        self.make_entry(p, "Post sleep mindset:", "Sleep_Mindset")

        check_f = ctk.CTkFrame(p, fg_color="transparent"); check_f.pack(fill="x", pady=10)
        c1 = ctk.CTkCheckBox(check_f, text="Woke < 6:30", variable=self.get_var("Sleep_WokeEarly", "No"), onvalue="Yes", offvalue="No", font=("Inter", 11)); c1.pack(side="left", expand=True)
        c2 = ctk.CTkCheckBox(check_f, text="Slept < 11:00", variable=self.get_var("Sleep_SleptEarly", "No"), onvalue="Yes", offvalue="No", font=("Inter", 11)); c2.pack(side="left", expand=True)
        c3 = ctk.CTkCheckBox(check_f, text="Out in 10m", variable=self.get_var("Sleep_Out10m", "No"), onvalue="Yes", offvalue="No", font=("Inter", 11)); c3.pack(side="left", expand=True)

        ctk.CTkLabel(p, text="Sleep Analysis / Notes (50 words):", font=("Inter", 12), text_color=self.CYBER_BLUE).pack(anchor="w", pady=(15, 0))
        tb = ctk.CTkTextbox(p, height=100, fg_color=self.BG, border_color=self.BORDER, border_width=1); tb.pack(fill="x", pady=5)
        note_var = self.get_var("Sleep_FinalNotes")
        tb.insert("1.0", note_var.get())
        tb.bind("<KeyRelease>", lambda e: note_var.set(tb.get("1.0", "end-1c")))

    def open_study(self):
        p = self.prepare_view("Study Module")
        
        subjects_frame = ctk.CTkFrame(p, fg_color="transparent")
        subjects_frame.pack(fill="x", pady=5)
        
        for subj in ["PHYS", "CHEM", "MATH"]:
            sf = ctk.CTkFrame(subjects_frame, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=10)
            sf.pack(fill="x", pady=10, padx=5, ipadx=10, ipady=10)
            ctk.CTkLabel(sf, text=f"◈ {subj} TARGET", font=self.SUB_FONT, text_color=self.CYBER_BLUE).pack(anchor="w")
            ctk.CTkEntry(sf, textvariable=self.get_var(f"Study_{subj}_Target"), width=600, placeholder_text=f"Enter specific {subj} mission...").pack(anchor="w", pady=5)
            
            radio_f = ctk.CTkFrame(sf, fg_color="transparent")
            radio_f.pack(fill="x", pady=5)
            ctk.CTkLabel(radio_f, text="Objective Met?", font=("Inter", 12, "bold"), text_color=self.TEXT_SEC, width=120, anchor="w").pack(side="left")
            ctk.CTkRadioButton(radio_f, text="Yes", variable=self.get_var(f"Study_{subj}_Achieved", "No"), value="Yes", fg_color=self.EMERALD).pack(side="left", padx=10)
            ctk.CTkRadioButton(radio_f, text="No", variable=self.get_var(f"Study_{subj}_Achieved", "No"), value="No", fg_color="#ef4444").pack(side="left")
            
            ctk.CTkLabel(sf, text=f"{subj} Analysis / Reflection:", font=("Inter", 10), text_color=self.TEXT_SEC).pack(anchor="w", pady=(10, 0))
            tb = ctk.CTkTextbox(sf, height=60, fg_color=self.BG, border_color=self.BORDER, border_width=1)
            tb.pack(fill="x", pady=5)
            analysis_var = self.get_var(f"Study_{subj}_Analysis")
            tb.insert("1.0", analysis_var.get())
            tb.bind("<KeyRelease>", lambda e, v=analysis_var, t=tb: v.set(t.get("1.0", "end-1c")))

        hrs_f = ctk.CTkFrame(p, fg_color="transparent")
        hrs_f.pack(fill="x", pady=10)
        def make_study_entry(parent, label, key):
            f = ctk.CTkFrame(parent, fg_color="transparent"); f.pack(side="left", expand=True, fill="x", padx=5)
            ctk.CTkLabel(f, text=label, font=("Inter", 11), text_color=self.TEXT_SEC).pack()
            ctk.CTkEntry(f, textvariable=self.get_var(key), fg_color=self.BG, border_color=self.BORDER, height=28).pack(fill="x")

        make_study_entry(hrs_f, "Total Hours", "Study_TotalHrs")
        make_study_entry(hrs_f, "Self Study", "Study_SelfHrs")
        make_study_entry(hrs_f, "Class Hours", "Study_ClassHrs")

        test_var = self.get_var("Study_TestTaken", "No")
        test_radio_f = ctk.CTkFrame(p, fg_color="transparent"); test_radio_f.pack(fill="x", pady=(20, 5))
        ctk.CTkLabel(test_radio_f, text="Test Taken?", font=("Inter", 12, "bold"), text_color=self.CYBER_BLUE, width=120, anchor="w").pack(side="left")
        
        table_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=10)
        def draw_table():
            for widget in table_f.winfo_children(): widget.destroy()
            headers = ["Questions", "Correct", "Incorrect", "Score"]
            keys = ["Study_T_Ques", "Study_T_Corr", "Study_T_Incorr", "Study_T_Score"]
            for i, head in enumerate(headers):
                ctk.CTkLabel(table_f, text=head, font=("Inter", 10, "bold"), text_color=self.TEXT_SEC).grid(row=0, column=i, padx=12, pady=5)
                ctk.CTkEntry(table_f, textvariable=self.get_var(keys[i]), width=70, height=25, fg_color=self.BG).grid(row=1, column=i, padx=5, pady=5)

            if "Kurukshetra" in self.data["profile"].get("owned_items", []):
                wager_f = ctk.CTkFrame(table_f, fg_color="#1a0505", border_color="#ef4444", border_width=2, corner_radius=10)
                wager_f.grid(row=2, column=0, columnspan=4, pady=15, padx=10, ipadx=10, ipady=10)
                ctk.CTkLabel(wager_f, text="⚔️ KURUKSHETRA: THE WAR ROOM", font=("Inter", 14, "bold"), text_color="#ef4444").pack(pady=5)
                ctk.CTkLabel(wager_f, text="High predictions yield massive multipliers. Failure triggers the Humiliation Tax.", font=("Inter", 10), text_color=self.TEXT_SEC).pack(pady=(0,10))
                
                input_f = ctk.CTkFrame(wager_f, fg_color="transparent")
                input_f.pack()
                ctk.CTkLabel(input_f, text="Total Exam Marks:", font=("Inter", 10, "bold")).grid(row=0, column=0, padx=5)
                ctk.CTkEntry(input_f, textvariable=self.get_var("Study_T_Total", "300"), width=60, height=25).grid(row=0, column=1, padx=5)
                
                ctk.CTkLabel(input_f, text="Predicted Score:", font=("Inter", 10, "bold")).grid(row=0, column=2, padx=5)
                ctk.CTkEntry(input_f, textvariable=self.get_var("Study_T_Predicted", "0"), width=60, height=25).grid(row=0, column=3, padx=5)
                
                ctk.CTkLabel(input_f, text="Wager (Arka):", font=("Inter", 10, "bold"), text_color="#fbbf24").grid(row=0, column=4, padx=5)
                ctk.CTkEntry(input_f, textvariable=self.get_var("Study_T_Wager", "0"), width=70, height=25, text_color="#fbbf24").grid(row=0, column=5, padx=5)

        def toggle_test():
            if test_var.get() == "Yes": draw_table(); table_f.pack(fill="x", pady=10)
            else: table_f.pack_forget()

        ctk.CTkRadioButton(test_radio_f, text="Yes", variable=test_var, value="Yes", command=toggle_test).pack(side="left", padx=10)
        ctk.CTkRadioButton(test_radio_f, text="No", variable=test_var, value="No", command=toggle_test).pack(side="left")
        toggle_test()
        
    def open_mindset(self): 
        p = self.prepare_view("Mindset Module")
        self.make_entry(p, "State of mind:", "Mindset_State")
        self.make_dropdown(p, "Mood:", "Mindset_Mood", ["1","2","3","4","5"])
        self.make_dropdown(p, "Energy:", "Mindset_Energy", ["1","2","3","4","5"])
        
    def open_laptop(self):
        p = self.prepare_view("Laptop Discipline")
        self.make_check(p, "Delayed laptop for 1 hour after waking up", "Laptop_Delayed")
        self.make_entry(p, "Hours used for study:", "Laptop_StudyHrs")
        self.make_cond_radio(p, "AI Learning?", "Laptop_AI", "Yes", "Write about it (30 words):")
        self.make_cond_radio(p, "Anime?", "Laptop_Anime", "Yes", "Write about it (30 words):")
        self.make_cond_radio(p, "Waste Usage?", "Laptop_Waste", "Yes", "Identify trigger/waste (30 words):")
        self.make_check(p, "No screen for 30 min before sleeping [last night]", "Laptop_NoScreenBed")
        self.make_dropdown(p, "Laptop Rating:", "Laptop_Rating", ["Perfect", "Good", "Okay", "Bad", "Extremely Bad"])
        
    def open_afac(self):
        p = self.prepare_view("AFAC Protocol")
        afac_used_var = self.get_var("AFAC_Used", "No")
        trigger_f = ctk.CTkFrame(p, fg_color="transparent"); trigger_f.pack(fill="x", pady=10)
        ctk.CTkLabel(trigger_f, text="AFAC RULE USED?", font=("Inter", 14, "bold"), text_color=self.EMERALD, width=150, anchor="w").pack(side="left")

        main_hidden_f = ctk.CTkFrame(p, fg_color="transparent")
        def toggle_main():
            if afac_used_var.get() == "Yes": main_hidden_f.pack(fill="both", expand=True, pady=10)
            else: main_hidden_f.pack_forget()

        ctk.CTkRadioButton(trigger_f, text="Yes", variable=afac_used_var, value="Yes", command=toggle_main, fg_color=self.CYBER_BLUE).pack(side="left", padx=10)
        ctk.CTkRadioButton(trigger_f, text="No", variable=afac_used_var, value="No", command=toggle_main, fg_color=self.CYBER_BLUE).pack(side="left")

        ctk.CTkLabel(main_hidden_f, text="WHY? (30 words):", font=("Inter", 12), text_color=self.TEXT_SEC).pack(anchor="w", pady=(5,0))
        tb_why = ctk.CTkTextbox(main_hidden_f, height=60, fg_color=self.BG, border_color=self.BORDER, border_width=1); tb_why.pack(fill="x", pady=5)
        why_var = self.get_var("AFAC_Why"); tb_why.insert("1.0", why_var.get())
        tb_why.bind("<KeyRelease>", lambda e: why_var.set(tb_why.get("1.0", "end-1c")))

        ctk.CTkLabel(main_hidden_f, text="THE 'HOW' PROTOCOL", font=("Inter", 12, "bold"), text_color=self.CYBER_BLUE).pack(anchor="w", pady=(20,10))
        self.make_check(main_hidden_f, "Trusted Krishna and facts", "AFAC_Trust")
        self.make_check(main_hidden_f, "Went outdoor", "AFAC_Outdoor")
        self.make_check(main_hidden_f, "Drunk water and kept it in mouth", "AFAC_Mouth")
        self.make_check(main_hidden_f, "Washed face with cold water", "AFAC_Face")
        self.make_cond_radio(main_hidden_f, "Took action?", "AFAC_Action", "Yes", "Write about the action (30 words):")
        toggle_main()
        
    def open_health(self):
        p = self.prepare_view("Health Module")
        tabs = ctk.CTkTabview(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1); tabs.pack(fill="both", expand=True, pady=10)
        t_eye = tabs.add("Eye Health")
        t_height = tabs.add("Height")
        t_ex = tabs.add("Exercise")

        self.make_check(t_eye, "Sunlight exposure for 10 min", "Eye_Sunlight")
        self.make_check(t_eye, "Not used laptop in dark room", "Eye_Darkroom")
        self.make_cond_radio(t_eye, "20-20-20 RULE?", "Eye_2020", "Yes", "Write about it (50 words):")
        self.make_cond_radio(t_eye, "3L water consumed?", "Eye_Water", "No", "Amount of water drunk:")
        self.make_cond_radio(t_eye, "10 hard-blink?", "Eye_Blink", "Yes", "Write about it:")

        h_check_f = ctk.CTkFrame(t_height, fg_color="transparent"); h_check_f.pack(fill="x", pady=15)
        ctk.CTkCheckBox(h_check_f, text="DAL 20g", variable=self.get_var("Height_Dal", "No"), onvalue="Yes", offvalue="No", font=("Inter", 12), fg_color=self.CYBER_BLUE).pack(side="left", expand=True)
        ctk.CTkCheckBox(h_check_f, text="Stretching", variable=self.get_var("Height_Stretch", "No"), onvalue="Yes", offvalue="No", font=("Inter", 12), fg_color=self.CYBER_BLUE).pack(side="left", expand=True)
        ctk.CTkCheckBox(h_check_f, text="TAK 500ml", variable=self.get_var("Height_Tak", "No"), onvalue="Yes", offvalue="No", font=("Inter", 12), fg_color=self.CYBER_BLUE).pack(side="left", expand=True)

        self.make_dropdown(t_height, "Posture Level:", "Height_Posture", ["1", "2", "3", "4", "5"])
        self.make_cond_radio(t_height, "Affirmation?", "Height_Affirm", "Yes", "Write about it (50 words):")

        ex_var = self.get_var("Ex_Done", "No")
        lbl_ex = ctk.CTkFrame(t_ex, fg_color="transparent"); lbl_ex.pack(fill="x", pady=5)
        ctk.CTkLabel(lbl_ex, text="Exercise?", font=("Inter", 12, "bold"), text_color=self.CYBER_BLUE, width=150, anchor="w").pack(side="left")

        f_ex = ctk.CTkFrame(t_ex, fg_color=self.BG, corner_radius=10, border_color=self.BORDER, border_width=1)
        self.make_entry(f_ex, "Duration:", "Ex_Duration")
        self.make_entry(f_ex, "Type:", "Ex_Type")
        
        f_sweat = ctk.CTkFrame(f_ex, fg_color="transparent"); f_sweat.pack(fill="x", pady=5)
        ctk.CTkLabel(f_sweat, text="Sweating?", font=("Inter", 12), text_color=self.TEXT_SEC, width=150, anchor="w").pack(side="left")
        ctk.CTkRadioButton(f_sweat, text="Yes", variable=self.get_var("Ex_Sweat", "No"), value="Yes", fg_color=self.CYBER_BLUE).pack(side="left", padx=10)
        ctk.CTkRadioButton(f_sweat, text="No", variable=self.get_var("Ex_Sweat", "No"), value="No", fg_color=self.CYBER_BLUE).pack(side="left")
        
        self.make_entry(f_ex, "Time of day:", "Ex_Time")
        def check_ex():
            if ex_var.get() == "Yes": f_ex.pack(fill="x", pady=5, ipadx=10, ipady=10)
            else: f_ex.pack_forget()
        ctk.CTkRadioButton(lbl_ex, text="Yes", variable=ex_var, value="Yes", command=check_ex, fg_color=self.CYBER_BLUE).pack(side="left", padx=10)
        ctk.CTkRadioButton(lbl_ex, text="No", variable=ex_var, value="No", command=check_ex, fg_color=self.CYBER_BLUE).pack(side="left")
        check_ex()

        med_var = self.get_var("Ex_Med", "No")
        lbl_med = ctk.CTkFrame(t_ex, fg_color="transparent"); lbl_med.pack(fill="x", pady=(15, 5))
        ctk.CTkLabel(lbl_med, text="Meditation?", font=("Inter", 12, "bold"), text_color=self.CYBER_BLUE, width=150, anchor="w").pack(side="left")
        
        f_med = ctk.CTkFrame(t_ex, fg_color=self.BG, corner_radius=10, border_color=self.BORDER, border_width=1)
        self.make_entry(f_med, "Duration:", "Med_Duration")
        self.make_entry(f_med, "Type:", "Med_Type")
        def check_med():
            if med_var.get() == "Yes": f_med.pack(fill="x", pady=5, ipadx=10, ipady=10)
            else: f_med.pack_forget()
        ctk.CTkRadioButton(lbl_med, text="Yes", variable=med_var, value="Yes", command=check_med, fg_color=self.CYBER_BLUE).pack(side="left", padx=10)
        ctk.CTkRadioButton(lbl_med, text="No", variable=med_var, value="No", command=check_med, fg_color=self.CYBER_BLUE).pack(side="left")
        check_med()

        self.make_cond_radio(t_ex, "YOG NIDRA last night?", "Ex_Yog", "Yes", "Write about it:")

    # ==========================================
    # ARMORY & BLACK MARKET
    # ==========================================
    def handle_arka_purchase(self, item_name, cost, category):
        profile = self.data["profile"]
        current_arka = profile.get("arka", 0)
        if current_arka >= cost:
            profile["arka"] -= cost
            if category == "Consumable":
                if "inventory" not in profile: profile["inventory"] = {}
                profile["inventory"][item_name] = profile["inventory"].get(item_name, 0) + 1
                msg.showinfo("BLACK MARKET", f"Acquired {item_name}. It is now in your inventory.")
            else:
                if "owned_items" not in profile: profile["owned_items"] = []
                if item_name not in profile["owned_items"]: profile["owned_items"].append(item_name)
                msg.showinfo("FORGE SUCCESS", f"Manifested {item_name}.\nArka spent: {cost}")
                
            self.save_data_state()
            self.build_sidebar()
            self.open_armory()
        else: 
            msg.showerror("INSUFFICIENT ARKA", f"Not enough Arka. Need {cost - current_arka} more.")

    def open_armory(self):
        p = self.prepare_view("The Armory")
        header = ctk.CTkFrame(p, fg_color=self.PANEL, border_color="#fbbf24", border_width=1); header.pack(fill="x", pady=(0, 20))
        ctk.CTkLabel(header, text="CURRENT ARKA (ESSENCE)", font=("Inter", 11, "bold"), text_color=self.TEXT_SEC).pack(pady=(10,0))
        ctk.CTkLabel(header, text=f"{self.data['profile'].get('arka', 0)}", font=self.RANK_FONT, text_color="#fbbf24").pack(pady=(0,10))

        tabs = ctk.CTkTabview(p, fg_color="transparent", segmented_button_selected_color=self.CYBER_BLUE); tabs.pack(fill="both", expand=True)
        t_bm = tabs.add("BLACK MARKET")
        t_siddhi = tabs.add("ELITE SIDDHIS")
        t_tejas = tabs.add("TEJAS (AURAS)")

        self.build_blackmarket_tab(t_bm)
        self.build_siddhi_tab(t_siddhi)
        self.build_tejas_tab(t_tejas)

    def build_blackmarket_tab(self, parent):
        s_scroll = ctk.CTkScrollableFrame(parent, fg_color="transparent")
        s_scroll.pack(fill="both", expand=True)
        s_scroll.grid_columnconfigure((0, 1), weight=1)
        
        ctk.CTkLabel(s_scroll, text="WARNING: ONE-TIME USE CONSUMABLES", font=("Inter", 12, "bold"), text_color="#ef4444").grid(row=0, column=0, columnspan=2, pady=(10, 20))
        consumables = [
            ("Soma-Rasa", 500, "Instantly restores 30% Prana. Keeps you grinding."),
            ("Vishrama-Mudra", 2500, "Guilt-Free Rest. Freezes streak for 24 hours. No penalties."),
            ("Sanjeevani", 5000, "Retroactive fix. Allows you to complete yesterday's failed targets."),
            ("Mrityunjaya", 15000, "Resurrection Protocol. Heals Prana, wipes penalties, 5x Multiplier.") 
        ]
        for i, (name, cost, desc) in enumerate(consumables):
            owned = self.data["profile"].get("inventory", {}).get(name, 0)
            row = (i // 2) + 1
            col = i % 2
            card_color = "#1a0505" if owned > 0 else self.PANEL
            card = ctk.CTkFrame(s_scroll, fg_color=card_color, border_color="#ef4444", border_width=1, corner_radius=15)
            card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew")
            top_f = ctk.CTkFrame(card, fg_color="transparent")
            top_f.pack(fill="x", padx=15, pady=(15, 5))
            ctk.CTkLabel(top_f, text=name.upper(), font=("Inter", 16, "bold"), text_color="#ef4444").pack(side="left")
            
            if owned > 0:
                badge = ctk.CTkFrame(top_f, fg_color="#ef4444", corner_radius=5)
                badge.pack(side="right")
                ctk.CTkLabel(badge, text=f" OWNED: {owned} ", font=("Inter", 10, "bold"), text_color=self.BG).pack(padx=5, pady=2)
            
            desc_lbl = ctk.CTkLabel(card, text=desc, font=("Inter", 11), text_color=self.TEXT_SEC, wraplength=250, justify="left")
            desc_lbl.pack(padx=15, pady=5, anchor="w")
            buy_btn = ctk.CTkButton(card, text=f"BUY: {cost} ARKA", font=("Inter", 12, "bold"), fg_color="transparent", border_color="#b91c1c", border_width=2, hover_color="#b91c1c", text_color="#ef4444", height=35, command=lambda n=name, c=cost: self.handle_arka_purchase(n, c, "Consumable"))
            buy_btn.pack(padx=15, pady=(10, 15), fill="x", side="bottom")

    def build_tejas_tab(self, parent):
        s_scroll = ctk.CTkScrollableFrame(parent, fg_color="transparent"); s_scroll.pack(fill="both", expand=True)

        # --- THE RESTORE DEFAULT SWITCH ---
        def restore_default():
            self.data["profile"]["active_tejas"] = "DEFAULT"
            self.save_data_state()
            msg.showinfo("SYSTEM RESTORED", "Reverted to DEFAULT Aura.\n\nSYSTEM REBOOT REQUIRED.\nPlease close and restart the app.")
            
        top_bar = ctk.CTkFrame(s_scroll, fg_color="transparent")
        top_bar.pack(fill="x", pady=(0, 15))
        ctk.CTkButton(top_bar, text="⟲ RESTORE SYSTEM DEFAULT", font=("Inter", 12, "bold"), fg_color="#333333", hover_color="#555555", text_color="#FFFFFF", height=35, command=restore_default).pack(side="right", padx=5)
        # ----------------------------------

        auras = [
            ("AGNI-VARDHAN", 5000, "The Forge: Blazing orange and crimson. Absolute intensity for massive backlogs."),
            ("SHUNYA-AVASTHA", 7500, "The Void: Abyssal navy and glowing cyan. Zero distractions. Deep conceptual focus."),
            ("BRAHMASTRAS", 10000, "The Arsenal: Gunmetal and military green. The tactical UI for Mock Test warfare."),
            ("KALKI", 25000, "The Apex: Obsidian and pure gold. The final evolution. Only for the elite."),
            ("RUDRA", 50000, "The Destroyer: Ash grey and blood red. Absolute wartime discipline."),
            ("INDRA-JAAL", 75000, "The Matrix: Pure black and neon green. Terminal hacker isolation."),
            ("VAIKUNTHA", 150000, "The Absolute: Ivory, celestial blue, and gold. The ultimate flex of mastery.")
        ]
        
        active_tejas = self.data["profile"].get("active_tejas", "DEFAULT")
        
        for name, cost, desc in auras:
            owned_list = self.data["profile"].get("owned_items", [])
            is_owned = name in owned_list
            is_active = name == active_tejas
            border_c = self.CYBER_BLUE if is_active else self.BORDER
            
            f = ctk.CTkFrame(s_scroll, fg_color=self.PANEL, border_color=border_c, border_width=2 if is_active else 1)
            f.pack(fill="x", pady=5, padx=5)
            
            lbl_f = ctk.CTkFrame(f, fg_color="transparent")
            lbl_f.pack(side="left", padx=15, pady=10)
            
            status = "[ ACTIVE ]" if is_active else ("[ SECURED ]" if is_owned else f"COST: {cost} ARKA")
            ctk.CTkLabel(lbl_f, text=f"{name}  {status}", font=("Inter", 14, "bold"), text_color=self.CYBER_BLUE).pack(anchor="w")
            ctk.CTkLabel(lbl_f, text=desc, font=("Inter", 11), text_color=self.TEXT_SEC, wraplength=450, justify="left").pack(anchor="w")
            
            btn_f = ctk.CTkFrame(f, fg_color="transparent")
            btn_f.pack(side="right", padx=15)
            
            if not is_owned: 
                ctk.CTkButton(btn_f, text="MANIFEST", width=100, fg_color=self.CYBER_BLUE, command=lambda n=name, c=cost: self.handle_arka_purchase(n, c, "Tejas")).pack()
            elif not is_active: 
                ctk.CTkButton(btn_f, text="EQUIP", width=100, fg_color=self.EMERALD, command=lambda n=name: self.equip_tejas(n)).pack()
            else: 
                ctk.CTkLabel(btn_f, text="EQUIPPED", font=("Inter", 12, "bold"), text_color=self.EMERALD).pack()
    def build_siddhi_tab(self, parent):
        s_scroll = ctk.CTkScrollableFrame(parent, fg_color="transparent")
        s_scroll.pack(fill="both", expand=True)
        s_scroll.grid_columnconfigure((0, 1), weight=1)
        
        siddhis = [
            ("Surya-Tejas", 3000, "The Dawn Blade: Waking < 6:30 for 3 days grants a permanent 1.5x Multiplier to study rewards.", "Multiplier"),
            ("Brahma-Muhurta", 5000, "The Creator's Hour: Any Deep Work completed before 7:00 AM pays 3x Arka.", "Modifier"),
            ("Lakshman-Rekha", 4500, "Anti-Distraction: Throws 15-second presence checks while studying.", "Active"),
            ("Kurukshetra", 3000, "The Blood Wager: Bet your Arka on your mock test scores for a 3x payout.", "Wager"),
            ("Darpan", 3000, "Mirror of Truth: Locks the Armory for 3 days if your mock test score is lower than predicted.", "Anti-Ego"),
            ("Gyan-Drishti", 45000, "The Oracle: Scans your Mistake Vault. Forces an un-deletable target if you fail a topic 3 times.", "Audit")
        ]
        
        for i, (name, cost, desc, s_type) in enumerate(siddhis):
            is_owned = name in self.data["profile"].get("owned_items", [])
            row, col = i // 2, i % 2
            
            card = ctk.CTkFrame(s_scroll, fg_color=self.PANEL, border_color=self.EMERALD if is_owned else self.BORDER, border_width=1, corner_radius=15)
            card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew")
            
            top_f = ctk.CTkFrame(card, fg_color="transparent")
            top_f.pack(fill="x", padx=15, pady=(15, 0))
            
            ctk.CTkLabel(top_f, text=name.upper(), font=("Inter", 16, "bold"), text_color=self.CYBER_BLUE).pack(side="left")
            type_f = ctk.CTkFrame(top_f, fg_color=self.BORDER, corner_radius=5)
            type_f.pack(side="right")
            ctk.CTkLabel(type_f, text=f" {s_type.upper()} ", font=("Inter", 9, "bold"), text_color=self.TEXT_PRI).pack(padx=5, pady=2)
            
            ctk.CTkLabel(card, text=desc, font=("Inter", 11), text_color="#BBBBBB", wraplength=250, justify="left").pack(anchor="w", padx=15, pady=(10, 10))
            
            if is_owned: btn = ctk.CTkButton(card, text="MANIFESTED", height=35, fg_color=self.EMERALD, state="disabled")
            else: btn = ctk.CTkButton(card, text=f"FUSE: {cost} ARKA", height=35, fg_color="transparent", border_width=2, border_color=self.CYBER_BLUE, hover_color=self.CYBER_BLUE, text_color=self.CYBER_BLUE, command=lambda n=name, c=cost: self.handle_arka_purchase(n, c, "Siddhi"))
            btn.pack(padx=15, pady=(0, 15), fill="x", side="bottom")

    # ==========================================
    # MISSION PLANNING & TARGETS
    # ==========================================
    def open_tomorrow_planning(self):
        p = self.prepare_view("Tomorrow's Mission Architecture")
        
        # --- THE DAILY DEBRIEF MODULE (Mandatory Failsafe Added) ---
        ref_f = ctk.CTkFrame(p, fg_color="#1a0505", border_color="#ef4444", border_width=2, corner_radius=15)
        ref_f.pack(fill="x", pady=(0, 20), padx=10, ipadx=10, ipady=10)
        
        ctk.CTkLabel(ref_f, text="🚨 FINAL PROTOCOL: DAILY DEBRIEF", font=("Inter", 16, "bold"), text_color="#ef4444").pack(anchor="w", padx=10, pady=(10, 5))
        ctk.CTkLabel(ref_f, text="You must confront today's reality before planning tomorrow. (Mandatory)", font=("Inter", 11), text_color=self.TEXT_SEC).pack(anchor="w", padx=10, pady=(0, 15))
        
        def add_reflect_entry(parent, label, key):
            f = ctk.CTkFrame(parent, fg_color="transparent")
            f.pack(fill="x", padx=10, pady=8)
            ctk.CTkLabel(f, text=label, font=("Inter", 12, "bold"), text_color=self.TEXT_SEC, width=250, anchor="w").pack(side="left")
            ctk.CTkEntry(f, textvariable=self.get_var(key), fg_color=self.BG, border_color=self.BORDER, height=35).pack(side="left", fill="x", expand=True)

        add_reflect_entry(ref_f, "MAIN DISTRACTION TODAY:", "Reflect_Distraction")
        add_reflect_entry(ref_f, "WIN OF THE DAY:", "Reflect_Win")
        add_reflect_entry(ref_f, "1 IMPROVEMENT FOR TOMORROW:", "Reflect_Improvement")
        
        # --- TOMORROW'S TARGETS ---
        self.t_date = str(date.today() + timedelta(days=1))
        ctk.CTkLabel(p, text=f"STRATEGY FOR: {self.t_date}", font=self.UI_FONT).pack(pady=(10,0))
        self.plan_registry = {"Must": [], "Imp": [], "Opt": []}
        
        oracle_targets = []
        if "Gyan-Drishti" in self.data["profile"].get("owned_items", []):
            smriti = self.data["profile"].get("smriti_v2", {})
            recent_attempts = list(smriti.keys())[-2:]
            
            for attempt_name in recent_attempts:
                for m in smriti[attempt_name]:
                    t = m.get("topic", "").strip().upper()
                    if t: oracle_targets.append(f"[ORACLE] Fix {attempt_name}: {t}")

        sections = [("MUST TO DO", "Must"), ("IMPORTANT", "Imp"), ("OPTIONAL", "Opt")]

        for title, key in sections:
            sect_frame = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1)
            sect_frame.pack(fill="x", pady=15, padx=10)
            
            ctk.CTkLabel(sect_frame, text=f"◈ {title}", font=self.SUB_FONT, text_color=self.CYBER_BLUE).pack(anchor="w", padx=20, pady=10)
            
            if key == "Must" and oracle_targets:
                for ot in oracle_targets:
                    slot_f = ctk.CTkFrame(sect_frame, fg_color="transparent")
                    slot_f.pack(fill="x", padx=10, pady=2)
                    
                    l_var = ctk.StringVar(value=ot)
                    t_var = ctk.StringVar(value="Checkbox")
                    
                    entry = ctk.CTkEntry(slot_f, textvariable=l_var, width=300, text_color="#ef4444")
                    entry.pack(side="left", padx=5)
                    entry.configure(state="disabled") 
                    
                    seg = ctk.CTkSegmentedButton(slot_f, values=["Checkbox", "Textbox", "Radio"], variable=t_var, width=200)
                    seg.pack(side="left")
                    seg.configure(state="disabled") 
                    
                    self.plan_registry[key].append({"label": l_var, "type": t_var})

            for i in range(5):
                slot_f = ctk.CTkFrame(sect_frame, fg_color="transparent")
                slot_f.pack(fill="x", padx=10, pady=2)
                
                l_var = ctk.StringVar()
                t_var = ctk.StringVar(value="Checkbox")
                
                ctk.CTkEntry(slot_f, placeholder_text=f"Task {i+1}...", textvariable=l_var, width=300).pack(side="left", padx=5)
                ctk.CTkSegmentedButton(slot_f, values=["Checkbox", "Textbox", "Radio"], variable=t_var, width=200).pack(side="left")
                
                self.plan_registry[key].append({"label": l_var, "type": t_var})

        ctk.CTkButton(p, text="LOCK ALL MISSIONS & GENERATE PDF", font=self.HEAD_FONT, fg_color=self.EMERALD, height=60, command=self.save_tomorrow_multi).pack(pady=30, fill="x")

    def save_tomorrow_multi(self):
        # --- THE MANDATORY LOCK CHECK ---
        distraction = self.get_var("Reflect_Distraction").get().strip()
        win = self.get_var("Reflect_Win").get().strip()
        improvement = self.get_var("Reflect_Improvement").get().strip()
        
        if not distraction or not win or not improvement:
            msg.showwarning("DEBRIEF INCOMPLETE", "You cannot lock the grid until you complete the Daily Debrief.\n\nFill in your Distraction, Win, and Improvement to proceed.")
            return
            
        t_date = str(date.today() + timedelta(days=1)) 
        if "history" not in self.data: self.data["history"] = {}
        if t_date not in self.data["history"]: self.data["history"][t_date] = {}
        
        for key in ["Must", "Imp", "Opt"]:
            task_list = []
            for item in self.plan_registry[key]:
                label = item["label"].get().strip()
                if label: task_list.append({"label": label, "type": item["type"].get()})
            self.data["history"][t_date][f"Tasks_{key}"] = task_list
            
        self.save_data_state()
        self.save_and_generate()
    def open_target_page(self):
        p = self.prepare_view("Active Mission Targets")
        today, found_any = str(date.today()), False
        sections = [("MUST TO DO", "Must"), ("IMPORTANT", "Imp"), ("OPTIONAL", "Opt")]

        for title, key in sections:
            task_list = self.data.get("history", {}).get(today, {}).get(f"Tasks_{key}", [])
            if task_list:
                found_any = True
                sect_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1); sect_f.pack(fill="x", pady=10, padx=10)
                ctk.CTkLabel(sect_f, text=f"◈ {title}", font=self.SUB_FONT, text_color=self.CYBER_BLUE).pack(anchor="w", padx=20, pady=10)
                for i, task in enumerate(task_list):
                    t_id = f"TaskLog_{today}_{key}_{i}" 
                    item_f = ctk.CTkFrame(sect_f, fg_color=self.BG, corner_radius=8, border_width=1, border_color="#1A1A1A"); item_f.pack(fill="x", padx=15, pady=5, ipady=5)
                    ctk.CTkLabel(item_f, text=f"• {task['label']}", font=self.UI_BOLD).pack(anchor="w", padx=10, pady=5)
                    if task["type"] == "Checkbox": self.make_check(item_f, "MISSION ACCOMPLISHED", f"{t_id}_Check")
                    elif task["type"] == "Textbox": self.make_entry(item_f, "Field Analysis:", f"{t_id}_Note")
                    elif task["type"] == "Radio": self.make_cond_radio(item_f, "Objective Met?", f"{t_id}_Radio", "No", "Explain the obstacle:")
        
        if not found_any:
            empty_f = ctk.CTkFrame(p, fg_color="transparent"); empty_f.pack(expand=True, pady=100)
            ctk.CTkLabel(empty_f, text="◈ NO MISSIONS DETECTED ◈", font=self.HEAD_FONT, text_color=self.TEXT_SEC).pack()
            ctk.CTkLabel(empty_f, text="Plan your next day using the LOCK button on the Dashboard.", font=self.UI_FONT).pack(pady=10)
    
    # ==========================================
    # MESOCYCLE V2 (INDEPENDENT SECTIONS & TABS)
    # ==========================================
    def open_mesocycle(self):
        p = self.prepare_view("MESOCYCLE: THE 35-DAY CRUCIBLE", color="#8b5cf6")
        
        head_f = ctk.CTkFrame(p, fg_color="transparent")
        head_f.pack(fill="x", pady=(0, 20))
        
        ctk.CTkLabel(head_f, text="CURRENT STANDARD LEVELS (0-10)", font=("Inter", 16, "bold"), text_color=self.TEXT_SEC).pack(side="left")
        ctk.CTkButton(head_f, text="SECTIONS ⚙️", font=("Inter", 14, "bold"), fg_color="#8b5cf6", hover_color="#7c3aed", height=40, command=self.open_meso_sections).pack(side="right", padx=10)
        
        graph_f = ctk.CTkFrame(p, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=15)
        graph_f.pack(fill="x", padx=20, pady=10)
        
        self.meso_canvas = ctk.CTkCanvas(graph_f, bg=self.PANEL, highlightthickness=0, height=350)
        self.meso_canvas.pack(fill="x", padx=20, pady=20)
        
        self.draw_meso_graph()

    def draw_meso_graph(self):
        if not hasattr(self, 'meso_canvas') or not self.meso_canvas.winfo_exists(): return
        canvas = self.meso_canvas
        canvas.delete("all")
        
        width, height = 850, 350
        canvas.configure(width=width, height=height)
        pad_left, pad_bottom, pad_top, pad_right = 50, 40, 30, 30
        plot_w, plot_h = width - pad_left - pad_right, height - pad_bottom - pad_top
        
        # Y-Axis (0 to 10 Rating)
        for i in range(0, 11, 2):
            y_pos = pad_top + plot_h - (i / 10.0) * plot_h
            canvas.create_line(pad_left, y_pos, width - pad_right, y_pos, fill="#1A1A1A", dash=(4, 4))
            canvas.create_text(pad_left - 20, y_pos, text=str(i), fill=self.TEXT_SEC, font=("Inter", 10, "bold"))

        canvas.create_line(pad_left, pad_top, pad_left, height - pad_bottom, fill=self.BORDER, width=2)
        canvas.create_line(pad_left, height - pad_bottom, width - pad_right, height - pad_bottom, fill=self.BORDER, width=2)
        
        # Calculate the 35-Day Unified Score
        active_starts = []
        for p in self.data["profile"]["meso_v2"].values():
            if p["active"] and p["start_date"]:
                try: active_starts.append(datetime.datetime.strptime(p["start_date"], "%Y-%m-%d").date())
                except: pass
                
        if not active_starts:
            canvas.create_text(width/2, height/2, text="NO ACTIVE MESOCYCLE. LOCK PROTOCOLS TO VIEW 35-DAY DATA.", fill=self.TEXT_SEC, font=("Inter", 14, "bold"))
            return
            
        base_date = min(active_starts)
        data = []
        
        for day in range(35):
            current_date = base_date + timedelta(days=day)
            
            if current_date > date.today():
                data.append(None)
                continue
                
            total_tasks, passed_tasks = 0, 0
            
            for p in self.data["profile"]["meso_v2"].values():
                if p["active"]:
                    for t_data in p["tabs"].values():
                        if t_data.get("standards"):
                            total_tasks += 1
                            log = t_data["logs"].get(str(current_date))
                            if log:
                                status = log.get("status") if isinstance(log, dict) else log
                                if status in ["Pass", "PASS", "Meet", "Exceed", "EXCEED"]:
                                    passed_tasks += 1
                                    
            if total_tasks == 0: data.append(0)
            else: data.append(round((passed_tasks / total_tasks) * 10, 1))

        num_bars = 35
        bar_spacing = plot_w / num_bars
        bar_w = bar_spacing * 0.6 
        
        for i in range(num_bars):
            score = data[i]
            x_center = pad_left + (i * bar_spacing) + (bar_spacing / 2)
            
            # X-Axis Labels (D1, D5, D10... D35)
            if i == 0 or (i + 1) % 5 == 0:
                canvas.create_text(x_center, height - pad_bottom + 15, text=f"D{i+1}", fill=self.TEXT_SEC, font=("Inter", 8, "bold"))
            
            if score is None: continue
            
            bar_h = (score / 10.0) * plot_h
            x1, x2 = x_center - (bar_w / 2), x_center + (bar_w / 2)
            y1, y2 = pad_top + plot_h - bar_h, pad_top + plot_h
            
            if score >= 8: color = self.EMERALD
            elif score >= 5: color = "#8b5cf6" 
            else: color = "#ef4444"
                
            canvas.create_rectangle(x1, y1, x2, y2, fill=color, outline=color, width=1)
            
            if score > 0:
                canvas.create_text(x_center, y1 - 8, text=str(score), fill=color, font=("Inter", 7, "bold"))

    def open_meso_sections(self):
        p = self.prepare_view("MESOCYCLE: PROTOCOL MODULES", color="#8b5cf6")
        ctk.CTkLabel(p, text="Select a module to configure. Each module runs its own independent 35-Day cycle.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0, 5))
        
        nav_f = ctk.CTkFrame(p, fg_color="transparent")
        nav_f.pack(fill="x", padx=10)
        ctk.CTkButton(nav_f, text="← VIEW GRAPH", font=("Inter", 12, "bold"), fg_color="transparent", border_width=1, border_color="#8b5cf6", text_color="#8b5cf6", hover_color="#2d1b4e", command=self.open_mesocycle).pack(side="left")

        grid_f = ctk.CTkFrame(p, fg_color="transparent")
        grid_f.pack(fill="both", expand=True, padx=10, pady=10)
        grid_f.grid_columnconfigure(0, weight=1, uniform="a")
        grid_f.grid_columnconfigure(1, weight=1, uniform="a")

        sections = [
            ("SLEEP", "Wake & Sleep targets.", self.CYBER_BLUE),
            ("STUDY", "Class, Self-Study, Backlog, DPPs.", self.EMERALD),
            ("HEALTH", "Exercise, Meditation, Water.", self.EMERALD),
            ("LAPTOP", "YouTube, Anime, Movies, News, WEBAPP", self.CYBER_BLUE),
            ("DEVOTION", "Spiritual consistency.", "#fbbf24")
        ]

        # Automatic expiration check across all modules
        today = date.today()
        for pillar, _, _ in sections:
            p_data = self.data["profile"]["meso_v2"][pillar]
            if p_data["active"]:
                try:
                    start_date = datetime.datetime.strptime(p_data["start_date"], "%Y-%m-%d").date()
                    if (today - start_date).days >= 35:
                        p_data["active"] = False
                        self.save_data_state()
                        msg.showinfo("CYCLE COMPLETE", f"Your 35-Day cycle for {pillar} has concluded.")
                except: pass

        card_height = 190 
        active_count = sum(1 for pillar in self.data["profile"]["meso_v2"] if self.data["profile"]["meso_v2"][pillar]["active"])

        for i, (pillar, desc, color) in enumerate(sections):
            row, col = i // 2, i % 2
            is_active = self.data["profile"]["meso_v2"][pillar]["active"]
            
            card = ctk.CTkFrame(grid_f, fg_color=self.PANEL, border_color=color if is_active else self.BORDER, border_width=2 if is_active else 1, corner_radius=15, height=card_height)
            card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew")
            card.pack_propagate(False) 
            
            ctk.CTkLabel(card, text=f"◈ {pillar} PROTOCOL", font=("Inter", 16, "bold"), text_color=color).pack(anchor="w", padx=20, pady=(15, 0))
            ctk.CTkLabel(card, text=desc, font=("Inter", 11), text_color=self.TEXT_SEC).pack(anchor="w", padx=20, pady=(0, 10))
            
            if is_active:
                days_passed = min(35, (today - datetime.datetime.strptime(self.data["profile"]["meso_v2"][pillar]["start_date"], "%Y-%m-%d").date()).days + 1)
                ctk.CTkLabel(card, text="STATUS: LOCKED", font=("Inter", 12, "bold"), text_color="#ef4444").pack(anchor="w", padx=20, pady=5)
                ctk.CTkLabel(card, text=f"DAY {days_passed} OF 35", font=("Inter", 16, "bold"), text_color="#fbbf24").pack(anchor="w", padx=20)
                ctk.CTkButton(card, text="OPEN VAULT", font=("Inter", 12, "bold"), fg_color="transparent", border_color=color, border_width=1, text_color=color, hover_color="#1A1A1A", command=lambda p_name=pillar, c=color: self.open_meso_vault(p_name, c)).pack(side="bottom", pady=15, fill="x", padx=20)
            else:
                ctk.CTkLabel(card, text="STATUS: UNLOCKED", font=("Inter", 12, "bold"), text_color=self.TEXT_SEC).pack(anchor="w", padx=20, pady=15)
                ctk.CTkButton(card, text="CONFIGURE STANDARDS", font=("Inter", 12, "bold"), fg_color="#333333", text_color="#FFFFFF", hover_color="#444444", command=lambda p_name=pillar, c=color: self.open_meso_setup(p_name, c)).pack(side="bottom", pady=15, fill="x", padx=20)

        # 6th Block: Master Status
        stat_f = ctk.CTkFrame(grid_f, fg_color="transparent", height=card_height)
        stat_f.grid(row=2, column=1, padx=10, pady=10, sticky="nsew")
        stat_f.pack_propagate(False)
        ctk.CTkLabel(stat_f, text="MASTER STATUS", font=("Inter", 18, "bold"), text_color="#fbbf24").pack(pady=(40, 5))
        ctk.CTkLabel(stat_f, text=f"{active_count} / 5 PROTOCOLS ACTIVE", font=self.HEAD_FONT, text_color=self.TEXT_PRI).pack()

    def open_meso_setup(self, pillar, color, edit_mode=False):
        edit_cost = 20000
        if edit_mode:
            cycle_start = self.data["profile"]["meso_v2"][pillar].get("start_date", "")
            try:
                days_since_start = (date.today() - datetime.datetime.strptime(cycle_start, "%Y-%m-%d").date()).days
            except (ValueError, TypeError):
                days_since_start = 5
            if not 0 <= days_since_start < 5:
                msg.showerror("CHANGE WINDOW CLOSED", "Standards can only be changed during the first 5 days of the cycle.")
                self.open_meso_vault(pillar, color)
                return

        title = f"CHANGE {pillar} STANDARDS" if edit_mode else f"CONFIGURE {pillar} PROTOCOL"
        p = self.prepare_view(title, color=color)
        description = f"Changes are allowed only during the first 5 days. Saving any modified standards deducts exactly {edit_cost:,} ARKA. Existing logs and cycle dates will be preserved." if edit_mode else "Define your immutable standards below."
        ctk.CTkLabel(p, text=description, font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0, 10))
        
        nav_f = ctk.CTkFrame(p, fg_color="transparent"); nav_f.pack(fill="x", padx=10)
        ctk.CTkButton(nav_f, text="← CANCEL", font=("Inter", 12, "bold"), fg_color="transparent", border_width=1, border_color=self.BORDER, command=self.open_meso_sections).pack(side="left")

        tabs = ctk.CTkTabview(p, fg_color=self.PANEL, segmented_button_selected_color=color)
        tabs.pack(fill="both", expand=True, padx=20, pady=10)

        self.setup_vars = {} # pillar -> tab_name -> list of stringvars
        tab_dict = self.data["profile"]["meso_v2"][pillar]["tabs"]

        for t_name in tab_dict.keys():
            t_frame = tabs.add(t_name)
            self.setup_vars[t_name] = []
            
            num_entries = 1
            if t_name == "Exercise": num_entries = 7
            elif t_name == "YouTube": num_entries = 5
            elif t_name == "Anime": num_entries = 3
            elif t_name == "Movies": num_entries = 3
            elif t_name == "News": num_entries = 3
            elif t_name == "WEBAPP": num_entries = 3
            elif t_name == "Meditation": num_entries = 5
            elif pillar == "STUDY":
                if t_name == "Self Study": num_entries = 10
                elif t_name in ["DPPs", "Class", "Backlog"]: num_entries = 5

            existing_standards = tab_dict[t_name].get("standards", [])
            if edit_mode:
                num_entries = max(num_entries, len(existing_standards))

            ctk.CTkLabel(t_frame, text=f"Define strict standards for {t_name}:", font=("Inter", 14, "bold"), text_color=color).pack(pady=15)
            
            # Wrap inputs in a scrollable frame to prevent 10 fields from breaking the UI
            input_scroll = ctk.CTkScrollableFrame(t_frame, fg_color="transparent", height=350)
            input_scroll.pack(fill="both", expand=True, padx=10, pady=5)
            
            for i in range(num_entries):
                var = ctk.StringVar(value=existing_standards[i] if edit_mode and i < len(existing_standards) else "")
                self.setup_vars[t_name].append(var)
                ctk.CTkEntry(t_frame, textvariable=var, width=600, placeholder_text=f"Rule / Standard {i+1}...").pack(pady=5, ipady=5)

        def lock_pillar():
            if edit_mode:
                cycle_start = self.data["profile"]["meso_v2"][pillar].get("start_date", "")
                try:
                    days_since_start = (date.today() - datetime.datetime.strptime(cycle_start, "%Y-%m-%d").date()).days
                except (ValueError, TypeError):
                    days_since_start = 5
                if not 0 <= days_since_start < 5:
                    msg.showerror("CHANGE WINDOW CLOSED", "Standards can only be changed during the first 5 days of the cycle.")
                    self.open_meso_vault(pillar, color)
                    return

                new_standards = {
                    t_name: [v.get().strip() for v in var_list if v.get().strip()]
                    for t_name, var_list in self.setup_vars.items()
                }
                current_standards = {
                    t_name: t_data.get("standards", [])
                    for t_name, t_data in self.data["profile"]["meso_v2"][pillar]["tabs"].items()
                }
                changed = new_standards != current_standards
                if changed and self.data["profile"].get("arka", 0) < edit_cost:
                    msg.showerror("INSUFFICIENT ARKA", f"Changing standards costs {edit_cost:,} ARKA.")
                    return
                confirm_text = f"Save the updated {pillar} standards? This costs {edit_cost:,} ARKA. Existing logs and cycle dates will be preserved." if changed else f"No standards changed. Save without charge?"
            else:
                confirm_text = f"Are you certain? You cannot alter these {pillar} rules for 35 days."
            if msg.askyesno("SAVE CHANGES" if edit_mode else "LOCK INITIATED", confirm_text):
                # Recheck funds before applying an edit so modified standards can never be saved unpaid.
                if edit_mode and changed and self.data["profile"].get("arka", 0) < edit_cost:
                    msg.showerror("INSUFFICIENT ARKA", f"You need {edit_cost:,} ARKA to change standards. No changes were saved.")
                    return

                for t_name, var_list in self.setup_vars.items():
                    # Extract text, ignore empty fields
                    rules = [v.get().strip() for v in var_list if v.get().strip() != ""]
                    self.data["profile"]["meso_v2"][pillar]["tabs"][t_name]["standards"] = rules
                
                if not edit_mode:
                    self.data["profile"]["meso_v2"][pillar]["active"] = True
                    self.data["profile"]["meso_v2"][pillar]["start_date"] = str(date.today())
                elif changed:
                    self.data["profile"]["arka"] -= edit_cost
                self.save_data_state()
                if edit_mode:
                    self.open_meso_vault(pillar, color)
                else:
                    self.open_meso_sections()

        button_text = f"SAVE CHANGES (-{edit_cost:,} ARKA)" if edit_mode else f"LOCK {pillar} PROTOCOL FOR 35 DAYS"
        ctk.CTkButton(p, text=button_text, font=self.HEAD_FONT, fg_color="#ef4444", hover_color="#b91c1c", height=60, command=lock_pillar).pack(fill="x", padx=40, pady=20)

    def open_meso_vault(self, pillar, color):
        p = self.prepare_view(f"{pillar} VAULT", color=color)
        today = date.today()
        start_date = datetime.datetime.strptime(self.data["profile"]["meso_v2"][pillar]["start_date"], "%Y-%m-%d").date()

        nav_f = ctk.CTkFrame(p, fg_color="transparent"); nav_f.pack(fill="x", padx=10)
        ctk.CTkButton(nav_f, text="← BACK TO MODULES", font=("Inter", 12, "bold"), fg_color="transparent", border_width=1, border_color=self.BORDER, command=self.open_meso_sections).pack(side="left")
        ctk.CTkButton(nav_f, text="✎ CHANGE STANDARDS (20,000 ARKA)", font=("Inter", 12, "bold"), fg_color="transparent", border_width=1, border_color=color, text_color=color, command=lambda: self.open_meso_setup(pillar, color, edit_mode=True)).pack(side="right")

        tabs = ctk.CTkTabview(p, fg_color=self.PANEL, segmented_button_selected_color=color)
        tabs.pack(fill="both", expand=True, padx=20, pady=10)

        for t_name, t_data in self.data["profile"]["meso_v2"][pillar]["tabs"].items():
            t_frame = tabs.add(t_name)
            
            # --- SHOW LOCKED STANDARDS ---
            std_f = ctk.CTkFrame(t_frame, fg_color="#1a1a1a", border_width=1, border_color=color, corner_radius=10)
            std_f.pack(fill="x", padx=20, pady=10, ipadx=10, ipady=10)
            ctk.CTkLabel(std_f, text=f"LOCKED STANDARDS FOR {t_name.upper()}", font=("Inter", 10, "bold"), text_color=self.TEXT_SEC).pack(pady=(0, 10))
            
            rules = t_data.get("standards", [])
            if not rules: ctk.CTkLabel(std_f, text="[No rules defined for this section]", font=("Inter", 12, "italic")).pack()
            else:
                for i, rule in enumerate(rules):
                    ctk.CTkLabel(std_f, text=f"Standard {i+1}: {rule}", font=("Inter", 14, "bold"), text_color=color, wraplength=700).pack(anchor="w", padx=20)

            # --- INTERACTIVE 35-DAY GRID (GHOST BUTTONS REMOVED) ---
            ctk.CTkLabel(t_frame, text="CLICK A DAY TO LOG ACHIEVEMENTS", font=("Inter", 14, "bold"), text_color=self.TEXT_SEC).pack(pady=(20, 5))
            grid_f = ctk.CTkFrame(t_frame, fg_color="transparent")
            grid_f.pack()

            for day in range(35):
                r, c = day // 7, day % 7
                target_date = start_date + timedelta(days=day)
                target_str = str(target_date)
                
                day_log = t_data["logs"].get(target_str, None)
                overall = day_log.get("status") if isinstance(day_log, dict) else day_log
                
                if target_date > today:
                    bg_c, border_c, text_c, status_text = self.BG, self.BORDER, self.TEXT_SEC, "..."
                    btn_state = "disabled"
                elif target_date == today and not day_log:
                    bg_c, border_c, text_c, status_text = self.PANEL, "#fbbf24", "#fbbf24", "PENDING"
                    btn_state = "normal"
                elif overall in ["Exceed", "EXCEED"]:
                    bg_c, border_c, text_c, status_text = "#1e3a8a", "#3b82f6", "#3b82f6", "EXCEEDED"
                    btn_state = "normal"
                elif overall in ["Pass", "PASS", "Meet"]:
                    bg_c, border_c, text_c, status_text = "#064e3b", self.EMERALD, self.EMERALD, "MET"
                    btn_state = "normal"
                else: 
                    bg_c, border_c, text_c, status_text = "#450a0a", "#ef4444", "#ef4444", "FAILED"
                    btn_state = "normal"

                btn = ctk.CTkButton(
                    grid_f, 
                    text=f"D-{day+1}\n{target_date.strftime('%d %b')}\n\n{status_text}", 
                    width=100, height=85, corner_radius=10, border_width=2,
                    fg_color=bg_c, border_color=border_c, text_color=text_c,
                    font=("Inter", 11, "bold"), hover_color="#1A1A1A",
                    state=btn_state,
                    command=lambda t=t_name, dt=target_date: self.open_meso_day_logger(pillar, t, dt, color)
                )
                btn.grid(row=r, column=c, padx=5, pady=5)

    def open_meso_day_logger(self, pillar, tab_name, target_date, color):
        log_win = ctk.CTkToplevel(self)
        log_win.title(f"LOG: {tab_name.upper()} - {target_date}")
        log_win.geometry("750x650")
        log_win.attributes("-topmost", True)
        log_win.configure(fg_color=self.BG)
        
        log_win.update_idletasks()
        x = (log_win.winfo_screenwidth() // 2) - (750 // 2)
        y = (log_win.winfo_screenheight() // 2) - (650 // 2)
        log_win.geometry(f"+{x}+{y}")
        
        start_date = datetime.datetime.strptime(self.data['profile']['meso_v2'][pillar]['start_date'], '%Y-%m-%d').date()
        day_num = (target_date - start_date).days + 1
        
        ctk.CTkLabel(log_win, text=f"EXECUTION LOG: DAY {day_num}", font=("Inter", 20, "bold"), text_color=color).pack(pady=(20, 5))

        scroll_f = ctk.CTkScrollableFrame(log_win, fg_color="transparent")
        scroll_f.pack(fill="both", expand=True, padx=20, pady=10)
        
        rules = self.data["profile"]["meso_v2"][pillar]["tabs"][tab_name].get("standards", [])
        
        # --- SAFE DATA EXTRACTION ---
        raw_log = self.data["profile"]["meso_v2"][pillar]["tabs"][tab_name]["logs"].get(str(target_date))
        if isinstance(raw_log, str): existing_log = {"status": raw_log, "details": {}}
        elif isinstance(raw_log, dict): existing_log = raw_log
        else: existing_log = {}
        
        is_locked = bool(existing_log) or target_date < date.today()
        
        if is_locked and not existing_log:
            ctk.CTkLabel(log_win, text="MISSED LOG.", font=("Inter", 20, "bold"), text_color="#ef4444").pack(pady=(0, 5))
            ctk.CTkLabel(log_win, text="You failed to log this day before midnight. It is permanently sealed as a failure.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0, 20))
            return
            
        if not is_locked:
            ctk.CTkLabel(log_win, text="Log your exact achievement against every standard.", font=("Inter", 12), text_color=self.TEXT_SEC).pack(pady=(0, 15))

        log_vars = []
        details_dict = existing_log.get("details", {})
        
        for i, rule in enumerate(rules):
            f = ctk.CTkFrame(scroll_f, fg_color=self.PANEL, border_color=self.BORDER, border_width=1, corner_radius=10)
            f.pack(fill="x", pady=10, ipadx=10, ipady=15)
            ctk.CTkLabel(f, text=f"Standard {i+1}: {rule}", font=("Inter", 14, "bold"), text_color=color, wraplength=600).pack(anchor="w", padx=10, pady=5)
            
            if is_locked:
                # --- BUG FIXED: CORRECTLY READS PAST DATA NOW ---
                rule_old_data = details_dict.get(f"rule_{i}", {})
                val = rule_old_data.get("val", "No Data Logged")
                stat = rule_old_data.get("status", "N/A")
                
                ctk.CTkLabel(f, text=f"Achieved: {val}", font=("Inter", 14), text_color=self.TEXT_PRI).pack(anchor="w", padx=10, pady=5)
                color_stat = self.EMERALD if stat in ["Meet", "Pass"] else ("#3b82f6" if stat == "Exceed" else "#ef4444")
                ctk.CTkLabel(f, text=f"Status: {stat.upper()}", font=("Inter", 14, "bold"), text_color=color_stat).pack(anchor="w", padx=10, pady=5)
                
            else:
                val_var = ctk.StringVar()
                ctk.CTkEntry(f, textvariable=val_var, placeholder_text="What did you actually achieve? (e.g. 50 pushups, 9 hours)...", fg_color=self.BG).pack(fill="x", padx=10, pady=10, ipady=5)
                
                stat_var = ctk.StringVar(value="Meet")
                seg = ctk.CTkSegmentedButton(f, values=["Exceed", "Meet", "Fail"], variable=stat_var, selected_color=color, unselected_color=self.BG)
                seg.pack(anchor="w", padx=10, pady=5)
                log_vars.append((val_var, stat_var))
            
        if not is_locked:
            def save_log():
                details = {}
                statuses = []
                failed_backlogs = []
                
                for i, (v, s) in enumerate(log_vars):
                    details[f"rule_{i}"] = {"val": v.get().strip(), "status": s.get()}
                    statuses.append(s.get())
                    
                    # Capture failed Backlog tasks for Drishti Smart-Sync
                    if tab_name == "Backlog" and s.get() in ["Fail", "FAIL"]:
                        failed_backlogs.append(rules[i])
                
                # --- BUG FIXED: "ALWAYS BLUE" MATH LOGIC CORRECTED ---
                if not statuses: overall = "Pass"
                elif "Fail" in statuses: overall = "Fail"
                elif all(s == "Exceed" for s in statuses): overall = "Exceed"
                else: overall = "Pass"
                
                self.data["profile"]["meso_v2"][pillar]["tabs"][tab_name]["logs"][str(target_date)] = {"status": overall, "details": details}
                
                # --- 🔗 DRISHTI V2 SMART-SYNC INTEGRATION ---
                if failed_backlogs:
                    drishti = self.data["profile"].get("drishti_v2", {})
                    if "PHY" not in drishti: drishti["PHY"] = {}
                    if "MESO_FAILURES" not in drishti["PHY"]: drishti["PHY"]["MESO_FAILURES"] = []
                    
                    for fb in failed_backlogs:
                        drishti["PHY"]["MESO_FAILURES"].append({
                            "topic": f"[MESO LEAK] {fb}", 
                            "days": 0, 
                            "bounty": 150
                        })
                    msg.showwarning("DRISHTI SMART-SYNC", f"{len(failed_backlogs)} failed backlog standard(s) automatically exported to Drishti V2.\n(Check PHY -> MESO_FAILURES).")

                self.save_data_state()
                log_win.destroy()
                self.open_meso_vault(pillar, color)
                if not statuses: overall = "Pass"
                elif "Fail" in statuses: overall = "Fail"
                elif all(s == "Exceed" for s in statuses): overall = "Exceed"
                else: overall = "Pass"
                
                self.data["profile"]["meso_v2"][pillar]["tabs"][tab_name]["logs"][str(target_date)] = {"status": overall, "details": details}
                self.save_data_state()
                log_win.destroy()
                self.open_meso_vault(pillar, color)
                
                # --- COLLECTIVE PDF TRIGGER ---
                if day_num == 35: 
                    all_tabs_complete = True
                    for t_n, t_d in self.data["profile"]["meso_v2"][pillar]["tabs"].items():
                        if str(target_date) not in t_d["logs"]:
                            all_tabs_complete = False
                            break
                            
                    if all_tabs_complete:
                        if msg.askyesno("CRUCIBLE COMPLETED", f"You have logged Day 35 for ALL {pillar} sections.\nGenerate the Collective 35-Day PDF Dossier?"):
                            self.generate_mesocycle_pdf(pillar)
                        
            ctk.CTkButton(scroll_f, text="LOCK DAY LOG", fg_color=color, hover_color="#1A1A1A", font=("Inter", 16, "bold"), height=50, command=save_log).pack(pady=20, fill="x")
        else:
            ctk.CTkLabel(scroll_f, text="THIS LOG IS IMMUTABLE (LOCKED).", font=("Inter", 14, "bold"), text_color=self.TEXT_SEC).pack(pady=20)

    def generate_mesocycle_pdf(self, pillar):
        import threading
        def bg_task():
            # --- THE FIX: Custom PDF Class to paint background on EVERY auto-generated page ---
            class DarkPDF(FPDF):
                def header(self):
                    self.set_fill_color(10, 10, 12)
                    self.rect(0, 0, 210, 297, 'F')
                    
            pdf = DarkPDF() # Use the custom class instead of standard FPDF
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.add_page()
            
            pdf.set_font("Arial", 'B', 24)
            pdf.set_text_color(139, 92, 246) 
            pdf.cell(0, 15, f"35-DAY CRUCIBLE REPORT: {pillar.upper()}", ln=True, align="C")
            pdf.set_font("Arial", '', 12)
            pdf.set_text_color(150, 150, 150)
            pdf.cell(0, 10, f"Generated: {date.today()}", ln=True, align="C")
            pdf.ln(10)
            
            p_data = self.data["profile"]["meso_v2"][pillar]
            start_date = datetime.datetime.strptime(p_data["start_date"], "%Y-%m-%d").date()
            
            for t_name, t_data in p_data["tabs"].items():
                pdf.set_font("Arial", 'B', 16)
                pdf.set_text_color(255, 255, 255)
                pdf.cell(0, 10, f">> MODULE: {t_name.upper()}", ln=True)
                
                rules = t_data.get("standards", [])
                pdf.set_font("Arial", 'B', 10)
                pdf.set_text_color(139, 92, 246)
                pdf.cell(0, 8, "LOCKED STANDARDS:", ln=True)
                pdf.set_font("Arial", '', 10)
                pdf.set_text_color(200, 200, 200)
                for i, r in enumerate(rules):
                    pdf.cell(0, 6, f"   Standard {i+1}: {r}", ln=True)
                pdf.ln(5)
                
                passes, fails, exceeds = 0, 0, 0
                for day in range(35):
                    t_date = start_date + timedelta(days=day)
                    log = t_data["logs"].get(str(t_date))
                    if not log: continue
                    status = log.get("status") if isinstance(log, dict) else log
                    if status in ["Pass", "PASS", "Meet"]: passes += 1
                    elif status in ["Fail", "FAIL"]: fails += 1
                    elif status in ["Exceed", "EXCEED"]: exceeds += 1
                
                pdf.set_font("Arial", 'B', 12)
                pdf.set_text_color(16, 185, 129) 
                pdf.cell(60, 10, f"MET: {passes} Days", border=1, align="C")
                pdf.set_text_color(59, 130, 246) 
                pdf.cell(60, 10, f"EXCEEDED: {exceeds} Days", border=1, align="C")
                pdf.set_text_color(239, 68, 68) 
                pdf.cell(60, 10, f"FAILED: {fails} Days", border=1, align="C", ln=True)
                pdf.ln(10)
                
                pdf.set_font("Arial", 'B', 10)
                pdf.set_text_color(200, 200, 200)
                pdf.cell(0, 8, "DAILY BREAKDOWN LOG:", ln=True)
                pdf.set_font("Arial", '', 9)
                
                for day in range(35):
                    t_date = start_date + timedelta(days=day)
                    log = t_data["logs"].get(str(t_date))
                    if not log: continue
                    
                    status = log.get("status") if isinstance(log, dict) else log
                    if status in ["Fail", "FAIL"]: pdf.set_text_color(239, 68, 68)
                    elif status in ["Exceed", "EXCEED"]: pdf.set_text_color(59, 130, 246)
                    else: pdf.set_text_color(16, 185, 129)
                    
                    pdf.cell(0, 6, f"Day {day+1} ({t_date}): {status.upper()}", ln=True)
                    if isinstance(log, dict) and "details" in log:
                        pdf.set_text_color(150, 150, 150)
                        for r_idx, r_val in log["details"].items():
                            val = r_val.get('val', '')
                            r_stat = r_val.get('status', '')
                            pdf.cell(10) 
                            pdf.cell(0, 5, f"- {r_idx.replace('_', ' ').capitalize()}: Achieved [{val}] -> {r_stat}", ln=True)
                pdf.ln(15)
                
            pdf_name = f"Sovereign_Crucible_{pillar}_{date.today()}.pdf"
            pdf_path = os.path.join(BASE_DIR, pdf_name)
            pdf.output(pdf_path)
            self.after(0, lambda: msg.showinfo("REPORT GENERATED", f"35-Day Crucible Report Saved:\n{pdf_path}"))
        
        threading.Thread(target=bg_task, daemon=True).start()

if __name__ == "__main__":
    app = SelfBuildingApp()
    app.mainloop()