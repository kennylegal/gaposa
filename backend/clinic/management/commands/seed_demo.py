from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date,time,timedelta
from clinic.models import Student,Medication,Visit,Prescription,LabRequest,Immunization

class Command(BaseCommand):
    def handle(self,*a,**kw):
        if Student.objects.exists():
            self.stdout.write(self.style.WARNING('Data exists — skipping.')); return
        today=date.today(); d=lambda n: today+timedelta(days=n)
        S=[('STU/2021/0451','Ada','Okonkwo',date(2003,4,12),'Female','Science','Computer Science','300','O+','AA',['Penicillin'],[],'Mrs. Ngozi Okonkwo','0803 999 8877','Mother'),
        ('STU/2020/0112','Musa','Ibrahim',date(2001,9,30),'Male','Engineering','Mechanical Eng.','400','B+','AA',[],['Asthma'],'Alhaji Ibrahim','0806 555 1122','Father'),
        ('STU/2022/0788','Chioma','Eze',date(2004,1,22),'Female','Medicine','Nursing Science','200','A-','AS',['Sulfa drugs'],[],'Mr. Paul Eze','0810 777 6655','Father'),
        ('STU/2021/0390','Tunde','Bakare',date(2002,7,8),'Male','Law','Public Law','300','O-','AA',[],[],'Mrs. Bisi Bakare','0705 222 1100','Mother'),
        ('STU/2023/0901','Fatima','Yusuf',date(2005,3,17),'Female','Arts','English Language','100','AB+','AA',['Dust'],['Allergic rhinitis'],'Hajiya Amina','0812 888 4433','Mother'),
        ('STU/2020/0055','Emeka','Nwosu',date(2000,11,2),'Male','Business','Accounting','400','B-','AA',[],[],'Mr. Chidi Nwosu','0814 333 2211','Brother'),
        ('STU/2022/0663','Zainab','Ali',date(2003,12,25),'Female','Social Sciences','Economics','200','O+','AC',[],[],'Malam Sani Ali','0708 444 3322','Father'),
        ('STU/2023/0999','David','Osei',date(2004,6,14),'Male','Science','Microbiology','100','A+','AA',['Ibuprofen'],[],'Mrs. Akua Osei','0816 111 5544','Mother'),
        ('STU/2021/0477','Grace','Mensah',date(2002,2,9),'Female','Engineering','Civil Eng.','300','O+','AA',[],[],'Mr. Kofi Mensah','0703 555 7788','Father'),
        ('STU/2022/0702','Ibrahim','Sule',date(2003,8,19),'Male','Medicine','Medicine & Surgery','200','B+','AS',['Aspirin'],['Peptic ulcer'],'Mrs. Hauwa Sule','0819 765 4321','Mother')]
        so={}
        for sid,fn,ln,dob,g,fac,dept,lvl,bg,gno,alg,cond,en,ep,er in S:
            s=Student.objects.create(student_id=sid,first_name=fn,last_name=ln,dob=dob,gender=g,
                faculty=fac,department=dept,level=lvl,phone='0800 000 0000',
                email=f'{fn.lower()}.{ln.lower()}@uni.edu',blood_group=bg,genotype=gno,
                allergies=alg,conditions=cond,emergency_name=en,emergency_phone=ep,emergency_relation=er)
            so[sid]=s
        M=[('Paracetamol','500 mg','Tablet','Analgesic','tablets',820,200,'PCM-2411',420,12.5),
        ('Ibuprofen','400 mg','Tablet','NSAID','tablets',150,180,'IBU-2408',260,22),
        ('Amoxicillin','500 mg','Capsule','Antibiotic','capsules',340,150,'AMX-2501',180,65),
        ('Artemether/Lumefantrine','20/120 mg','Tablet','Antimalarial','tablets',96,120,'AL-2503',75,180),
        ('Chlorpheniramine','4 mg','Tablet','Antihistamine','tablets',500,100,'CPM-2405',330,8),
        ('Oral Rehydration Salts','20.5 g','Sachet','Electrolyte','sachets',210,80,'ORS-2502',540,95),
        ('Metronidazole','400 mg','Tablet','Antibiotic','tablets',270,120,'MTZ-2412',210,35),
        ('Omeprazole','20 mg','Capsule','Antacid','capsules',64,90,'OMP-2409',150,75),
        ('Salbutamol Inhaler','100 mcg','Inhaler','Bronchodilator','inhalers',18,10,'SAL-2504',400,2400),
        ('Vitamin C','100 mg','Tablet','Supplement','tablets',1200,250,'VTC-2501',600,5),
        ('Diclofenac Gel','1%','Topical Gel','NSAID','tubes',42,25,'DCF-2410',290,850),
        ('Cetirizine','10 mg','Tablet','Antihistamine','tablets',410,120,'CTZ-2502',365,18),
        ('Ciprofloxacin','500 mg','Tablet','Antibiotic','tablets',0,100,'CIP-2406',120,110),
        ('Multivitamin Syrup','200 ml','Syrup','Supplement','bottles',35,20,'MVS-2308',-25,1200)]
        mo={}
        for i,(n,st,fo,ca,u,q,rl,bn,ex,co) in enumerate(M):
            m=Medication.objects.create(name=n,strength=st,form=fo,category=ca,unit=u,
                quantity=q,reorder_level=rl,batch_no=bn,expiry_date=d(ex),
                supplier='Supplier',unit_cost=co,location='Shelf '+chr(65+i%5)+str(i+1))
            mo[n]=m
        V=[('STU/2021/0451',-13,time(9,20),'Fever, chills and body aches for 3 days','completed','Malaria (uncomplicated)','Artemether/Lumefantrine 6 doses + Paracetamol','110/70','38.7','96','58','98','Dr. A. Bello'),
        ('STU/2020/0112',-12,time(11,5),'Difficulty breathing after football','completed','Acute asthma exacerbation','Salbutamol 2 puffs','118/76','36.9','88','74','94','Dr. A. Bello'),
        ('STU/2022/0788',-10,time(14,30),'Severe headache and general weakness','completed','Migraine','Paracetamol 1g stat','105/68','36.6','78','54','99','Dr. A. Bello'),
        ('STU/2023/0901',-9,time(10,15),'Sneezing, runny nose and itchy eyes','completed','Allergic rhinitis','Cetirizine 10mg nocte','112/72','36.8','80','51','99','Dr. A. Bello'),
        ('STU/2022/0702',-8,time(8,45),'Epigastric pain burning at night','completed','Peptic ulcer disease','Omeprazole 20mg BD','120/78','36.7','82','66','98','Dr. A. Bello'),
        ('STU/2022/0663',-6,time(12,40),'Watery stool 5x/day','completed','Gastroenteritis','ORS + Metronidazole','100/64','37.4','92','60','98','Dr. A. Bello'),
        ('STU/2021/0390',-5,time(15,20),'Twisted right ankle during basketball','completed','Grade I ankle sprain','Diclofenac gel TDS','122/80','36.5','76','70','99','Dr. A. Bello'),
        ('STU/2023/0999',-4,time(9,50),'Sore throat and painful swallowing','completed','Acute tonsillitis','Amoxicillin 500mg TDS','115/74','37.8','84','68','98','Dr. A. Bello'),
        ('STU/2020/0055',-3,time(13,10),'Burning sensation on urination','completed','Urinary tract infection','Ciprofloxacin 500mg BD','124/82','37.2','80','78','99','Dr. A. Bello'),
        ('STU/2021/0477',-2,time(11,30),'Generalised body pain','completed','Viral URTI','Paracetamol + Vitamin C','118/76','37.6','82','63','99','Dr. A. Bello'),
        ('STU/2022/0788',0,time(9,15),'Itchy skin rash on both forearms','awaiting_doctor','','','108/70','36.6','76','54','99','Nurse F. Adeyemi'),
        ('STU/2023/0901',0,time(11,45),'Severe cramps during menstruation','awaiting_doctor','','','110/70','36.7','84','51','99','Nurse F. Adeyemi'),
        ('STU/2022/0702',0,time(14,20),'Recurrent epigastric pain','awaiting_doctor','','','120/78','36.6','80','66','98','Nurse F. Adeyemi')]
        vo=[]
        for sid,off,t,comp,stt,dx,tx,bp,temp,pu,wt,sp,att in V:
            v=Visit.objects.create(student=so[sid],date=d(off),time=t,complaint=comp,
                status=stt,diagnosis=dx,treatment=tx,attending=att,
                vitals_bp=bp,vitals_temp=temp,vitals_pulse=pu,vitals_weight=wt,vitals_spo2=sp)
            vo.append(v)
        R=[(0,'Artemether/Lumefantrine','4 tablets','BD','3 days',24,'dispensed'),
        (0,'Paracetamol','1 tablet','TDS','5 days',15,'dispensed'),
        (1,'Salbutamol Inhaler','2 puffs','PRN','30 days',1,'dispensed'),
        (2,'Paracetamol','2 tablets','TDS','3 days',18,'dispensed'),
        (3,'Cetirizine','1 tablet','Nocte','7 days',7,'dispensed'),
        (4,'Omeprazole','1 capsule','BD','14 days',28,'dispensed'),
        (5,'Oral Rehydration Salts','1 sachet','After stool','3 days',6,'dispensed'),
        (5,'Metronidazole','1 tablet','TDS','5 days',15,'dispensed'),
        (6,'Diclofenac Gel','Apply thinly','TDS','7 days',1,'dispensed'),
        (7,'Amoxicillin','1 capsule','TDS','5 days',15,'dispensed'),
        (8,'Ciprofloxacin','1 tablet','BD','5 days',10,'cancelled'),
        (9,'Paracetamol','2 tablets','TDS','3 days',18,'dispensed'),
        (9,'Vitamin C','1 tablet','Daily','14 days',14,'dispensed')]
        for idx,mn,ds,fr,du,qt,stt in R:
            v=vo[idx]
            Prescription.objects.create(visit=v,student=v.student,medication=mo[mn],
                dosage=ds,frequency=fr,duration=du,quantity=qt,status=stt,
                prescribed_by=v.attending,
                dispensed_at=timezone.now() if stt=='dispensed' else None,
                dispensed_by='Pharm. J. Okafor' if stt=='dispensed' else '')
        for sid,tt,ob,oa,stt,res,rb in [('STU/2021/0451','Malaria RDT','Dr. A. Bello',d(-13),'resulted','Positive for P. falciparum','Dr. A. Bello'),
            ('STU/2020/0055','Urinalysis','Dr. A. Bello',d(-3),'resulted','Leucocytes +, Nitrites +','' ),
            ('STU/2022/0702','Full Blood Count','Dr. A. Bello',today,'ordered','','')]:
            LabRequest.objects.create(student=so[sid],test_type=tt,ordered_by=ob,
                ordered_at=oa,status=stt,result=res,reviewed_by=rb)
        for sid,vac,ds,dt,gb,bn in [('STU/2021/0451','Tetanus Toxoid','1st',d(-300),'Nurse F. Adeyemi','TT-2301'),
            ('STU/2022/0788','Hepatitis B','3rd',d(-200),'Nurse F. Adeyemi','HB-2305'),
            ('STU/2023/0901','COVID-19 Booster','Booster',d(-150),'Nurse F. Adeyemi','CV-2309')]:
            Immunization.objects.create(student=so[sid],vaccine=vac,dose=ds,date=dt,given_by=gb,batch_no=bn)
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(so)} students, {len(mo)} meds, {len(vo)} visits.'))
