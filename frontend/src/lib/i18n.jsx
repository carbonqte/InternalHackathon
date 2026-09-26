import { createContext, useContext, useEffect, useState } from 'react'

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
]

// UI text only. Step content (names, offices) comes from the data, translated per language.
// Hindi/Marathi strings should be checked by a native speaker before the demo.
const dict = {
  en: {
    admin: 'Admin review',
    heroTitle: 'Know every form, office and fee before you start.',
    heroSub: 'Describe what you want to do. We map the government steps in the order they have to happen, with a link to the official source for each one.',
    askLabel: 'What do you want to do?',
    askPlaceholder: 'e.g. I want to start a small tiffin service from home',
    city: 'City',
    finding: 'Finding…',
    showRoadmap: 'Show my roadmap',
    notCovered: "We don't cover that procedure yet. Try a food business or a small shop registration.",
    genericError: 'Something went wrong. Please try again.',
    examples: ['Start a cloud kitchen', 'Open a small shop', 'Register my startup for GST'],
    newSearch: '← New search',
    lastVerified: 'Last verified',
    sampleData: 'Sample data',
    graph: 'Graph', list: 'List',
    stepsDone: (d, t) => `${d} of ${t} steps done`,
    doNext: 'Do next', status: 'Status', allDone: 'All steps complete', and: 'and',
    onlineForms: 'Online forms', officeVisits: 'Office visits',
    loadError: 'This roadmap could not be loaded.', goBack: 'Go back',
    selectStep: 'Select a step to see what you need.',
    where: 'Where', fee: 'Fee', bring: 'Bring', officialSource: 'Official source ↗',
    finishFirst: 'Finish first:', markDone: 'Mark as done', markUndone: 'Mark as not done',
    tagDone: 'Done', tagStart: 'Start now', tagLocked: 'Cannot start yet',
    types: { document: 'Document', form: 'Online form', visit: 'Office visit', payment: 'Payment', milestone: 'Milestone' },
    disclaimer: 'Not an official government service. Information is gathered from public government websites and may be out of date. Always confirm at the linked official source before applying.',
    privacy: 'Privacy', contact: 'Contact', language: 'Language',
    notFound: "This page doesn't exist.", notFoundSub: 'The link may be old or mistyped.', backToSearch: 'Back to search',
  },
  hi: {
    admin: 'एडमिन समीक्षा',
    heroTitle: 'शुरू करने से पहले हर फ़ॉर्म, दफ़्तर और फ़ीस जानिए।',
    heroSub: 'बताइए आप क्या करना चाहते हैं। हम सरकारी कदमों को उसी क्रम में दिखाते हैं जिसमें उन्हें पूरा करना होता है, और हर कदम के साथ आधिकारिक स्रोत का लिंक देते हैं।',
    askLabel: 'आप क्या करना चाहते हैं?',
    askPlaceholder: 'जैसे: मैं घर से छोटी टिफ़िन सेवा शुरू करना चाहता/चाहती हूँ',
    city: 'शहर',
    finding: 'खोज रहे हैं…',
    showRoadmap: 'मेरा रोडमैप दिखाएँ',
    notCovered: 'यह प्रक्रिया अभी उपलब्ध नहीं है। फ़ूड बिज़नेस या छोटी दुकान का पंजीकरण आज़माएँ।',
    genericError: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    examples: ['क्लाउड किचन शुरू करना', 'छोटी दुकान खोलना', 'स्टार्टअप का GST पंजीकरण'],
    newSearch: '← नई खोज',
    lastVerified: 'अंतिम जाँच',
    sampleData: 'नमूना डेटा',
    graph: 'ग्राफ़', list: 'सूची',
    stepsDone: (d, t) => `${t} में से ${d} कदम पूरे`,
    doNext: 'अगला कदम', status: 'स्थिति', allDone: 'सभी कदम पूरे', and: 'और',
    onlineForms: 'ऑनलाइन फ़ॉर्म', officeVisits: 'दफ़्तर जाना',
    loadError: 'यह रोडमैप लोड नहीं हो सका।', goBack: 'वापस जाएँ',
    selectStep: 'ज़रूरी जानकारी देखने के लिए कोई कदम चुनें।',
    where: 'कहाँ', fee: 'फ़ीस', bring: 'साथ लाएँ', officialSource: 'आधिकारिक स्रोत ↗',
    finishFirst: 'पहले पूरा करें:', markDone: 'पूरा हुआ', markUndone: 'पूरा नहीं हुआ',
    tagDone: 'पूरा', tagStart: 'अभी शुरू करें', tagLocked: 'अभी शुरू नहीं कर सकते',
    types: { document: 'दस्तावेज़', form: 'ऑनलाइन फ़ॉर्म', visit: 'दफ़्तर जाना', payment: 'भुगतान', milestone: 'पड़ाव' },
    disclaimer: 'यह आधिकारिक सरकारी सेवा नहीं है। जानकारी सार्वजनिक सरकारी वेबसाइटों से ली गई है और पुरानी हो सकती है। आवेदन से पहले आधिकारिक स्रोत पर ज़रूर जाँच लें।',
    privacy: 'गोपनीयता', contact: 'संपर्क', language: 'भाषा',
    notFound: 'यह पेज मौजूद नहीं है।', notFoundSub: 'लिंक पुराना या ग़लत हो सकता है।', backToSearch: 'खोज पर लौटें',
  },
  mr: {
    admin: 'अ‍ॅडमिन पुनरावलोकन',
    heroTitle: 'सुरुवात करण्यापूर्वी प्रत्येक अर्ज, कार्यालय आणि शुल्क जाणून घ्या.',
    heroSub: 'तुम्हाला काय करायचे आहे ते सांगा. आम्ही सरकारी टप्पे ज्या क्रमाने पूर्ण करायचे त्या क्रमाने दाखवतो, आणि प्रत्येक टप्प्यासाठी अधिकृत स्रोताची लिंक देतो.',
    askLabel: 'तुम्हाला काय करायचे आहे?',
    askPlaceholder: 'उदा. मला घरून छोटी टिफिन सेवा सुरू करायची आहे',
    city: 'शहर',
    finding: 'शोधत आहोत…',
    showRoadmap: 'माझा रोडमॅप दाखवा',
    notCovered: 'ही प्रक्रिया अजून उपलब्ध नाही. फूड बिझनेस किंवा छोट्या दुकानाची नोंदणी वापरून पहा.',
    genericError: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
    examples: ['क्लाउड किचन सुरू करणे', 'छोटे दुकान उघडणे', 'स्टार्टअपची GST नोंदणी'],
    newSearch: '← नवीन शोध',
    lastVerified: 'शेवटची पडताळणी',
    sampleData: 'नमुना डेटा',
    graph: 'आलेख', list: 'यादी',
    stepsDone: (d, t) => `${t} पैकी ${d} टप्पे पूर्ण`,
    doNext: 'पुढचा टप्पा', status: 'स्थिती', allDone: 'सर्व टप्पे पूर्ण', and: 'आणि',
    onlineForms: 'ऑनलाइन अर्ज', officeVisits: 'कार्यालय भेटी',
    loadError: 'हा रोडमॅप लोड होऊ शकला नाही.', goBack: 'मागे जा',
    selectStep: 'काय लागेल ते पाहण्यासाठी एक टप्पा निवडा.',
    where: 'कुठे', fee: 'शुल्क', bring: 'सोबत आणा', officialSource: 'अधिकृत स्रोत ↗',
    finishFirst: 'आधी पूर्ण करा:', markDone: 'पूर्ण झाले', markUndone: 'पूर्ण झाले नाही',
    tagDone: 'पूर्ण', tagStart: 'आता सुरू करा', tagLocked: 'अजून सुरू करता येत नाही',
    types: { document: 'कागदपत्र', form: 'ऑनलाइन अर्ज', visit: 'कार्यालय भेट', payment: 'पेमेंट', milestone: 'टप्पा' },
    disclaimer: 'ही अधिकृत सरकारी सेवा नाही. माहिती सार्वजनिक सरकारी संकेतस्थळांवरून घेतली आहे आणि जुनी असू शकते. अर्ज करण्यापूर्वी अधिकृत स्रोतावर नक्की तपासा.',
    privacy: 'गोपनीयता', contact: 'संपर्क', language: 'भाषा',
    notFound: 'हे पान अस्तित्वात नाही.', notFoundSub: 'लिंक जुनी किंवा चुकीची असू शकते.', backToSearch: 'शोधाकडे परत',
  },
}

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'en' } catch { return 'en' }
  })
  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('lang', lang) } catch { /* private mode */ }
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** Pick a translated field from data, e.g. tr(step, 'name', 'hi') → step.name_hi ?? step.name */
export const tr = (obj, field, lang) => (lang !== 'en' && obj?.[`${field}_${lang}`]) || obj?.[field]

// Added with the trust / readability pass.
Object.assign(dict.en, {
  notGov: 'Not a government website', free: 'Free', moreCities: 'More cities coming soon', noFee: 'No government fee',
  feeUnknown: 'Fee not confirmed. Check the official source before paying.',
  timeUnknown: 'Not confirmed yet',
  processing: 'Time', required: 'Required', conditional: 'Only if it applies to you', optional: 'Optional',
  checked: 'Checked', openPortal: 'Open official portal', notOfficialDomain: 'This link is not a government (.gov.in) website. Double-check it.',
  report: 'Report outdated information', completed: 'Completed', undo: 'Undo',
  startHere: 'Start here', legend: 'Key', legAvail: 'Can start now', legDone: 'Completed', legLocked: 'Waiting on earlier steps',
  copyLink: 'Copy link', copied: 'Link copied', print: 'Print checklist', verifiedLabel: 'Last verified',
  stepsWord: 'steps', inStages: 'stages', previewTitle: 'Ready now', previewSub: 'Each journey is checked against the official portals. Open one to see the full order.',
  popular: 'Popular journeys', onlyMumbai: 'Full coverage for Mumbai and Pune. Other places get the all-India steps for now.',
  howTitle: 'How it works', how: ['Describe what you want to do, in your own words.', 'Get every step in the right order, with what to bring.', 'Open the official portal for each step and tick it off.'],
  trust: ['Links to official sources', 'Free to use', 'No login needed', 'Every step shows when it was checked'],
  notCoveredTitle: "We don't have that procedure yet.", supportedNow: 'Available right now:', suggest: 'Suggest a procedure we should add',
})
Object.assign(dict.hi, {
  notGov: 'यह सरकारी वेबसाइट नहीं है', free: 'मुफ़्त', moreCities: 'और शहर जल्द', noFee: 'कोई सरकारी फ़ीस नहीं',
  feeUnknown: 'फ़ीस की पुष्टि नहीं हुई है। भुगतान से पहले आधिकारिक स्रोत देखें।',
  timeUnknown: 'अभी पुष्टि नहीं हुई',
  processing: 'समय', required: 'ज़रूरी', conditional: 'केवल आप पर लागू हो तो', optional: 'वैकल्पिक',
  checked: 'जाँचा गया', openPortal: 'आधिकारिक पोर्टल खोलें', notOfficialDomain: 'यह लिंक सरकारी (.gov.in) वेबसाइट नहीं है। ध्यान से जाँचें।',
  report: 'पुरानी जानकारी की शिकायत करें', completed: 'पूरा हुआ', undo: 'वापस लें',
  startHere: 'यहाँ से शुरू करें', legend: 'संकेत', legAvail: 'अभी शुरू कर सकते हैं', legDone: 'पूरा', legLocked: 'पिछले कदमों का इंतज़ार',
  copyLink: 'लिंक कॉपी करें', copied: 'लिंक कॉपी हो गया', print: 'चेकलिस्ट प्रिंट करें', verifiedLabel: 'अंतिम जाँच',
  stepsWord: 'कदम', inStages: 'चरण', previewTitle: 'अभी उपलब्ध', previewSub: 'हर प्रक्रिया आधिकारिक पोर्टलों से जाँची गई है। पूरा क्रम देखने के लिए खोलिए।',
  popular: 'लोकप्रिय प्रक्रियाएँ', onlyMumbai: 'मुंबई और पुणे पूरी तरह शामिल हैं। बाक़ी जगहों के लिए अभी पूरे भारत वाले कदम मिलेंगे।',
  howTitle: 'यह कैसे काम करता है', how: ['अपने शब्दों में बताइए कि आप क्या करना चाहते हैं।', 'हर कदम सही क्रम में पाइए, साथ में क्या लाना है वह भी।', 'हर कदम का आधिकारिक पोर्टल खोलिए और पूरा होने पर टिक कीजिए।'],
  trust: ['आधिकारिक स्रोतों के लिंक', 'मुफ़्त', 'लॉगिन की ज़रूरत नहीं', 'हर कदम की जाँच की तारीख़'],
  notCoveredTitle: 'यह प्रक्रिया अभी हमारे पास नहीं है।', supportedNow: 'अभी उपलब्ध:', suggest: 'कोई प्रक्रिया जोड़ने का सुझाव दें',
})
Object.assign(dict.mr, {
  notGov: 'हे सरकारी संकेतस्थळ नाही', free: 'मोफत', moreCities: 'आणखी शहरे लवकरच', noFee: 'सरकारी शुल्क नाही',
  feeUnknown: 'शुल्काची खात्री झालेली नाही. पैसे भरण्यापूर्वी अधिकृत स्रोत तपासा.',
  timeUnknown: 'अजून खात्री नाही',
  processing: 'वेळ', required: 'आवश्यक', conditional: 'फक्त तुम्हाला लागू असल्यास', optional: 'ऐच्छिक',
  checked: 'तपासले', openPortal: 'अधिकृत पोर्टल उघडा', notOfficialDomain: 'ही लिंक सरकारी (.gov.in) संकेतस्थळाची नाही. नीट तपासा.',
  report: 'जुनी माहिती कळवा', completed: 'पूर्ण झाले', undo: 'मागे घ्या',
  startHere: 'इथून सुरुवात करा', legend: 'संकेत', legAvail: 'आता सुरू करता येईल', legDone: 'पूर्ण', legLocked: 'आधीच्या टप्प्यांची वाट',
  copyLink: 'लिंक कॉपी करा', copied: 'लिंक कॉपी झाली', print: 'चेकलिस्ट प्रिंट करा', verifiedLabel: 'शेवटची पडताळणी',
  stepsWord: 'टप्पे', inStages: 'टप्पे-गट', previewTitle: 'आता उपलब्ध', previewSub: 'प्रत्येक प्रक्रिया अधिकृत पोर्टलवरून तपासली आहे. संपूर्ण क्रम पाहण्यासाठी उघडा.',
  popular: 'लोकप्रिय प्रक्रिया', onlyMumbai: 'मुंबई आणि पुणे पूर्णपणे समाविष्ट. इतर ठिकाणांसाठी सध्या संपूर्ण भारताचे टप्पे मिळतील.',
  howTitle: 'हे कसे काम करते', how: ['तुम्हाला काय करायचे आहे ते तुमच्या शब्दांत सांगा.', 'प्रत्येक टप्पा योग्य क्रमाने मिळवा, सोबत काय आणायचे तेही.', 'प्रत्येक टप्प्याचे अधिकृत पोर्टल उघडा आणि पूर्ण झाल्यावर टिक करा.'],
  trust: ['अधिकृत स्रोतांच्या लिंक', 'मोफत', 'लॉगिनची गरज नाही', 'प्रत्येक टप्प्याची तपासणी तारीख'],
  notCoveredTitle: 'ही प्रक्रिया अजून आमच्याकडे नाही.', supportedNow: 'सध्या उपलब्ध:', suggest: 'एखादी प्रक्रिया जोडण्याची सूचना द्या',
})

/** 20 Sep 2026 / २० सित॰ २०२६ style dates */
export function fmtDate(iso, lang) {
  try { return new Intl.DateTimeFormat(`${lang}-IN`, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) } catch { return iso }
}

export const CONTACT = 'kabirh2006@gmail.com'

// Location + law pass.
Object.assign(dict.en, {
  state: 'State', whereBiz: 'Where will your business be?',
  scope: { national: 'All India', state: 'State', local: 'City' },
  covFull: null,
  covState: (city, state) => `We have the all-India and ${state} steps. Local steps for ${city} aren't covered yet, so check your municipal corporation's website too.`,
  covNational: (state) => `We only have the all-India steps for ${state} so far. State and city rules (like shop registration and trade licences) aren't covered yet.`,
  partial: 'partial', changePlace: 'Change location',
  lawTitle: 'Legal basis', lawSearch: 'Look up this Act on India Code ↗', lawUnverified: 'To be verified',
  rightsTitle: 'Your rights', rightsLink: 'Check time limits on Aaple Sarkar ↗',
  grievance: 'Complaint about a delay? Use the central grievance portal (CPGRAMS) ↗',
  notAdvice: 'Information, not legal advice.',
})
Object.assign(dict.hi, {
  state: 'राज्य', whereBiz: 'आपका व्यवसाय कहाँ होगा?',
  scope: { national: 'पूरे भारत में', state: 'राज्य', local: 'शहर' },
  covState: (city, state) => `हमारे पास पूरे भारत और ${state} के कदम हैं। ${city} के स्थानीय कदम अभी शामिल नहीं हैं, इसलिए अपनी नगर निगम की वेबसाइट भी देखें।`,
  covNational: (state) => `${state} के लिए अभी केवल पूरे भारत वाले कदम हैं। राज्य और शहर के नियम (जैसे दुकान पंजीकरण, व्यापार लाइसेंस) अभी शामिल नहीं हैं।`,
  partial: 'आंशिक', changePlace: 'स्थान बदलें',
  lawTitle: 'कानूनी आधार', lawSearch: 'India Code पर यह अधिनियम देखें ↗', lawUnverified: 'जाँच बाक़ी',
  rightsTitle: 'आपके अधिकार', rightsLink: 'आपले सरकार पर समय-सीमा देखें ↗',
  grievance: 'देरी की शिकायत? केंद्रीय शिकायत पोर्टल (CPGRAMS) ↗',
  notAdvice: 'यह जानकारी है, कानूनी सलाह नहीं।',
})
Object.assign(dict.mr, {
  state: 'राज्य', whereBiz: 'तुमचा व्यवसाय कुठे असेल?',
  scope: { national: 'संपूर्ण भारत', state: 'राज्य', local: 'शहर' },
  covState: (city, state) => `आमच्याकडे संपूर्ण भारत आणि ${state} चे टप्पे आहेत. ${city} चे स्थानिक टप्पे अजून समाविष्ट नाहीत, म्हणून तुमच्या महानगरपालिकेचे संकेतस्थळही तपासा.`,
  covNational: (state) => `${state} साठी सध्या फक्त संपूर्ण भारताचे टप्पे आहेत. राज्य व शहराचे नियम (उदा. दुकान नोंदणी, व्यापार परवाना) अजून समाविष्ट नाहीत.`,
  partial: 'अंशतः', changePlace: 'ठिकाण बदला',
  lawTitle: 'कायदेशीर आधार', lawSearch: 'India Code वर हा कायदा पहा ↗', lawUnverified: 'पडताळणी बाकी',
  rightsTitle: 'तुमचे हक्क', rightsLink: 'आपले सरकारवर कालमर्यादा पहा ↗',
  grievance: 'विलंबाची तक्रार? केंद्रीय तक्रार पोर्टल (CPGRAMS) ↗',
  notAdvice: 'ही माहिती आहे, कायदेशीर सल्ला नाही.',
})

Object.assign(dict.en, { theme: 'Theme', themes: { system: 'Auto', light: 'Light', dark: 'Dark', contrast: 'High contrast' } })
Object.assign(dict.hi, { theme: 'थीम', themes: { system: 'अपने-आप', light: 'लाइट', dark: 'डार्क', contrast: 'हाई कॉन्ट्रास्ट' } })
Object.assign(dict.mr, { theme: 'थीम', themes: { system: 'आपोआप', light: 'लाइट', dark: 'डार्क', contrast: 'उच्च कॉन्ट्रास्ट' } })

Object.assign(dict.en, { listen: 'Listen', stopListen: 'Stop', micStart: 'Speak your request', micStop: 'Stop listening', micBlocked: 'Microphone access is blocked. Allow it in your browser settings, or type instead.', micFailed: "Didn't catch that. Please try again or type your request.", textSize: 'Text size', sizes: ['Normal text', 'Large text', 'Extra large text'], skip: 'Skip to main content' })
Object.assign(dict.hi, { listen: 'सुनें', stopListen: 'रोकें', micStart: 'बोलकर बताइए', micStop: 'सुनना बंद करें', micBlocked: 'माइक्रोफ़ोन की अनुमति नहीं है। ब्राउज़र सेटिंग में अनुमति दें, या टाइप करें।', micFailed: 'ठीक से सुनाई नहीं दिया। फिर कोशिश करें या टाइप करें।', textSize: 'अक्षर का आकार', sizes: ['सामान्य अक्षर', 'बड़े अक्षर', 'बहुत बड़े अक्षर'], skip: 'मुख्य सामग्री पर जाएँ' })
Object.assign(dict.mr, { listen: 'ऐका', stopListen: 'थांबा', micStart: 'बोलून सांगा', micStop: 'ऐकणे थांबवा', micBlocked: 'मायक्रोफोनला परवानगी नाही. ब्राउझर सेटिंगमध्ये परवानगी द्या, किंवा टाइप करा.', micFailed: 'नीट ऐकू आले नाही. पुन्हा प्रयत्न करा किंवा टाइप करा.', textSize: 'अक्षरांचा आकार', sizes: ['सामान्य अक्षरे', 'मोठी अक्षरे', 'खूप मोठी अक्षरे'], skip: 'मुख्य मजकुराकडे जा' })

// Categories, browsing, suggestions + plainer wording.
Object.assign(dict.en, {
  heroTitle: 'Starting a business? See every step, in the right order.',
  heroSub: 'Tell us what you want to start. We show each form, office and fee, and link to the official website for every step.',
  askPlaceholder: 'For example: I want to open a tea stall',
  previewTitle: 'Popular right now', previewSub: 'Open one to see every step in order.',
  seeAll: (n) => `See all ${n} procedures`,
  catTitle: 'What kind of business?', catSub: 'Pick the closest match. You can change it later.',
  cats: { food: 'Food & drinks', retail: 'Shop & retail', services: 'Services', manufacturing: 'Manufacturing', online: 'Online business', home: 'From home' },
  catHint: { food: 'Restaurant, café, tiffin', retail: 'Kirana, clothes, hardware', services: 'Salon, repair, tuition', manufacturing: 'Workshop, small factory', online: 'Website, social media', home: 'Home bakery, crafts' },
  nProcedures: (n) => (n === 1 ? '1 procedure' : `${n} procedures`),
  browseTitle: 'All procedures', browseSub: (city, state) => `Showing steps for ${city}, ${state}.`,
  filterLabel: 'Filter by name', filterPlaceholder: 'Type a word, e.g. salon', allCats: 'All',
  clearFilters: 'Clear filters', suggestionsLabel: 'Suggestions',
  suggestCount: (n) => `${n} suggestions. Use the down arrow to choose.`,
})
Object.assign(dict.hi, {
  heroTitle: 'व्यवसाय शुरू कर रहे हैं? हर कदम सही क्रम में देखें।',
  heroSub: 'बताइए आप क्या शुरू करना चाहते हैं। हम हर फ़ॉर्म, दफ़्तर और फ़ीस दिखाते हैं, और हर कदम के लिए आधिकारिक वेबसाइट का लिंक देते हैं।',
  askPlaceholder: 'जैसे: मुझे चाय की दुकान खोलनी है',
  previewTitle: 'अभी लोकप्रिय', previewSub: 'कोई एक खोलें और हर कदम क्रम से देखें।',
  seeAll: (n) => `सभी ${n} प्रक्रियाएँ देखें`,
  catTitle: 'किस तरह का व्यवसाय?', catSub: 'सबसे मिलता-जुलता चुनें। बाद में बदल सकते हैं।',
  cats: { food: 'खाना-पीना', retail: 'दुकान', services: 'सेवाएँ', manufacturing: 'निर्माण', online: 'ऑनलाइन व्यवसाय', home: 'घर से' },
  catHint: { food: 'रेस्टोरेंट, कैफ़े, टिफ़िन', retail: 'किराना, कपड़े, हार्डवेयर', services: 'सैलून, मरम्मत, ट्यूशन', manufacturing: 'वर्कशॉप, छोटी फ़ैक्टरी', online: 'वेबसाइट, सोशल मीडिया', home: 'घर की बेकरी, हस्तशिल्प' },
  nProcedures: (n) => `${n} प्रक्रिया${n === 1 ? '' : 'एँ'}`,
  browseTitle: 'सभी प्रक्रियाएँ', browseSub: (city, state) => `${city}, ${state} के कदम दिखाए जा रहे हैं।`,
  filterLabel: 'नाम से खोजें', filterPlaceholder: 'कोई शब्द लिखें, जैसे सैलून', allCats: 'सभी',
  clearFilters: 'फ़िल्टर हटाएँ', suggestionsLabel: 'सुझाव',
  suggestCount: (n) => `${n} सुझाव। चुनने के लिए नीचे वाला तीर दबाएँ।`,
})
Object.assign(dict.mr, {
  heroTitle: 'व्यवसाय सुरू करताय? प्रत्येक टप्पा योग्य क्रमाने पहा.',
  heroSub: 'तुम्हाला काय सुरू करायचे आहे ते सांगा. आम्ही प्रत्येक अर्ज, कार्यालय आणि शुल्क दाखवतो, आणि प्रत्येक टप्प्यासाठी अधिकृत संकेतस्थळाची लिंक देतो.',
  askPlaceholder: 'उदा. मला चहाची टपरी सुरू करायची आहे',
  previewTitle: 'सध्या लोकप्रिय', previewSub: 'एक उघडा आणि प्रत्येक टप्पा क्रमाने पहा.',
  seeAll: (n) => `सर्व ${n} प्रक्रिया पहा`,
  catTitle: 'कोणत्या प्रकारचा व्यवसाय?', catSub: 'सर्वात जवळचा पर्याय निवडा. नंतर बदलता येईल.',
  cats: { food: 'खाद्यपदार्थ', retail: 'दुकान', services: 'सेवा', manufacturing: 'उत्पादन', online: 'ऑनलाइन व्यवसाय', home: 'घरून' },
  catHint: { food: 'हॉटेल, कॅफे, टिफिन', retail: 'किराणा, कपडे, हार्डवेअर', services: 'सलून, दुरुस्ती, शिकवणी', manufacturing: 'वर्कशॉप, छोटा कारखाना', online: 'वेबसाइट, सोशल मीडिया', home: 'घरगुती बेकरी, हस्तकला' },
  nProcedures: (n) => `${n} प्रक्रिया`,
  browseTitle: 'सर्व प्रक्रिया', browseSub: (city, state) => `${city}, ${state} साठीचे टप्पे दाखवत आहोत.`,
  filterLabel: 'नावाने शोधा', filterPlaceholder: 'एखादा शब्द लिहा, उदा. सलून', allCats: 'सर्व',
  clearFilters: 'फिल्टर काढा', suggestionsLabel: 'सूचना',
  suggestCount: (n) => `${n} सूचना. निवडण्यासाठी खालचा बाण दाबा.`,
})
