import 'dotenv/config'
import connectDB from './config/mongodb.js'
import doctorModel from './models/doctorModel.js'

const UPDATED_DOCTORS = [
  {
    _id: '68ec7e9e6e31a019c57be925',
    name: 'Dr. Rohan Deshmukh',
    speciality: 'General physician',
    degree: 'MBBS, MD (Internal Medicine)',
    experience: '8 Years',
    fees: 700,
    address: {
      clinic: 'Manipal Hospital, Indiranagar',
      line1: 'Manipal Hospital, 100 Feet Road, Indiranagar',
      line2: 'Bengaluru, Karnataka - 560038',
    },
    about:
      'Dr. Rohan Deshmukh is an internal medicine specialist with over 8 years of outpatient and hospital care experience. He focuses on viral and seasonal fevers, hypertension, thyroid disorders, diabetes management, and preventive adult health checkups. Patients appreciate his clear explanations, thorough symptom review, and practical lifestyle guidance.',
  },
  {
    _id: '68ef3bef788c499183c3b665',
    name: 'Dr. Sunita Rao',
    speciality: 'Gynecologist',
    degree: 'MBBS, MS (Obstetrics & Gynecology)',
    experience: '12 Years',
    fees: 1500,
    address: {
      clinic: 'Fernandez Stork Home, Jubilee Hills',
      line1: 'Fernandez Stork Home, Road No. 36, Jubilee Hills',
      line2: 'Hyderabad, Telangana - 500033',
    },
    about:
      'Dr. Sunita Rao brings 12 years of dedicated experience in women’s health, prenatal care, PCOS management, and menstrual wellness. She provides evidence-based obstetric consultations, pre-pregnancy counseling, and routine gynecological screenings in a calm, supportive clinic setting.',
  },
  {
    _id: '68ef3c7c788c499183c3b66f',
    name: 'Dr. Siddharth Patel',
    speciality: 'Dermatologist',
    degree: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    experience: '7 Years',
    fees: 1000,
    address: {
      clinic: 'Lilavati Skin & Derma Care, Bandra West',
      line1: 'Lilavati Skin & Derma Care, Linking Road, Bandra West',
      line2: 'Mumbai, Maharashtra - 400050',
    },
    about:
      'Dr. Siddharth Patel is a board-certified clinical dermatologist specializing in persistent acne, eczema, fungal skin infections, hair fall evaluation, and allergic rashes. He emphasizes accurate root-cause assessment and simple, sustainable skincare routines tailored to Indian skin types and climates.',
  },
  {
    _id: '68ef3cf4788c499183c3b675',
    name: 'Dr. Arjun Malhotra',
    speciality: 'Pediatricians',
    degree: 'MBBS, MD (Pediatrics)',
    experience: '6 Years',
    fees: 800,
    address: {
      clinic: "Rainbow Children's Hospital, Malviya Nagar",
      line1: "Rainbow Children's Hospital, Geetanjali Marg, Malviya Nagar",
      line2: 'New Delhi, Delhi - 110017',
    },
    about:
      'Dr. Arjun Malhotra cares for newborns, infants, and school-age children with a gentle, parent-friendly approach. His consultations cover childhood immunizations, growth and nutrition tracking, childhood allergies, and acute respiratory or digestive illnesses, helping parents feel confident and well-informed.',
  },
  {
    _id: '68ef3d71788c499183c3b678',
    name: 'Dr. Niharika Iyer',
    speciality: 'Neurologist',
    degree: 'MBBS, MD, DM (Neurology)',
    experience: '8 Years',
    fees: 2000,
    address: {
      clinic: 'Kauvery Hospital Neuro Centre, Alwarpet',
      line1: 'Kauvery Hospital Neuro Centre, TTK Road, Alwarpet',
      line2: 'Chennai, Tamil Nadu - 600018',
    },
    about:
      'Dr. Niharika Iyer specializes in clinical neurology with particular focus on chronic migraines, vertigo, nerve pain, sleep-related headaches, and seizure disorders. She combines structured neurological evaluations with clear long-term care plans to help patients regain daily comfort.',
  },
  {
    _id: '68ef3dfd788c499183c3b67b',
    name: 'Dr. Rajeshwar Joshi',
    speciality: 'Neurologist',
    degree: 'MBBS, MD, DM (Neurology)',
    experience: '13 Years',
    fees: 2600,
    address: {
      clinic: 'Ruby Hall Clinic, Sassoon Road',
      line1: 'Ruby Hall Clinic, 40 Sassoon Road, Sangamvadi',
      line2: 'Pune, Maharashtra - 411001',
    },
    about:
      'Dr. Rajeshwar Joshi has 13 years of experience evaluating stroke recovery, peripheral neuropathy, tremors, movement disorders, and spine-related nerve compression. He takes a methodical, patient-centered approach to neurological testing and coordinated follow-up rehabilitation.',
  },
  {
    _id: '68ef3e64788c499183c3b67e',
    name: 'Dr. Vikramaditya Sen',
    speciality: 'General physician',
    degree: 'MBBS, MD (General Medicine), FRCP',
    experience: '16 Years',
    fees: 900,
    address: {
      clinic: 'Apollo Multispeciality Hospital, Salt Lake',
      line1: 'Apollo Multispeciality Hospital, Canal Circular Road, Salt Lake',
      line2: 'Kolkata, West Bengal - 700054',
    },
    about:
      'Dr. Vikramaditya Sen is a senior general physician with 16 years of experience managing complex multi-system illnesses, blood pressure and lipid disorders, adult vaccinations, and unexplained fatigue or prolonged fevers. He focuses on careful clinical listening and avoiding unnecessary tests.',
  },
  {
    _id: '68ef3f13788c499183c3b681',
    name: 'Dr. Karthik Subramanian',
    speciality: 'Gynecologist',
    degree: 'MBBS, MD (OBG), DNB',
    experience: '9 Years',
    fees: 1200,
    address: {
      clinic: "CARE Hospitals Women's Centre, Ram Nagar",
      line1: "CARE Hospitals Women's Centre, Waltair Main Road, Ram Nagar",
      line2: 'Visakhapatnam, Andhra Pradesh - 530002',
    },
    about:
      'Dr. Karthik Subramanian offers comprehensive consultations in antenatal monitoring, high-risk pregnancy follow-ups, fibroid and endometriosis evaluation, and preventive women’s health screenings. He prioritizes respectful communication and step-by-step guidance at every stage of care.',
  },
  {
    _id: '68ef3f91788c499183c3b687',
    name: 'Dr. Meera Krishnan',
    speciality: 'Dermatologist',
    degree: 'MBBS, DDVL, Fellowship in Clinical Dermatology',
    experience: '6 Years',
    fees: 900,
    address: {
      clinic: 'Zydus Skin & Wellness Clinic, Navrangpura',
      line1: 'Zydus Skin & Wellness Clinic, CG Road, Navrangpura',
      line2: 'Ahmedabad, Gujarat - 380009',
    },
    about:
      'Dr. Meera Krishnan treats everyday and chronic skin, hair, and nail concerns including pigmentation, urticaria (hives), psoriasis, dandruff, and teenage acne. She focuses on gentle, evidence-backed dermatology plans and educates patients on sun protection and trigger prevention.',
  },
  {
    _id: '68ef3fe6788c499183c3b68a',
    name: 'Dr. Pranav Kulkarni',
    speciality: 'Pediatricians',
    degree: 'MBBS, DCH, DNB (Pediatrics)',
    experience: '10 Years',
    fees: 1200,
    address: {
      clinic: 'Medanta Super Specialty Clinic, Gomti Nagar',
      line1: 'Medanta Super Specialty Clinic, Vibhuti Khand, Gomti Nagar',
      line2: 'Lucknow, Uttar Pradesh - 226010',
    },
    about:
      'Dr. Pranav Kulkarni has spent a decade caring for infants, toddlers, and adolescents across outpatient pediatrics and developmental clinics. He advises families on childhood asthma, seasonal infections, picky eating, milestone checks, and catch-up vaccination schedules.',
  },
  {
    _id: '68ef4043788c499183c3b68d',
    name: 'Dr. Nandini Chatterjee',
    speciality: 'Neurologist',
    degree: 'MBBS, MD, DNB (Neurology), Stroke Fellowship',
    experience: '15 Years',
    fees: 3500,
    address: {
      clinic: 'Fortis Hospital, Bannerghatta Road',
      line1: 'Fortis Hospital, 154/9 Bannerghatta Main Road',
      line2: 'Bengaluru, Karnataka - 560076',
    },
    about:
      'Dr. Nandini Chatterjee is a senior consultant neurologist with 15 years of expertise in stroke prevention, epilepsy, memory and cognitive evaluations, and refractory headache syndromes. She provides detailed diagnostic reviews and coordinates closely with families on long-term neurological wellness.',
  },
  {
    _id: '68ef40cf788c499183c3b690',
    name: 'Dr. Harsha Vardhan Reddy',
    speciality: 'Neurologist',
    degree: 'MBBS, MD, DM (Neurology), FINR',
    experience: '19 Years',
    fees: 5000,
    address: {
      clinic: 'Yashoda Hospitals Neurosciences Institute, Hitec City',
      line1: 'Yashoda Hospitals Neurosciences Institute, Hitec City Main Road',
      line2: 'Hyderabad, Telangana - 500081',
    },
    about:
      'Dr. Harsha Vardhan Reddy is a senior director-level neurologist with 19 years of clinical experience in complex neurovascular conditions, Parkinson’s disease, demyelinating disorders, and second-opinion neurological consultations. Known for his thorough diagnostic precision, he guides patients through complex neurological reports in clear, reassuring language.',
  },
  {
    _id: '68ef4120788c499183c3b693',
    name: 'Dr. Kavya Nair',
    speciality: 'General physician',
    degree: 'MBBS, DNB (Family Medicine)',
    experience: '5 Years',
    fees: 500,
    address: {
      clinic: 'Kokilaben Ambani Family Clinic, Andheri West',
      line1: 'Kokilaben Ambani Family Clinic, Four Bungalows, Andheri West',
      line2: 'Mumbai, Maharashtra - 400053',
    },
    about:
      'Dr. Kavya Nair practices comprehensive family and primary medicine, helping adults and seniors with acute infections, blood sugar and blood pressure monitoring, nutritional deficiencies, and annual health report reviews. Her consultations focus on practical everyday care and early preventive action.',
  },
  {
    _id: '68ef4198788c499183c3b696',
    name: 'Dr. Nikhil Verma',
    speciality: 'Gynecologist',
    degree: 'MBBS, MS (OBG), Fellowship in Reproductive Medicine',
    experience: '14 Years',
    fees: 2200,
    address: {
      clinic: 'Max Smart Super Speciality Hospital, Saket',
      line1: 'Max Smart Super Speciality Hospital, Press Enclave Marg, Saket',
      line2: 'New Delhi, Delhi - 110017',
    },
    about:
      'Dr. Nikhil Verma has 14 years of specialized experience in reproductive health, fertility evaluation, minimally invasive gynecological consultations, and hormonal health. He works closely with couples and individual patients to create transparent, personalized care plans.',
  },
  {
    _id: '68ef41ef788c499183c3b699',
    name: 'Dr. Ananya Reddy',
    speciality: 'Dermatologist',
    degree: 'MBBS, MD (Dermatology), FAAD',
    experience: '11 Years',
    fees: 1600,
    address: {
      clinic: 'Apollo Skin & Hair Studio, Nungambakkam',
      line1: 'Apollo Skin & Hair Studio, Khader Nawaz Khan Road, Nungambakkam',
      line2: 'Chennai, Tamil Nadu - 600034',
    },
    about:
      'Dr. Ananya Reddy brings 11 years of clinical dermatology experience managing stubborn acne scarring, melasma, chronic dermatitis, alopecia, and sensitive skin conditions. She combines thorough medical dermatology workups with safe, realistic treatment timelines.',
  },
  {
    _id: '6ad84056bab0df25b16b0f83',
    name: 'Dr. Arvind Sharma',
    speciality: 'Gastroenterologist',
    degree: 'MBBS, MD, DM (Medical Gastroenterology)',
    experience: '15 Years',
    fees: 2000,
    address: {
      clinic: 'Aster CMI Hospital, Hebbal',
      line1: 'Aster CMI Hospital, NH 44, Sahakar Nagar, Hebbal',
      line2: 'Bengaluru, Karnataka - 560092',
    },
    about:
      'Dr. Arvind Sharma is a senior medical gastroenterologist with 15 years of experience treating acid reflux (GERD), gastritis, irritable bowel syndrome (IBS), fatty liver disease, and inflammatory bowel conditions. He emphasizes dietary clarity alongside modern diagnostic gastroenterology.',
  },
  {
    _id: '6ad84056bab0df25b16b0f84',
    name: 'Dr. Sarah Jenkins',
    speciality: 'Gastroenterologist',
    degree: 'MBBS, MD, FACG (Gastroenterology & Hepatology)',
    experience: '14 Years',
    fees: 2800,
    address: {
      clinic: 'AIG Hospitals, Gachibowli',
      line1: 'AIG Hospitals, Mindspace Road, Gachibowli',
      line2: 'Hyderabad, Telangana - 500032',
    },
    about:
      'Dr. Sarah Jenkins is a consultant gastroenterologist and hepatologist with 14 years of clinical experience in liver wellness, chronic indigestion, food intolerances, peptic ulcer care, and preventive digestive screenings. She is known for structured symptom tracking and clear nutritional guidance.',
  },
  {
    _id: '6ad84056bab0df25b16b0f85',
    name: 'Dr. Alan Thompson',
    speciality: 'Gastroenterologist',
    degree: 'MD, FRCP (Senior Consultant Gastroenterologist)',
    experience: '24 Years',
    fees: 4500,
    address: {
      clinic: 'Breach Candy Hospital Trust, South Mumbai',
      line1: 'Breach Candy Hospital Trust, 60A Bhulabhai Desai Road',
      line2: 'Mumbai, Maharashtra - 400026',
    },
    about:
      'Dr. Alan Thompson is a senior visiting consultant gastroenterologist with 24 years of international and tertiary-hospital experience in complex pancreaticobiliary disorders, chronic liver disease, motility disorders, and second-opinion digestive consultations.',
  },
]

const run = async () => {
  try {
    await connectDB()
    let updatedCount = 0

    for (const doc of UPDATED_DOCTORS) {
      const { _id, ...fields } = doc
      const res = await doctorModel.findByIdAndUpdate(_id, { $set: fields }, { new: true })
      if (res) {
        updatedCount++
      }
    }

    console.log(`Successfully updated ${updatedCount}/${UPDATED_DOCTORS.length} doctors in MongoDB.`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to update doctors:', error)
    process.exit(1)
  }
}

run()

