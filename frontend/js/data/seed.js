import { dayOffset,todayISO } from '../ui/format.js';
export function seed(){
    const s=[
        ['STU/2021/0451','Ada','Okonkwo','2003-04-12','Female','Science','Computer Science','300','O+','AA',['Penicillin'],[],'Mrs. Ngozi Okonkwo','0803 999 8877','Mother'],
        ['STU/2020/0112','Musa','Ibrahim','2001-09-30','Male','Engineering','Mechanical Eng.','400','B+','AA',[],['Asthma'],'Alhaji Ibrahim','0806 555 1122','Father'],
        ['STU/2022/0788','Chioma','Eze','2004-01-22','Female','Medicine','Nursing Science','200','A-','AS',['Sulfa drugs'],[],'Mr. Paul Eze','0810 777 6655','Father'],
        ['STU/2021/0390','Tunde','Bakare','2002-07-08','Male','Law','Public Law','300','O-','AA',[],[],'Mrs. Bisi Bakare','0705 222 1100','Mother'],
        ['STU/2023/0901','Fatima','Yusuf','2005-03-17','Female','Arts','English Language','100','AB+','AA',['Dust'],['Allergic rhinitis'],'Hajiya Amina','0812 888 4433','Mother'],
        ['STU/2020/0055','Emeka','Nwosu','2000-11-02','Male','Business','Accounting','400','B-','AA',[],[],'Mr. Chidi Nwosu','0814 333 2211','Brother'],
        ['STU/2022/0663','Zainab','Ali','2003-12-25','Female','Social Sciences','Economics','200','O+','AC',[],[],'Malam Sani Ali','0708 444 3322','Father'],
        ['STU/2023/0999','David','Osei','2004-06-14','Male','Science','Microbiology','100','A+','AA',['Ibuprofen'],[],'Mrs. Akua Osei','0816 111 5544','Mother'],
        ['STU/2021/0477','Grace','Mensah','2002-02-09','Female','Engineering','Civil Eng.','300','O+','AA',[],[],'Mr. Kofi Mensah','0703 555 7788','Father'],
        ['STU/2022/0702','Ibrahim','Sule','2003-08-19','Male','Medicine','Medicine & Surgery','200','B+','AS',['Aspirin'],['Peptic ulcer'],'Mrs. Hauwa Sule','0819 765 4321','Mother'],
    ].map((r,i)=>({id:'s'+(i+1),studentId:r[0],firstName:r[1],lastName:r[2],dob:r[3],gender:r[4],
        faculty:r[5],department:r[6],level:r[7],phone:'0800 000 0000',
        email:r[1].toLowerCase()+'.'+r[2].toLowerCase()+'@uni.edu',
        bloodGroup:r[8],genotype:r[9],allergies:r[10],conditions:r[11],
        emergency:{name:r[12],phone:r[13],relation:r[14]},registeredAt:'2022-09-15'}));
    const m=[
        ['Paracetamol','500 mg','Tablet','Analgesic','tablets',820,200,'PCM-2411',420,12.5],
        ['Ibuprofen','400 mg','Tablet','NSAID','tablets',150,180,'IBU-2408',260,22],
        ['Amoxicillin','500 mg','Capsule','Antibiotic','capsules',340,150,'AMX-2501',180,65],
        ['Artemether/Lumefantrine','20/120 mg','Tablet','Antimalarial','tablets',96,120,'AL-2503',75,180],
        ['Chlorpheniramine','4 mg','Tablet','Antihistamine','tablets',500,100,'CPM-2405',330,8],
        ['Oral Rehydration Salts','20.5 g','Sachet','Electrolyte','sachets',210,80,'ORS-2502',540,95],
        ['Metronidazole','400 mg','Tablet','Antibiotic','tablets',270,120,'MTZ-2412',210,35],
        ['Omeprazole','20 mg','Capsule','Antacid','capsules',64,90,'OMP-2409',150,75],
        ['Salbutamol Inhaler','100 mcg','Inhaler','Bronchodilator','inhalers',18,10,'SAL-2504',400,2400],
        ['Vitamin C','100 mg','Tablet','Supplement','tablets',1200,250,'VTC-2501',600,5],
        ['Diclofenac Gel','1%','Topical Gel','NSAID','tubes',42,25,'DCF-2410',290,850],
        ['Cetirizine','10 mg','Tablet','Antihistamine','tablets',410,120,'CTZ-2502',365,18],
        ['Ciprofloxacin','500 mg','Tablet','Antibiotic','tablets',0,100,'CIP-2406',120,110],
        ['Multivitamin Syrup','200 ml','Syrup','Supplement','bottles',35,20,'MVS-2308',-25,1200],
    ].map((r,i)=>({id:'m'+(i+1),name:r[0],strength:r[1],form:r[2],category:r[3],unit:r[4],
        quantity:r[5],reorderLevel:r[6],batchNo:r[7],expiryDate:dayOffset(r[8]),
        supplier:'Supplier',unitCost:r[9],location:'Shelf '+String.fromCharCode(65+i%5)+(i+1)}));
    const vS=[
        ['s1',-13,'09:20','Fever, chills and body aches for 3 days','completed','Malaria (uncomplicated)','Artemether/Lumefantrine + Paracetamol','110/70','38.7','96','58','98','Dr. A. Bello'],
        ['s2',-12,'11:05','Difficulty breathing after football','completed','Acute asthma exacerbation','Salbutamol 2 puffs','118/76','36.9','88','74','94','Dr. A. Bello'],
        ['s3',-10,'14:30','Severe headache and general weakness','completed','Migraine','Paracetamol 1g stat','105/68','36.6','78','54','99','Dr. A. Bello'],
        ['s5',-9,'10:15','Sneezing, runny nose and itchy eyes','completed','Allergic rhinitis','Cetirizine 10mg nocte','112/72','36.8','80','51','99','Dr. A. Bello'],
        ['s10',-8,'08:45','Epigastric pain burning at night','completed','Peptic ulcer disease','Omeprazole 20mg BD','120/78','36.7','82','66','98','Dr. A. Bello'],
        ['s7',-6,'12:40','Watery stool 5x/day','completed','Gastroenteritis','ORS + Metronidazole','100/64','37.4','92','60','98','Dr. A. Bello'],
        ['s4',-5,'15:20','Twisted right ankle during basketball','completed','Grade I ankle sprain','Diclofenac gel TDS','122/80','36.5','76','70','99','Dr. A. Bello'],
        ['s8',-4,'09:50','Sore throat and painful swallowing','completed','Acute tonsillitis','Amoxicillin 500mg TDS','115/74','37.8','84','68','98','Dr. A. Bello'],
        ['s6',-3,'13:10','Burning sensation on urination','completed','Urinary tract infection','Ciprofloxacin 500mg BD','124/82','37.2','80','78','99','Dr. A. Bello'],
        ['s9',-2,'11:30','Generalised body pain','completed','Viral URTI','Paracetamol + Vitamin C','118/76','37.6','82','63','99','Dr. A. Bello'],
        ['s3',0,'09:15','Itchy skin rash on both forearms','awaiting_doctor','','','108/70','36.6','76','54','99','Nurse F. Adeyemi'],
        ['s5',0,'11:45','Severe menstrual cramps','awaiting_doctor','','','110/70','36.7','84','51','99','Nurse F. Adeyemi'],
        ['s10',0,'14:20','Recurrent epigastric pain','awaiting_doctor','','','120/78','36.6','80','66','98','Nurse F. Adeyemi'],
    ];
    const visits=vS.map((r,i)=>({id:'v'+(i+1),studentId:r[0],date:dayOffset(r[1]),time:r[2],
        complaint:r[3],status:r[4],diagnosis:r[5],treatment:r[6],
        vitals:{bp:r[7],temp:r[8],pulse:r[9],weight:r[10],spo2:r[11]},attending:r[12],notes:''}));
    const rS=[
        [0,'m4','4 tablets','BD','3 days',24,'dispensed'],
        [0,'m1','1 tablet','TDS','5 days',15,'dispensed'],
        [1,'m9','2 puffs','PRN','30 days',1,'dispensed'],
        [2,'m1','2 tablets','TDS','3 days',18,'dispensed'],
        [3,'m12','1 tablet','Nocte','7 days',7,'dispensed'],
        [4,'m8','1 capsule','BD','14 days',28,'dispensed'],
        [5,'m6','1 sachet','After stool','3 days',6,'dispensed'],
        [5,'m7','1 tablet','TDS','5 days',15,'dispensed'],
        [6,'m11','Apply thinly','TDS','7 days',1,'dispensed'],
        [7,'m3','1 capsule','TDS','5 days',15,'dispensed'],
        [8,'m13','1 tablet','BD','5 days',10,'cancelled'],
        [9,'m1','2 tablets','TDS','3 days',18,'dispensed'],
        [9,'m10','1 tablet','Daily','14 days',14,'dispensed'],
    ];
    const prescriptions=rS.map((r,i)=>{
        const v=visits[r[0]];
        return {id:'p'+(i+1),visitId:v.id,studentId:v.studentId,medicationId:r[1],
            dosage:r[2],frequency:r[3],duration:r[4],quantity:r[5],status:r[6],
            prescribedBy:v.attending,
            dispensedAt:r[6]==='dispensed'?new Date(Date.now()-5*864e5).toISOString():null,
            dispensedBy:r[6]==='dispensed'?'Pharm. J. Okafor':null};
    });
    return {students:s,medications:m,visits,prescriptions,
        labRequests:[
            {id:'l1',studentId:'s1',testType:'Malaria RDT',orderedBy:'Dr. A. Bello',orderedAt:dayOffset(-13),status:'resulted',result:'Positive for P. falciparum',reviewedBy:'Dr. A. Bello'},
            {id:'l2',studentId:'s6',testType:'Urinalysis',orderedBy:'Dr. A. Bello',orderedAt:dayOffset(-3),status:'resulted',result:'Leucocytes +, Nitrites +',reviewedBy:null},
            {id:'l3',studentId:'s10',testType:'Full Blood Count',orderedBy:'Dr. A. Bello',orderedAt:todayISO(),status:'ordered',result:'',reviewedBy:null},
        ],
        immunizations:[
            {id:'i1',studentId:'s1',vaccine:'Tetanus Toxoid',dose:'1st',date:dayOffset(-300),givenBy:'Nurse F. Adeyemi',batchNo:'TT-2301'},
            {id:'i2',studentId:'s3',vaccine:'Hepatitis B',dose:'3rd',date:dayOffset(-200),givenBy:'Nurse F. Adeyemi',batchNo:'HB-2305'},
        ],
        audit:[],notificationsSeen:[],
        settings:{clinicName:'Gaposa',staffName:'Dr. A. Bello',staffRole:'Clinic Officer',staffInitials:'AB'}};
}
